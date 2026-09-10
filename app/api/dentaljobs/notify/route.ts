import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { escapeEmailHtml, renderDentalShiftEmail } from "@/lib/email";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dentalshift.ca";

const allowedEvents = new Set(["application_created", "response_interested", "response_declined", "chat_message"]);

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const accessToken = authorization.slice("Bearer ".length);
  const requestClient = createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });

  const { data: userData, error: userError } = await requestClient.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as {
    applicationId?: string;
    eventType?: string;
    messageId?: string | null;
  } | null;

  const applicationId = body?.applicationId?.trim();
  const eventType = body?.eventType?.trim();
  const messageId = body?.messageId?.trim() || null;

  if (!applicationId || !eventType || !allowedEvents.has(eventType)) {
    return NextResponse.json({ error: "Invalid DentalJobs notification request." }, { status: 400 });
  }

  const { data: context, error: contextError } = await requestClient.rpc("create_dentaljobs_notification", {
    p_application_id: applicationId,
    p_event_type: eventType,
    p_message_id: messageId,
  });

  if (contextError || !context) {
    return NextResponse.json({ error: contextError?.message || "Notification could not be created." }, { status: 400 });
  }

  const recipientEmail = String(context.recipient_email || "").trim();
  const recipientName = String(context.recipient_name || "there").trim() || "there";
  const title = String(context.title || "DentalJobs update");
  const bodyText = String(context.body || "You have a new DentalJobs update.");
  const profession = String(context.profession || "DentalJobs opportunity");
  const city = String(context.city || "");
  const province = String(context.province || "");
  const href = String(context.href || "/classifieds");
  const actionUrl = `${siteUrl}${href.startsWith("/") ? href : `/${href}`}`;

  const resendApiKey = process.env.RESEND_API_KEY;
  let emailSent = false;

  if (recipientEmail && resendApiKey) {
    const location = [city, province].filter(Boolean).join(", ");
    const detailsHtml = `<div style="margin:20px 0;padding:18px;background:#F5F8FB;border:1px solid #DCE5EF;border-radius:12px;color:#334155;font-size:14px;line-height:1.7;">
      <strong style="display:block;margin-bottom:8px;color:#002757;">DentalJobs update</strong>
      <div><strong>Opportunity:</strong> ${escapeEmailHtml(profession)}</div>
      ${location ? `<div><strong>Location:</strong> ${escapeEmailHtml(location)}</div>` : ""}
      <div style="margin-top:10px;">${escapeEmailHtml(bodyText)}</div>
    </div>`;

    const html = renderDentalShiftEmail({
      siteUrl,
      preheader: title,
      title,
      greeting: `Hello ${recipientName},`,
      intro: bodyText,
      bodyHtml: detailsHtml,
      actionLabel: "Open DentalJobs",
      actionUrl,
      noteHtml: `<p style="margin:0;font-size:14px;line-height:1.6;color:#64748B;">This alert was generated from activity on your DentalShift DentalJobs account.</p>`,
    });

    const text = `${title}\n\n${bodyText}\n\nOpportunity: ${profession}${location ? `\nLocation: ${location}` : ""}\n\nOpen DentalJobs: ${actionUrl}\n\nThe DentalShift Team`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DentalShift <support@dentalshift.ca>",
        to: [recipientEmail],
        subject: title,
        text,
        html,
      }),
    });

    emailSent = response.ok;
    if (!response.ok) {
      console.error("[dentaljobs-notify] email failed", { status: response.status, body: await response.text() });
    }
  }

  return NextResponse.json({ notified: true, emailSent });
}
