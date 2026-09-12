import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BriefcaseBusiness, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { PublicDentalJobs } from "@/components/PublicDentalJobs";
import { getActivePublicJob, getJobsForCity, payLabel } from "@/lib/public-dentaljobs";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dentalshift.ca";
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = await getActivePublicJob(id);

  if (listing) {
    const professional = listing.listing_type === "professional_available";
    const title = professional ? `${listing.profession} Available in ${listing.city} | DentalShift` : `${listing.profession} Job in ${listing.city} | DentalShift`;
    const description = professional
      ? `${listing.profession} available in ${listing.city}, ${listing.province}. View this privacy-protected DentalJobs listing on DentalShift.`
      : `${listing.profession} opportunity in ${listing.city}, ${listing.province}. View this DentalJobs position on DentalShift.`;
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

  const city = await getJobsForCity(id);
  if (!city) return { title: "DentalJobs | DentalShift" };
  const title = `Dental Jobs in ${city.city}, ${city.province} | DentalShift`;
  const description = `Browse current dental jobs and dental professionals looking for offices in ${city.city}, ${city.province}. Updated automatically from active DentalShift listings.`;
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/jobs/${id}` },
    openGraph: { title, description, url: `${siteUrl}/jobs/${id}`, siteName: "DentalShift", type: "website" },
  };
}

export default async function DentalJobsSlugPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ returnTo?: string }> }) {
  const { id } = await params;
  const { returnTo } = await searchParams;
  const backHref = returnTo === "/dental-jobs" ? "/dental-jobs" : "/jobs";
  const backLabel = returnTo === "/dental-jobs" ? "Back to DentalJobs" : "Browse DentalJobs";
  const listing = await getActivePublicJob(id);

  if (!listing) {
    const city = await getJobsForCity(id);
    if (!city) notFound();
    return <PublicDentalJobs
      listings={city.listings}
      title={`Dental Jobs in ${city.city}, ${city.province}`}
      intro={`Browse active dental positions and dental professionals looking for offices in ${city.city}. New local listings appear here automatically when they are posted on DentalShift.`}
    />;
  }

  const professional = listing.listing_type === "professional_available";
  const heading = professional ? `${listing.profession} Available` : `${listing.profession} Wanted`;
  const actionLabel = professional ? "I'm Interested" : "Apply to this Position";

  return <main className="min-h-screen bg-[#f5f8fb] text-slate-900">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-7">
        <Link href="/jobs" aria-label="DentalJobs by DentalShift"><Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="h-14 w-auto sm:h-16" priority /></Link>
        <div className="flex gap-2"><Link href={backHref} className="rounded-xl border-2 border-[#002757] bg-white px-4 py-2.5 text-sm font-black text-[#002757]">{backLabel}</Link><Link href="/?signin=1" className="rounded-xl bg-[#002757] px-4 py-2.5 text-sm font-black text-white">Sign in</Link></div>
      </div>
    </header>

    <section className="mx-auto max-w-5xl px-5 py-10 sm:px-7 sm:py-14">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border-2 border-[#002757]/10 bg-white shadow-xl">
        <div className={`h-2 ${professional ? "bg-[#4285F4]" : "bg-[#01A32E]"}`} />
        <div className="p-6 sm:p-9">
          <div className="flex items-start gap-4">
            <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white ${professional ? "bg-[#4285F4]" : "bg-[#002757]"}`}>{professional ? <UserRound size={26}/> : <BriefcaseBusiness size={26}/>}</div>
            <div><p className={`text-xs font-black uppercase tracking-[0.13em] ${professional ? "text-[#245FB8]" : "text-[#017f27]"}`}>{professional ? "Professional seeking an office" : "Dental office hiring"}</p><h1 className="mt-2 text-3xl font-black tracking-tight text-[#002757] sm:text-4xl">{heading}</h1></div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={`/jobs/${listing.city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700"><MapPin size={15}/>{listing.city}, {listing.province}</Link>
            <span className="rounded-xl bg-[#edf3fa] px-3 py-2 text-sm font-black text-[#002757]">{listing.employment_type}</span>
            {listing.days_per_week && <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">{listing.days_per_week}</span>}
            <span className="rounded-xl bg-[#fff7df] px-3 py-2 text-sm font-black text-[#805F00]">{payLabel(listing)}</span>
          </div>

          {listing.schedule && <div className="mt-6 rounded-2xl bg-[#f8fafc] p-4"><p className="text-xs font-black uppercase tracking-wide text-slate-400">Schedule</p><p className="mt-1 text-sm font-bold leading-6 text-slate-700">{listing.schedule}</p></div>}
          <p className="mt-6 whitespace-pre-wrap text-base leading-7 text-slate-600">{listing.description}</p>

          <div className="mt-7 rounded-2xl border border-[#01A32E]/20 bg-[#f4fbf6] p-4"><div className="flex items-center gap-2 font-black text-[#017f27]"><ShieldCheck size={18}/> Privacy protected by DentalShift</div><p className="mt-1 text-sm leading-6 text-slate-600">Public visitors can browse this listing without an account. Signing in is required before applying, expressing interest, messaging, posting or unlocking private candidate details.</p></div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2"><Link href="/?signin=1" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#01A32E] px-5 py-3 text-center font-black text-white shadow-sm">{actionLabel}</Link><Link href={backHref} className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-[#002757] bg-white px-5 py-3 text-center font-black text-[#002757]">{backLabel}</Link></div>
        </div>
      </div>
      <p className="mx-auto mt-5 max-w-3xl text-center text-xs font-semibold text-slate-400">DentalJobs by DentalShift · Canadian dental staffing and employment</p>
    </section>
  </main>;
}
