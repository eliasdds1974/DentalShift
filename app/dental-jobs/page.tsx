"use client";

import { useEffect } from "react";
import ClassifiedsPage from "../classifieds/page";
import { loadAccountDetails } from "@/lib/dentalshift";
import { supabase } from "@/lib/supabase";

type Point = { lat: number; lng: number };

type DistanceMaps = {
  anchor: Point | null;
  cityKm: Map<string, number>;
  provinceKm: Map<string, number>;
};

const demoListingTitles = new Set([
  "Registered Dental Hygienist — Permanent Full-Time",
  "Certified Dental Assistant Seeking Permanent Position",
  "Dental Administrator — 4 Days / Week",
  "Associate Dentist — 3 to 4 Days / Week",
  "Registered Dental Hygienist Looking for an Office",
  "Sterilization Technician",
]);

const provinceNames: Record<string, string> = {
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland & Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
};

// Keep these colours aligned with the DentalShift professional calendar and public DentalJobs Marketplace.
const professionalThemes: Record<string, { accent: string; pale: string; text: string }> = {
  "Registered Dental Hygienist": { accent: "#4285F4", pale: "#EEF4FF", text: "#245FB8" },
  "Certified Dental Assistant": { accent: "#EA4335", pale: "#FFF0EE", text: "#B52C22" },
  "Dental Administrator": { accent: "#FBBC05", pale: "#FFF8DF", text: "#805F00" },
  "Sterilization Technician": { accent: "#34A853", pale: "#ECF8EF", text: "#247A3B" },
  "Associate Dentist": { accent: "#7C3AED", pale: "#F4EEFF", text: "#5B21B6" },
};

