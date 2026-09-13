"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Check, ChevronLeft, FileText, GraduationCap, Languages, Plus, Save, Sparkles, Trash2, Wrench } from "lucide-react";
import { supabase } from "@/lib/supabase";

type EducationEntry = { program: string; school: string; year: string };
type WorkEntry = { role: string; employer: string; dates: string; details: string };
type ResumeData = {
  profile: { first_name?: string | null; last_name?: string | null; city?: string | null; province?: string | null; phone?: string | null };
  professional: {
    profession?: string | null;
    licence_number?: string | null;
    licence_province?: string | null;
    years_experience?: number | null;
    languages?: string[] | null;
    bio?: string | null;
    software?: string[] | null;
    clinical_skills?: string[] | null;
    certifications?: string[] | null;
    education?: EducationEntry[] | null;
    work_history?: WorkEntry[] | null;
    resume_summary?: string | null;
    updated_at?: string | null;
  };
};

const emptyEducation: EducationEntry = { program: "", school: "", year: "" };
const emptyWork: WorkEntry = { role: "", employer: "", dates: "", details: "" };

function parseList(value: string) {
  return Array.from(new Set(value.split(",").map((item) => item.trim()).filter(Boolean)));
}

function listText(values?: string[] | null) {
  return (values || []).join(", ");
}

export default function ProfessionalDigitalResumePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [data, setData] = useState<ResumeData | null>(null);
  const [summary, setSummary] = useState("");
  const [yearsExperience, setYearsExperience] = useState(0);
  const [languages, setLanguages] = useState("");
  const [software, setSoftware] = useState("");
  const [skills, setSkills] = useState("");
  const [certifications, setCertifications] = useState("");
  const [education, setEducation] = useState<EducationEntry[]>([{ ...emptyEducation }]);
  const [workHistory, setWorkHistory] = useState<WorkEntry[]>([{ ...emptyWork }]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) throw new Error("Please sign in to open your Digital Resume.");
        const { data: resume, error: resumeError } = await supabase.rpc("get_professional_digital_resume");
        if (resumeError) throw resumeError;
        if (cancelled) return;
        const loaded = resume as ResumeData;
        setData(loaded);
        const professional = loaded.professional || {};
        setSummary(professional.resume_summary || professional.bio || "");
        setYearsExperience(Number(professional.years_experience || 0));
        setLanguages(listText(professional.languages));
        setSoftware(listText(professional.software));
        setSkills(listText(professional.clinical_skills));
        setCertifications(listText(professional.certifications));
        setEducation(professional.education?.length ? professional.education : [{ ...emptyEducation }]);
        setWorkHistory(professional.work_history?.length ? professional.work_history : [{ ...emptyWork }]);
      } catch (value) {
        if (!cancelled) setError(value instanceof Error ? value.message : "Could not load your Digital Resume.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const completion = useMemo(() => {
    let score = 0;
    if (summary.trim()) score += 20;
    if (yearsExperience > 0) score += 10;
    if (parseList(languages).length) score += 10;
    if (parseList(software).length) score += 15;
    if (parseList(skills).length) score += 15;
    if (parseList(certifications).length) score += 10;
    if (education.some((item) => item.program || item.school)) score += 10;
    if (workHistory.some((item) => item.role || item.employer)) score += 10;
    return Math.min(100, score);
  }, [summary, yearsExperience, languages, software, skills, certifications, education, workHistory]);

  const save = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const cleanEducation = education.filter((item) => item.program.trim() || item.school.trim() || item.year.trim()).map((item) => ({
        program: item.program.trim(), school: item.school.trim(), year: item.year.trim(),
      }));
      const cleanWork = workHistory.filter((item) => item.role.trim() || item.employer.trim() || item.dates.trim() || item.details.trim()).map((item) => ({
        role: item.role.trim(), employer: item.employer.trim(), dates: item.dates.trim(), details: item.details.trim(),
      }));
      const { error: saveError } = await supabase.rpc("save_professional_digital_resume", {
        p_summary: summary.trim(),
        p_years_experience: Math.max(0, Number(yearsExperience || 0)),
        p_languages: parseList(languages),
        p_software: parseList(software),
        p_clinical_skills: parseList(skills),
        p_certifications: parseList(certifications),
        p_education: cleanEducation,
        p_work_history: cleanWork,
      });
      if (saveError) throw saveError;
      setSuccess("Digital Resume saved. DentalJobs will now use this information for your professional profile.");
    } catch (value) {
      setError(value instanceof Error ? value.message : "Your Digital Resume could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-[#f5f8fb] p-6"><div className="mx-auto max-w-6xl animate-pulse rounded-3xl bg-white p-10 shadow-sm"><div className="h-10 w-64 rounded bg-slate-200"/><div className="mt-6 h-72 rounded-2xl bg-slate-100"/></div></main>;
  }

  const fullName = [data?.profile?.first_name, data?.profile?.last_name].filter(Boolean).join(" ") || "Dental Professional";
  const profession = data?.professional?.profession || "Dental Professional";
  const location = [data?.profile?.city, data?.profile?.province].filter(Boolean).join(", ") || "Location not set";

  return (
    <main className="min-h-screen bg-[#f5f8fb] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="h-11 w-auto" priority />
            <div className="hidden border-l border-slate-200 pl-4 sm:block"><p className="text-xs font-black uppercase tracking-[.12em] text-[#01A32E]">Professional Profile</p><p className="text-sm font-bold text-slate-500">Digital Resume</p></div>
          </div>
          <Link href="/professionals/profile" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-[#002757] shadow-sm hover:bg-slate-50"><ChevronLeft size={17}/>Back to Account</Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <div className="rounded-3xl border border-[#01A32E]/25 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div><div className="inline-flex items-center gap-2 rounded-full bg-[#eaf8ee] px-3 py-1.5 text-xs font-black uppercase tracking-[.1em] text-[#017f27]"><Sparkles size={14}/>DentalShift Digital Resume</div><h1 className="mt-3 text-3xl font-black tracking-tight text-[#002757]">Build your professional profile once</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">DentalJobs uses this structured information instead of requiring you to upload a résumé. Offices see the same consistent professional profile every time.</p></div>
              <div className="shrink-0 rounded-2xl bg-[#f5f8fb] px-4 py-3 text-center"><p className="text-2xl font-black text-[#01A32E]">{completion}%</p><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Complete</p></div>
            </div>
          </div>

          {error && <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}
          {success && <div className="rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700"><Check size={17} className="mr-2 inline"/>{success}</div>}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf3fa] text-[#002757]"><FileText size={20}/></span><div><h2 className="text-xl font-black text-[#002757]">Professional summary</h2><p className="text-xs text-slate-500">A short introduction offices can scan quickly.</p></div></div>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={900} rows={5} placeholder="Example: Experienced Registered Dental Hygienist focused on patient education, periodontal care and efficient recall appointments..." className="mt-4 w-full rounded-2xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:border-[#4285F4]"/>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="text-sm font-black text-[#002757]">Years of experience</span><input type="number" min="0" max="60" value={yearsExperience} onChange={(e) => setYearsExperience(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#4285F4]"/></label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs font-black uppercase tracking-wide text-slate-400">Profession</p><p className="mt-1 font-black text-[#002757]">{profession}</p><p className="mt-1 text-xs text-slate-500">Licence details stay managed in Account Verification.</p></div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <ListField icon={<Languages size={19}/>} title="Languages spoken" hint="Comma separated" value={languages} onChange={setLanguages} placeholder="English, Greek, French" />
              <ListField icon={<Wrench size={19}/>} title="Dental software" hint="Systems you can use confidently" value={software} onChange={setSoftware} placeholder="ClearDent, Dentrix, Tracker" />
              <ListField icon={<BriefcaseBusiness size={19}/>} title="Professional skills" hint="Clinical or administrative strengths" value={skills} onChange={setSkills} placeholder="Periodontal therapy, digital scanning, orthodontic assisting" />
              <ListField icon={<Check size={19}/>} title="Certifications & training" hint="Do not repeat your licence" value={certifications} onChange={setCertifications} placeholder="WHMIS, Invisalign training, radiography" />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><GraduationCap size={20}/></span><div><h2 className="text-xl font-black text-[#002757]">Education</h2><p className="text-xs text-slate-500">Keep this short and relevant to dentistry.</p></div></div><button type="button" onClick={() => setEducation((current) => [...current, { ...emptyEducation }])} className="inline-flex items-center gap-1.5 rounded-xl bg-[#002757] px-3 py-2 text-xs font-black text-white"><Plus size={14}/>Add</button></div>
            <div className="mt-4 space-y-3">{education.map((item, index) => <div key={index} className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1.2fr_1.2fr_.6fr_auto] sm:items-end"><SmallField label="Program / credential" value={item.program} onChange={(value) => setEducation((current) => current.map((entry, i) => i === index ? { ...entry, program: value } : entry))}/><SmallField label="School" value={item.school} onChange={(value) => setEducation((current) => current.map((entry, i) => i === index ? { ...entry, school: value } : entry))}/><SmallField label="Year" value={item.year} onChange={(value) => setEducation((current) => current.map((entry, i) => i === index ? { ...entry, year: value } : entry))}/><button type="button" disabled={education.length === 1} onClick={() => setEducation((current) => current.filter((_, i) => i !== index))} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 disabled:opacity-30"><Trash2 size={16}/></button></div>)}</div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><BriefcaseBusiness size={20}/></span><div><h2 className="text-xl font-black text-[#002757]">Work history</h2><p className="text-xs text-slate-500">Office names can remain general if you prefer privacy before a match.</p></div></div><button type="button" onClick={() => setWorkHistory((current) => [...current, { ...emptyWork }])} className="inline-flex items-center gap-1.5 rounded-xl bg-[#002757] px-3 py-2 text-xs font-black text-white"><Plus size={14}/>Add</button></div>
            <div className="mt-4 space-y-3">{workHistory.map((item, index) => <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="grid gap-2 sm:grid-cols-[1fr_1fr_.7fr_auto] sm:items-end"><SmallField label="Role" value={item.role} onChange={(value) => setWorkHistory((current) => current.map((entry, i) => i === index ? { ...entry, role: value } : entry))}/><SmallField label="Office / employer" value={item.employer} onChange={(value) => setWorkHistory((current) => current.map((entry, i) => i === index ? { ...entry, employer: value } : entry))}/><SmallField label="Dates" value={item.dates} onChange={(value) => setWorkHistory((current) => current.map((entry, i) => i === index ? { ...entry, dates: value } : entry))}/><button type="button" disabled={workHistory.length === 1} onClick={() => setWorkHistory((current) => current.filter((_, i) => i !== index))} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 disabled:opacity-30"><Trash2 size={16}/></button></div><textarea value={item.details} onChange={(e) => setWorkHistory((current) => current.map((entry, i) => i === index ? { ...entry, details: e.target.value } : entry))} rows={2} placeholder="Optional: key responsibilities or accomplishments" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#4285F4]"/></div>)}</div>
          </section>

          <button type="button" disabled={saving} onClick={() => void save()} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#01A32E] px-5 py-4 text-base font-black text-white shadow-md transition hover:bg-[#018a28] disabled:opacity-50"><Save size={19}/>{saving ? "Saving Digital Resume…" : "Save Digital Resume"}</button>
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-[#002757] p-5 text-white"><p className="text-xs font-black uppercase tracking-[.12em] text-[#9be3ad]">Preview</p><h2 className="mt-1 text-2xl font-black">{profession}</h2><p className="mt-1 text-sm text-slate-300">{location}</p></div>
            <div className="p-5"><div className="flex flex-wrap gap-2"><PreviewPill>{yearsExperience} years experience</PreviewPill>{parseList(languages).slice(0,3).map((item) => <PreviewPill key={item}>{item}</PreviewPill>)}</div>{summary.trim() ? <p className="mt-4 text-sm leading-6 text-slate-600">{summary}</p> : <p className="mt-4 text-sm italic text-slate-400">Add a professional summary to complete your profile.</p>}{parseList(skills).length > 0 && <PreviewSection title="Skills" values={parseList(skills)}/>} {parseList(software).length > 0 && <PreviewSection title="Software" values={parseList(software)}/>} {parseList(certifications).length > 0 && <PreviewSection title="Training" values={parseList(certifications)}/>}<div className="mt-5 rounded-2xl border border-[#01A32E]/20 bg-[#f3fbf5] p-4"><p className="text-sm font-black text-[#017f27]">This is what DentalJobs uses.</p><p className="mt-1 text-xs leading-5 text-slate-600">Your name and direct contact details remain private until the platform’s match rules allow them to be shared.</p></div></div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function ListField({ icon, title, hint, value, onChange, placeholder }: { icon: React.ReactNode; title: string; hint: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="block"><span className="flex items-center gap-2 text-sm font-black text-[#002757]">{icon}{title}</span><span className="mt-1 block text-xs text-slate-500">{hint}</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#4285F4]"/></label>;
}

function SmallField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#4285F4]"/></label>;
}

function PreviewPill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-[#edf3fa] px-3 py-1.5 text-xs font-black text-[#002757]">{children}</span>;
}

function PreviewSection({ title, values }: { title: string; values: string[] }) {
  return <div className="mt-4"><p className="text-xs font-black uppercase tracking-wide text-slate-400">{title}</p><div className="mt-2 flex flex-wrap gap-2">{values.slice(0,8).map((value) => <span key={value} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-600">{value}</span>)}</div></div>;
}
