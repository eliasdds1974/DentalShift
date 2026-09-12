"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { BriefcaseBusiness, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { citySlug, payLabel, type PublicJobListing } from "@/lib/public-dentaljobs";

const publicSupabase = createClient(
  "https://pvugjtlmtlyfzyvvhcik.supabase.co",
  "sb_publishable_cl7HUUywEucu1DsSbuaodA_oKo8qNFJ",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

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

// Keep these colours aligned with the DentalShift professional calendar.
const professionalThemes: Record<string, { accent: string; pale: string; text: string }> = {
  "Registered Dental Hygienist": { accent: "#4285F4", pale: "#EEF4FF", text: "#245FB8" },
  "Certified Dental Assistant": { accent: "#EA4335", pale: "#FFF0EE", text: "#B52C22" },
  "Dental Administrator": { accent: "#FBBC05", pale: "#FFF8DF", text: "#805F00" },
  "Sterilization Technician": { accent: "#34A853", pale: "#ECF8EF", text: "#247A3B" },
  "Associate Dentist": { accent: "#7C3AED", pale: "#F4EEFF", text: "#5B21B6" },
};

function themeFor(profession: string) {
  return professionalThemes[profession] ?? { accent: "#01A32E", pale: "#EAF8EE", text: "#017F27" };
}

type CityGroup = {
  city: string;
  office: PublicJobListing[];
  professional: PublicJobListing[];
};

type ProvinceGroup = {
  province: string;
  label: string;
  total: number;
  cities: CityGroup[];
};

function groupListings(listings: PublicJobListing[]): ProvinceGroup[] {
  const provinceMap = new Map<string, Map<string, CityGroup>>();

  for (const listing of listings) {
    const province = String(listing.province || "").trim().toUpperCase();
    const city = String(listing.city || "").trim();
    if (!province || !city) continue;

    if (!provinceMap.has(province)) provinceMap.set(province, new Map());
    const cityMap = provinceMap.get(province)!;

    if (!cityMap.has(city)) {
      cityMap.set(city, { city, office: [], professional: [] });
    }

    const group = cityMap.get(city)!;
    if (listing.listing_type === "office_hiring") group.office.push(listing);
    if (listing.listing_type === "professional_available") group.professional.push(listing);
  }

  return Array.from(provinceMap.entries())
    .map(([province, cityMap]) => {
      const cities = Array.from(cityMap.values()).sort((a, b) => {
        const aTotal = a.office.length + a.professional.length;
        const bTotal = b.office.length + b.professional.length;
        return bTotal - aTotal || a.city.localeCompare(b.city);
      });

      return {
        province,
        label: provinceNames[province] || province,
        total: cities.reduce((sum, city) => sum + city.office.length + city.professional.length, 0),
        cities,
      };
    })
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

function ListingCard({ listing }: { listing: PublicJobListing }) {
  const professional = listing.listing_type === "professional_available";
  const theme = themeFor(listing.profession);
  const accent = professional ? theme.accent : "#002757";
  const pale = professional ? theme.pale : "#EDF3FA";
  const text = professional ? theme.text : "#002757";

  return (
    <article className="flex min-h-[315px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="h-1.5" style={{ backgroundColor: accent }} />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ backgroundColor: accent }}>
            {professional ? <UserRound size={20} /> : <BriefcaseBusiness size={20} />}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: text }}>
              {professional ? "Professional looking for an office" : "Dental office hiring"}
            </p>
            <h4 className="mt-1 text-base font-black leading-5 text-[#002757]">
              {professional ? `${listing.profession} Available` : listing.profession}
            </h4>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600">
            {listing.employment_type}
          </span>
          <span className="rounded-lg px-2.5 py-1.5 text-[11px] font-black" style={{ backgroundColor: pale, color: text }}>
            {payLabel(listing)}
          </span>
        </div>

        <p className="mt-3 line-clamp-4 text-xs leading-5 text-slate-600">{listing.description}</p>

        <div className="mt-auto pt-4">
          <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <ShieldCheck size={13} /> Privacy protected
          </div>
          <Link
            href={`/jobs/${listing.id}`}
            className="block w-full rounded-xl px-3 py-2.5 text-center text-xs font-black text-white transition hover:brightness-95"
            style={{ backgroundColor: accent }}
          >
            View Listing
          </Link>
        </div>
      </div>
    </article>
  );
}

