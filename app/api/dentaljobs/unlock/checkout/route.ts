import { createClient } from "@supabase/supabase-js";
import { after, NextResponse } from "next/server";
import { escapeEmailHtml, renderDentalShiftEmail } from "@/lib/email";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const unlockPriceCents = Number(process.env.DENTALJOBS_UNLOCK_PRICE_CENTS ?? "2900");
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dentalshift.ca";

function safeFileName(path: string, professionalName: string) {
  const original = path.split("/").pop() || "resume.pdf";
  const extensionMatch = original.match(/\.(pdf|doc|docx)$/i);
  const extension = extensionMatch?.[1]?.toLowerCase() || "pdf";
  const base = professionalName
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "Dental-Professional";
  return `${base}-Resume.${extension}`;
}

async function sendMatchEmail(input: {
  applicationId: string;
  officeId: string;
  officeOwnerId: string;
  officeName: string | null;
  officeCommunicationEmail: string | null;
  officeContactName: string | null;
  professionalId: string;
  professionalName: string;
  professionalFirstName: string;
  professionalEmail: string;
  professionalPhone: string | null;
  profession: string;
  professionalLocation: string;
  resumePath: string | null;
}) {
  if (!serviceRoleKey) return;

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("[dentaljobs-match] RESEND_API_KEY is not configured");
      return;
    }

    const { data: officeOwnerAuth } = await admin.auth.admin.getUserById(input.officeOwnerId);
    const officeEmail = input.officeCommunicationEmail?.trim() || officeOwnerAuth.user?.email?.trim() || "";
    if (!officeEmail || !input.professionalEmail) {
      console.error("[dentaljobs-match] missing office or professional email", {
        applicationId: input.applicationId,
        hasOfficeEmail: Boolean(officeEmail),
        hasProfessionalEmail: Boolean(input.professionalEmail),
      });
      return;
    }

    let resumeBlob: Blob | null = null;
    if (input.resumePath) {
      const { data, error: resumeError } = await admin.storage
        .from("professional-resumes")
        .download(input.resumePath);
      resumeBlob = data ?? null;
      if (resumeError || !resumeBlob) {
        console.error("[dentaljobs-match] resume download failed", resumeError);
      }
    }

    const detailsHtml = `<div style="margin:20px 0;padding:18px;background:#F5F8FB;border:1px solid #DCE5EF;border-radius:12px;color:#334155;font-size:14px;line-height:1.7;">
      <strong style="display:block;margin-bottom:8px;color:#002757;">Professional contact details</strong>
      <div><strong>Name:</strong> ${escapeEmailHtml(input.professionalName)}</div>
      <div><strong>Profession:</strong> ${escapeEmailHtml(input.profession)}</div>
      <div><strong>Email:</strong> ${escapeEmailHtml(input.professionalEmail)}</div>
      ${input.professionalPhone ? `<div><strong>Phone:</strong> ${escapeEmailHtml(input.professionalPhone)}</div>` : ""}
      ${input.professionalLocation ? `<div><strong>Location:</strong> ${escapeEmailHtml(input.professionalLocation)}</div>` : ""}
    </div>`;

    const officeGreeting = input.officeContactName?.trim() || input.officeName?.trim() || "Dental Office";
    const resumeNote = resumeBlob
      ? " The professional’s résumé/CV is attached for your review."
      : " A résumé/CV was not available for this earlier application; please request it directly from the professional if needed.";

    const html = renderDentalShiftEmail({
      siteUrl,
      preheader: `You matched with ${input.professionalName}`,
      title: "You’ve made a DentalJobs match",
      greeting: `Hello ${officeGreeting},`,
      intro: `Your office selected LET’S MATCH with ${input.professionalName}.`,
      bodyHtml: `${detailsHtml}
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#334155;">We recommend contacting ${escapeEmailHtml(input.professionalFirstName)} promptly to introduce your office, discuss the opportunity and arrange an interview.</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#64748B;">${escapeEmailHtml(input.professionalFirstName)} has been copied on this email so both parties can connect directly.${escapeEmailHtml(resumeNote)}</p>`,
      actionLabel: "Open DentalJobs",
      actionUrl: `${siteUrl}/dental-jobs`,
      noteHtml: `<p style="margin:0;font-size:13px;line-height:1.6;color:#64748B;">DentalShift introduced this match. Interviewing, hiring decisions and employment terms remain between the dental office and the professional.</p>`,
    });

    const text = `You’ve made a DentalJobs match\n\nHello ${officeGreeting},\n\nYour office selected LET’S MATCH with ${input.professionalName}.\n\nProfessional contact details\nName: ${input.professionalName}\nProfession: ${input.profession}\nEmail: ${input.professionalEmail}${input.professionalPhone ? `\nPhone: ${input.professionalPhone}` : ""}${input.professionalLocation ? `\nLocation: ${input.professionalLocation}` : ""}\n\nWe recommend contacting ${input.professionalFirstName} promptly to introduce your office, discuss the opportunity and arrange an interview.\n\n${input.professionalFirstName} has been copied on this email so both parties can connect directly.${resumeNote}\n\nThe DentalShift Team`;

    const attachments: Array<{ filename: string; content: string }> = [];
    if (resumeBlob && input.resumePath) {
      const bytes = Buffer.from(await resumeBlob.arrayBuffer());
      attachments.push({
        filename: safeFileName(input.resumePath, input.professionalName),
        content: bytes.toString("base64"),
      });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DentalShift <support@dentalshift.ca>",
        to: [officeEmail],
        cc: [input.professionalEmail],
        subject: `DentalShift Match: ${input.professionalName} — ${input.profession}`,
        text,
        html,
        attachments,
      }),
    });

    if (!response.ok) {
      console.error("[dentaljobs-match] email failed", {
        status: response.status,
        body: await response.text(),
        applicationId: input.applicationId,
      });
    }
  } catch (emailError) {
    console.error("[dentaljobs-match] email error", emailError);
  }
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!serviceRoleKey) return NextResponse.json({ error: "Candidate unlock billing is not configured yet." }, { status: 503 });

  const accessToken = authorization.slice("Bearer ".length);
  const requestClient = createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await requestClient.auth.getUser(accessToken);
  if (userError || !userData.user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const body = await request.json().catch(() => null) as { applicationId?: string } | null;
  const applicationId = body?.applicationId?.trim();
  if (!applicationId) return NextResponse.json({ error: "Application is required." }, { status: 400 });

  const { data: application } = await admin
    .from("job_applications")
    .select("id,office_id,professional_id,resume_path_snapshot")
    .eq("id", applicationId)
    .maybeSingle();
  if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });

  const [{ data: office }, { data: professional }, { data: professionalProfile }, { data: professionalAuth }] = await Promise.all([
    admin
      .from("offices")
      .select("id,owner_id,name,communication_email,contact_name")
      .eq("id", application.office_id)
      .maybeSingle(),
    admin
      .from("professional_profiles")
      .select("profession,resume_path")
      .eq("user_id", application.professional_id)
      .maybeSingle(),
    admin
      .from("profiles")
      .select("first_name,last_name,phone,city,province")
      .eq("id", application.professional_id)
      .maybeSingle(),
    admin.auth.admin.getUserById(application.professional_id),
  ]);

  if (!office || office.owner_id !== userData.user.id) {
    return NextResponse.json({ error: "Only this dental office can complete the match." }, { status: 403 });
  }

  const resumePath = application.resume_path_snapshot || professional?.resume_path || null;

  const { data: billing } = await admin
    .from("office_billing_profiles")
    .select("billing_status,payment_method_on_file,provider_payment_method_id")
    .eq("office_id", application.office_id)
    .maybeSingle();
  if (!billing || billing.billing_status !== "active" || !billing.payment_method_on_file || !billing.provider_payment_method_id) {
    return NextResponse.json({ error: "A valid credit card must be on file before you can complete a DentalJobs match.", needsPaymentMethod: true }, { status: 402 });
  }

  const nowIso = new Date().toISOString();
  const billingPeriod = nowIso.slice(0, 7);

  const { data: existing } = await admin
    .from("candidate_unlocks")
    .select("id,status")
    .eq("office_id", application.office_id)
    .eq("professional_id", application.professional_id)
    .maybeSingle();

  let unlockId = existing?.id ?? null;
  const alreadyUnlocked = Boolean(existing && ["accrued", "billed", "paid"].includes(existing.status));

  if (!alreadyUnlocked) {
    if (unlockId) {
      const { error } = await admin
        .from("candidate_unlocks")
        .update({
          application_id: application.id,
          amount_cents: unlockPriceCents,
          currency: "cad",
          status: "accrued",
          billing_period: billingPeriod,
          updated_at: nowIso,
        })
        .eq("id", unlockId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      const { data: created, error } = await admin
        .from("candidate_unlocks")
        .insert({
          application_id: application.id,
          office_id: application.office_id,
          professional_id: application.professional_id,
          amount_cents: unlockPriceCents,
          currency: "cad",
          status: "accrued",
          billing_period: billingPeriod,
        })
        .select("id")
        .single();
      if (error || !created) return NextResponse.json({ error: error?.message || "Could not record candidate match." }, { status: 400 });
      unlockId = created.id;
    }

    const { error: lineError } = await admin.from("billing_line_items").upsert({
      office_id: application.office_id,
      booking_id: null,
      service_date: nowIso.slice(0, 10),
      description: "DentalJobs Candidate Match",
      amount_cents: unlockPriceCents,
      status: "unbilled",
      invoice_id: null,
      source_type: "dentaljobs_unlock",
      source_id: unlockId,
      updated_at: nowIso,
    }, { onConflict: "source_type,source_id" });
    if (lineError) return NextResponse.json({ error: lineError.message }, { status: 400 });
  }

  const { error: applicationUpdateError } = await admin
    .from("job_applications")
    .update({
      status: "interested",
      responded_at: nowIso,
      office_hidden_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", application.id);
  if (applicationUpdateError) return NextResponse.json({ error: applicationUpdateError.message }, { status: 400 });

  const professionalName = [professionalProfile?.first_name, professionalProfile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim() || "Dental Professional";
  const professionalFirstName = professionalProfile?.first_name?.trim() || professionalName;
  const professionalEmail = professionalAuth.user?.email?.trim() || "";
  const profession = professional?.profession || "Dental Professional";
  const professionalLocation = [professionalProfile?.city, professionalProfile?.province].filter(Boolean).join(", ");

  if (!alreadyUnlocked) {
    after(async () => {
      await sendMatchEmail({
        applicationId: application.id,
        officeId: application.office_id,
        officeOwnerId: office.owner_id,
        officeName: office.name || null,
        officeCommunicationEmail: office.communication_email || null,
        officeContactName: office.contact_name || null,
        professionalId: application.professional_id,
        professionalName,
        professionalFirstName,
        professionalEmail,
        professionalPhone: professionalProfile?.phone || null,
        profession,
        professionalLocation,
        resumePath,
      });
    });
  }

  return NextResponse.json({
    unlocked: true,
    matched: true,
    alreadyUnlocked,
    amountCents: unlockPriceCents,
    billingPeriod,
    billedMonthly: true,
    emailQueued: !alreadyUnlocked,
    resumeAttachedWhenAvailable: Boolean(resumePath),
  });
}
