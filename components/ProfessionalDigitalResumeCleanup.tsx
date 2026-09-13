"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BriefcaseBusiness, Check, GraduationCap, Laptop, Languages, Plus, Sparkles, Stethoscope, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type EducationEntry = { program: string; school: string; year: string };
type WorkEntry = { role: string; employer: string; dates: string; details: string };
type LanguageEntry = { name: string; level: "Basic" | "Conversational" | "Fluent" | "Native" | "Not specified" };
type WorkPreferences = {
  employmentTypes?: string[];
  preferredDays?: string;
  scheduleNotes?: string;
};

type ResumeData = {
  professional?: {
    resume_summary?: string | null;
    bio?: string | null;
    years_experience?: number | null;
    languages?: string[] | null;
    language_proficiency?: LanguageEntry[] | null;
    software?: string[] | null;
    equipment?: string[] | null;
    work_preferences?: WorkPreferences | null;
    clinical_skills?: string[] | null;
    certifications?: string[] | null;
    education?: EducationEntry[] | null;
    work_history?: WorkEntry[] | null;
  } | null;
};

const emptyEducation: EducationEntry = { program: "", school: "", year: "" };
const emptyWork: WorkEntry = { role: "", employer: "", dates: "", details: "" };

const languageSuggestions = [
  "English", "French", "Spanish", "Greek", "Mandarin", "Cantonese", "Punjabi", "Hindi", "Arabic", "Tagalog", "Ukrainian", "Russian", "Farsi", "Korean", "Vietnamese", "Portuguese",
];

const softwareSuggestions = [
  "Tracker", "ClearDent", "Dentrix", "Open Dental", "ABELDent", "Power Practice", "Curve Dental", "Maxident", "Gold Dental", "RecallMax", "Carestream", "Practice-Web", "Dentitek",
];

const equipmentSuggestions = [
  "iTero", "TRIOS", "Primescan", "CBCT", "Digital sensors", "Intraoral camera", "Cavitron", "EMS Airflow", "Piezo scaler", "Panoramic X-ray", "Cephalometric X-ray", "Digital impression scanner", "Soft-tissue laser", "3D printer",
];

const employmentOptions = ["Full-Time", "Part-Time", "Temporary / Contract", "Casual / Flexible"];

