"use client";

import Link from "next/link";
import { Check, FileText, Send, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Readiness = {
  ready: boolean;
  completion: number;
  missing: string[];
};

type Listing = {
  id: string;
  office_id: string;
  profession: string;
  employment_type: string;
  city: string;
  province: string;
};

const copyReplacements: Array<[string, string]> = [
  [
    "Advertise what you are looking for without displaying your identity. Your résumé/CV already on file can be used when you apply.",
    "Advertise what you are looking for without displaying your identity. DentalShift uses your completed Digital Resume to create one consistent professional profile.",
  ],
  [
    "DentalShift does not automatically reveal your account contact details. Your résumé/CV may contain identifying or contact information.",
    "DentalShift shares your structured Digital Resume while keeping your name and direct contact information private until a match is made.",
  ],
  [
    "Your name and direct contact information will not appear publicly. DentalShift can use the résumé/CV already stored in your account when you apply.",
    "Your name and direct contact information will not appear publicly. DentalShift uses your completed Digital Resume when you apply.",
  ],
  [
    "Résumé/CV on file",
    "Digital Resume",
  ],
  [
    "When you apply to an office position, DentalShift can use the private résumé/CV stored in your professional profile instead of asking you to upload it again.",
    "DentalJobs uses your structured Digital Resume for applications. A traditional résumé or CV is not required; after a match, you and the office can decide what additional documents to exchange directly.",
  ],
];

function rewriteLegacyCopy() {
  if (!document.body) return;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const value = node.nodeValue || "";
    for (const [oldText, newText] of copyReplacements) {
      if (value.includes(oldText)) {
        node.nodeValue = value.replace(oldText, newText);
      }
    }
    node = walker.nextNode();
  }
}

async function loadReadiness(): Promise<Readiness> {
  const { data, error } = await supabase.rpc("get_professional_digital_resume_readiness");
  if (error) throw error;
  const result = (data || {}) as Partial<Readiness>;
  return {
    ready: Boolean(result.ready),
    completion: Number(result.completion || 0),
    missing: Array.isArray(result.missing) ? result.missing : [],
  };
}

