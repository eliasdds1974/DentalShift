import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const unlockPriceCents = Number(process.env.DENTALJOBS_UNLOCK_PRICE_CENTS ?? "2900");

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!serviceRoleKey) return NextResponse.json({ error: "Candidate unlock billing is not configured yet." }, { status: 503 });

  const accessToken = authorization.slice("Bearer ".length);
  const requestClient = createClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await requestClient.auth.getUser(accessToken);
  if (userError || !userData.user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const body = await request.json().catch(() => null) as { applicationId?: string } | null;
  const applicationId = body?.applicationId?.trim();
  if (!applicationId) return NextResponse.json({ error: "Application is required." }, { status: 400 });

  const { data: application } = await admin.from("job_applications").select("id,office_id,professional_id").eq("id", applicationId).maybeSingle();
  if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  const { data: office } = await admin.from("offices").select("id,owner_id").eq("id", application.office_id).maybeSingle();
  if (!office || office.owner_id !== userData.user.id) return NextResponse.json({ error: "Only this dental office can unlock the candidate." }, { status: 403 });

  const { data: billing } = await admin.from("office_billing_profiles").select("billing_status,payment_method_on_file,provider_payment_method_id").eq("office_id", application.office_id).maybeSingle();
  if (!billing || billing.billing_status !== "active" || !billing.payment_method_on_file || !billing.provider_payment_method_id) {
    return NextResponse.json({ error: "A valid credit card must be on file before you can unlock a candidate.", needsPaymentMethod: true }, { status: 402 });
  }

  const { data: existing } = await admin.from("candidate_unlocks").select("id,status").eq("office_id", application.office_id).eq("professional_id", application.professional_id).maybeSingle();
  if (existing && ["accrued","billed","paid"].includes(existing.status)) return NextResponse.json({ unlocked: true, alreadyUnlocked: true });

  const nowIso = new Date().toISOString();
  const billingPeriod = nowIso.slice(0, 7);
  let unlockId = existing?.id ?? null;
  if (unlockId) {
    const { error } = await admin.from("candidate_unlocks").update({ application_id: application.id, amount_cents: unlockPriceCents, currency: "cad", status: "accrued", billing_period: billingPeriod, updated_at: nowIso }).eq("id", unlockId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    const { data: created, error } = await admin.from("candidate_unlocks").insert({ application_id: application.id, office_id: application.office_id, professional_id: application.professional_id, amount_cents: unlockPriceCents, currency: "cad", status: "accrued", billing_period: billingPeriod }).select("id").single();
    if (error || !created) return NextResponse.json({ error: error?.message || "Could not record candidate unlock." }, { status: 400 });
    unlockId = created.id;
  }

  const { error: lineError } = await admin.from("billing_line_items").upsert({ office_id: application.office_id, booking_id: null, service_date: nowIso.slice(0, 10), description: "DentalJobs Candidate Unlock", amount_cents: unlockPriceCents, status: "unbilled", invoice_id: null, source_type: "dentaljobs_unlock", source_id: unlockId, updated_at: nowIso }, { onConflict: "source_type,source_id" });
  if (lineError) return NextResponse.json({ error: lineError.message }, { status: 400 });

  await admin.from("job_applications").update({ status: "interested", responded_at: nowIso, updated_at: nowIso }).eq("id", application.id);
  return NextResponse.json({ unlocked: true, amountCents: unlockPriceCents, billingPeriod, billedMonthly: true });
}
