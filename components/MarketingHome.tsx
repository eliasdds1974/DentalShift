"use client";

import { ArrowRight, BadgeCheck, BriefcaseBusiness, CalendarCheck2, Check, Clock3, DollarSign, MapPin, Menu, Search, ShieldCheck, UserCheck, X } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { MarketingCalendarPreview } from "./MarketingCalendarPreview";

type Audience = "office" | "professional";

function MarketingBrand() {
  return <Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="h-14 w-auto sm:h-16 lg:h-20" priority />;
}

function CheckLine({ children }: { children: React.ReactNode }) {
  return <li className="flex items-start gap-2.5"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#e5f7ea] text-[#01A32E]"><Check size={13} strokeWidth={3} /></span><span>{children}</span></li>;
}

export function MarketingHome({ onSignIn, onGetStarted, onWorkspace = onSignIn, signedIn = false }: { onSignIn: () => void; onGetStarted: (audience: Audience) => void; onWorkspace?: () => void; signedIn?: boolean }) {
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
        <nav className="hidden items-center gap-7 text-sm font-bold text-slate-600 lg:flex">
          <a href="#how-it-works" className="transition hover:text-[#002757]">How it works</a>
          <a href="#pricing" className="transition hover:text-[#002757]">Why DentalShift</a>
          <a href="/jobs" className="rounded-full bg-[#eaf8ee] px-3 py-1.5 font-black text-[#017f27] transition hover:bg-[#d7f3df]">DentalJobs</a>
        </nav>
        <div className="hidden items-center gap-3 sm:flex">
          {signedIn ? <button onClick={onWorkspace} className="rounded-xl px-4 py-2.5 text-sm font-extrabold text-[#002757] hover:bg-[#edf3fa]">My workspace</button> : <button onClick={onSignIn} className="rounded-xl px-4 py-2.5 text-sm font-extrabold text-[#002757] hover:bg-[#edf3fa]">Sign in</button>}
          <button onClick={() => start("office")} className="inline-flex items-center gap-2 rounded-xl bg-[#002757] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#003d80]">Get started <ArrowRight size={16} /></button>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation" className="rounded-xl border border-slate-200 p-2.5 text-[#002757] sm:hidden">{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
      </div>
      {menuOpen && <div className="border-t border-slate-100 bg-white px-5 py-5 sm:hidden"><div className="grid gap-2">
        <a onClick={() => setMenuOpen(false)} href="#how-it-works" className="rounded-xl px-3 py-3 font-bold text-slate-700">How it works</a>
        <a onClick={() => setMenuOpen(false)} href="#pricing" className="rounded-xl px-3 py-3 font-bold text-slate-700">Why DentalShift</a>
        <a onClick={() => setMenuOpen(false)} href="/jobs" className="rounded-xl bg-[#eaf8ee] px-3 py-3 font-black text-[#017f27]">DentalJobs · Browse permanent opportunities</a>
        <button onClick={signedIn ? onWorkspace : onSignIn} className="rounded-xl border border-[#002757]/15 px-4 py-3 text-left font-extrabold text-[#002757]">{signedIn ? "My workspace" : "Sign in"}</button>
        <button onClick={() => start("office")} className="rounded-xl bg-[#002757] px-4 py-3 font-extrabold text-white">Get started</button>
      </div></div>}
    </header>

    <main>
      <section className="relative bg-[radial-gradient(circle_at_85%_20%,rgba(0,120,254,.13),transparent_28%),radial-gradient(circle_at_15%_10%,rgba(1,163,46,.10),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:py-16">
          <div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.03] tracking-[-0.05em] text-[#002757] sm:text-5xl lg:text-[4rem]">Temporary dental staffing and permanent dental jobs — <span className="text-[#01A32E]">without expensive subscriptions.</span></h1>
            <div className="mt-5 max-w-3xl rounded-2xl border border-[#002757]/10 bg-white/85 p-5 shadow-sm"><p className="text-lg font-black leading-8 text-[#002757]">Either side can make the first move.</p><p className="mt-1 text-base font-medium leading-7 text-slate-600 sm:text-lg">Professionals can apply to shifts, and offices can invite professionals. Once both sides agree, the shift is confirmed.</p></div>
            <div className="mt-5 rounded-2xl border border-[#01A32E]/20 bg-white/90 p-4 shadow-sm"><p className="text-base font-black leading-7 text-[#002757]">No subscription. No monthly fee. Pay only when you use it — <span className="text-[#01A32E]">at a fraction of the cost of traditional staffing.</span></p></div>

            <div className="mt-7 grid gap-3 lg:grid-cols-3">
              <button onClick={() => start("office")} className="group rounded-2xl border-2 border-[#002757]/10 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#002757]/25 hover:shadow-lg"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#002757] text-white"><BriefcaseBusiness size={21}/></div><h2 className="mt-4 text-lg font-black text-[#002757]">I Need Temporary Staff</h2><p className="mt-1 text-sm leading-6 text-slate-500">Post an open shift and connect with available dental professionals.</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-[#002757]">Get started <ArrowRight size={15}/></span></button>
              <button onClick={() => start("professional")} className="group rounded-2xl border-2 border-[#01A32E]/15 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#01A32E]/35 hover:shadow-lg"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#01A32E] text-white"><Search size={21}/></div><h2 className="mt-4 text-lg font-black text-[#002757]">I’m Looking for Shifts</h2><p className="mt-1 text-sm leading-6 text-slate-500">Choose when you want to work and apply to nearby opportunities.</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-[#017f27]">Find shifts <ArrowRight size={15}/></span></button>
              <a href="/jobs" className="group rounded-2xl border-2 border-[#4285F4]/15 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#4285F4]/35 hover:shadow-lg"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#4285F4] text-white"><CalendarCheck2 size={21}/></div><h2 className="mt-4 text-lg font-black text-[#002757]">DentalJobs</h2><p className="mt-1 text-sm leading-6 text-slate-500">Browse or post permanent dental positions across Canada.</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-[#245FB8]">Browse jobs <ArrowRight size={15}/></span></a>
            </div>
          </div>

          <MarketingCalendarPreview />
        </div>
      </section>

      <section id="how-it-works" className="border-y border-slate-200 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center"><p className="text-sm font-black uppercase tracking-[.14em] text-[#01A32E]">It’s this simple</p><h2 className="mt-2 text-3xl font-black tracking-[-.035em] text-[#002757] sm:text-4xl">A match only happens when it works for both sides.</h2></div>
          <div className="mx-auto mt-6 flex w-fit rounded-2xl bg-slate-100 p-1"><button onClick={()=>setAudience('office')} className={`rounded-xl px-4 py-2 text-sm font-black ${audience==='office'?'bg-white text-[#002757] shadow-sm':'text-slate-500'}`}>For Offices</button><button onClick={()=>setAudience('professional')} className={`rounded-xl px-4 py-2 text-sm font-black ${audience==='professional'?'bg-white text-[#002757] shadow-sm':'text-slate-500'}`}>For Professionals</button></div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {(audience==='office' ? [
              ['1','Post or Invite','Post your shift, then invite professionals who match your needs — or wait for professionals to apply.'],
              ['2','Connect','Review interested professionals and choose the people who fit your office, schedule and role.'],
              ['3','Both Confirm','Either side can make the first move. Once the office and professional both agree, the shift is confirmed.']
            ] : [
              ['1','Set Availability','Choose the days and hours you want to work so offices can see when you are available.'],
              ['2','Apply or Get Invited','Apply to shifts you want — or receive invitations from offices looking for someone like you.'],
              ['3','Both Confirm','Once you and the office both agree, the shift is confirmed and everything stays organized in DentalShift.']
            ]).map(([step,title,detail])=><article key={step} className="rounded-2xl border border-slate-200 bg-[#f8fbff] p-5"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#002757] text-sm font-black text-white">{step}</div><h3 className="mt-4 text-xl font-black text-[#002757]">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p></article>)}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-[#002757] py-14 text-white sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-[#79e797]"><DollarSign size={14}/> Simple pay-as-you-go pricing</div><h2 className="mt-4 text-3xl font-black tracking-[-.035em] sm:text-4xl">Dental staffing shouldn’t come with expensive commitments.</h2><p className="mt-4 text-base leading-7 text-blue-100">Use DentalShift once or use it every week. You only pay when you actually use the service.</p></div>
          <div className="grid gap-4 sm:grid-cols-2"><article className="rounded-2xl bg-white/8 p-5 ring-1 ring-white/10"><p className="text-sm font-black uppercase tracking-[.12em] text-blue-200">Traditional staffing</p><ul className="mt-4 space-y-3 text-sm text-blue-100"><CheckLine>Agency markups</CheckLine><CheckLine>Subscription fees</CheckLine><CheckLine>Monthly commitments</CheckLine><CheckLine>Higher ongoing staffing costs</CheckLine></ul></article><article className="rounded-2xl bg-white p-5 text-slate-900 shadow-xl"><p className="text-sm font-black uppercase tracking-[.12em] text-[#01A32E]">DentalShift</p><ul className="mt-4 space-y-3 text-sm font-semibold text-slate-600"><CheckLine>No subscription</CheckLine><CheckLine>No monthly fee</CheckLine><CheckLine>Pay as you go</CheckLine><CheckLine>A fraction of traditional staffing costs</CheckLine></ul></article></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[.82fr_1.18fr] lg:items-center"><div><p className="text-sm font-black uppercase tracking-[.14em] text-[#4285F4]">Permanent opportunities</p><h2 className="mt-2 text-3xl font-black tracking-[-.035em] text-[#002757] sm:text-4xl">Looking for something permanent?</h2><p className="mt-3 text-lg leading-8 text-slate-600">DentalJobs by DentalShift gives offices and professionals a public marketplace for permanent dental employment.</p><a href="/jobs" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#01A32E] px-5 py-3.5 font-black text-white">Browse DentalJobs <ArrowRight size={17}/></a></div>
          <div className="grid gap-4 sm:grid-cols-2"><article className="rounded-2xl border-2 border-[#4285F4]/15 bg-[#f7faff] p-5"><p className="text-xs font-black uppercase tracking-[.12em] text-[#245FB8]">Dental office hiring</p><h3 className="mt-2 text-xl font-black text-[#002757]">Registered Dental Hygienist Wanted</h3><p className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-600"><MapPin size={15}/> Calgary, AB</p><p className="mt-2 text-sm text-slate-500">Full-Time · $55–$62/hr</p></article><article className="rounded-2xl border-2 border-[#01A32E]/15 bg-[#f7fcf8] p-5"><p className="text-xs font-black uppercase tracking-[.12em] text-[#017f27]">Professional available</p><h3 className="mt-2 text-xl font-black text-[#002757]">Dental Administrator Available</h3><p className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-600"><MapPin size={15}/> Edmonton, AB</p><p className="mt-2 text-sm text-slate-500">Full-Time · Experienced</p></article></div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#f8fbff] py-12"><div className="mx-auto max-w-6xl px-5 sm:px-8"><div className="text-center"><h2 className="text-3xl font-black tracking-[-.035em] text-[#002757]">Built for Canadian dental teams.</h2></div><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[[<BadgeCheck key="a" size={20}/>,"Verified professionals","Credentials and licences can be reviewed."],[<DollarSign key="b" size={20}/>,"Transparent rates","Know the rate before committing."],[<ShieldCheck key="c" size={20}/>,"Protected communication","Keep conversations and records together."],[<CalendarCheck2 key="d" size={20}/>,"Temporary + permanent","One platform for both staffing needs."]].map(([icon,title,detail])=><article key={String(title)} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="text-[#01A32E]">{icon}</div><h3 className="mt-3 font-black text-[#002757]">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{detail}</p></article>)}</div></div></section>

      <section className="px-5 py-14 sm:px-8 sm:py-16"><div className="mx-auto max-w-4xl rounded-[2rem] bg-[#002757] px-6 py-10 text-center text-white shadow-xl sm:px-10"><h2 className="text-3xl font-black tracking-[-.035em] sm:text-4xl">Ready to make dental staffing simpler?</h2><p className="mx-auto mt-3 max-w-2xl text-blue-100">No subscription. No monthly fee. Pay only when you use it.</p><div className="mt-6 grid gap-3 sm:flex sm:justify-center"><button onClick={()=>start('office')} className="rounded-xl bg-white px-5 py-3.5 font-black text-[#002757]">I’m a Dental Office</button><button onClick={()=>start('professional')} className="rounded-xl bg-[#01A32E] px-5 py-3.5 font-black text-white">I’m a Dental Professional</button></div></div></section>
    </main>
  </div>;
}