function cleanList(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function TagEditor({
  title,
  hint,
  values,
  setValues,
  suggestions,
  placeholder,
  icon,
}: {
  title: string;
  hint: string;
  values: string[];
  setValues: (values: string[]) => void;
  suggestions: string[];
  placeholder: string;
  icon: React.ReactNode;
}) {
  const [draft, setDraft] = useState("");
  const listId = `suggest-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  const add = () => {
    const next = draft.trim();
    if (!next) return;
    setValues(cleanList([...values, next]));
    setDraft("");
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2 text-[#002757]">{icon}<div><p className="text-sm font-black">{title}</p><p className="text-[11px] font-medium text-slate-500">{hint}</p></div></div>
      <div className="mt-3 flex gap-2">
        <input
          list={listId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#4285F4]"
        />
        <datalist id={listId}>{suggestions.map((item) => <option key={item} value={item} />)}</datalist>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 rounded-xl bg-[#002757] px-3 py-2 text-xs font-black text-white"><Plus size={14}/>Add</button>
      </div>
      {values.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{values.map((value) => <span key={value} className="inline-flex items-center gap-1.5 rounded-full border border-[#0078FE]/25 bg-[#edf3fa] px-3 py-1.5 text-xs font-black text-[#002757]">{value}<button type="button" aria-label={`Remove ${value}`} onClick={() => setValues(values.filter((item) => item !== value))} className="text-slate-400 hover:text-rose-600"><X size={13}/></button></span>)}</div>}
    </div>
  );
}

function ResumeFields({ form, onReady }: { form: HTMLFormElement; onReady: (save: () => Promise<void>) => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState("");
  const [certifications, setCertifications] = useState("");
  const [languages, setLanguages] = useState<LanguageEntry[]>([]);
  const [languageDraft, setLanguageDraft] = useState("");
  const [software, setSoftware] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<string[]>([]);
  const [preferredDays, setPreferredDays] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [education, setEducation] = useState<EducationEntry[]>([{ ...emptyEducation }]);
  const [workHistory, setWorkHistory] = useState<WorkEntry[]>([{ ...emptyWork }]);
  const [yearsValue, setYearsValue] = useState<number | null>(null);

  useEffect(() => {
    const input = form.querySelector<HTMLInputElement>('input[name="years_experience"]');
    if (!input) return;
    const sync = () => setYearsValue(input.value === "" ? null : Number(input.value || 0));
    sync();
    input.addEventListener("input", sync);
    return () => input.removeEventListener("input", sync);
  }, [form]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data, error: loadError } = await supabase.rpc("get_professional_digital_resume");
        if (loadError) throw loadError;
        if (cancelled) return;
        const loaded = (data || {}) as ResumeData;
        const professional = loaded.professional || {};
        setSummary(professional.resume_summary || professional.bio || "");
        setSkills((professional.clinical_skills || []).join(", "));
        setCertifications((professional.certifications || []).join(", "));
        const proficiency = Array.isArray(professional.language_proficiency) ? professional.language_proficiency : [];
        const proficiencyMap = new Map(proficiency.map((item) => [String(item.name).toLowerCase(), item.level]));
        setLanguages((professional.languages || []).map((name) => ({ name, level: proficiencyMap.get(String(name).toLowerCase()) || "Not specified" })));
        setSoftware(professional.software || []);
        setEquipment(professional.equipment || []);
        setEmploymentTypes(professional.work_preferences?.employmentTypes || []);
        setPreferredDays(professional.work_preferences?.preferredDays || "");
        setScheduleNotes(professional.work_preferences?.scheduleNotes || "");
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
    if (yearsValue !== null) score += 15;
    if (languages.length) score += 15;
    if (cleanList(skills.split(",")).length) score += 20;
    if (education.some((item) => item.program.trim() || item.school.trim())) score += 20;
    if (yearsValue === 0 || workHistory.some((item) => item.role.trim() || item.employer.trim())) score += 10;
    return Math.min(100, score);
  }, [summary, yearsValue, languages, skills, education, workHistory]);

  const addLanguage = () => {
    const name = languageDraft.trim();
    if (!name || languages.some((item) => item.name.toLowerCase() === name.toLowerCase())) return;
    setLanguages([...languages, { name, level: "Not specified" }]);
    setLanguageDraft("");
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const yearsInput = form.querySelector<HTMLInputElement>('input[name="years_experience"]');
      const years = Math.max(0, Number(yearsInput?.value || 0));
      const cleanEducation = education
        .filter((item) => item.program.trim() || item.school.trim() || item.year.trim())
        .map((item) => ({ program: item.program.trim(), school: item.school.trim(), year: item.year.trim() }));
      const cleanWork = workHistory
        .filter((item) => item.role.trim() || item.employer.trim() || item.dates.trim() || item.details.trim())
        .map((item) => ({ role: item.role.trim(), employer: item.employer.trim(), dates: item.dates.trim(), details: item.details.trim() }));

      const { error: saveError } = await supabase.rpc("save_professional_digital_resume_v2", {
        p_summary: summary.trim(),
        p_years_experience: years,
        p_languages: languages.map((item) => item.name),
        p_language_proficiency: languages,
        p_software: software,
        p_equipment: equipment,
        p_clinical_skills: cleanList(skills.split(",")),
        p_certifications: cleanList(certifications.split(",")),
        p_education: cleanEducation,
        p_work_history: cleanWork,
        p_work_preferences: { employmentTypes, preferredDays: preferredDays.trim(), scheduleNotes: scheduleNotes.trim() },
      });
      if (saveError) throw saveError;
      setSaved(true);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Your Digital Resume could not be saved.");
      throw value;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { onReady(save); });

  if (loading) {
    return <div className="rounded-2xl border-2 border-[#01A32E]/25 bg-[#f4fbf6] p-5"><div className="h-5 w-52 animate-pulse rounded bg-slate-200"/><div className="mt-3 h-20 animate-pulse rounded-xl bg-white"/></div>;
  }

  return (
    <div className="rounded-2xl border-2 border-[#01A32E]/30 bg-[#f5fcf7] p-4">
      {languages.map((item) => <input key={`lang-${item.name}`} type="hidden" name="professional_languages" value={item.name} />)}
      {software.map((item) => <input key={`software-${item}`} type="hidden" name="software" value={item} />)}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#01A32E] text-white"><Sparkles size={19}/></span>
            <div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#017f27]">DentalShift Digital Resume</p><h3 className="text-lg font-black text-[#002757]">Your DentalJobs professional profile</h3></div>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-600">Build one structured profile that offices can scan quickly. Languages, software and equipment are added as searchable tags so employers see consistent information.</p>
        </div>
        <div className="rounded-xl bg-white px-3 py-2 text-center shadow-sm ring-1 ring-[#01A32E]/15"><p className="text-xl font-black text-[#01A32E]">{completion}%</p><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Application readiness</p></div>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="field"><span>Professional summary</span><textarea value={summary} onChange={(event) => { setSummary(event.target.value); setSaved(false); }} rows={4} maxLength={900} placeholder="Example: Experienced Registered Dental Hygienist focused on patient education, periodontal care and efficient recall appointments…" /></label>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2 text-[#002757]"><Languages size={18}/><div><p className="text-sm font-black">Languages spoken</p><p className="text-[11px] font-medium text-slate-500">Type any language, then optionally choose your proficiency level.</p></div></div>
          <div className="mt-3 flex gap-2">
            <input list="digital-resume-language-suggestions" value={languageDraft} onChange={(event) => setLanguageDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addLanguage(); } }} placeholder="Type a language" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#4285F4]"/>
            <datalist id="digital-resume-language-suggestions">{languageSuggestions.map((item) => <option key={item} value={item}/>)}</datalist>
            <button type="button" onClick={addLanguage} className="inline-flex items-center gap-1 rounded-xl bg-[#002757] px-3 py-2 text-xs font-black text-white"><Plus size={14}/>Add</button>
          </div>
          {languages.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2">{languages.map((item) => <div key={item.name} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2"><span className="min-w-0 flex-1 truncate text-sm font-black text-[#002757]">{item.name}</span><select value={item.level} onChange={(event) => { const level = event.target.value as LanguageEntry["level"]; setLanguages((current) => current.map((entry) => entry.name === item.name ? { ...entry, level } : entry)); setSaved(false); }} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700"><option>Not specified</option><option>Basic</option><option>Conversational</option><option>Fluent</option><option>Native</option></select><button type="button" aria-label={`Remove ${item.name}`} onClick={() => setLanguages((current) => current.filter((entry) => entry.name !== item.name))} className="text-slate-400 hover:text-rose-600"><X size={15}/></button></div>)}</div>}
        </div>

        <TagEditor title="Dental software" hint="Type a system and select a suggestion or add your own." values={software} setValues={(next) => { setSoftware(next); setSaved(false); }} suggestions={softwareSuggestions} placeholder="e.g. ClearDent" icon={<Laptop size={18}/>} />
        <TagEditor title="Equipment familiarity" hint="Add scanners, imaging systems and clinical equipment you can use confidently." values={equipment} setValues={(next) => { setEquipment(next); setSaved(false); }} suggestions={equipmentSuggestions} placeholder="e.g. iTero" icon={<Stethoscope size={18}/>} />

        <label className="field"><span>Professional skills</span><input value={skills} onChange={(event) => { setSkills(event.target.value); setSaved(false); }} placeholder="Periodontal therapy, digital scanning, orthodontic assisting…" /><small className="mt-1 block text-xs text-slate-500">Separate skills with commas.</small></label>
        <label className="field"><span>Certifications & additional training <span className="font-normal text-slate-400">(optional)</span></span><input value={certifications} onChange={(event) => { setCertifications(event.target.value); setSaved(false); }} placeholder="WHMIS, Invisalign training, radiography…" /><small className="mt-1 block text-xs text-slate-500">Do not repeat your professional licence or CPR certificate.</small></label>

        <div className="rounded-xl border border-[#FDB605]/45 bg-[#FFFDF6] p-3">
          <div className="flex items-center gap-2"><BriefcaseBusiness size={18} className="text-[#9A6D00]"/><div><p className="text-sm font-black text-[#002757]">Work preferences</p><p className="text-[11px] text-slate-500">Helps an office quickly determine whether the opportunity fits what you are looking for.</p></div></div>
          <div className="mt-3 flex flex-wrap gap-2">{employmentOptions.map((option) => { const selected = employmentTypes.includes(option); return <button key={option} type="button" onClick={() => { setEmploymentTypes((current) => selected ? current.filter((item) => item !== option) : [...current, option]); setSaved(false); }} className={`rounded-full border px-3 py-1.5 text-xs font-black transition ${selected ? "border-[#01A32E] bg-[#eaf8ee] text-[#017f27]" : "border-slate-200 bg-white text-slate-600"}`}>{selected ? <Check size={13} className="mr-1 inline"/> : null}{option}</button>; })}</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="field"><span>Preferred days / pattern <span className="font-normal text-slate-400">(optional)</span></span><input value={preferredDays} onChange={(event) => { setPreferredDays(event.target.value); setSaved(false); }} placeholder="e.g. Mon–Thu, 3–4 days/week" /></label>
            <label className="field"><span>Schedule preferences <span className="font-normal text-slate-400">(optional)</span></span><input value={scheduleNotes} onChange={(event) => { setScheduleNotes(event.target.value); setSaved(false); }} placeholder="e.g. No evenings, prefers 8–4" /></label>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><GraduationCap size={18} className="text-violet-700"/><div><p className="text-sm font-black text-[#002757]">Education</p><p className="text-[11px] text-slate-500">Required for DentalJobs applications.</p></div></div><button type="button" onClick={() => setEducation((current) => [...current, { ...emptyEducation }])} className="rounded-lg bg-[#002757] px-3 py-1.5 text-xs font-black text-white">Add</button></div>
          <div className="mt-3 space-y-2">{education.map((item, index) => <div key={index} className="grid gap-2 sm:grid-cols-[1.15fr_1.15fr_.55fr_auto]"><input aria-label="Education program" value={item.program} onChange={(event) => setEducation((current) => current.map((entry, i) => i === index ? { ...entry, program: event.target.value } : entry))} placeholder="Program / credential" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#4285F4]"/><input aria-label="School" value={item.school} onChange={(event) => setEducation((current) => current.map((entry, i) => i === index ? { ...entry, school: event.target.value } : entry))} placeholder="School" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#4285F4]"/><input aria-label="Education year" value={item.year} onChange={(event) => setEducation((current) => current.map((entry, i) => i === index ? { ...entry, year: event.target.value } : entry))} placeholder="Year" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#4285F4]"/><button type="button" disabled={education.length === 1} onClick={() => setEducation((current) => current.filter((_, i) => i !== index))} className="rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-500 disabled:opacity-30">Remove</button></div>)}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><BriefcaseBusiness size={18} className="text-amber-700"/><div><p className="text-sm font-black text-[#002757]">Work history</p><p className="text-[11px] text-slate-500">Required when you have previous experience; new graduates may leave it blank.</p></div></div><button type="button" onClick={() => setWorkHistory((current) => [...current, { ...emptyWork }])} className="rounded-lg bg-[#002757] px-3 py-1.5 text-xs font-black text-white">Add</button></div>
          <div className="mt-3 space-y-2">{workHistory.map((item, index) => <div key={index} className="rounded-xl bg-slate-50 p-2"><div className="grid gap-2 sm:grid-cols-[1fr_1fr_.75fr_auto]"><input aria-label="Work role" value={item.role} onChange={(event) => setWorkHistory((current) => current.map((entry, i) => i === index ? { ...entry, role: event.target.value } : entry))} placeholder="Role" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#4285F4]"/><input aria-label="Employer" value={item.employer} onChange={(event) => setWorkHistory((current) => current.map((entry, i) => i === index ? { ...entry, employer: event.target.value } : entry))} placeholder="Employer / general office description" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#4285F4]"/><input aria-label="Work dates" value={item.dates} onChange={(event) => setWorkHistory((current) => current.map((entry, i) => i === index ? { ...entry, dates: event.target.value } : entry))} placeholder="Dates" className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#4285F4]"/><button type="button" disabled={workHistory.length === 1} onClick={() => setWorkHistory((current) => current.filter((_, i) => i !== index))} className="rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-500 disabled:opacity-30">Remove</button></div><textarea aria-label="Work details" value={item.details} onChange={(event) => setWorkHistory((current) => current.map((entry, i) => i === index ? { ...entry, details: event.target.value } : entry))} rows={2} placeholder="Responsibilities / highlights" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#4285F4]"/></div>)}</div>
        </div>
      </div>

      {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
      {saved && <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-700"><Check size={15} className="mr-1 inline"/>Digital Resume saved with your Professional Account.</p>}
      {saving && <p className="mt-3 text-xs font-bold text-[#017f27]">Saving Digital Resume…</p>}
    </div>
  );
}

export function ProfessionalDigitalResumeCleanup() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [form, setForm] = useState<HTMLFormElement | null>(null);
  const saveRef = useRef<(() => Promise<void>) | null>(null);
  const bypassRef = useRef(false);

  useEffect(() => {
    let portalNode: HTMLDivElement | null = null;

    const integrate = () => {
      const headings = Array.from(document.querySelectorAll("h3"));
      const heading = headings.find((node) => node.textContent?.trim() === "Professional résumé/CV");
      if (!heading) return;
      const legacyCard = heading.closest("div.rounded-xl.border.border-dashed");
      const accountForm = legacyCard?.closest("form");
      if (!(legacyCard instanceof HTMLElement) || !(accountForm instanceof HTMLFormElement)) return;

      legacyCard.style.display = "none";

      const legends = Array.from(accountForm.querySelectorAll("legend"));
      for (const legend of legends) {
        const label = legend.textContent?.trim();
        if (label !== "Languages spoken" && label !== "Dental software experience") continue;
        const fieldset = legend.closest("fieldset");
        if (!(fieldset instanceof HTMLFieldSetElement)) continue;
        fieldset.style.display = "none";
        fieldset.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input,select,textarea").forEach((control) => { control.disabled = true; });
      }

      const existing = accountForm.querySelector<HTMLElement>('[data-digital-resume-account="true"]');
      if (existing) {
        setTarget(existing);
        setForm(accountForm);
        return;
      }

      portalNode = document.createElement("div");
      portalNode.dataset.digitalResumeAccount = "true";
      portalNode.className = "sm:col-span-2 lg:col-span-4";
      legacyCard.parentElement?.insertBefore(portalNode, legacyCard);
      setTarget(portalNode);
      setForm(accountForm);
    };

    integrate();
    const observer = new MutationObserver(integrate);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      portalNode?.remove();
      setTarget(null);
      setForm(null);
    };
  }, []);

  useEffect(() => {
    if (!form) return;
    const intercept = async (event: Event) => {
      if (bypassRef.current) {
        bypassRef.current = false;
        return;
      }
      if (!saveRef.current) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      try {
        await saveRef.current();
        bypassRef.current = true;
        form.requestSubmit();
      } catch {
        // Embedded Digital Resume shows its own save error and keeps the account open.
      }
    };
    form.addEventListener("submit", intercept, true);
    return () => form.removeEventListener("submit", intercept, true);
  }, [form]);

  if (!target || !form) return null;
  return createPortal(<ResumeFields form={form} onReady={(save) => { saveRef.current = save; }} />, target);
}
