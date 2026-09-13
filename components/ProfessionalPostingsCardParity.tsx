"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BriefcaseBusiness, ChevronDown, Clock3, FileText, MapPin, MoreVertical, Pencil } from "lucide-react";
import { ShareListingButton } from "@/components/ShareListingButton";
import { supabase } from "@/lib/supabase";

type Listing = {
  id: string;
  profession: string;
  employment_type: string;
  city: string;
  province: string;
  created_at: string;
  status: string;
  expires_at: string;
};

type Application = {
  listing_id: string;
  status: string;
};

const btn: React.CSSProperties = {
  height: 32,
  borderRadius: 7,
  padding: "0 10px",
  fontSize: 13,
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  whiteSpace: "nowrap",
};

function text(el: Element | null) {
  return el?.textContent?.replace(/\s+/g, " ").trim() || "";
}

function findLegacySection() {
  return Array.from(document.querySelectorAll("section")).find((section) =>
    Array.from(section.querySelectorAll("p")).some((p) => text(p).toLowerCase() === "my availability ads"),
  ) as HTMLElement | undefined;
}

function daysRemaining(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

export function ProfessionalPostingsCardParity() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | null = null;

    const ensureHost = () => {
      const oldSection = findLegacySection();
      if (!oldSection) return;

      oldSection.style.display = "none";

      let nextHost = document.querySelector<HTMLElement>("[data-professional-office-card-host='1']");
      if (!nextHost) {
        nextHost = document.createElement("div");
        nextHost.dataset.professionalOfficeCardHost = "1";
        oldSection.insertAdjacentElement("afterend", nextHost);
      }
      if (!cancelled) setHost((current) => current || nextHost!);
    };

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const [{ data: listingRows }, { data: applicationRows }] = await Promise.all([
        supabase
          .from("job_listings")
          .select("id,profession,employment_type,city,province,created_at,status,expires_at")
          .eq("professional_id", user.id)
          .eq("listing_type", "professional_available")
          .order("created_at", { ascending: false }),
        supabase
          .from("job_applications")
          .select("listing_id,status")
          .eq("professional_id", user.id),
      ]);

      if (cancelled) return;
      setListings((listingRows || []) as Listing[]);
      setApplications((applicationRows || []) as Application[]);
    };

    ensureHost();
    void load();

    observer = new MutationObserver(ensureHost);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelled = true;
      observer?.disconnect();
      document.querySelector("[data-professional-office-card-host='1']")?.remove();
      const oldSection = findLegacySection();
      if (oldSection) oldSection.style.display = "";
    };
  }, []);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of applications) {
      if (!item.listing_id || item.status === "declined" || item.status === "withdrawn") continue;
      map.set(item.listing_id, (map.get(item.listing_id) || 0) + 1);
    }
    return map;
  }, [applications]);

  const clickLegacyAction = (listingId: string, action: "manage" | "edit") => {
    const oldSection = findLegacySection();
    if (!oldSection) return;
    const link = oldSection.querySelector<HTMLAnchorElement>(`a[href^="/jobs/${CSS.escape(listingId)}"]`);
    const article = link?.closest("article");
    if (!article) return;

    const buttons = Array.from(article.querySelectorAll<HTMLButtonElement>("button"));
    const manage = buttons.find((button) => text(button).toLowerCase().includes("manage"));

    if (action === "manage") {
      manage?.click();
      return;
    }

    // The existing professional card opens Edit from its Manage dialog.
    manage?.click();
  };

  if (!host) return null;

  return createPortal(
    <div id="my-dentaljobs" style={{ width: "100%", marginTop: 14 }}>
      <div style={{ border: "2px solid #01A32E", borderRadius: 18, background: "#fff", padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#009b2f", fontWeight: 900, fontSize: 11, textTransform: "uppercase" }}>Office Postings</div>
            <div style={{ color: "#002757", fontWeight: 900, fontSize: 26 }}>My DentalJobs</div>
            <div style={{ color: "#455f89", fontWeight: 600, fontSize: 13 }}>Manage your postings and review each office who responds.</div>
          </div>
          <div style={{ border: "1px solid #bfe9ca", background: "#f2fff6", color: "#009b2f", fontWeight: 900, borderRadius: 999, padding: "6px 12px", fontSize: 13 }}>
            {listings.length} posting{listings.length === 1 ? "" : "s"}
          </div>
        </div>

        <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
          {listings.length === 0 ? (
            <div style={{ border: "1px dashed #cbd5e1", background: "#f8fafc", borderRadius: 12, padding: 18, textAlign: "center", color: "#64748b", fontSize: 13, fontWeight: 700 }}>
              You have no DentalJobs postings yet.
            </div>
          ) : listings.map((job) => {
            const remaining = daysRemaining(job.expires_at);
            const active = job.status === "active" && remaining > 0;
            const displayStatus = job.status === "active" && remaining === 0 ? "expired" : job.status;
            const interested = counts.get(job.id) || 0;

            return (
              <div key={job.id} style={{ border: "1px solid #b9dfc3", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
                <div style={{ background: "#f7fff9", padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    <span style={{ background: active ? "#01A32E" : "#eef2f7", color: active ? "#fff" : "#475569", borderRadius: 999, padding: "4px 9px", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{displayStatus}</span>
                    {active && <span style={{ color: "#455f89", fontSize: 12, fontWeight: 700 }}>{remaining} day{remaining === 1 ? "" : "s"} remaining</span>}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 7 }}>
                    <div style={{ color: "#002757", fontSize: 20, fontWeight: 900 }}>{job.profession} — {job.employment_type}</div>
                    <span style={{ border: "1px solid #bfe9ca", background: "#f2fff6", color: "#009b2f", borderRadius: 999, padding: "4px 9px", fontSize: 11, fontWeight: 900 }}>{interested} Interested</span>
                  </div>

                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", color: "#526a90", fontSize: 12, fontWeight: 700, marginTop: 7 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><MapPin size={14} />{job.city}, {job.province}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><BriefcaseBusiness size={14} />{job.employment_type}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Clock3 size={14} />Posted {new Date(job.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", padding: "7px 10px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", background: "#f8fbff" }}>
                  <button onClick={() => clickLegacyAction(job.id, "manage")} style={{ ...btn, border: 0, background: "#06499d", color: "white" }}><MoreVertical size={13} />Manage<ChevronDown size={12} /></button>
                  <Link href={`/jobs/${job.id}?returnTo=${encodeURIComponent("/dental-jobs")}`} style={{ ...btn, border: "1px solid #7793b9", background: "white", color: "#06499d", textDecoration: "none" }}><FileText size={13} />View Ad</Link>
                  <ShareListingButton listingId={job.id} compact />
                  <button onClick={() => clickLegacyAction(job.id, "edit")} style={{ ...btn, border: "1px solid #7793b9", background: "white", color: "#06499d" }}><Pencil size={13} />Edit Posting</button>
                </div>

                <div style={{ padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", paddingBottom: 8, borderBottom: "1px solid #e2e8f0" }}>
                    <div style={{ color: "#002757", fontSize: 17, fontWeight: 900 }}>Interested Dental Offices ({interested})</div>
                    <div style={{ color: "#002757", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>Sort by: Newest First <ChevronDown size={14} /></div>
                  </div>

                  <div style={{ marginTop: 9, border: "1px dashed #cbd5e1", background: "#f8fafc", borderRadius: 10, padding: 14, textAlign: "center", color: "#64748b", fontSize: 12, fontWeight: 700 }}>
                    {interested === 0
                      ? "When a dental office responds to this posting, its card will appear here."
                      : "Office response details will appear here."}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    host,
  );
}
