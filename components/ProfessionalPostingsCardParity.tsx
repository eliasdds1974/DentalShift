"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

type ListingMeta = {
  id: string;
  employment_type: string;
  created_at: string;
  status: string;
  expires_at: string;
};

function text(el: Element | null) {
  return el?.textContent?.replace(/\s+/g, " ").trim() || "";
}

function professionalSection() {
  return Array.from(document.querySelectorAll("section")).find((section) =>
    Array.from(section.querySelectorAll("p")).some((p) => text(p).toLowerCase() === "my availability ads"),
  ) as HTMLElement | undefined;
}

function listingIdFromArticle(article: HTMLElement) {
  const link = article.querySelector<HTMLAnchorElement>('a[href^="/jobs/"]');
  const match = link?.getAttribute("href")?.match(/^\/jobs\/([^?]+)/);
  return match?.[1] || null;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export function ProfessionalPostingsCardParity() {
  const metaRef = useRef<Record<string, ListingMeta>>({});
  const countsRef = useRef<Record<string, number>>({});
  const metaLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | null = null;

    const apply = () => {
      const section = professionalSection();
      if (!section) return;

      section.style.width = "100%";
      section.style.height = "auto";
      section.style.minHeight = "0";
      section.style.marginTop = "14px";
      section.style.border = "2px solid #01A32E";
      section.style.borderRadius = "18px";
      section.style.background = "#fff";
      section.style.padding = "14px";
      section.style.boxShadow = "none";
      section.style.overflow = "visible";

      const leftAccent = section.querySelector<HTMLElement>(":scope > div.absolute");
      if (leftAccent) leftAccent.style.display = "none";

      const header = section.querySelector<HTMLElement>(":scope > div.flex");
      if (header) {
        header.style.alignItems = "center";
        header.style.flexWrap = "wrap";
        header.style.gap = "10px";
        const eyebrow = header.querySelector<HTMLElement>("p");
        const heading = header.querySelector<HTMLElement>("h2");
        const desc = heading?.nextElementSibling as HTMLElement | null;
        const count = header.querySelector<HTMLElement>("span");
        if (eyebrow) {
          eyebrow.textContent = "Professional Postings";
          eyebrow.style.color = "#009b2f";
          eyebrow.style.fontSize = "11px";
          eyebrow.style.fontWeight = "900";
        }
        if (heading) {
          heading.style.color = "#002757";
          heading.style.fontSize = "26px";
          heading.style.fontWeight = "900";
          heading.style.marginTop = "0";
        }
        if (desc) {
          desc.textContent = "Manage your postings and review each dental office that responds.";
          desc.style.color = "#455f89";
          desc.style.fontSize = "13px";
          desc.style.fontWeight = "600";
        }
        if (count) {
          count.style.border = "1px solid #bfe9ca";
          count.style.background = "#f2fff6";
          count.style.color = "#009b2f";
          count.style.fontWeight = "900";
          count.style.borderRadius = "999px";
          count.style.padding = "6px 12px";
          count.style.fontSize = "13px";
          count.style.boxShadow = "none";
        }
      }

      const list = section.querySelector<HTMLElement>(":scope > div.mt-4.grid");
      if (!list || !metaLoadedRef.current) return;
      list.style.gap = "14px";
      list.style.marginTop = "12px";

      for (const article of Array.from(list.querySelectorAll<HTMLElement>(":scope > article"))) {
        const id = listingIdFromArticle(article);
        if (!id) continue;
        const meta = metaRef.current[id];
        const info = article.firstElementChild as HTMLElement | null;
        const actions = article.children[1] as HTMLElement | undefined;
        if (!info || !actions) continue;

        // If our rendered marker is still present, nothing has overwritten this card.
        // When React re-renders the legacy card, the marker disappears and we safely re-apply.
        if (info.querySelector('[data-professional-parity="1"]')) continue;

        const titleEl = info.querySelector<HTMLElement>("h3");
        const locationEl = info.querySelector<HTMLElement>("h3 + p");
        const title = text(titleEl);
        const location = text(locationEl);
        const existingStatus = info.querySelector<HTMLElement>("span");
        const existingDays = existingStatus?.nextElementSibling as HTMLElement | null;
        const displayStatus = text(existingStatus) || meta?.status || "active";
        const daysText = text(existingDays);
        const count = countsRef.current[id] || 0;
        const employment = meta?.employment_type || title.split(" — ").slice(1).join(" — ") || "Position";
        const posted = meta?.created_at ? formatDate(meta.created_at) : "—";
        const active = displayStatus.toLowerCase() === "active";

        article.style.border = "1px solid #b9dfc3";
        article.style.borderRadius = "14px";
        article.style.overflow = "hidden";
        article.style.background = "#fff";
        article.style.padding = "0";
        article.style.boxShadow = "none";

        info.innerHTML = `
          <div data-professional-parity="1" style="background:#f7fff9;padding:12px 14px">
            <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">
              <span style="background:${active ? "#01A32E" : "#eef2f7"};color:${active ? "#fff" : "#475569"};border-radius:999px;padding:4px 9px;font-size:10px;font-weight:900;text-transform:uppercase">${displayStatus}</span>
              ${daysText ? `<span style="color:#455f89;font-size:12px;font-weight:700">${daysText}</span>` : ""}
            </div>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:7px">
              <div style="color:#002757;font-size:20px;font-weight:900">${title}</div>
              <span style="border:1px solid #bfe9ca;background:#f2fff6;color:#009b2f;border-radius:999px;padding:4px 9px;font-size:11px;font-weight:900">${count} Interested</span>
            </div>
            <div style="display:flex;gap:16px;flex-wrap:wrap;color:#526a90;font-size:12px;font-weight:700;margin-top:7px">
              <span style="display:inline-flex;align-items:center;gap:5px">📍 ${location}</span>
              <span style="display:inline-flex;align-items:center;gap:5px">💼 ${employment}</span>
              <span style="display:inline-flex;align-items:center;gap:5px">🕒 Posted ${posted}</span>
            </div>
          </div>`;

        actions.style.display = "flex";
        actions.style.alignItems = "center";
        actions.style.gap = "6px";
        actions.style.flexWrap = "wrap";
        actions.style.padding = "7px 10px";
        actions.style.borderTop = "1px solid #e2e8f0";
        actions.style.borderBottom = "1px solid #e2e8f0";
        actions.style.background = "#f8fbff";
        actions.style.marginTop = "0";

        for (const el of Array.from(actions.querySelectorAll<HTMLElement>("button,a"))) {
          el.style.minHeight = "32px";
          el.style.height = "32px";
          el.style.borderRadius = "7px";
          el.style.padding = "0 10px";
          el.style.fontSize = "13px";
          el.style.fontWeight = "900";
          el.style.display = "inline-flex";
          el.style.alignItems = "center";
          el.style.justifyContent = "center";
          el.style.gap = "5px";
          el.style.whiteSpace = "nowrap";
          el.style.width = "auto";
        }

        const manage = Array.from(actions.querySelectorAll<HTMLElement>("button")).find((button) => text(button).includes("Manage"));
        if (manage) {
          manage.style.border = "0";
          manage.style.background = "#06499d";
          manage.style.color = "#fff";
        }
        const view = actions.querySelector<HTMLElement>('a[href^="/jobs/"]');
        if (view) {
          view.style.border = "1px solid #7793b9";
          view.style.background = "#fff";
          view.style.color = "#06499d";
          view.style.textDecoration = "none";
        }
      }
    };

    const loadMeta = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const [{ data: listings }, { data: applications }] = await Promise.all([
        supabase
          .from("job_listings")
          .select("id,employment_type,created_at,status,expires_at")
          .eq("professional_id", user.id)
          .eq("listing_type", "professional_available")
          .order("created_at", { ascending: false }),
        supabase
          .from("job_applications")
          .select("listing_id,status")
          .eq("professional_id", user.id),
      ]);

      if (cancelled) return;
      metaRef.current = Object.fromEntries((listings || []).map((row: any) => [row.id, row]));
      const counts: Record<string, number> = {};
      for (const row of applications || []) {
        if (!row.listing_id || row.status === "declined" || row.status === "withdrawn") continue;
        counts[row.listing_id] = (counts[row.listing_id] || 0) + 1;
      }
      countsRef.current = counts;
      metaLoadedRef.current = true;
      apply();
    };

    void loadMeta();
    observer = new MutationObserver(() => apply());
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = window.setInterval(apply, 1000);

    return () => {
      cancelled = true;
      observer?.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
