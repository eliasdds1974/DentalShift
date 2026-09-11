import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { escapeEmailHtml, renderDentalShiftEmail } from "@/lib/email";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dentalshift.ca";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const accessToken = authorization.slice("Bearer ".length);
  const requestClient = createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData, error: userError } = await requestClient.auth.getUser(accessToken);
  if (userError || !userData.user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const body = await request.json().catch(() => null) as { kind?: "shift" | "availability"; batchId?: string } | null;
  if (!body?.kind || !body.batchId) return NextResponse.json({ error: "Preferred First batch is required." }, { status: 400 });

  const { data: context, error: contextError } = await requestClient.rpc("preferred_first_email_context", {
    p_kind: body.kind,
    p_batch_id: body.batchId,
  });
  if (contextError || !context) return NextResponse.json({ error: contextError?.message || "Preferred First details could not be loaded." }, { status: 400 });

  const recipients = Array.isArray(context.recipients) ? context.recipients : [];
  const items = Array.isArray(context.items) ? context.items : [];
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey || recipients.length === 0) return NextResponse.json({ sent: 0 });

  const rows = items.map((item: any) => {
    const rate = Number(item.hourly_rate);
    return `<div style="padding:10px 0;border-bottom:1px solid #E2E8F0;"><strong style="color:#002757;">${escapeEmailHtml(formatDateTime(String(item.starts_at)))}</strong> – ${escapeEmailHtml(formatDateTime(String(item.ends_at)).split(", ").pop() || "")} ${Number.isFinite(rate) ? `<span style="color:#017f27;font-weight:700;"> · $${rate.toFixed(2)}/hr</span>` : ""}</div>`;
  }).join("");

  const isShift = body.kind === "shift";
  const senderName = String(context.sender_name || (isShift ? "Preferred Dental Office" : "Preferred Professional"));
  const profession = String(context.profession || "Dental Professional");
  let sent = 0;

  for (const recipient of recipients) {
    const email = String(recipient?.email || "").trim();
    if (!email) continue;
    const name = String(recipient?.name || "there").trim() || "there";
    const title = isShift ? "Preferred First shifts are available" : "Preferred First availability is available";
    const intro = isShift
      ? `${senderName} has shared new shifts with its Preferred Professionals before releasing them to the general calendar.`
      : `A ${profession} has shared availability with your office before releasing it to the general calendar.`;
    const html = renderDentalShiftEmail({
      siteUrl,
      preheader: title,
      title,
      greeting: `Hello ${escapeEmailHtml(name)},`,
      intro: escapeEmailHtml(intro),
      bodyHtml: `<div style="margin:20px 0;padding:18px;background:#FFFBEA;border:1px solid #FDB605;border-radius:12px;color:#334155;font-size:14px;line-height:1.6;"><strong style="display:block;margin-bottom:8px;color:#9A6D00;">★ Preferred First</strong>${rows}</div><p style="font-size:14px;color:#64748B;">Log in to DentalShift to review all available dates together and show interest in the days that work for you. First mutual match gets scheduled.</p>`,
      actionLabel: "View Preferred First opportunities",
      actionUrl: isShift ? `${siteUrl}/professionals/find-shifts` : `${siteUrl}/office/overview`,
    });
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "DentalShift <support@dentalshift.ca>",
        to: [email],
        subject: isShift ? `Preferred First shifts from ${senderName}` : `Preferred First availability — ${profession}`,
        html,
      }),
    });
    if (response.ok) sent += 1;
    else console.error("[preferred-first-email] send failed", { status: response.status, body: await response.text() });
  }

  return NextResponse.json({ sent });
}
