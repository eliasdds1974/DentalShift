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
      const current = cities.get(city) || { city, count: 0 };
      current.count += 1;
      cities.set(city, current);
    }

    return Array.from(grouped.entries())
      .map(([province, cities]) => {
        const orderedCities = Array.from(cities.values()).sort(
          (a, b) => b.count - a.count || a.city.localeCompare(b.city)
        );
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
    <footer className="mt-8 overflow-hidden bg-[#001c3f] text-white">
      <div className="h-[3px] bg-[#01A32E]" />

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="shrink-0 rounded-xl bg-white px-3 py-2">
              <Image
                src="/dentalshift-logo.svg"
                alt="DentalShift"
                width={230}
                height={78}
                className="h-auto w-[145px] sm:w-[160px]"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-white">Dental opportunities across Canada</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {totalAds} active ad{totalAds === 1 ? "" : "s"} · {provinces.length} province{provinces.length === 1 ? "" : "s"} · {totalCities} cit{totalCities === 1 ? "y" : "ies"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-slate-300">
            <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 transition hover:text-[#9be3ad]">
              <Mail size={14} /> {email}
            </a>
            {phone && (
              <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 transition hover:text-[#9be3ad]">
                <Phone size={14} /> {phone}
              </a>
            )}
            <a href={website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 transition hover:text-[#9be3ad]">
              <Globe2 size={14} /> {websiteLabel(contact?.website)}
            </a>
            {address.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <MapPin size={14} /> {address.join(", ")}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9be3ad]">Active DentalJobs markets</p>
            <p className="text-[10px] font-semibold text-slate-500">Province → city</p>
          </div>

          {provinces.length === 0 ? (
            <p className="text-xs font-semibold text-slate-500">Active markets will appear here as listings are published.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {provinces.map((province) => (
                <div key={province.province} className="rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-xs font-black text-white">{province.label}</p>
                    <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black text-[#9be3ad]">{province.total}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {province.cities.map((city) => (
                      <span
                        key={`${province.province}-${city.city}`}
                        className="rounded-md bg-black/15 px-2 py-1 text-[10px] font-bold text-slate-300"
                      >
                        {city.city} <span className="text-[#9be3ad]">{city.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-1 border-t border-white/10 pt-3 text-[10px] font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} DentalShift. Canadian dental staffing and career marketplace.</p>
          <p>Counts reflect active, non-expired DentalJobs ads.</p>
        </div>
      </div>
    </footer>
  );
}
