"use client";

import Image from "next/image";
import { Globe2, Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ListingRow = {
  listing_type: string;
  city: string | null;
  province: string | null;
};

type ContactSettings = {
  company_name: string | null;
  support_email: string | null;
  phone: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
};

type CityCount = {
  city: string;
  count: number;
  office: number;
  professional: number;
};

type ProvinceCount = {
  province: string;
  label: string;
  total: number;
  cities: CityCount[];
};

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

function clean(value?: string | null) {
  return String(value || "").trim();
}

function normalizeWebsite(value?: string | null) {
  const candidate = clean(value);
  if (!candidate) return "https://www.dentalshift.ca";
  return /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
}

function websiteLabel(value?: string | null) {
  return normalizeWebsite(value).replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function DentalJobsDynamicFooter() {
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [contact, setContact] = useState<ContactSettings | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const now = new Date().toISOString();
      const [{ data: listingData }, { data: contactData }] = await Promise.all([
        supabase
          .from("job_listings")
          .select("listing_type,city,province")
          .eq("status", "active")
          .gt("expires_at", now),
        supabase
          .from("dentalshift_contact_settings")
          .select("company_name,support_email,phone,website,address_line1,address_line2,city,province,postal_code,country")
          .eq("id", true)
          .maybeSingle(),
      ]);

      if (!alive) return;
      setListings((listingData || []) as ListingRow[]);
      setContact((contactData || null) as ContactSettings | null);
    };

    void load();

    const channel = supabase
      .channel("dentaljobs-footer-listings")
      .on("postgres_changes", { event: "*", schema: "public", table: "job_listings" }, () => void load())
      .subscribe();

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const provinces = useMemo<ProvinceCount[]>(() => {
    const grouped = new Map<string, Map<string, CityCount>>();

    for (const row of listings) {
      const province = clean(row.province).toUpperCase();
      const city = clean(row.city);
      if (!province || !city) continue;

      if (!grouped.has(province)) grouped.set(province, new Map());
      const cities = grouped.get(province)!;
      const current = cities.get(city) || { city, count: 0, office: 0, professional: 0 };
      current.count += 1;
      if (row.listing_type === "office_hiring") current.office += 1;
      else current.professional += 1;
      cities.set(city, current);
    }

    return Array.from(grouped.entries())
      .map(([province, cities]) => {
        const orderedCities = Array.from(cities.values()).sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
        return {
          province,
          label: provinceNames[province] || province,
          total: orderedCities.reduce((sum, city) => sum + city.count, 0),
          cities: orderedCities,
        };
      })
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
  }, [listings]);

  const totalAds = listings.length;
  const officeAds = listings.filter((item) => item.listing_type === "office_hiring").length;
  const availabilityAds = totalAds - officeAds;
  const totalCities = provinces.reduce((sum, province) => sum + province.cities.length, 0);

  const email = clean(contact?.support_email) || "support@dentalshift.ca";
  const phone = clean(contact?.phone);
  const website = normalizeWebsite(contact?.website);
  const address = [
    clean(contact?.address_line1),
    clean(contact?.address_line2),
    [clean(contact?.city), clean(contact?.province), clean(contact?.postal_code)].filter(Boolean).join(" "),
    clean(contact?.country) || "Canada",
  ].filter(Boolean);

  return (
    <footer className="mt-10 overflow-hidden bg-[#001c3f] text-white">
      <div className="border-t-4 border-[#01A32E]" />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_2fr] lg:gap-12">
          <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/10 sm:p-7">
            <div className="inline-flex rounded-2xl bg-white p-3 shadow-lg">
              <Image src="/dentalshift-logo.svg" alt="DentalShift" width={230} height={78} className="h-auto w-[200px]" />
            </div>

            <h2 className="mt-6 text-2xl font-black tracking-tight">Dental opportunities across Canada</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
              Explore active office postings and professional availability ads by province and city.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/[0.07] p-3 text-center">
                <p className="text-2xl font-black text-[#9be3ad]">{totalAds}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-300">Active ads</p>
              </div>
              <div className="rounded-2xl bg-white/[0.07] p-3 text-center">
                <p className="text-2xl font-black text-[#9be3ad]">{provinces.length}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-300">Provinces</p>
              </div>
              <div className="rounded-2xl bg-white/[0.07] p-3 text-center">
                <p className="text-2xl font-black text-[#9be3ad]">{totalCities}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-300">Cities</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-xs font-black">
              <span className="rounded-full bg-[#eaf8ee] px-3 py-1.5 text-[#017f27]">{officeAds} office posting{officeAds === 1 ? "" : "s"}</span>
              <span className="rounded-full bg-[#eef4ff] px-3 py-1.5 text-[#245FB8]">{availabilityAds} availability ad{availabilityAds === 1 ? "" : "s"}</span>
            </div>

            <div className="mt-7 space-y-3 text-sm text-slate-200">
              <a href={`mailto:${email}`} className="flex items-center gap-3 transition hover:text-[#9be3ad]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10"><Mail size={16} /></span>
                <span className="font-bold">{email}</span>
              </a>
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-3 transition hover:text-[#9be3ad]">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10"><Phone size={16} /></span>
                  <span className="font-bold">{phone}</span>
                </a>
              )}
              <a href={website} target="_blank" rel="noreferrer" className="flex items-center gap-3 transition hover:text-[#9be3ad]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10"><Globe2 size={16} /></span>
                <span className="font-bold">{websiteLabel(contact?.website)}</span>
              </a>
              {address.length > 0 && (
                <div className="flex items-start gap-3 text-slate-300">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10"><MapPin size={16} /></span>
                  <span className="pt-2 font-semibold leading-5">{address.join(", ")}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9be3ad]">DentalJobs by location</p>
                <h2 className="mt-1 text-2xl font-black">Active markets</h2>
              </div>
              <p className="text-xs font-semibold text-slate-400">Most active provinces appear first</p>
            </div>

            {provinces.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-white/[0.035] p-6 text-sm font-semibold text-slate-400">
                Active DentalJobs markets will appear here as ads are published.
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {provinces.map((province, index) => (
                  <section key={province.province} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition hover:bg-white/[0.07]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{province.province}</p>
                        <h3 className="truncate text-base font-black text-white">{province.label}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {index === 0 && provinces.length > 1 && (
                          <span className="rounded-full bg-[#01A32E] px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-white">Most active</span>
                        )}
                        <span className="grid min-w-9 place-items-center rounded-full bg-white/10 px-2.5 py-1.5 text-xs font-black text-[#9be3ad]">{province.total}</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {province.cities.map((city) => (
                        <div key={`${province.province}-${city.city}`} className="group flex items-center justify-between gap-3 rounded-xl bg-black/10 px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-100">{city.city}</p>
                            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                              {city.office} office · {city.professional} availability
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-[#01A32E] px-2.5 py-1 text-xs font-black text-white">{city.count}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs font-semibold text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DentalShift. Canadian dental staffing and career marketplace.</p>
          <p>City counts reflect currently active, non-expired DentalJobs ads.</p>
        </div>
      </div>
    </footer>
  );
}
