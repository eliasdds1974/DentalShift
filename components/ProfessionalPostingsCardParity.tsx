"use client";

import { useEffect } from "react";
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

function text(el: Element | null) {
  return el?.textContent?.replace(/\s+/g, " ").trim() || "";
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function legacySection() {
  return Array.from(document.querySelectorAll("section")).find((section) =>
    Array.from(section.querySelectorAll("p")).some((p) => text(p).toLowerCase() === "my availability ads"),
  ) as HTMLElement | undefined;
}

function daysRemaining(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export function ProfessionalPostingsCardParity() {
  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | null = null;
    let listings: Listing[] = [];
    let applications: Application[] = [];

    const renderReplacement = () => {
      const oldSection = legacySection();
      if (!oldSection) return;

      // Remove the old My Availability Ads card from view entirely.
      oldSection.style.display = "none";

      let replacement = document.querySelector<HTMLElement>("[data-professional-postings-replacement='1']");
      if (!replacement) {
        replacement = document.createElement("section");
        replacement.dataset.professionalPostingsReplacement = "1";
        oldSection.insertAdjacentElement("afterend", replacement);
      }

      const countByListing = new Map<string, number>();
      for (const application of applications) {
        if (!application.listing_id || application.status === "declined" || application.status === "withdrawn") continue;
        countByListing.set(application.listing_id, (countByListing.get(application.listing_id) || 0) + 1);
      }

      const cards = listings.length === 0
        ? `<div style="border:1px dashed #cbd5e1;background:#f8fafc;border-radius:12px;padding:18px;text-align:center;color:#64748b;font-size:13px;font-weight:700">You have no DentalJobs postings yet.</div>`
        : listings.map((job) => {
            const remaining = daysRemaining(job.expires_at);
            const active = job.status === "active" && remaining > 0;
            const displayStatus = job.status === "active" && remaining === 0 ? "expired" : job.status;
            const interested = countByListing.get(job.id) || 0;

            return `
              <div data-professional-listing-id="${escapeHtml(job.id)}" style="border:1px solid #b9dfc3;border-radius:14px;overflow:hidden;background:#fff">
                <div style="background:#f7fff9;padding:12px 14px">
                  <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">
                    <span style="background:${active ? "#01A32E" : "#eef2f7"};color:${active ? "#fff" : "#475569"};border-radius:999px;padding:4px 9px;font-size:10px;font-weight:900;text-transform:uppercase">${escapeHtml(displayStatus)}</span>
                    ${active ? `<span style="color:#455f89;font-size:12px;font-weight:700">${remaining} day${remaining === 1 ? "" : "s"} remaining</span>` : ""}
                  </div>

                  <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:7px">
                    <div style="color:#002757;font-size:20px;font-weight:900">${escapeHtml(job.profession)} — ${escapeHtml(job.employment_type)}</div>
                    <span style="border:1px solid #bfe9ca;background:#f2fff6;color:#009b2f;border-radius:999px;padding:4px 9px;font-size:11px;font-weight:900">${interested} Interested</span>
                  </div>

                  <div style="display:flex;gap:16px;flex-wrap:wrap;color:#526a90;font-size:12px;font-weight:700;margin-top:7px">
                    <span style="display:inline-flex;align-items:center;gap:5px">⌖ ${escapeHtml(job.city)}, ${escapeHtml(job.province)}</span>
                    <span style="display:inline-flex;align-items:center;gap:5px">▣ ${escapeHtml(job.employment_type)}</span>
                    <span style="display:inline-flex;align-items:center;gap:5px">◷ Posted ${escapeHtml(formatDate(job.created_at))}</span>
                  </div>
                </div>

                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:7px 10px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;background:#f8fbff">
                  <button type="button" data-professional-manage="${escapeHtml(job.id)}" style="height:32px;border:0;border-radius:7px;padding:0 10px;background:#06499d;color:white;font-size:13px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;gap:5px;cursor:pointer">⋮ Manage⌄</button>
                  <a href="/jobs/${encodeURIComponent(job.id)}?returnTo=${encodeURIComponent("/dental-jobs")}" style="height:32px;border:1px solid #7793b9;border-radius:7px;padding:0 10px;background:white;color:#06499d;font-size:13px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;gap:5px;text-decoration:none">▤ View Ad</a>
                  <button type="button" data-professional-share="${escapeHtml(job.id)}" style="height:32px;border:0;border-radius:7px;padding:0 10px;background:#4285F4;color:white;font-size:13px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;gap:5px;cursor:pointer">⌯ Share Listing</button>
                  <button type="button" data-professional-edit="${escapeHtml(job.id)}" style="height:32px;border:1px solid #7793b9;border-radius:7px;padding:0 10px;background:white;color:#06499d;font-size:13px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;gap:5px;cursor:pointer">✎ Edit Posting</button>
                </div>

                <div style="padding:12px">
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding-bottom:8px;border-bottom:1px solid #e2e8f0">
                    <div style="color:#002757;font-size:17px;font-weight:900">Interested Dental Offices (${interested})</div>
                    <div style="color:#002757;font-size:12px;font-weight:700">Sort by: Newest First⌄</div>
                  </div>
                  <div style="margin-top:9px;border:1px dashed #cbd5e1;background:#f8fafc;border-radius:10px;padding:14px;text-align:center;color:#64748b;font-size:12px;font-weight:700">
                    ${interested === 0
                      ? "When a dental office selects I’m Interested, its card will appear here."
                      : "Dental office response cards will be defined here next."}
                  </div>
                </div>
              </div>`;
          }).join("");

      replacement.innerHTML = `
        <div style="width:100%;margin-top:14px;border:2px solid #01A32E;border-radius:18px;background:#fff;padding:14px;box-sizing:border-box">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
            <div>
              <div style="color:#009b2f;font-weight:900;font-size:11px;text-transform:uppercase">Professional Postings</div>
              <div style="color:#002757;font-weight:900;font-size:26px">My DentalJobs</div>
              <div style="color:#455f89;font-weight:600;font-size:13px">Manage your postings and review each dental office that responds.</div>
            </div>
            <div style="border:1px solid #bfe9ca;background:#f2fff6;color:#009b2f;font-weight:900;border-radius:999px;padding:6px 12px;font-size:13px">
              ${listings.length} posting${listings.length === 1 ? "" : "s"}
            </div>
          </div>
          <div style="display:grid;gap:14px;margin-top:12px">${cards}</div>
        </div>`;

      for (const button of Array.from(replacement.querySelectorAll<HTMLButtonElement>("[data-professional-manage]"))) {
        button.onclick = () => {
          const id = button.dataset.professionalManage;
          const hiddenArticle = oldSection.querySelector<HTMLElement>(`a[href^="/jobs/${CSS.escape(id || "")}"]`)?.closest("article");
          const hiddenManage = Array.from(hiddenArticle?.querySelectorAll<HTMLButtonElement>("button") || []).find((item) => text(item).includes("Manage"));
          hiddenManage?.click();
        };
      }

      for (const button of Array.from(replacement.querySelectorAll<HTMLButtonElement>("[data-professional-edit]"))) {
        button.onclick = () => {
          const id = button.dataset.professionalEdit;
          const hiddenArticle = oldSection.querySelector<HTMLElement>(`a[href^="/jobs/${CSS.escape(id || "")}"]`)?.closest("article");
          const hiddenManage = Array.from(hiddenArticle?.querySelectorAll<HTMLButtonElement>("button") || []).find((item) => text(item).includes("Manage"));
          hiddenManage?.click();
        };
      }

      for (const button of Array.from(replacement.querySelectorAll<HTMLButtonElement>("[data-professional-share]"))) {
        button.onclick = async () => {
          const id = button.dataset.professionalShare || "";
          const url = `${window.location.origin}/jobs/${id}`;
          try {
            if (navigator.share) await navigator.share({ title: "DentalJobs", url });
            else {
              await navigator.clipboard.writeText(url);
              const previous = button.textContent;
              button.textContent = "Copied";
              window.setTimeout(() => { button.textContent = previous; }, 1400);
            }
          } catch {
            // User cancelled share or browser blocked it; no action needed.
          }
        };
      }
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
      listings = (listingRows || []) as Listing[];
      applications = (applicationRows || []) as Application[];
      renderReplacement();
    };

    void load();

    observer = new MutationObserver(() => renderReplacement());
    observer.observe(document.body, { childList: true, subtree: true });

    const timer = window.setInterval(() => renderReplacement(), 1000);

    return () => {
      cancelled = true;
      observer?.disconnect();
      window.clearInterval(timer);
      document.querySelector("[data-professional-postings-replacement='1']")?.remove();
      const oldSection = legacySection();
      if (oldSection) oldSection.style.display = "";
    };
  }, []);

  return null;
}
