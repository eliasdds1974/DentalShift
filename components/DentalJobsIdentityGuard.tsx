"use client";

import { useEffect, useState } from "react";

type WarningState = {
  title: string;
  items: string[];
  role: "office" | "professional";
};

function portalRole() {
  const role = window.localStorage.getItem("dentalshift_portal_role");
  return role === "office" || role === "professional" ? role : null;
}

function onDentalJobsPage() {
  return window.location.pathname === "/dental-jobs" || window.location.pathname === "/classifieds";
}

function identityFindings(text: string, role: "office" | "professional") {
  const findings = new Set<string>();
  const value = text || "";

  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value)) findings.add("Email address");
  if (/(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|ca|net|org|co|clinic|dental)\b/i.test(value)) findings.add("Website or web address");
  if (/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/.test(value)) findings.add("Phone number");
  if (/\b\d{1,6}\s+[A-Za-z0-9.'’-]+(?:\s+[A-Za-z0-9.'’-]+){0,4}\s+(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Drive|Dr\.?|Trail|Trl\.?|Lane|Ln\.?|Way|Court|Ct\.?|Highway|Hwy\.?)\b/i.test(value)) findings.add("Street address");
  if (/\b[A-Z][A-Za-z&'’-]*(?:\s+[A-Z][A-Za-z&'’-]*){0,5}\s+(?:Dental|Dentistry|Orthodontics|Endodontics|Periodontics|Prosthodontics)(?:\s+(?:Clinic|Centre|Center|Group|Care|Studio|Office|Practice))?\b/.test(value)) findings.add("Clinic or business name");
  if (/\b(?:instagram|facebook|linkedin|tiktok)\b\s*[:@-]?\s*@?[A-Za-z0-9._-]+/i.test(value)) findings.add("Social media account");
  if (/\b(?:contact|call|email|text)\s+(?:us|me|the office|our office|the clinic|our clinic)?\s*(?:at|on)?\s*[:\-]?\s*(?:\+?1?[\s().-]*)?\d{3}/i.test(value)) findings.add("Direct contact information");

  if (role === "professional") {
    if (/\b(?:my name is|name\s*[:=-])\s+[A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+){1,2}\b/.test(value)) findings.add("Personal name");
    if (/\b(?:licen[cs]e|registration)\s*(?:number|no\.?|#)?\s*[:#-]?\s*[A-Z0-9-]{4,}\b/i.test(value)) findings.add("Licence or registration number");
  }

  return Array.from(findings);
}

function combinedPostingText(form: HTMLFormElement) {
  const description = form.querySelector<HTMLTextAreaElement>('textarea[name="description"]')?.value || "";
  const schedule = form.querySelector<HTMLInputElement>('input[name="schedule"]')?.value || "";
  return `${description}\n${schedule}`;
}

export function DentalJobsIdentityGuard() {
  const [warning, setWarning] = useState<WarningState | null>(null);

  useEffect(() => {
    const block = (event: Event, items: string[], title: string, role: "office" | "professional") => {
      event.preventDefault();
      event.stopPropagation();
      if ("stopImmediatePropagation" in event) event.stopImmediatePropagation();
      setWarning({ title, items, role });
    };

    const handleSubmit = (event: Event) => {
      if (!onDentalJobsPage()) return;
      const role = portalRole();
      if (!role) return;
      if (!(event.target instanceof HTMLFormElement)) return;

      const form = event.target;
      if (!form.querySelector('textarea[name="description"]')) return;

      const items = identityFindings(combinedPostingText(form), role);
      if (items.length > 0) {
        block(event, items, role === "office" ? "This job ad cannot be posted yet" : "This professional ad cannot be posted yet", role);
      }
    };

    const handleClick = (event: Event) => {
      if (!onDentalJobsPage()) return;
      const role = portalRole();
      if (role !== "office") return;
      const target = event.target instanceof Element ? event.target.closest("button") : null;
      if (!(target instanceof HTMLButtonElement)) return;

      const label = target.textContent?.replace(/\s+/g, " ").trim() || "";
      if (label !== "Fill Posting Form") return;

      const dialog = target.closest('section[role="dialog"]');
      const importedText = dialog?.querySelector<HTMLTextAreaElement>("textarea")?.value || "";
      const items = identityFindings(importedText, "office");
      if (items.length > 0) {
        block(event, items, "Remove identifying details before importing this ad", "office");
      }
    };

    window.addEventListener("submit", handleSubmit, true);
    window.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("submit", handleSubmit, true);
      window.removeEventListener("click", handleClick, true);
    };
  }, []);

  if (!warning) return null;

  const professional = warning.role === "professional";

  return (
    <div className="fixed inset-0 z-[220] grid place-items-center bg-[#002757]/70 p-4">
      <button type="button" aria-label="Close identity warning" onClick={() => setWarning(null)} className="absolute inset-0" />
      <section role="dialog" aria-modal="true" className="relative z-10 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-2xl">⚠️</div>
        <h2 className="mt-4 text-center text-2xl font-black text-[#002757]">{warning.title}</h2>
        <p className="mt-2 text-center text-sm leading-6 text-slate-600">
          {professional
            ? "DentalJobs professional postings must remain anonymous. Remove the identifying information below, then try again."
            : "DentalJobs office postings must remain anonymous. Remove the identifying information below, then try again."}
        </p>
        <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-900">Identifying information detected:</p>
          <ul className="mt-2 space-y-1.5 text-sm font-bold text-amber-900">
            {warning.items.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          {professional
            ? "General location, profession, experience, schedule preferences, pay expectations and work details are fine. Do not include your name, exact address, phone number, email, website, social media, or licence/registration number."
            : "General location, profession, schedule, pay and job details are fine. Do not include the clinic name, exact address, phone number, email, website or social media information."}
        </p>
        <button type="button" onClick={() => setWarning(null)} className="mt-5 w-full rounded-xl bg-[#002757] px-4 py-3 text-sm font-black text-white">
          Go Back and Edit
        </button>
      </section>
    </div>
  );
}
