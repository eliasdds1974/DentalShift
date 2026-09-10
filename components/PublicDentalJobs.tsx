import Image from "next/image";
import Link from "next/link";
import { BriefcaseBusiness, MapPin, Search, ShieldCheck, UserRound } from "lucide-react";
import { citySlug, payLabel, type PublicJobListing } from "@/lib/public-dentaljobs";

const themes: Record<string, { accent: string; pale: string; text: string }> = {
  "Registered Dental Hygienist": { accent: "#4285F4", pale: "#EEF4FF", text: "#245FB8" },
  "Certified Dental Assistant": { accent: "#EA4335", pale: "#FFF0EE", text: "#B52C22" },
  "Dental Administrator": { accent: "#FBBC05", pale: "#FFF8DF", text: "#805F00" },
  "Sterilization Technician": { accent: "#34A853", pale: "#ECF8EF", text: "#247A3B" },
  "Associate Dentist": { accent: "#7C3AED", pale: "#F4EEFF", text: "#5B21B6" },
};

function themeFor(profession: string) {
  return themes[profession] ?? { accent: "#01A32E", pale: "#EAF8EE", text: "#017F27" };
}

function uniqueCities(listings: PublicJobListing[]) {
  const map = new Map<string, { city: string; province: string; count: number }>();
  for (const listing of listings) {
    const slug = citySlug(listing.city);
    const current = map.get(slug);
    if (current) current.count += 1;
    else map.set(slug, { city: listing.city, province: listing.province, count: 1 });
  }
  return [...map.entries()].sort((a, b) => b[1].count - a[1].count || a[1].city.localeCompare(b[1].city));
}

export function PublicDentalJobs({ listings, title = "DentalJobs by DentalShift", intro = "Browse current dental opportunities and professionals looking for offices across Canada." }: { listings: PublicJobListing[]; title?: string; intro?: string }) {
  const cities = uniqueCities(listings);

  return <main className="min-h-screen bg-[#f5f8fb] text-slate-900">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" aria-label="DentalShift home"><Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="h-12 w-auto sm:h-14" priority /></Link>
        <div className="flex items-center gap-2">
          <Link href="/?signin=1" className="rounded-xl border-2 border-[#002757] bg-white px-3 py-2 text-sm font-black text-[#002757] sm:px-4">Sign in</Link>
          <Link href="/?signin=1" className="rounded-xl bg-[#01A32E] px-3 py-2 text-sm font-black text-white sm:px-4">Post a Listing</Link>
        </div>
      </div>
    </header>

    <section className="border-b border-[#dfe8f2] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-12">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#01A32E]">Public Dental Marketplace</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#002757] sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">{intro}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/?signin=1" className="rounded-xl bg-[#002757] px-5 py-3 font-black text-white">Post a Position</Link>
          <Link href="/?signin=1" className="rounded-xl border-2 border-[#4285F4] bg-white px-5 py-3 font-black text-[#245FB8]">Looking for an Office</Link>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
      {cities.length > 0 && <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2 text-[#002757]"><MapPin size={18}/><h2 className="text-lg font-black">Browse by city</h2></div>
        <div className="mt-4 flex flex-wrap gap-2">
          {cities.map(([slug, city]) => <Link key={slug} href={`/jobs/${slug}`} className="rounded-full bg-[#edf3fa] px-3.5 py-2 text-sm font-black text-[#002757] hover:bg-[#dfeaf6]">{city.city}, {city.province} <span className="text-slate-400">({city.count})</span></Link>)}
        </div>
      </div>}

      <div className="mb-5 flex items-end justify-between gap-4">
        <div><h2 className="text-2xl font-black text-[#002757]">Current listings</h2><p className="mt-1 text-sm font-semibold text-slate-500">{listings.length} active {listings.length === 1 ? "listing" : "listings"}</p></div>
        <div className="hidden items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-500 shadow-sm sm:flex"><Search size={16}/> Publicly browseable</div>
      </div>

      {listings.length === 0 ? <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm"><BriefcaseBusiness className="mx-auto text-slate-300" size={38}/><h3 className="mt-4 text-xl font-black text-[#002757]">No active listings yet</h3><p className="mt-2 text-sm text-slate-500">New DentalJobs listings will appear here automatically.</p></div> : <div className="grid gap-4 md:grid-cols-2">
        {listings.map((listing) => {
          const professional = listing.listing_type === "professional_available";
          const theme = themeFor(listing.profession);
          return <article key={listing.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="h-1.5" style={{ backgroundColor: theme.accent }} />
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white" style={{ backgroundColor: professional ? theme.accent : "#002757" }}>{professional ? <UserRound size={21}/> : <BriefcaseBusiness size={21}/>}</div>
                <div className="min-w-0"><p className="text-[11px] font-black uppercase tracking-[0.12em]" style={{ color: theme.text }}>{professional ? "Professional seeking an office" : "Dental office hiring"}</p><h3 className="mt-1 text-xl font-black leading-tight text-[#002757]">{professional ? `${listing.profession} Available` : `${listing.profession} Wanted`}</h3></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2"><Link href={`/jobs/${citySlug(listing.city)}`} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600"><MapPin size={13}/>{listing.city}, {listing.province}</Link><span className="rounded-lg px-2.5 py-1.5 text-xs font-black" style={{ backgroundColor: theme.pale, color: theme.text }}>{listing.employment_type}</span><span className="rounded-lg bg-[#fff7df] px-2.5 py-1.5 text-xs font-black text-[#805F00]">{payLabel(listing)}</span></div>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{listing.description}</p>
              <div className="mt-5 flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400"><ShieldCheck size={14}/> Privacy protected</span><Link href={`/jobs/${listing.id}`} className="rounded-xl bg-[#002757] px-4 py-2.5 text-sm font-black text-white">View Listing</Link></div>
            </div>
          </article>;
        })}
      </div>}
    </section>
  </main>;
}
