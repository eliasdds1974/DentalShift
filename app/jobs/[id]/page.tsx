import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { BriefcaseBusiness, MapPin, ShieldCheck, UserRound } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://pvugjtlmtlyfzyvvhcik.supabase.co";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dentalshift.ca";

async function getListing(id: string) {
  const supabase = createClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false } });
  const { data } = await supabase.from("job_listings").select("id,listing_type,profession,employment_type,city,province,days_per_week,pay_min,pay_max,schedule,description,status,expires_at").eq("id", id).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  const profession = listing?.profession || "DentalJobs Opportunity";
  const title = listing?.listing_type === "professional_available" ? `${profession} Available | DentalShift` : `${profession} Wanted | DentalShift`;
  const description = listing ? `${listing.city}, ${listing.province} · ${listing.employment_type}. View this anonymous DentalJobs listing on DentalShift.` : "View this DentalJobs opportunity on DentalShift.";
  const url = `${siteUrl}/jobs/${id}`;
  const image = `${siteUrl}/api/dentaljobs/share-card?id=${encodeURIComponent(id)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "DentalShift", type: "website", images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

function moneyRange(min: number | null, max: number | null) {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `$${Number(min)}–$${Number(max)}/hr`;
  return `${min != null ? `$${Number(min)}+` : `Up to $${Number(max)}`}/hr`;
}

export default async function SharedDentalJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) return <main className="grid min-h-screen place-items-center bg-[#f5f8fb] p-5"><section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl"><Link href="/?signin=1" className="inline-block"><Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="mx-auto h-16 w-auto" priority /></Link><h1 className="mt-6 text-2xl font-black text-[#002757]">This DentalJobs listing is no longer available.</h1><p className="mt-2 text-sm text-slate-500">Explore DentalShift or choose your sign-in to continue.</p><Link href="/?signin=1" className="mt-6 inline-flex rounded-xl bg-[#002757] px-5 py-3 font-black text-white">Choose your sign-in</Link></section></main>;

  const professional = listing.listing_type === "professional_available";
  const heading = professional ? `${listing.profession} Available` : `${listing.profession} Wanted`;
  const pay = moneyRange(listing.pay_min == null ? null : Number(listing.pay_min), listing.pay_max == null ? null : Number(listing.pay_max));

  return <main className="min-h-screen bg-[#f5f8fb] text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-7"><Link href="/?signin=1" aria-label="Open DentalShift sign in"><Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="h-14 w-auto sm:h-16" priority /></Link><Link href="/?signin=1" className="rounded-xl bg-[#002757] px-4 py-2.5 text-sm font-black text-white">Choose your sign-in</Link></div></header>

    <section className="mx-auto max-w-5xl px-5 py-10 sm:px-7 sm:py-14">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border-2 border-[#002757]/10 bg-white shadow-xl">
        <div className={`h-2 ${professional ? "bg-[#4285F4]" : "bg-[#01A32E]"}`} />
        <div className="p-6 sm:p-9">
          <div className="flex items-start gap-4"><div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white ${professional ? "bg-[#4285F4]" : "bg-[#002757]"}`}>{professional ? <UserRound size={26}/> : <BriefcaseBusiness size={26}/>}</div><div><p className={`text-xs font-black uppercase tracking-[0.13em] ${professional ? "text-[#245FB8]" : "text-[#017f27]"}`}>{professional ? "Professional seeking an office" : "Dental office hiring"}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-[#002757] sm:text-4xl">{heading}</h1></div></div>
          <div className="mt-6 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700"><MapPin size={15}/>{listing.city}, {listing.province}</span><span className="rounded-xl bg-[#edf3fa] px-3 py-2 text-sm font-black text-[#002757]">{listing.employment_type}</span>{listing.days_per_week && <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">{listing.days_per_week}</span>}{pay && <span className="rounded-xl bg-[#fff7df] px-3 py-2 text-sm font-black text-[#805F00]">{pay}</span>}</div>
          {listing.schedule && <div className="mt-6 rounded-2xl bg-[#f8fafc] p-4"><p className="text-xs font-black uppercase tracking-wide text-slate-400">Schedule</p><p className="mt-1 text-sm font-bold leading-6 text-slate-700">{listing.schedule}</p></div>}
          <p className="mt-6 whitespace-pre-wrap text-base leading-7 text-slate-600">{listing.description}</p>
          <div className="mt-7 rounded-2xl border border-[#01A32E]/20 bg-[#f4fbf6] p-4"><div className="flex items-center gap-2 font-black text-[#017f27]"><ShieldCheck size={18}/> Privacy protected by DentalShift</div><p className="mt-1 text-sm leading-6 text-slate-600">This shared listing intentionally keeps personal contact information and other identifying details private.</p></div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2"><Link href={`/classifieds?listing=${encodeURIComponent(id)}`} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#01A32E] px-5 py-3 text-center font-black text-white shadow-sm">View on DentalJobs</Link><Link href="/?signin=1" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-[#002757] bg-white px-5 py-3 text-center font-black text-[#002757]">DentalShift sign in</Link></div>
        </div>
      </div>
      <p className="mx-auto mt-5 max-w-3xl text-center text-xs font-semibold text-slate-400">Shared from DentalShift · Canadian dental staffing and DentalJobs</p>
    </section>
  </main>;
}
