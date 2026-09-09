import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { escapeEmailHtml, renderDentalShiftEmail } from "@/lib/email";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dentalshift.ca";

function timezoneForProvince(province?: string | null) {
  const value = (province || "").toUpperCase();
  if (value === "BC") return "America/Vancouver";
  if (value === "AB" || value === "NT") return "America/Edmonton";
  if (value === "SK") return "America/Regina";
  if (value === "MB") return "America/Winnipeg";
  if (["ON", "QC"].includes(value)) return "America/Toronto";
  if (["NB", "NS", "PE"].includes(value)) return "America/Halifax";
  if (value === "NL") return "America/St_Johns";
  return "America/Edmonton";
}

function formatDate(value: string, province?: string | null) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezoneForProvince(province),
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string, province?: string | null) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezoneForProvince(province),
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

  const body = await request.json().catch(() => null) as { bookingId?: string; reason?: string } | null;
  const bookingId = body?.bookingId?.trim();
  const reason = body?.reason?.trim() ?? "";
  if (!bookingId || reason.length < 3 || reason.length > 1000) {
    return NextResponse.json({ error: "Please provide a cancellation reason." }, { status: 400 });
  }

  const { data: context, error: contextError } = await requestClient.rpc("get_booking_cancellation_context", { p_booking_id: bookingId });
  if (contextError || !context) return NextResponse.json({ error: contextError?.message || "Booking details could not be loaded." }, { status: 400 });

  const { error: cancelError } = await requestClient.rpc("cancel_confirmed_booking", { p_booking_id: bookingId, p_reason: reason });
  if (cancelError) return NextResponse.json({ error: cancelError.message }, { status: 400 });

  const actorParty = String(context.actor_party || "");
  const officeEmail = String(context.office_email || "").trim();
  const professionalEmail = String(context.professional_email || "").trim();
  const recipientEmail = actorParty === "professional" ? officeEmail : professionalEmail;
  const resendApiKey = process.env.RESEND_API_KEY;
  let emailSent = false;

  if (recipientEmail && resendApiKey) {
    const province = String(context.licence_province || "");
    const shiftDate = formatDate(String(context.shift_starts_at), province);
    const shiftTime = `${formatTime(String(context.shift_starts_at), province)}–${formatTime(String(context.shift_ends_at), province)}`;
    const safeReason = escapeEmailHtml(reason).replace(/\n/g, "<br />");

    const professionalName = String(context.professional_name || "Dental professional").trim() || "Dental professional";
    const profession = String(context.profession || "Dental Professional");
    const licence = [context.licence_province, context.licence_number].filter(Boolean).join(" ") || "Not listed";
    const phone = String(context.professional_phone || "").trim();
    const proEmail = professionalEmail || "Not listed";
    const officeName = String(context.office_name || "Dental Office");

    const isProfessionalCancellation = actorParty === "professional";
    const title = isProfessionalCancellation ? "Booking cancelled by dental professional" : "Booking cancelled by dental office";
    const greetingName = isProfessionalCancellation ? (String(context.office_contact_name || officeName).trim() || officeName) : professionalName;
    const intro = isProfessionalCancellation
      ? "A confirmed DentalShift booking has been cancelled by the professional. The shift has been reopened in DentalShift."
      : "A confirmed DentalShift booking has been cancelled by the dental office.";

    const detailsHtml = isProfessionalCancellation
      ? `<div style="margin:20px 0;padding:18px;background:#FFF7F7;border:1px solid #F5B5B5;border-radius:12px;color:#334155;font-size:14px;line-height:1.7;">
          <strong style="display:block;margin-bottom:8px;color:#002757;">Cancelled appointment details</strong>
          <div><strong>Professional:</strong> ${escapeEmailHtml(professionalName)}</div>
          <div><strong>Position:</strong> ${escapeEmailHtml(profession)}</div>
          <div><strong>Licence / registration:</strong> ${escapeEmailHtml(licence)}</div>
          <div><strong>Email:</strong> ${escapeEmailHtml(proEmail)}</div>
          ${phone ? `<div><strong>Phone:</strong> ${escapeEmailHtml(phone)}</div>` : ""}
          <div><strong>Shift date:</strong> ${escapeEmailHtml(shiftDate)}</div>
          <div><strong>Shift time:</strong> ${escapeEmailHtml(shiftTime)}</div>
          <div style="margin-top:10px;"><strong>Cancellation reason:</strong><br />${safeReason}</div>
        </div>`
      : `<div style="margin:20px 0;padding:18px;background:#FFF7F7;border:1px solid #F5B5B5;border-radius:12px;color:#334155;font-size:14px;line-height:1.7;">
          <strong style="display:block;margin-bottom:8px;color:#002757;">Cancelled appointment details</strong>
          <div><strong>Dental office:</strong> ${escapeEmailHtml(officeName)}</div>
          <div><strong>Shift date:</strong> ${escapeEmailHtml(shiftDate)}</div>
          <div><strong>Shift time:</strong> ${escapeEmailHtml(shiftTime)}</div>
          <div style="margin-top:10px;"><strong>Cancellation reason:</strong><br />${safeReason}</div>
        </div>`;

    const html = renderDentalShiftEmail({
      siteUrl,
      preheader: title,
      title,
      greeting: `Hello ${greetingName},`,
      intro,
      bodyHtml: detailsHtml,
      actionLabel: "Open DentalShift",
      actionUrl: siteUrl,
      noteHtml: isProfessionalCancellation
        ? `<p style="margin:0;font-size:14px;line-height:1.6;color:#64748B;">The professional's licence/registration details are included above so your office can update its records.</p>`
        : undefined,
    });

    const text = isProfessionalCancellation
      ? `A confirmed DentalShift booking was cancelled by the professional.\n\nProfessional: ${professionalName}\nPosition: ${profession}\nLicence / registration: ${licence}\nEmail: ${proEmail}${phone ? `\nPhone: ${phone}` : ""}\nShift date: ${shiftDate}\nShift time: ${shiftTime}\nCancellation reason: ${reason}\n\nThe shift has been reopened in DentalShift.\n\nThe DentalShift Team`
      : `A confirmed DentalShift booking was cancelled by the dental office.\n\nOffice: ${officeName}\nShift date: ${shiftDate}\nShift time: ${shiftTime}\nCancellation reason: ${reason}\n\nThe DentalShift Team`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "DentalShift <support@dentalshift.ca>",
        to: [recipientEmail],
        subject: `${title} — ${shiftDate}`,
        text,
        html,
      }),
    });
    emailSent = emailResponse.ok;
    if (!emailResponse.ok) console.error("[booking-cancellation] email failed", { status: emailResponse.status, body: await emailResponse.text() });
  }

  return NextResponse.json({ cancelled: true, emailSent, actorParty });
}
