import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dentalshift.ca";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!serviceRoleKey || !stripeSecretKey) return NextResponse.json({ error: "DentalJobs billing is not configured yet." }, { status: 503 });

  const accessToken = authorization.slice("Bearer ".length);
  const requestClient = createClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization } } });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await requestClient.auth.getUser(accessToken);
  if (userError || !userData.user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const { data: office } = await admin.from("offices").select("id,name,owner_id,communication_email").eq("owner_id", userData.user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (!office) return NextResponse.json({ error: "Dental office account not found." }, { status: 404 });

  const { data: existing } = await admin.from("office_billing_profiles").select("stripe_customer_id").eq("office_id", office.id).maybeSingle();
  let customerId = existing?.stripe_customer_id ?? null;

  if (!customerId) {
    const params = new URLSearchParams();
    params.set("name", office.name || "DentalShift Office");
    params.set("email", office.communication_email || userData.user.email || "");
    params.set("metadata[office_id]", office.id);
    const customerResponse = await fetch("https://api.stripe.com/v1/customers", { method: "POST", headers: { Authorization: `Bearer ${stripeSecretKey}`, "Content-Type": "application/x-www-form-urlencoded" }, body: params.toString() });
    const customer = await customerResponse.json() as { id?: string; error?: { message?: string } };
    if (!customerResponse.ok || !customer.id) return NextResponse.json({ error: customer.error?.message || "Could not create billing profile." }, { status: 400 });
    customerId = customer.id;
    await admin.from("office_billing_profiles").upsert({ office_id: office.id, stripe_customer_id: customerId, billing_status: "missing", updated_at: new Date().toISOString() }, { onConflict: "office_id" });
  }

  const checkout = new URLSearchParams();
  checkout.set("mode", "setup");
  checkout.set("customer", customerId);
  checkout.set("success_url", `${siteUrl}/classifieds?billing_setup=success`);
  checkout.set("cancel_url", `${siteUrl}/classifieds?billing_setup=cancelled`);
  checkout.set("metadata[office_id]", office.id);
  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${stripeSecretKey}`, "Content-Type": "application/x-www-form-urlencoded" }, body: checkout.toString() });
  const stripe = await stripeResponse.json() as { url?: string; error?: { message?: string } };
  if (!stripeResponse.ok || !stripe.url) return NextResponse.json({ error: stripe.error?.message || "Could not open card setup." }, { status: 400 });
  return NextResponse.json({ checkoutUrl: stripe.url });
}