export function PublicDentalJobs({
  listings,
  title = "DentalJobs Marketplace",
  intro = "Browse dental office hiring opportunities and dental professionals looking for offices across Canada.",
}: {
  listings: PublicJobListing[];
  title?: string;
  intro?: string;
}) {
  const [liveListings, setLiveListings] = useState<PublicJobListing[]>(listings);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let alive = true;

    const loadListings = async () => {
      const { data, error } = await publicSupabase
        .from("job_listings")
        .select("id,listing_type,profession,employment_type,city,province,days_per_week,pay_min,pay_max,schedule,description,status,expires_at,created_at")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .in("listing_type", ["office_hiring", "professional_available"])
        .order("created_at", { ascending: false });

      if (!alive) return;
      if (error) {
        setLoadError(error.message || "Unable to load DentalJobs listings.");
        return;
      }

      setLoadError("");
      setLiveListings((data || []) as PublicJobListing[]);
    };

    void loadListings();

    const channel = publicSupabase
      .channel("public-dentaljobs-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "job_listings" }, () => void loadListings())
      .subscribe();

    return () => {
      alive = false;
      void publicSupabase.removeChannel(channel);
    };
  }, []);

  const provinces = useMemo(() => groupListings(liveListings), [liveListings]);

  return (
    <main className="min-h-screen bg-[#f5f8fb] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="DentalShift home">
            <Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="h-12 w-auto sm:h-14" priority />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/?signin=1" className="rounded-xl border-2 border-[#002757] bg-white px-3 py-2 text-sm font-black text-[#002757] sm:px-4">Sign in</Link>
            <Link href="/?signin=1" className="rounded-xl bg-[#01A32E] px-3 py-2 text-sm font-black text-white sm:px-4">Post a Listing</Link>
          </div>
        </div>
      </header>

      <section className="border-b border-[#dfe8f2] bg-white">
        <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#01A32E]">Public Dental Marketplace</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#002757] sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{intro}</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        {loadError && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            DentalJobs could not refresh the public listings: {loadError}
          </div>
        )}

        {provinces.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <BriefcaseBusiness className="mx-auto text-slate-300" size={38} />
            <h3 className="mt-4 text-xl font-black text-[#002757]">No active listings yet</h3>
            <p className="mt-2 text-sm text-slate-500">New DentalJobs listings will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {provinces.map((province) => (
              <section key={province.province}>
                <div className="mb-5 flex items-end justify-between gap-4 border-b-2 border-[#002757] pb-3">
                  <h2 className="text-2xl font-black text-[#002757] sm:text-3xl">{province.label}</h2>
                  <span className="rounded-full bg-[#002757] px-3 py-1.5 text-xs font-black text-white">{province.total} active</span>
                </div>

                <div className="space-y-8">
                  {province.cities.map((city) => {
                    const cityTotal = city.office.length + city.professional.length;
                    return (
                      <section key={`${province.province}-${city.city}`} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                          <div className="flex items-center gap-2">
                            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf3fa] text-[#002757]"><MapPin size={17} /></span>
                            <div>
                              <h3 className="text-xl font-black text-[#002757]">{city.city}</h3>
                              <p className="text-xs font-semibold text-slate-500">{cityTotal} active listing{cityTotal === 1 ? "" : "s"}</p>
                            </div>
                          </div>
                          <Link href={`/jobs/${citySlug(city.city)}`} className="text-xs font-black text-[#4285F4] hover:underline">View {city.city}</Link>
                        </div>

                        {city.office.length > 0 && (
                          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {city.office.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
                          </div>
                        )}

                        {city.professional.length > 0 && (
                          <div className={`${city.office.length > 0 ? "mt-5" : "mt-5"} grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}>
                            {city.professional.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
