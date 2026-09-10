from pathlib import Path

# 1) Create the server-side candidate preview generator.
route = Path('app/api/dentaljobs/candidate-preview/route.ts')
route.parent.mkdir(parents=True, exist_ok=True)
route.write_text(r'''import { createClient } from "@supabase/supabase-js";
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
''')

# 2) Trigger preview generation whenever the professional uploads a new résumé.
page = Path('app/page.tsx')
text = page.read_text()
old = '''  const uploadResume = async (file?: File) => {
    if (!file || !session || !details?.professional) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const resumePath = await uploadProfessionalResume(session.user.id, file);
      setDetails({ ...details, professional: { ...details.professional, resume_path: resumePath } });
      setNotice("Your résumé/CV was uploaded securely.");
      onSaved();
    } catch (value) { setError(value instanceof Error ? value.message : "Your résumé/CV could not be uploaded."); }
    finally { setBusy(false); }
  };
'''
new = '''  const uploadResume = async (file?: File) => {
    if (!file || !session || !details?.professional) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const resumePath = await uploadProfessionalResume(session.user.id, file);
      setDetails({ ...details, professional: { ...details.professional, resume_path: resumePath } });

      const form = new FormData();
      form.append("file", file);
      form.append("resumePath", resumePath);
      const previewResponse = await fetch("/api/dentaljobs/candidate-preview", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      });
      const previewResult = await previewResponse.json().catch(() => null);
      if (previewResponse.ok) {
        setNotice("Your résumé/CV was uploaded securely and your private Candidate Preview was generated.");
      } else {
        setNotice("Your résumé/CV was uploaded securely. Candidate Preview generation needs attention before using it for DentalJobs applications.");
        if (previewResult?.error) setError(String(previewResult.error));
      }
      onSaved();
    } catch (value) { setError(value instanceof Error ? value.message : "Your résumé/CV could not be uploaded."); }
    finally { setBusy(false); }
  };
'''
if old not in text:
    raise RuntimeError('Professional resume upload anchor not found')
text = text.replace(old, new, 1)
page.write_text(text)

# 3) Show the sanitized candidate preview to offices inside DentalJobs connections.
classifieds = Path('app/classifieds/page.tsx')
text = classifieds.read_text()
connection_type = '''type JobConnection = {
  id: string;
  listingId: string;
  professionalId: string;
  officeId: string;
  initiatorRole: "professional" | "office";
  status: "pending" | "interested" | "declined" | "withdrawn";
  message: string;
  resumePath: string | null;
  createdAt: string;
  profession: string;
  employment: string;
  city: string;
  province: string;
  listingType: "office_hiring" | "professional_available";
};
'''
preview_type = '''type CandidatePreview = {
  profession: string | null;
  safeCity: string | null;
  safeProvince: string | null;
  yearsExperience: number | null;
  summary: string;
  experienceSummary: string | null;
  educationSummary: string | null;
  workHistorySummary: string | null;
  skills: string[];
  software: string[];
  certifications: string[];
};

'''
if connection_type not in text:
    raise RuntimeError('JobConnection type anchor not found')
text = text.replace(connection_type, preview_type + connection_type.replace('  listingType: "office_hiring" | "professional_available";\n', '  listingType: "office_hiring" | "professional_available";\n  candidatePreview?: CandidatePreview | null;\n'), 1)

old_loader = '''    if (error || !data) return;
    setConnections((data as any[]).map((row) => {
      const listing = Array.isArray(row.job_listings) ? row.job_listings[0] : row.job_listings;
      return {
        id: row.id, listingId: row.listing_id, professionalId: row.professional_id, officeId: row.office_id,
        initiatorRole: row.initiator_role, status: row.status, message: row.message || "", resumePath: row.resume_path_snapshot || null,
        createdAt: row.created_at, profession: listing?.profession || "Dental position", employment: listing?.employment_type || "",
        city: listing?.city || "", province: listing?.province || "", listingType: listing?.listing_type || "office_hiring",
      } as JobConnection;
    }));
'''
new_loader = '''    if (error || !data) return;
    const rows = data as any[];
    const professionalIds = [...new Set(rows.map((row) => String(row.professional_id)).filter(Boolean))];
    const previewMap = new Map<string, CandidatePreview>();
    if (professionalIds.length) {
      const { data: previewRows } = await supabase
        .from("candidate_previews")
        .select("professional_id,profession,safe_city,safe_province,years_experience,summary,experience_summary,education_summary,work_history_summary,skills,software,certifications")
        .in("professional_id", professionalIds);
      for (const preview of previewRows || []) {
        previewMap.set(String(preview.professional_id), {
          profession: preview.profession || null,
          safeCity: preview.safe_city || null,
          safeProvince: preview.safe_province || null,
          yearsExperience: preview.years_experience == null ? null : Number(preview.years_experience),
          summary: preview.summary || "",
          experienceSummary: preview.experience_summary || null,
          educationSummary: preview.education_summary || null,
          workHistorySummary: preview.work_history_summary || null,
          skills: preview.skills || [],
          software: preview.software || [],
          certifications: preview.certifications || [],
        });
      }
    }
    setConnections(rows.map((row) => {
      const listing = Array.isArray(row.job_listings) ? row.job_listings[0] : row.job_listings;
      return {
        id: row.id, listingId: row.listing_id, professionalId: row.professional_id, officeId: row.office_id,
        initiatorRole: row.initiator_role, status: row.status, message: row.message || "", resumePath: row.resume_path_snapshot || null,
        createdAt: row.created_at, profession: listing?.profession || "Dental position", employment: listing?.employment_type || "",
        city: listing?.city || "", province: listing?.province || "", listingType: listing?.listing_type || "office_hiring",
        candidatePreview: previewMap.get(String(row.professional_id)) || null,
      } as JobConnection;
    }));
'''
if old_loader not in text:
    raise RuntimeError('loadConnections mapping anchor not found')
