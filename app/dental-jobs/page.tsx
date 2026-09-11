"use client";

import { useEffect } from "react";
import ClassifiedsPage from "../classifieds/page";

export default function DentalJobsPage() {
  useEffect(() => {
    const updateDurationAndHeadingText = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node.textContent;
        if (!text) continue;
        if (text.includes("Renew for 14 Days")) node.textContent = text.replace(/Renew for 14 Days/g, "Renew for 30 Days");
        if (text.includes("remain active for 14 days")) node.textContent = text.replace(/remain active for 14 days/g, "remain active for 30 days");
        if (text.includes("Renew for 30 Days") && node.parentElement?.closest("section")?.textContent?.includes("Office postings")) {
          node.textContent = text.replace(/Renew for 30 Days/g, "Renew for 90 Days");
        }
        if (text.includes("remain active for 30 days") && node.parentElement?.closest("[role='dialog']")?.textContent?.includes("Dental Office")) {
          node.textContent = text.replace(/remain active for 30 days/g, "remain active for 90 days");
        }
        if (text.includes("Dental job opportunities within")) {
          node.textContent = "Dental job opportunities";
        }
        if (text.includes("Closest opportunities first")) {
          node.textContent = "Organized by province and city";
        }
      }
    };

    const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const organizeListingsAndBuildCityIndex = () => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>(".dental-jobs-compact-layout main > section"));
      const resultsSection = sections.find((section) => section.textContent?.includes("Dental job opportunities"));
      if (!resultsSection) return;

      const grid = Array.from(resultsSection.querySelectorAll<HTMLElement>("div.grid")).find((candidate) =>
        Array.from(candidate.children).some((child) => child.tagName === "ARTICLE")
      );
      if (!grid) return;

      grid.querySelectorAll(":scope > .dentaljobs-group-heading").forEach((node) => node.remove());
      const cards = Array.from(grid.querySelectorAll<HTMLElement>(":scope > article"));
      if (!cards.length) return;

      const grouped = new Map<string, { province: string; city: string; office: HTMLElement[]; professional: HTMLElement[] }>();

      for (const card of cards) {
        const locationBlock = Array.from(card.querySelectorAll<HTMLElement>("div")).find((node) =>
          node.querySelector("p:first-child")?.textContent?.trim() === "Location"
        );
        const locationText = locationBlock?.querySelector("p:nth-child(2)")?.textContent?.trim() || "Other, Canada";
        const parts = locationText.split(",").map((part) => part.trim()).filter(Boolean);
        const city = parts[0] || "Other";
        const province = parts[1] || "Canada";
        const key = `${province}|||${city}`;
        const kind = card.textContent?.includes("OFFICE HIRING") ? "office" : "professional";
        if (!grouped.has(key)) grouped.set(key, { province, city, office: [], professional: [] });
        grouped.get(key)![kind].push(card);
      }

      const provinceTotals = new Map<string, number>();
      for (const group of grouped.values()) {
        provinceTotals.set(group.province, (provinceTotals.get(group.province) || 0) + group.office.length + group.professional.length);
      }

      const groups = Array.from(grouped.values()).sort((a, b) => {
        const provinceDiff = (provinceTotals.get(b.province) || 0) - (provinceTotals.get(a.province) || 0);
        if (provinceDiff !== 0) return provinceDiff;
        if (a.province !== b.province) return a.province.localeCompare(b.province);
        const cityDiff = (b.office.length + b.professional.length) - (a.office.length + a.professional.length);
        return cityDiff !== 0 ? cityDiff : a.city.localeCompare(b.city);
      });

      let order = 0;
      let previousProvince = "";

      for (const group of groups) {
        if (group.province !== previousProvince) {
          const provinceHeading = document.createElement("div");
          provinceHeading.className = "dentaljobs-group-heading dentaljobs-province-heading";
          provinceHeading.style.order = String(order++);
          provinceHeading.innerHTML = `<span>${group.province}</span><small>${provinceTotals.get(group.province) || 0} ads</small>`;
          grid.appendChild(provinceHeading);
          previousProvince = group.province;
        }

        const cityId = `dentaljobs-city-${slugify(group.province)}-${slugify(group.city)}`;
        const cityHeading = document.createElement("div");
        cityHeading.id = cityId;
        cityHeading.className = "dentaljobs-group-heading dentaljobs-city-heading";
        cityHeading.style.order = String(order++);
        cityHeading.innerHTML = `<span>${group.city}</span><small>${group.office.length + group.professional.length} active</small>`;
        grid.appendChild(cityHeading);

        if (group.office.length) {
          const officeHeading = document.createElement("div");
          officeHeading.className = "dentaljobs-group-heading dentaljobs-type-heading dentaljobs-office-heading";
          officeHeading.style.order = String(order++);
          officeHeading.innerHTML = `<span>Office Hiring</span><small>${group.office.length}</small>`;
          grid.appendChild(officeHeading);
          group.office.forEach((card) => { card.style.order = String(order++); });
        }

        if (group.professional.length) {
          const professionalHeading = document.createElement("div");
          professionalHeading.className = "dentaljobs-group-heading dentaljobs-type-heading dentaljobs-professional-heading";
          professionalHeading.style.order = String(order++);
          professionalHeading.innerHTML = `<span>Professionals Seeking an Office</span><small>${group.professional.length}</small>`;
          grid.appendChild(professionalHeading);
          group.professional.forEach((card) => { card.style.order = String(order++); });
        }
      }

      const topSection = sections[0];
      const filterBar = Array.from(topSection.querySelectorAll<HTMLElement>("div.mt-6.grid.gap-3")).find((node) => node.querySelector("select"));
      if (!filterBar) return;

      filterBar.querySelectorAll("label").forEach((label) => {
        const input = label.querySelector("input[placeholder='Search position or city']");
        const radius = label.querySelector("select");
        if (input || (radius && Array.from(radius.options).some((option) => option.textContent?.includes("km")))) {
          (label as HTMLElement).style.display = "none";
        }
      });

      let index = topSection.querySelector<HTMLElement>(".dentaljobs-city-index");
      if (!index) {
        index = document.createElement("div");
        index.className = "dentaljobs-city-index";
        filterBar.parentElement?.insertBefore(index, filterBar);
      }

      const provinceOrder = [...new Set(groups.map((group) => group.province))];
      index.innerHTML = provinceOrder.map((province) => {
        const provinceGroups = groups.filter((group) => group.province === province);
        const badges = provinceGroups.map((group) => {
          const count = group.office.length + group.professional.length;
          const target = `dentaljobs-city-${slugify(group.province)}-${slugify(group.city)}`;
          return `<button type="button" class="dentaljobs-city-badge" data-target="${target}"><span>${group.city}</span><b>${count}</b></button>`;
        }).join("");
        return `<div class="dentaljobs-index-province"><div class="dentaljobs-index-title"><span>${province}</span><b>${provinceTotals.get(province) || 0}</b></div><div class="dentaljobs-index-badges">${badges}</div></div>`;
      }).join("");

      index.querySelectorAll<HTMLButtonElement>(".dentaljobs-city-badge").forEach((button) => {
        button.onclick = () => {
          const target = document.getElementById(button.dataset.target || "");
          target?.scrollIntoView({ behavior: "smooth", block: "start" });
        };
      });
    };

    const refresh = () => {
      updateDurationAndHeadingText();
      organizeListingsAndBuildCityIndex();
    };

    refresh();
    const observer = new MutationObserver(() => window.requestAnimationFrame(refresh));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="dental-jobs-compact-layout">
      <style>{`
        @media (min-width: 1024px) {
          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            column-gap: 1rem;
            align-items: start;
          }

          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > :first-child,
          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > section:not(.relative),
          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > div.mt-6.grid.gap-3,
          .dental-jobs-compact-layout .dentaljobs-city-index {
            grid-column: 1 / -1;
          }

          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > div.mt-6.grid.gap-4 {
            grid-column: 1;
            max-width: none;
            margin-top: 1.25rem;
          }

          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > section.relative {
            grid-column: 2;
            margin-top: 1.25rem;
            height: 100%;
          }

          .dental-jobs-compact-layout main > section:nth-of-type(2) {
            padding-top: 1.25rem !important;
            padding-bottom: 2rem !important;
          }

          .dental-jobs-compact-layout main > section:nth-of-type(2) > div.grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: .75rem !important;
            align-items: start;
          }

          .dental-jobs-compact-layout main > section:nth-of-type(2) article { border-radius: 1rem !important; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) article > div:nth-of-type(2) { padding: 1rem !important; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) article h3 { font-size: 1rem !important; line-height: 1.25rem !important; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) article .mt-5 { margin-top: .75rem !important; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) article p.line-clamp-3 { font-size: .78rem !important; line-height: 1.2rem !important; -webkit-line-clamp: 2 !important; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) article > div:last-child { padding: .75rem 1rem !important; }

          .dentaljobs-group-heading { grid-column: 1 / -1; scroll-margin-top: 90px; }
          .dentaljobs-province-heading { display:flex; align-items:center; justify-content:space-between; margin-top:.35rem; border-bottom:2px solid #002757; padding:.35rem 0 .4rem; color:#002757; font-size:1.15rem; font-weight:900; }
          .dentaljobs-province-heading small { font-size:.72rem; color:#64748b; }
          .dentaljobs-city-heading { display:flex; align-items:center; justify-content:space-between; margin-top:.2rem; border-radius:.8rem; background:#eef3f8; padding:.5rem .75rem; color:#002757; font-size:.95rem; font-weight:900; }
          .dentaljobs-city-heading small { color:#6b7d90; font-size:.68rem; font-weight:800; }
          .dentaljobs-type-heading { display:flex; align-items:center; justify-content:space-between; margin-top:.1rem; border-radius:.65rem; padding:.38rem .65rem; font-size:.75rem; font-weight:900; text-transform:uppercase; letter-spacing:.08em; }
          .dentaljobs-type-heading small { display:grid; min-width:1.4rem; height:1.4rem; place-items:center; border-radius:999px; background:white; font-size:.65rem; }
          .dentaljobs-office-heading { background:#edf3fa; color:#002757; }
          .dentaljobs-professional-heading { background:#eaf8ee; color:#017f27; }
        }

        @media (min-width: 1440px) {
          .dental-jobs-compact-layout main > section:nth-of-type(2) > div.grid { grid-template-columns:repeat(4,minmax(0,1fr)) !important; gap:.7rem !important; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) article > div:nth-of-type(2) { padding:.8rem !important; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) article h3 { font-size:.9rem !important; line-height:1.12rem !important; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) article p.line-clamp-3 { font-size:.72rem !important; line-height:1.05rem !important; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) article > div:last-child { padding:.65rem .8rem !important; }
        }

        .dentaljobs-city-index { margin-top:1.15rem; border:2px solid #4285F4; border-radius:1rem; background:#f7faff; padding:.85rem; box-shadow:0 4px 12px rgba(0,0,0,.05); }
        .dentaljobs-index-province + .dentaljobs-index-province { margin-top:.7rem; padding-top:.7rem; border-top:1px solid #dbe7f6; }
        .dentaljobs-index-title { display:flex; align-items:center; gap:.45rem; margin-bottom:.45rem; color:#002757; font-size:.78rem; font-weight:900; text-transform:uppercase; letter-spacing:.06em; }
        .dentaljobs-index-title b { display:grid; min-width:1.45rem; height:1.45rem; place-items:center; border-radius:999px; background:#002757; color:white; font-size:.67rem; }
        .dentaljobs-index-badges { display:flex; flex-wrap:wrap; gap:.45rem; }
        .dentaljobs-city-badge { display:inline-flex; align-items:center; gap:.45rem; border:1px solid #c8daf5; border-radius:999px; background:white; padding:.42rem .55rem .42rem .72rem; color:#002757; font-size:.78rem; font-weight:800; box-shadow:0 1px 3px rgba(0,0,0,.04); transition:.15s ease; }
        .dentaljobs-city-badge:hover { border-color:#4285F4; background:#eef4ff; transform:translateY(-1px); }
        .dentaljobs-city-badge b { display:grid; min-width:1.35rem; height:1.35rem; place-items:center; border-radius:999px; background:#4285F4; color:white; font-size:.64rem; }

        .dental-jobs-compact-layout main > section:first-of-type section.relative:has(p:first-of-type:nth-child(1)) { border-color:rgba(1,163,46,.55) !important; }
        .dental-jobs-compact-layout header a[href] { background:#4285F4 !important; border-color:#4285F4 !important; color:#fff !important; }
        .dental-jobs-compact-layout header a[href]:hover { background:#3367D6 !important; border-color:#3367D6 !important; color:#fff !important; }

        @media (max-width: 1023px) {
          .dentaljobs-group-heading { display:none !important; }
          .dentaljobs-city-index { margin-top:1rem; }
        }
      `}</style>
      <ClassifiedsPage />
    </div>
  );
}
