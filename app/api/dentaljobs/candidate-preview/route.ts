import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ";

const SOFTWARE = ["Tracker", "ClearDent", "Dentrix", "Open Dental", "ABELDent", "Power Practice", "Curve Dental", "Maxident", "Gold Dental", "RecallMax", "Carestream", "iTero", "CEREC"];
const SKILLS: Array<[string, string[]]> = [
  ["Digital radiography", ["digital radiography", "digital x-ray", "digital xray"]],
  ["Periodontal therapy", ["periodontal", "scaling", "root planing"]],
  ["Patient education", ["patient education", "oral hygiene instruction"]],
  ["Chairside assisting", ["chairside", "four handed", "four-handed"]],
  ["Sterilization & infection control", ["sterilization", "infection control"]],
  ["Dental administration", ["scheduling", "insurance", "recall", "treatment coordination"]],
  ["Digital scanning", ["digital scanning", "intraoral scan", "intraoral scanning", "itero"]],
  ["Restorative dentistry", ["restorative", "composite", "crown", "bridge"]],
  ["Orthodontics", ["orthodontic", "invisalign"]],
  ["Oral surgery support", ["oral surgery", "surgical assisting", "extraction"]],
  ["Endodontic support", ["endodontic", "root canal"]],
  ["Treatment planning", ["treatment planning", "case presentation"]],
];
const CERTIFICATIONS: Array<[string, string[]]> = [
  ["CPR / BLS", ["cpr", "basic life support", "bls"]],
  ["Local anesthetic", ["local anesthetic", "local anaesthetic", "local anesthesia", "local anaesthesia"]],
  ["WHMIS", ["whmis"]],
  ["Radiography certification", ["radiography certificate", "radiography certification", "dental radiography"]],
  ["NDAEB", ["ndaeb"]],
];

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function buildSummary(profession: string, years: number | null, skills: string[], software: string[], certifications: string[]) {
  const pieces: string[] = [];
  pieces.push(profession || "Dental professional");
  if (years != null && years >= 0) pieces.push(`${years} ${years === 1 ? "year" : "years"} of experience`);
  if (skills.length) pieces.push(`experience includes ${skills.slice(0, 3).join(", ").toLowerCase()}`);
  if (software.length) pieces.push(`familiar with ${software.slice(0, 3).join(", ")}`);
  if (certifications.length) pieces.push(`qualifications noted: ${certifications.slice(0, 3).join(", ")}`);
  return `${pieces.join("; ")}.`;
}

async function extractText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const result = await pdfParse(buffer);
    return String(result?.text || "");
  }
  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.toLowerCase().endsWith(".docx")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return String(result?.value || "");
  }
  throw new Error("Candidate Preview generation currently supports PDF and DOCX résumés. The original résumé can still remain stored privately.");
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const accessToken = authorization.slice("Bearer ".length);
  const client = createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData, error: userError } = await client.auth.getUser(accessToken);
  if (userError || !userData.user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const resumePath = String(form.get("resumePath") || "").trim();
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a résumé or CV." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Your résumé or CV must be smaller than 5 MB." }, { status: 400 });

  const [{ data: professional, error: professionalError }, { data: profile, error: profileError }] = await Promise.all([
    client.from("professional_profiles").select("profession,years_experience,licence_status,local_anesthetic,local_anesthetic_status").eq("user_id", userData.user.id).single(),
    client.from("profiles").select("city,province").eq("id", userData.user.id).single(),
  ]);
  if (professionalError || !professional) return NextResponse.json({ error: "Professional profile could not be loaded." }, { status: 400 });
  if (profileError || !profile) return NextResponse.json({ error: "Profile location could not be loaded." }, { status: 400 });

  let rawText = "";
  try {
    rawText = await extractText(file);
  } catch (value) {
    return NextResponse.json({ error: value instanceof Error ? value.message : "Could not read this résumé." }, { status: 400 });
  }

  const text = rawText.toLowerCase().replace(/\s+/g, " ");
  const detectedSoftware = SOFTWARE.filter((name) => text.includes(name.toLowerCase()));
  const detectedSkills = SKILLS.filter(([, terms]) => includesAny(text, terms)).map(([label]) => label);
  const detectedCertifications = CERTIFICATIONS.filter(([, terms]) => includesAny(text, terms)).map(([label]) => label);
  if ((professional.local_anesthetic || professional.local_anesthetic_status === "verified") && !detectedCertifications.includes("Local anesthetic")) detectedCertifications.push("Local anesthetic");

  const years = professional.years_experience == null ? null : Number(professional.years_experience);
  const summary = buildSummary(professional.profession, years, detectedSkills, detectedSoftware, detectedCertifications);
  const educationSummary = /diploma|degree|bachelor|certificate|college|university/.test(text) ? "Dental education or credential information is documented on the résumé." : null;
  const experienceSummary = years != null ? `${years} ${years === 1 ? "year" : "years"} of professional experience reported in the DentalShift profile.` : "Professional dental experience documented on the résumé.";
  const workHistorySummary = /dental|dentistry|clinic|practice/.test(text) ? "Previous dental practice experience is documented. Employer names are withheld before candidate unlock." : null;

  const payload = {
    professional_id: userData.user.id,
    source_resume_path: resumePath || null,
    profession: professional.profession,
    safe_city: profile.city || null,
    safe_province: profile.province || null,
    years_experience: years,
    summary,
    experience_summary: experienceSummary,
    education_summary: educationSummary,
    work_history_summary: workHistorySummary,
    skills: detectedSkills.slice(0, 10),
    software: detectedSoftware.slice(0, 10),
    certifications: detectedCertifications.slice(0, 10),
    generated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await client.from("candidate_previews").upsert(payload, { onConflict: "professional_id" });
  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 });

  return NextResponse.json({ preview: payload });
}
