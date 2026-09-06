import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { escapeEmailHtml, renderDentalShiftEmail } from "@/lib/email";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dentalshift.ca";

export async function POST(request: Request) {
  console.log("[verification-review] request received");
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return NextResponse.json({ error: "Email delivery has not been configured yet." }, { status: 503 });

  const accessToken = authorization.slice("Bearer ".length);
  const requestClient = createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData, error: userError } = await requestClient.auth.getUser(accessToken);
  if (userError || !userData.user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const body = await request.json().catch(() => null) as { targetKind?: string; targetId?: string; notes?: string } | null;
  const targetKind = body?.targetKind;
  const targetId = body?.targetId;
  const notes = body?.notes?.trim() ?? "";
  if ((targetKind !== "professional" && targetKind !== "office") || !targetId || notes.length < 10 || notes.length > 1000) {
    return NextResponse.json({ error: "Enter a review message between 10 and 1,000 characters." }, { status: 400 });
  }

  const { data: adminProfile, error: adminError } = await requestClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (adminError || adminProfile?.role !== "admin") return NextResponse.json({ error: "Only DentalShift administrators can send review requests." }, { status: 403 });

  const { error: decisionError } = await requestClient.rpc("admin_set_verification_status", {
    target_kind: targetKind,
    target_id: targetId,
    new_status: "needs_review",
    decision_notes: notes,
  });
  if (decisionError) return NextResponse.json({ error: decisionError.message }, { status: 400 });

  const { data: contacts, error: contactError } = await requestClient.rpc("get_verification_target_contact", {
    target_kind: targetKind,
    target_id: targetId,
  });
  const recipient = Array.isArray(contacts) ? contacts[0] : contacts;
  const recipientEmail = recipient?.email?.trim();
  if (contactError || !recipientEmail) {
    console.error("[verification-review] recipient lookup failed", { targetKind, targetId, contactError: contactError?.message });
    return NextResponse.json({ emailSent: false, error: "Review request was saved, but the applicant email could not be found." });
  }

  const firstName = recipient.first_name?.trim() || "there";
  const safeNotes = escapeEmailHtml(notes).replace(/\n/g, "<br />");
  const html = renderDentalShiftEmail({
    siteUrl,
    preheader: "DentalShift needs a little more information to complete your verification.",
    title: "Action needed to verify your account",
    greeting: `Hello ${firstName},`,
    intro: "We need a little more information before we can complete your DentalShift verification.",
    bodyHtml: `<div style="margin:20px 0;padding:16px 18px;background:#FFF8E6;border:1px solid #F6D77C;border-radius:12px;color:#334155;font-size:15px;line-height:1.65;"><strong style="display:block;margin-bottom:6px;color:#002757;">What we need from you</strong>${safeNotes}</div>`,
    actionLabel: "Open DentalShift",
    actionUrl: siteUrl,
    noteHtml: `<p style="margin:0;font-size:14px;line-height:1.6;color:#64748B;">Your account will remain unavailable for live shifts until verification is complete.</p>`,
  });

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "DentalShift <support@dentalshift.ca>",
      to: [recipientEmail],
      subject: "Action needed to verify your DentalShift account",
      text: `Hello ${firstName},\n\nWe need a little more information before we can complete your DentalShift verification:\n\n${notes}\n\nOpen DentalShift: ${siteUrl}\n\nYour account will remain unavailable for live shifts until verification is complete.\n\nThe DentalShift Team`,
      html,
    }),
  });

  if (!emailResponse.ok) {
    const resendError = await emailResponse.text();
    console.error("[verification-review] Resend rejected email", { status: emailResponse.status, resendError });
    return NextResponse.json({ emailSent: false, error: "Review request was saved, but Resend rejected the email. Please check the Resend API key and sender domain." });
  }

  console.log("[verification-review] email accepted by Resend", { targetKind, targetId });
  return NextResponse.json({ emailSent: true });
}
