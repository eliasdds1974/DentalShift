import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dentalshift.ca";

function escapeHtml(value: string) {
  return value.replace(/[&<>'\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!serviceRoleKey || !resendApiKey) {
    return NextResponse.json({ error: "Email delivery has not been configured yet." }, { status: 503 });
  }

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

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let recipientId = targetId;
  if (targetKind === "office") {
    const { data: office, error: officeError } = await serviceClient.from("offices").select("owner_id").eq("id", targetId).maybeSingle();
    if (officeError || !office?.owner_id) return NextResponse.json({ emailSent: false });
    recipientId = office.owner_id;
  }

  const [{ data: recipientData, error: recipientError }, { data: recipientProfile }] = await Promise.all([
    serviceClient.auth.admin.getUserById(recipientId),
    serviceClient.from("profiles").select("first_name").eq("id", recipientId).maybeSingle(),
  ]);
  const recipientEmail = recipientData.user?.email;
  if (recipientError || !recipientEmail) return NextResponse.json({ emailSent: false });

  const firstName = recipientProfile?.first_name?.trim() || "there";
  const safeNotes = escapeHtml(notes).replace(/\n/g, "<br />");
  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "DentalShift Support <support@dentalshift.ca>",
      to: [recipientEmail],
      subject: "Action needed to verify your DentalShift account",
      text: `Hello ${firstName},\n\nYour DentalShift verification needs additional information:\n\n${notes}\n\nSign in to DentalShift to update your profile: ${siteUrl}\n\nYour account will remain unavailable for live shifts until verification is complete.\n\nDentalShift Support`,
      html: `<div style="font-family:Arial,sans-serif;color:#14213d;line-height:1.6;max-width:600px;margin:0 auto;padding:24px"><h1 style="font-size:24px;margin:0 0 20px">Action needed to verify your account</h1><p>Hello ${escapeHtml(firstName)},</p><p>Your DentalShift verification needs additional information:</p><div style="background:#fff8e6;border:1px solid #f2c95c;border-radius:12px;padding:16px;margin:20px 0">${safeNotes}</div><p><a href="${siteUrl}" style="display:inline-block;background:#16b85a;color:#ffffff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700">Sign in to DentalShift</a></p><p>Your account will remain unavailable for live shifts until verification is complete.</p><p>DentalShift Support</p></div>`,
    }),
  });

  if (!emailResponse.ok) return NextResponse.json({ emailSent: false });
  return NextResponse.json({ emailSent: true });
}
