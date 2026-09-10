import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = header.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || !signatures.length) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`, "utf8").digest("hex");
  return signatures.some((signature) => {
    try {
      const a = Buffer.from(expected, "hex");
      const b = Buffer.from(signature, "hex");
      return a.length === b.length && timingSafeEqual(a, b);
    } catch { return false; }
  });
}

export async function POST(request: Request) {
  if (!serviceRoleKey || !webhookSecret || !stripeSecretKey) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  if (!verifyStripeSignature(payload, signature, webhookSecret)) return NextResponse.json({ error: "Invalid signature." }, { status: 400 });

  const event = JSON.parse(payload) as any;
  if (event?.type !== "checkout.session.completed") return NextResponse.json({ received: true });
  const session = event.data?.object;
  if (session?.mode !== "setup" || !session?.setup_intent) return NextResponse.json({ received: true });

  const setupResponse = await fetch(`https://api.stripe.com/v1/setup_intents/${session.setup_intent}`, { headers: { Authorization: `Bearer ${stripeSecretKey}` } });
  const setupIntent = await setupResponse.json() as any;
  const paymentMethodId = typeof setupIntent?.payment_method === "string" ? setupIntent.payment_method : null;
  if (!setupResponse.ok || !paymentMethodId) return NextResponse.json({ error: "Could not confirm saved card." }, { status: 400 });

  const pmResponse = await fetch(`https://api.stripe.com/v1/payment_methods/${paymentMethodId}`, { headers: { Authorization: `Bearer ${stripeSecretKey}` } });
  const paymentMethod = await pmResponse.json() as any;
  if (!pmResponse.ok) return NextResponse.json({ error: "Could not load saved card." }, { status: 400 });

  const officeId = session?.metadata?.office_id;
  if (!officeId) return NextResponse.json({ error: "Office billing profile was not identified." }, { status: 400 });
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const card = paymentMethod?.card;
  const { error } = await admin.from("office_billing_profiles").upsert({
    office_id: officeId,
    stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
    stripe_payment_method_id: paymentMethodId,
    card_brand: card?.brand ?? null,
    card_last4: card?.last4 ?? null,
    card_exp_month: card?.exp_month ?? null,
    card_exp_year: card?.exp_year ?? null,
    billing_status: "active",
    updated_at: new Date().toISOString(),
  }, { onConflict: "office_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ received: true });
}
