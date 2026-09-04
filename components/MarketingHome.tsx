"use client";

import { ArrowRight, BadgeCheck, BellRing, BriefcaseBusiness, CalendarCheck2, Check, Clock3, HeartHandshake, MapPin, Menu, Search, ShieldCheck, Sparkles, Star, UserCheck, X } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

type Audience = "office" | "professional";

function MarketingBrand() {
  return <Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="h-14 w-auto sm:h-16 lg:h-20" priority />;
}

function CheckLine({ children }: { children: React.ReactNode }) {
  return <li className="flex items-start gap-2.5"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#e5f7ea] text-[#01A32E]"><Check size={13} strokeWidth={3} /></span><span>{children}</span></li>;
}

export function MarketingHome({ onSignIn, onGetStarted, onAdmin = onSignIn, onWorkspace = onSignIn, signedIn = false }: { onSignIn: () => void; onGetStarted: (audience: Audience) => void; onAdmin?: () => void; onWorkspace?: () => void; signedIn?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [audience, setAudience] = useState<Audience>("office");

  const start = (nextAudience: Audience) => {
    setAudience(nextAudience);
    onGetStarted(nextAudience);
  };

  return <div className="min-h-screen overflow-hidden bg-white text-slate-900">
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:h-[88px] sm:px-8 lg:h-[104px]">
        <MarketingBrand />
        <nav className="hidden items-center gap-8 text-sm font-bold text-slate-600 lg:flex">
          <a href="#how-it-works" className="transition hover:text-[#002757]">How it works</a>
          <a href="#why-dentalshift" className="transition hover:text-[#002757]">Why DentalShift</a>
          <a href="#trust" className="transition hover:text-[#002757]">Trust & safety</a>
        </nav>
        <div className="hidden items-center gap-3 sm:flex">
          <button onClick={onAdmin} className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs font-extrabold text-amber-800 hover:bg-amber-100">Temporary admin</button>
          <button onClick={signedIn ? onWorkspace : onSignIn} className="rounded-xl px-4 py-2.5 text-sm font-extrabold text-[#002757] hover:bg-[#edf3fa]">{signedIn ? "Open workspace" : "Sign in"}</button>
          <button onClick={() => start("office")} className="inline-flex items-center gap-2 rounded-xl bg-[#002757] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#003d80]">Get started <ArrowRight size={16} /></button>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation" className="rounded-xl border border-slate-200 p-2.5 text-[#002757] sm:hidden">{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
      </div>
      {menuOpen && <div className="border-t border-slate-100 bg-white px-5 py-5 sm:hidden">
        <div className="grid gap-2">
          <a onClick={() => setMenuOpen(false)} href="#how-it-works" className="rounded-xl px-3 py-3 font-bold text-slate-700">How it works</a>
          <a onClick={() => setMenuOpen(false)} href="#why-dentalshift" className="rounded-xl px-3 py-3 font-bold text-slate-700">Why DentalShift</a>
          <button onClick={onAdmin} className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-left font-extrabold text-amber-800">Temporary admin</button>
          <button onClick={signedIn ? onWorkspace : onSignIn} className="rounded-xl border border-[#002757]/15 px-4 py-3 text-left font-extrabold text-[#002757]">{signedIn ? "Open workspace" : "Sign in"}</button>
          <button onClick={() => start("office")} className="rounded-xl bg-[#002757] px-4 py-3 font-extrabold text-white">Get started</button>
        </div>
      </div>}
    </header>

    <main>
      <section className="relative bg-[radial-gradient(circle_at_85%_20%,rgba(0,120,254,.13),transparent_28%),radial-gradient(circle_at_15%_10%,rgba(1,163,46,.10),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#01A32E]/20 bg-[#eaf8ee] px-3 py-1.5 text-xs font-extrabold text-[#017f27]"><Sparkles size={14} /> Dental staffing made simple</div>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.02] tracking-[-0.055em] text-[#002757] sm:text-6xl lg:text-[4.5rem]">Fill dental shifts.<br /><span className="text-[#01A32E]">Work on your terms.</span></h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600 sm:text-xl">DentalShift connects verified dental professionals with clinics that need dependable coverage—without agency phone tag, confusing markups, or endless group posts.</p>
            <div className="mt-8 grid gap-3 sm:flex">
              <button onClick={() => start("office")} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#002757] px-6 py-4 text-base font-black text-white shadow-[0_12px_30px_rgba(0,39,87,.18)] transition hover:-translate-y-0.5 hover:bg-[#003d80]">I need dental staff <ArrowRight size={18} /></button>
              <button onClick={() => start("professional")} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-[#002757]/12 bg-white px-6 py-4 text-base font-black text-[#002757] transition hover:border-[#01A32E] hover:bg-[#f7fcf8]">I want to find shifts <Search size={18} /></button>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-slate-500">
              <span className="flex items-center gap-1.5"><ShieldCheck size={17} className="text-[#01A32E]" /> Verified profiles</span>
              <span className="flex items-center gap-1.5"><Clock3 size={17} className="text-[#0078FE]" /> Fast, direct booking</span>
              <span className="flex items-center gap-1.5"><HeartHandshake size={17} className="text-[#F21C13]" /> Human support</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -left-4 top-12 hidden rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-slate-200 lg:block">
              <p className="flex items-center gap-2 text-sm font-black text-[#002757]"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#eaf8ee] text-[#01A32E]"><Check size={16} /></span> Shift confirmed</p>
              <p className="mt-1 pl-9 text-xs text-slate-500">Coverage secured in minutes</p>
            </div>
            <div className="rounded-[2rem] border border-[#002757]/10 bg-white p-4 shadow-[0_28px_80px_rgba(0,39,87,.16)] sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div><p className="text-xs font-extrabold uppercase tracking-[.13em] text-[#01A32E]">Best match</p><h2 className="mt-1 text-xl font-black text-[#002757]">Friday coverage</h2></div>
                <span className="rounded-full bg-[#edf3fa] px-3 py-1.5 text-xs font-black text-[#002757]">98% match</span>
              </div>
              <div className="mt-4 rounded-2xl bg-[#0078FE] p-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-sm font-extrabold text-blue-100">Registered Dental Hygienist</p><p className="mt-1 text-2xl font-black">Fri, Sept 11</p><p className="mt-1 text-base font-bold">8:00 AM–4:30 PM</p></div>
                  <div className="rounded-xl bg-white/15 px-3 py-2 text-right"><p className="text-xs font-bold text-blue-100">Rate</p><p className="text-lg font-black">$56/hr</p></div>
                </div>
                <p className="mt-4 flex items-center gap-2 border-t border-white/20 pt-4 text-sm font-bold"><MapPin size={16} /> 3.2 km away · Free parking</p>
              </div>
              <div className="mt-4 flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#002757] font-black text-white">MR</div>
                <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><p className="font-black text-[#002757]">Maya R.</p><BadgeCheck size={16} className="text-[#01A32E]" /></div><p className="mt-1 text-sm text-slate-500">Verified RDH · 84 shifts</p></div>
                <p className="flex items-center gap-1 text-sm font-black text-[#002757]"><Star size={16} className="fill-amber-400 text-amber-400" /> 4.9</p>
              </div>
              <button onClick={() => start("office")} className="mt-4 w-full rounded-xl bg-[#002757] px-5 py-3.5 font-black text-white">Review professional</button>
            </div>
            <div className="absolute -bottom-5 -right-2 hidden rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-slate-200 sm:block">
              <p className="flex items-center gap-2 text-sm font-black text-[#002757]"><BellRing size={17} className="text-[#F21C13]" /> New applicant</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-slate-200 sm:grid-cols-4">
          {[
            ["Canada-first", "Built for Canadian dental teams"],
            ["Clear rates", "Know the rate before booking"],
            ["Verified", "Credentials reviewed"],
            ["Protected", "Bookings and records together"],
          ].map(([title, detail]) => <div key={title} className="bg-white px-5 py-6 text-center"><p className="font-black text-[#002757]">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div>)}
        </div>
      </section>

      <section id="why-dentalshift" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-black uppercase tracking-[.14em] text-[#01A32E]">Choose your path</p><h2 className="mt-3 text-4xl font-black tracking-[-.04em] text-[#002757] sm:text-5xl">One platform. Two simpler workdays.</h2><p className="mt-4 text-lg leading-8 text-slate-600">Everything each side needs, with none of the clutter that slows a booking down.</p></div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="group rounded-[2rem] border border-[#002757]/10 bg-[#f7faff] p-7 transition hover:-translate-y-1 hover:shadow-xl sm:p-9">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#002757] text-white"><BriefcaseBusiness size={26} /></div>
            <p className="mt-6 text-sm font-black uppercase tracking-[.12em] text-[#0078FE]">For dental clinics</p>
            <h3 className="mt-2 text-3xl font-black tracking-[-.03em] text-[#002757]">Cover a shift without the scramble.</h3>
            <ul className="mt-6 space-y-3 text-base font-semibold text-slate-600"><CheckLine>Post one or several dates in minutes</CheckLine><CheckLine>See verified applicants and clear rates</CheckLine><CheckLine>Rebook favourites and keep history organized</CheckLine><CheckLine>Message safely without exposing contact details early</CheckLine></ul>
            <button onClick={() => start("office")} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#002757] px-5 py-3.5 font-black text-white">Post a shift <ArrowRight size={17} /></button>
          </article>
          <article className="group rounded-[2rem] border border-[#01A32E]/15 bg-[#f7fcf8] p-7 transition hover:-translate-y-1 hover:shadow-xl sm:p-9">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#01A32E] text-white"><UserCheck size={26} /></div>
            <p className="mt-6 text-sm font-black uppercase tracking-[.12em] text-[#017f27]">For dental professionals</p>
            <h3 className="mt-2 text-3xl font-black tracking-[-.03em] text-[#002757]">Choose shifts that fit your life.</h3>
            <ul className="mt-6 space-y-3 text-base font-semibold text-slate-600"><CheckLine>Post your availability from any device</CheckLine><CheckLine>Browse matching shifts with rates upfront</CheckLine><CheckLine>Track applications and confirmed bookings</CheckLine><CheckLine>Build a trusted, verified work history</CheckLine></ul>
            <button onClick={() => start("professional")} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#002757] px-5 py-3.5 font-black text-white">Find shifts <ArrowRight size={17} /></button>
          </article>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#002757] py-20 text-white sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div><p className="text-sm font-black uppercase tracking-[.14em] text-[#66df89]">How it works</p><h2 className="mt-3 max-w-2xl text-4xl font-black tracking-[-.04em] sm:text-5xl">From staffing gap to confirmed shift.</h2></div>
            <div className="inline-flex self-start rounded-2xl bg-white/10 p-1">
              <button onClick={() => setAudience("office")} className={"rounded-xl px-4 py-2.5 text-sm font-black " + (audience === "office" ? "bg-white text-[#002757]" : "text-white")}>Clinics</button>
              <button onClick={() => setAudience("professional")} className={"rounded-xl px-4 py-2.5 text-sm font-black " + (audience === "professional" ? "bg-white text-[#002757]" : "text-white")}>Professionals</button>
            </div>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {(audience === "office" ? [
              [CalendarCheck2, "Post the shift", "Add the role, date, hours, rate and helpful practice details."],
              [UserCheck, "Review matches", "Compare verified applicants, experience, ratings and availability."],
              [BadgeCheck, "Confirm coverage", "Book your preferred professional and keep every detail together."],
            ] : [
              [CalendarCheck2, "Set availability", "Choose the dates and hours you are ready to work."],
              [Search, "Find your match", "See relevant nearby shifts with rate and clinic details upfront."],
              [BadgeCheck, "Apply and confirm", "Track your application, booking, reminders and work history."],
            ]).map(([Icon, title, detail], index) => {
              const StepIcon = Icon as typeof CalendarCheck2;
              return <article key={title as string} className="rounded-3xl border border-white/10 bg-white/[.07] p-6 sm:p-7"><p className="text-sm font-black text-[#66df89]">0{index + 1}</p><div className="mt-5 grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#002757]"><StepIcon size={23} /></div><h3 className="mt-5 text-xl font-black">{title as string}</h3><p className="mt-2 leading-7 text-blue-100">{detail as string}</p></article>;
            })}
          </div>
        </div>
      </section>

      <section id="trust" className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
        <div><div className="grid h-16 w-16 place-items-center rounded-3xl bg-[#eaf8ee] text-[#01A32E]"><ShieldCheck size={32} /></div><p className="mt-6 text-sm font-black uppercase tracking-[.14em] text-[#01A32E]">Trust at every step</p><h2 className="mt-3 text-4xl font-black tracking-[-.04em] text-[#002757] sm:text-5xl">Confidence before contact.</h2><p className="mt-5 text-lg leading-8 text-slate-600">DentalShift is designed to reduce uncertainty before a shift is confirmed—not simply exchange phone numbers.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            [BadgeCheck, "Credential review", "Professional submissions enter a verification workflow before earning verified status."],
            [MapPin, "Accurate matching", "Standardized locations support better distance and availability matching."],
            [ShieldCheck, "Protected messaging", "Contact information stays private until the right stage of the booking."],
            [HeartHandshake, "Accountable history", "Confirmations, attendance records and reviews stay connected to each shift."],
          ].map(([Icon, title, detail]) => {
            const TrustIcon = Icon as typeof BadgeCheck;
            return <article key={title as string} className="rounded-3xl border border-slate-200 p-6"><TrustIcon size={24} className="text-[#0078FE]" /><h3 className="mt-4 text-lg font-black text-[#002757]">{title as string}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{detail as string}</p></article>;
          })}
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[linear-gradient(115deg,#002757_0%,#004b8f_62%,#01A32E_140%)] px-6 py-12 text-center text-white shadow-xl sm:px-10 sm:py-16">
          <h2 className="text-4xl font-black tracking-[-.04em] sm:text-5xl">Ready for a better way to staff?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-blue-100">Create your profile and make the next dental shift easier to fill—or easier to find.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={() => start("office")} className="rounded-xl bg-white px-6 py-4 font-black text-[#002757]">For Dental Clinics</button><button onClick={() => start("professional")} className="rounded-xl border border-white/30 bg-white/10 px-6 py-4 font-black text-white">For Dental Professionals</button></div>
        </div>
      </section>
    </main>

    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div><MarketingBrand /><p className="mt-3 text-sm text-slate-500">Dental staffing made simple across Canada.</p></div>
        <div className="flex flex-wrap gap-5 text-sm font-bold text-slate-500"><a href="#how-it-works">How it works</a><a href="#trust">Trust & safety</a><button onClick={onAdmin} className="text-amber-700">Temporary admin</button><button onClick={onSignIn}>{signedIn ? "My account" : "Sign in"}</button><a href="mailto:support@dentalshift.ca">Support</a></div>
        <p className="text-xs text-slate-400">© 2026 DentalShift. All rights reserved.</p>
      </div>
    </footer>
  </div>;
}