function haversineKm(a: Point, b: Point) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function DentalJobsPage() {
  useEffect(() => {
    let disposed = false;
    let distanceMaps: DistanceMaps = { anchor: null, cityKm: new Map(), provinceKm: new Map() };

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
        if (text.includes("Dental job opportunities within")) node.textContent = "Dental job opportunities";
        if (text.includes("Closest opportunities first")) node.textContent = "Closest cities to your account first";
        if (text.includes("Organized by province and city")) node.textContent = "Closest cities to your account first";
      }
    };

    const buildDistanceMaps = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const details = await loadAccountDetails(user.id);
      const role = window.localStorage.getItem("dentalshift_portal_role");
      const ownLat = role === "office" ? details.office?.latitude : details.profile.latitude;
      const ownLng = role === "office" ? details.office?.longitude : details.profile.longitude;
      if (ownLat == null || ownLng == null) return;

      const anchor = { lat: Number(ownLat), lng: Number(ownLng) };
      const { data: listings } = await supabase
        .from("job_listings")
        .select("id,listing_type,city,province,office_id,professional_id")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString());
      if (!listings?.length) {
        distanceMaps = { anchor, cityKm: new Map(), provinceKm: new Map() };
        return;
      }

      const officeIds = [...new Set(listings.map((row: any) => row.office_id).filter(Boolean))];
      const professionalIds = [...new Set(listings.map((row: any) => row.professional_id).filter(Boolean))];
      const [officeResult, profileResult] = await Promise.all([
        officeIds.length
          ? supabase.from("offices").select("id,latitude,longitude").in("id", officeIds)
          : Promise.resolve({ data: [] as any[] }),
        professionalIds.length
          ? supabase.from("profiles").select("id,latitude,longitude").in("id", professionalIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const officePoints = new Map((officeResult.data || []).map((row: any) => [String(row.id), row]));
      const professionalPoints = new Map((profileResult.data || []).map((row: any) => [String(row.id), row]));
      const cityDistances = new Map<string, number[]>();
      const provinceDistances = new Map<string, number[]>();

      for (const listing of listings as any[]) {
        const source = listing.listing_type === "office_hiring"
          ? officePoints.get(String(listing.office_id))
          : professionalPoints.get(String(listing.professional_id));
        if (!source || source.latitude == null || source.longitude == null) continue;
        const km = haversineKm(anchor, { lat: Number(source.latitude), lng: Number(source.longitude) });
        const cityKey = `${String(listing.province).trim()}|||${String(listing.city).trim()}`;
        if (!cityDistances.has(cityKey)) cityDistances.set(cityKey, []);
        cityDistances.get(cityKey)!.push(km);
        const province = String(listing.province).trim();
        if (!provinceDistances.has(province)) provinceDistances.set(province, []);
        provinceDistances.get(province)!.push(km);
      }

      const cityKm = new Map<string, number>();
      cityDistances.forEach((values, key) => cityKm.set(key, Math.min(...values)));
      const provinceKm = new Map<string, number>();
      provinceDistances.forEach((values, key) => provinceKm.set(key, Math.min(...values)));
      distanceMaps = { anchor, cityKm, provinceKm };
    };

    const organizeSignedInListings = () => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>(".dental-jobs-compact-layout main > section"));
      const resultsSection = sections.find((section) =>
        section.textContent?.includes("Dental job opportunities") || section.textContent?.includes("DentalJobs Near You")
      );
      if (!resultsSection) return false;

      const grid = Array.from(resultsSection.querySelectorAll<HTMLElement>("div.grid")).find((candidate) =>
        Array.from(candidate.children).some((child) => child.tagName === "ARTICLE")
      );
      if (!grid) return false;

      grid.querySelectorAll(":scope > .dentaljobs-group-heading").forEach((node) => node.remove());

      const allCards = Array.from(grid.querySelectorAll<HTMLElement>(":scope > article"));
      for (const card of allCards) {
        const title = card.querySelector("h3")?.textContent?.trim() || "";
        card.style.display = demoListingTitles.has(title) ? "none" : "";
        card.classList.remove("dentaljobs-office-card", "dentaljobs-professional-card");
      }

      const cards = allCards.filter((card) => card.style.display !== "none");
      if (!cards.length) return true;

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

        card.classList.add(kind === "office" ? "dentaljobs-office-card" : "dentaljobs-professional-card");
        if (kind === "professional") {
          const cardText = card.textContent || "";
          const profession = Object.keys(professionalThemes).find((name) => cardText.includes(name)) || "";
          const theme = professionalThemes[profession] || { accent: "#01A32E", pale: "#EAF8EE", text: "#017F27" };
          card.style.setProperty("--dentaljobs-prof-accent", theme.accent);
          card.style.setProperty("--dentaljobs-prof-pale", theme.pale);
          card.style.setProperty("--dentaljobs-prof-text", theme.text);
        }

        if (!grouped.has(key)) grouped.set(key, { province, city, office: [], professional: [] });
        grouped.get(key)![kind].push(card);
      }

      const provinceTotals = new Map<string, number>();
      grouped.forEach((group) => {
        provinceTotals.set(group.province, (provinceTotals.get(group.province) || 0) + group.office.length + group.professional.length);
      });

      const groups = Array.from(grouped.values()).sort((a, b) => {
        const aProvinceKm = distanceMaps.provinceKm.get(a.province) ?? Number.POSITIVE_INFINITY;
        const bProvinceKm = distanceMaps.provinceKm.get(b.province) ?? Number.POSITIVE_INFINITY;
        if (aProvinceKm !== bProvinceKm) return aProvinceKm - bProvinceKm;
        if (a.province !== b.province) return a.province.localeCompare(b.province);
        const aCityKm = distanceMaps.cityKm.get(`${a.province}|||${a.city}`) ?? Number.POSITIVE_INFINITY;
        const bCityKm = distanceMaps.cityKm.get(`${b.province}|||${b.city}`) ?? Number.POSITIVE_INFINITY;
        if (aCityKm !== bCityKm) return aCityKm - bCityKm;
        return a.city.localeCompare(b.city);
      });

      let order = 0;
      let previousProvince = "";
      for (const group of groups) {
        if (group.province !== previousProvince) {
          const provinceHeading = document.createElement("div");
          provinceHeading.className = "dentaljobs-group-heading dentaljobs-province-heading";
          provinceHeading.style.order = String(order++);
          const provinceKm = distanceMaps.provinceKm.get(group.province);
          const provinceLabel = provinceNames[group.province] || group.province;
          const total = provinceTotals.get(group.province) || 0;
          provinceHeading.innerHTML = `
            <div class="dentaljobs-province-title-wrap">
              <span class="dentaljobs-province-code">${group.province}</span>
              <strong>${provinceLabel}</strong>
              ${provinceKm != null ? `<em>${Math.round(provinceKm)} km nearest</em>` : ""}
            </div>
            <small>${total} active</small>`;
          grid.appendChild(provinceHeading);
          previousProvince = group.province;
        }

        const cityHeading = document.createElement("div");
        cityHeading.className = "dentaljobs-group-heading dentaljobs-city-heading";
        cityHeading.style.order = String(order++);
        const cityKm = distanceMaps.cityKm.get(`${group.province}|||${group.city}`);
        cityHeading.innerHTML = `
          <span class="dentaljobs-city-pin">●</span>
          <div class="dentaljobs-city-title-wrap">
            <strong>${group.city}</strong>
            <small>${cityKm != null ? `${Math.round(cityKm)} km · ` : ""}${group.office.length + group.professional.length} active listing${group.office.length + group.professional.length === 1 ? "" : "s"}</small>
          </div>`;
        grid.appendChild(cityHeading);

        if (group.office.length) {
          const officeHeading = document.createElement("div");
          officeHeading.className = "dentaljobs-group-heading dentaljobs-type-heading dentaljobs-office-heading";
          officeHeading.style.order = String(order++);
          officeHeading.innerHTML = `<span class="dentaljobs-type-icon">▣</span><strong>Dental Office Hiring</strong><small>${group.office.length}</small>`;
          grid.appendChild(officeHeading);
          group.office.forEach((card) => { card.style.order = String(order++); });
        }

        if (group.professional.length) {
          const professionalHeading = document.createElement("div");
          professionalHeading.className = "dentaljobs-group-heading dentaljobs-type-heading dentaljobs-professional-heading";
          professionalHeading.style.order = String(order++);
          professionalHeading.innerHTML = `<span class="dentaljobs-type-icon">●</span><strong>Professionals Looking for an Office</strong><small>${group.professional.length}</small>`;
          grid.appendChild(professionalHeading);
          group.professional.forEach((card) => { card.style.order = String(order++); });
        }
      }

      const topSection = sections[0];
      topSection.querySelector<HTMLElement>(".dentaljobs-city-index")?.remove();
      const filterBar = Array.from(topSection.querySelectorAll<HTMLElement>("div.mt-6.grid.gap-3")).find((node) => node.querySelector("select"));
      if (filterBar) filterBar.style.display = "none";
      return true;
    };

    const refresh = () => {
      updateDurationAndHeadingText();
      return organizeSignedInListings();
    };

    let attempts = 0;
    const runWhenReady = () => {
      if (disposed) return;
      attempts += 1;
      const done = refresh();
      if (!done && attempts < 12) window.setTimeout(runWhenReady, 150);
    };

    const initialTimer = window.setTimeout(runWhenReady, 0);
    void (async () => {
      try { await buildDistanceMaps(); } catch { /* Fall back to province/city grouping if coordinates are unavailable. */ }
      if (!disposed) refresh();
    })();

    return () => {
      disposed = true;
      window.clearTimeout(initialTimer);
    };
  }, []);

  return (
    <div className="dental-jobs-compact-layout">
      <style>{`
        @media (min-width: 1024px) {
          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) {
            display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); column-gap:1rem; align-items:start;
          }
          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > :first-child,
          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > section:not(.relative),
          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > div.mt-6.grid.gap-3 { grid-column:1 / -1; }
          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > div.mt-6.grid.gap-4 { grid-column:1; max-width:none; margin-top:1.25rem; }
          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > section.relative { grid-column:2; margin-top:1.25rem; height:100%; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) { padding-top:1.25rem !important; padding-bottom:2rem !important; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) > div.grid { display:grid !important; grid-template-columns:repeat(2,minmax(0,1fr)) !important; gap:.75rem !important; align-items:start; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) article:not(.dentaljobs-professional-card) { border-radius:1rem !important; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) article:not(.dentaljobs-professional-card) > div:nth-of-type(2) { padding:1rem !important; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) article:not(.dentaljobs-professional-card) h3 { font-size:1rem !important; line-height:1.25rem !important; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) article:not(.dentaljobs-professional-card) .mt-5 { margin-top:.75rem !important; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) article:not(.dentaljobs-professional-card) p.line-clamp-3 { font-size:.78rem !important; line-height:1.2rem !important; -webkit-line-clamp:2 !important; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) article:not(.dentaljobs-professional-card) > div:last-child { padding:.75rem 1rem !important; }
        }

        @media (min-width:1440px) {
          .dental-jobs-compact-layout main > section:nth-of-type(2) > div.grid { grid-template-columns:repeat(4,minmax(0,1fr)) !important; gap:.75rem !important; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) article:not(.dentaljobs-professional-card) > div:nth-of-type(2) { padding:.8rem !important; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) article:not(.dentaljobs-professional-card) h3 { font-size:.9rem !important; line-height:1.12rem !important; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) article:not(.dentaljobs-professional-card) p.line-clamp-3 { font-size:.72rem !important; line-height:1.05rem !important; }
          .dental-jobs-compact-layout main > section:nth-of-type(2) article:not(.dentaljobs-professional-card) > div:last-child { padding:.65rem .8rem !important; }
        }

        .dentaljobs-group-heading { grid-column:1 / -1; scroll-margin-top:90px; }

        .dentaljobs-province-heading {
          display:flex; align-items:flex-end; justify-content:space-between; gap:1rem;
          margin-top:1.35rem; border-bottom:2px solid #002757; padding:0 0 .75rem;
        }
        .dentaljobs-province-title-wrap { display:flex; flex-direction:column; align-items:flex-start; }
        .dentaljobs-province-code { color:#01A32E; font-size:.69rem; font-weight:900; letter-spacing:.16em; text-transform:uppercase; }
        .dentaljobs-province-heading strong { color:#002757; font-size:1.75rem; line-height:2rem; font-weight:900; }
        .dentaljobs-province-heading em { margin-top:.12rem; color:#64748b; font-size:.68rem; font-style:normal; font-weight:700; }
        .dentaljobs-province-heading > small {
          border-radius:999px; background:#002757; padding:.38rem .75rem; color:white;
          font-size:.72rem; font-weight:900;
        }

        .dentaljobs-city-heading {
          display:grid; grid-template-columns:2.25rem minmax(0,1fr); align-items:center; gap:.65rem;
          margin-top:.45rem; border:1px solid #e2e8f0; border-radius:1rem; background:white;
          padding:.75rem .9rem; box-shadow:0 1px 2px rgba(15,23,42,.04);
        }
        .dentaljobs-city-pin {
          display:grid; width:2.25rem; height:2.25rem; place-items:center; border-radius:.75rem;
          background:#edf3fa; color:#002757; font-size:.72rem;
        }
        .dentaljobs-city-title-wrap { display:flex; flex-direction:column; }
        .dentaljobs-city-heading strong { color:#002757; font-size:1.15rem; line-height:1.35rem; font-weight:900; }
        .dentaljobs-city-heading small { color:#64748b; font-size:.72rem; font-weight:700; }

        .dentaljobs-type-heading {
          display:grid; grid-template-columns:2rem minmax(0,1fr) auto; align-items:center; gap:.55rem;
          margin-top:.25rem; padding:.45rem 0; background:transparent; text-transform:none; letter-spacing:normal;
        }
        .dentaljobs-type-heading strong { color:#002757; font-size:.9rem; font-weight:900; }
        .dentaljobs-type-heading > small { color:#94a3b8; font-size:.72rem; font-weight:800; }
        .dentaljobs-type-icon {
          display:grid; width:2rem; height:2rem; place-items:center; border-radius:.5rem; color:white; font-size:.65rem;
        }
        .dentaljobs-office-heading .dentaljobs-type-icon { background:#002757; }
        .dentaljobs-professional-heading .dentaljobs-type-icon { background:#01A32E; }

        .dentaljobs-professional-card {
          min-height:315px !important; overflow:hidden !important; border:1px solid #e2e8f0 !important;
          border-radius:1rem !important; background:white !important;
          box-shadow:0 1px 2px rgba(15,23,42,.06) !important;
          border-top:6px solid var(--dentaljobs-prof-accent, #01A32E) !important;
          transition:transform .18s ease, box-shadow .18s ease !important;
        }
        .dentaljobs-professional-card:hover { transform:translateY(-2px); box-shadow:0 10px 22px rgba(15,23,42,.10) !important; }
        .dentaljobs-professional-card > div:nth-of-type(2) { padding:1rem !important; }
        .dentaljobs-professional-card h3 { color:#002757 !important; font-size:1rem !important; line-height:1.25rem !important; font-weight:900 !important; }
        .dentaljobs-professional-card p.line-clamp-3 { font-size:.75rem !important; line-height:1.2rem !important; -webkit-line-clamp:4 !important; }
        .dentaljobs-professional-card button { border-color:var(--dentaljobs-prof-accent, #01A32E) !important; }
        .dentaljobs-professional-card button[class*="bg-[#002757]"],
        .dentaljobs-professional-card button[class*="bg-[#01A32E]"] {
          background:var(--dentaljobs-prof-accent, #01A32E) !important; color:white !important;
        }

        .dental-jobs-compact-layout main > section:first-of-type section.relative:has(p:first-of-type:nth-child(1)) { border-color:rgba(1,163,46,.55) !important; }
        .dental-jobs-compact-layout header a[href] { background:#4285F4 !important; border-color:#4285F4 !important; color:#fff !important; }
        .dental-jobs-compact-layout header a[href]:hover { background:#3367D6 !important; border-color:#3367D6 !important; color:#fff !important; }
      `}</style>
      <ClassifiedsPage />
    </div>
  );
}