export function DentalJobsDigitalResumeApply() {
  const pathname = usePathname();
  const [listing, setListing] = useState<Listing | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (pathname !== "/dental-jobs") return;
    if (window.localStorage.getItem("dentalshift_portal_role") !== "professional") return;

    rewriteLegacyCopy();
    const observer = new MutationObserver(() => rewriteLegacyCopy());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    const onClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button || button.disabled || button.textContent?.trim() !== "Apply") return;

      const article = button.closest("article");
      const listingNode = article?.querySelector<HTMLElement>("[data-listing-id]");
      const listingId = listingNode?.dataset.listingId;
      if (!listingId) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setError("");
      setMessage("");
      setSent(false);
      setBusy(true);

      try {
        const currentReadiness = await loadReadiness();
        setReadiness(currentReadiness);
        if (!currentReadiness.ready) {
          setListing({ id: listingId, office_id: "", profession: "", employment_type: "", city: "", province: "" });
          return;
        }

        const { data: job, error: jobError } = await supabase
          .from("job_listings")
          .select("id,office_id,profession,employment_type,city,province")
          .eq("id", listingId)
          .eq("listing_type", "office_hiring")
          .maybeSingle();
        if (jobError) throw jobError;
        if (!job?.office_id) throw new Error("This opportunity is not available for applications yet.");
        setListing(job as Listing);
      } catch (value) {
        setError(value instanceof Error ? value.message : "Could not open this application.");
        setListing({ id: listingId, office_id: "", profession: "", employment_type: "", city: "", province: "" });
      } finally {
        setBusy(false);
      }
    };

    document.addEventListener("click", onClick, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
    };
  }, [pathname]);

  if (pathname !== "/dental-jobs" || !listing) return null;

  const close = () => {
    if (busy) return;
    setListing(null);
    setReadiness(null);
    setMessage("");
    setError("");
    setSent(false);
  };

  const submit = async () => {
    if (!listing.office_id || busy) return;
    setBusy(true);
    setError("");
    try {
      const currentReadiness = await loadReadiness();
      setReadiness(currentReadiness);
      if (!currentReadiness.ready) {
        throw new Error("Complete your DentalShift Digital Resume before applying.");
      }

      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Please sign in again.");

      const { data: created, error: insertError } = await supabase
        .from("job_applications")
        .insert({
          listing_id: listing.id,
          professional_id: authData.user.id,
          office_id: listing.office_id,
          initiator_role: "professional",
          status: "pending",
          message: message.trim() || null,
          resume_path_snapshot: null,
        })
        .select("id")
        .single();

      if (insertError) {
        if (insertError.code === "23505") throw new Error("You have already applied to this opportunity.");
        throw insertError;
      }

      if (created?.id) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          if (token) {
            await fetch("/api/dentaljobs/notify", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ applicationId: created.id, eventType: "application_created", messageId: null }),
            });
          }
        } catch {
          // The application is already saved; notification failure must not undo it.
        }
      }

      setSent(true);
      window.setTimeout(() => window.location.reload(), 850);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Could not send your application.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] overflow-y-auto bg-[#002757]/70 p-4 sm:p-6">
      <button type="button" aria-label="Close application" className="fixed inset-0" onClick={close} />
      <section className="relative mx-auto my-8 w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#01A32E]">DentalJobs</p>
            <h2 className="mt-1 text-2xl font-black text-[#002757]">Apply to this position</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Your structured Digital Resume is used for the application. Your name, direct contact details and exact address remain private until a match is made.</p>
          </div>
          <button type="button" onClick={close} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={22} /></button>
        </div>

        <div className="p-5 sm:p-6">
          {readiness && !readiness.ready ? (
            <div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <FileText size={22} className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <h3 className="font-black text-[#002757]">Complete your Digital Resume first</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">Your application profile is {readiness.completion}% complete. DentalJobs requires the core structured fields so every office receives a consistent candidate profile.</p>
                    {readiness.missing.length > 0 && <p className="mt-3 text-sm font-bold text-amber-800">Still needed: {readiness.missing.join(", ")}</p>}
                  </div>
                </div>
              </div>
              <Link href="/professionals/resume" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#01A32E] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#018a28]"><FileText size={17} /> Open Digital Resume</Link>
            </div>
          ) : sent ? (
            <div className="py-6 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#eaf8ee] text-[#01A32E]"><Check size={31} strokeWidth={3} /></div>
              <h3 className="mt-4 text-xl font-black text-[#002757]">Application sent</h3>
              <p className="mt-2 text-sm text-slate-500">The office will see your standardized DentalShift professional profile.</p>
            </div>
          ) : (
            <>
              {listing.office_id && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Opportunity</p>
                <h3 className="mt-1 font-black text-[#002757]">{listing.profession} — {listing.employment_type}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">{listing.city}, {listing.province}</p>
              </div>}

              <div className="mt-4 rounded-2xl border border-[#01A32E]/25 bg-[#f3fbf5] p-4">
                <div className="flex items-start gap-3"><FileText size={20} className="mt-0.5 shrink-0 text-[#01A32E]"/><div><p className="font-black text-[#002757]">Digital Resume will be shared</p><p className="mt-1 text-sm leading-6 text-slate-600">A traditional résumé or CV is not required. After a match, you and the office can decide directly whether to exchange any additional documents.</p></div></div>
              </div>

              <label className="mt-4 block">
                <span className="text-sm font-black text-[#002757]">Optional message</span>
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} maxLength={600} placeholder="Add a short note to the dental office…" className="mt-2 w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:border-[#4285F4]" />
              </label>
            </>
          )}

          {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}

          {readiness?.ready && !sent && <div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button type="button" disabled={busy} onClick={close} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-[#002757] disabled:opacity-50">Cancel</button>
            <button type="button" disabled={busy || !listing.office_id} onClick={() => void submit()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#01A32E] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#018a28] disabled:opacity-50"><Send size={16}/>{busy ? "Sending…" : "Send Application"}</button>
          </div>}
        </div>
      </section>
    </div>
  );
}
