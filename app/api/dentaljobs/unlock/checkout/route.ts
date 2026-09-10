import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dentalshift.ca";
const unlockPriceCents = Number(process.env.DENTALJOBS_UNLOCK_PRICE_CENTS ?? "2900");

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!serviceRoleKey || !stripeSecretKey) return NextResponse.json({ error: "Candidate unlock payments are not configured yet." }, { status: 503 });

  const accessToken = authorization.slice("Bearer ".length);
  const requestClient = createClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await requestClient.auth.getUser(accessToken);
  if (userError || !userData.user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const body = await request.json().catch(() => null) as { applicationId?: string } | null;
  const applicationId = body?.applicationId?.trim();
  if (!applicationId) return NextResponse.json({ error: "Application is required." }, { status: 400 });

  const { data: application } = await admin.from("job_applications").select("id,office_id,professional_id,status").eq("id", applicationId).maybeSingle();
  if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });
  const { data: office } = await admin.from("offices").select("id,owner_id").eq("id", application.office_id).maybeSingle();
  if (!office || office.owner_id !== userData.user.id) return NextResponse.json({ error: "Only this dental office can unlock the candidate." }, { status: 403 });

  const { data: existing } = await admin.from("candidate_unlocks").select("id,status").eq("office_id", application.office_id).eq("professional_id", application.professional_id).maybeSingle();
  if (existing?.status === "paid") return NextResponse.json({ unlocked: true });

  let unlockId = existing?.id ?? null;
  if (!unlockId) {
    const { data: inserted, error: insertError } = await admin.from("candidate_unlocks").insert({
      application_id: application.id,
      office_id: application.office_id,
      professional_id: application.professional_id,
      amount_cents: unlockPriceCents,
      currency: "cad",
      status: "checkout_pending",
    }).select("id").single();
    if (insertError || !inserted) return NextResponse.json({ error: insertError?.message || "Could not prepare checkout." }, { status: 400 });
    unlockId = inserted.id;
  }

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${siteUrl}/classifieds?candidate_unlocked={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${siteUrl}/classifieds?candidate_unlock_cancelled=1`);
  params.set("client_reference_id", application.id);
  params.set("line_items[0][price_data][currency]", "cad");
  params.set("line_items[0][price_data][product_data][name]", "DentalShift Candidate Unlock");
  params.set("line_items[0][price_data][product_data][description]", "Unlock candidate identity, contact details and original résumé");
  params.set("line_items[0][price_data][unit_amount]", String(unlockPriceCents));
  params.set("line_items[0][quantity]", "1");
  params.set("metadata[unlock_id]", unlockId);
  params.set("metadata[application_id]", application.id);
  params.set("metadata[office_id]", application.office_id);
  params.set("metadata[professional_id]", application.professional_id);

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${stripeSecretKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const stripe = await stripeResponse.json() as { id?: string; url?: string; error?: { message?: string } };
  if (!stripeResponse.ok || !stripe.id || !stripe.url) return NextResponse.json({ error: stripe.error?.message || "Could not start Stripe checkout." }, { status: 400 });

  await admin.from("candidate_unlocks").update({ stripe_session_id: stripe.id, application_id: application.id, amount_cents: unlockPriceCents, status: "checkout_pending", updated_at: new Date().toISOString() }).eq("id", unlockId);
  return NextResponse.json({ checkoutUrl: stripe.url, amountCents: unlockPriceCents, currency: "cad" });
}
