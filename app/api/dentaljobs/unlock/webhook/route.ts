import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
  if (!serviceRoleKey || !webhookSecret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  if (!verifyStripeSignature(payload, signature, webhookSecret)) return NextResponse.json({ error: "Invalid signature." }, { status: 400 });

  const event = JSON.parse(payload) as any;
  if (event?.type !== "checkout.session.completed") return NextResponse.json({ received: true });
  const session = event.data?.object;
  const unlockId = session?.metadata?.unlock_id;
  const applicationId = session?.metadata?.application_id;
  if (!unlockId || !applicationId || session?.payment_status !== "paid") return NextResponse.json({ received: true });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const now = new Date().toISOString();
  const { error: unlockError } = await admin.from("candidate_unlocks").update({
    status: "paid",
    stripe_session_id: session.id,
    stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
    paid_at: now,
    updated_at: now,
  }).eq("id", unlockId);
  if (unlockError) return NextResponse.json({ error: unlockError.message }, { status: 500 });

  await admin.from("job_applications").update({ status: "interested", responded_at: now, updated_at: now }).eq("id", applicationId);
  return NextResponse.json({ received: true });
}