text = text.replace(old_loader, new_loader, 1)

old_resume_line = '''{portalRole === "office" && item.resumePath && <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-[#01A32E]"><FileText size={14}/> Résumé/CV attached privately</p>}'''
new_resume_line = '''{portalRole === "office" && item.candidatePreview && <div className="mt-3 max-w-2xl rounded-2xl border border-[#4285F4]/20 bg-[#f7faff] p-4"><div className="flex items-center gap-2"><FileText size={16} className="text-[#4285F4]"/><p className="text-xs font-black uppercase tracking-[0.12em] text-[#4285F4]">Candidate Preview</p></div><p className="mt-2 text-sm font-bold leading-6 text-[#002757]">{item.candidatePreview.summary}</p><div className="mt-3 flex flex-wrap gap-2">{item.candidatePreview.yearsExperience != null && <span className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-200">{item.candidatePreview.yearsExperience} yrs experience</span>}{item.candidatePreview.skills.slice(0,4).map((skill) => <span key={skill} className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-200">{skill}</span>)}{item.candidatePreview.software.slice(0,3).map((software) => <span key={software} className="rounded-lg bg-[#eef4ff] px-2.5 py-1.5 text-xs font-black text-[#245FB8]">{software}</span>)}</div>{item.candidatePreview.certifications.length > 0 && <p className="mt-3 text-xs font-bold text-[#017f27]">Qualifications: {item.candidatePreview.certifications.join(" · ")}</p>}<p className="mt-3 text-[11px] font-semibold leading-5 text-slate-400">Name, direct contact details, exact address, employer names and the original résumé are withheld before candidate unlock.</p></div>}'''
if old_resume_line not in text:
    raise RuntimeError('Office resume line anchor not found')
text = text.replace(old_resume_line, new_resume_line, 1)

old_apply_copy = '''{portalRole === "professional" && <div className={`mt-4 rounded-2xl border p-4 ${resumePath ? "border-[#01A32E]/25 bg-[#f3fbf5]" : "border-amber-200 bg-amber-50"}`}><div className="flex items-start gap-3"><FileText size={20} className={resumePath ? "text-[#01A32E]" : "text-amber-600"}/><div><p className="font-black text-[#002757]">{resumePath ? "Résumé/CV attached from your profile" : "No résumé/CV currently on file"}</p><p className="mt-1 text-sm leading-6 text-slate-600">{resumePath ? "DentalShift will reference the private résumé stored in your professional account for this application." : "You can still send your application, but adding a résumé to your professional account will make it stronger."}</p></div></div></div>}'''
new_apply_copy = '''{portalRole === "professional" && <div className={`mt-4 rounded-2xl border p-4 ${resumePath ? "border-[#01A32E]/25 bg-[#f3fbf5]" : "border-amber-200 bg-amber-50"}`}><div className="flex items-start gap-3"><FileText size={20} className={resumePath ? "text-[#01A32E]" : "text-amber-600"}/><div><p className="font-black text-[#002757]">{resumePath ? "Candidate Preview will be shared" : "No résumé/CV currently on file"}</p><p className="mt-1 text-sm leading-6 text-slate-600">{resumePath ? "DentalShift shares the sanitized Candidate Preview generated from your résumé. Your original résumé, name and direct contact details stay private until a future candidate-unlock step." : "Upload a PDF or DOCX résumé in your professional profile so DentalShift can generate a privacy-safe Candidate Preview before you apply."}</p></div></div></div>}'''
if old_apply_copy not in text:
    raise RuntimeError('Application resume copy anchor not found')
text = text.replace(old_apply_copy, new_apply_copy, 1)

classifieds.write_text(text)
print('Candidate Preview system patch applied')
