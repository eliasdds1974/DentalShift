"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Clock3, ShieldCheck } from "lucide-react";

const demoDays = [
  { d: 10 }, { d: 11, open: 2 }, { d: 12 }, { d: 13, open: 1, available: true }, { d: 14, open: 3 }, { d: 15, interested: 1 }, { d: 16 },
  { d: 17, open: 2 }, { d: 18, open: 4, officeInterest: true, selected: true }, { d: 19, open: 1 }, { d: 20, available: true }, { d: 21, booked: true }, { d: 22, open: 2 }, { d: 23 },
  { d: 24, open: 1 }, { d: 25, interested: 1 }, { d: 26, open: 2 }, { d: 27 }, { d: 28, available: true }, { d: 29, open: 3 }, { d: 30 },
  { d: 1, muted: true }, { d: 2, muted: true, open: 1 }, { d: 3, muted: true }, { d: 4, muted: true }, { d: 5, muted: true, open: 2 }, { d: 6, muted: true }, { d: 7, muted: true },
  { d: 8, muted: true }, { d: 9, muted: true, open: 1 }, { d: 10, muted: true }, { d: 11, muted: true }, { d: 12, muted: true }, { d: 13, muted: true }, { d: 14, muted: true },
];

const weekdays = ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"];

export function MarketingCalendarPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[760px]">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(0,39,87,.16)]">
        <div className="border-b border-slate-200 p-3 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-black text-slate-600"><ChevronLeft size={13}/> Previous</span>
                <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-600">Today</span>
                <span className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-black text-slate-600">Next <ChevronRight size={13}/></span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-400">RDH opportunities</p>
              <h3 className="mt-1 text-lg font-black text-[#002757] sm:text-xl">Sept 10 – Oct 14, 2026</h3>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-extrabold text-slate-600 sm:text-xs">
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#4285F4]"/>Open shifts</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#34A853]"/>Interested</span>
            <span className="inline-flex items-center gap-1.5"><span className="grid h-3 w-3 place-items-center rounded-full bg-[#002757] text-[8px] text-white">✓</span>Booked</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(285px,.75fr)]">
          <div className="p-2.5 sm:p-4 lg:border-r lg:border-slate-200">
            <div className="grid grid-cols-7">{weekdays.map((day) => <div key={day} className="pb-2 text-center text-[9px] font-black uppercase tracking-wide text-slate-400 sm:text-[10px]">{day}</div>)}</div>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {demoDays.map((day, index) => (
                <div key={`${day.d}-${index}`} className={`relative min-h-[72px] rounded-xl border p-1 text-center sm:min-h-[86px] ${day.booked ? "border-[#002757] bg-[#002757]" : day.selected ? "border-[#4285F4] bg-blue-50 ring-2 ring-[#4285F4]/20" : "border-slate-200 bg-white"} ${day.muted ? "opacity-45" : ""}`}>
                  {day.booked ? <span className="absolute inset-0 grid place-items-center rounded-xl text-[10px] font-black tracking-wide text-white sm:text-xs">BOOKED</span> : <>
                    <span className="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full text-[10px] font-black text-slate-700 sm:h-7 sm:w-7 sm:text-xs">{day.d}</span>
                    <span className="absolute left-1 right-1 top-8 flex min-h-5 flex-wrap items-start justify-center gap-1 sm:top-9">
                      {day.open ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#4285F4] px-1 text-[9px] font-black text-white sm:h-6 sm:min-w-6 sm:text-[10px]">{day.open}</span> : null}
                      {day.interested ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#34A853] px-1 text-[9px] font-black text-white sm:h-6 sm:min-w-6 sm:text-[10px]">{day.interested}</span> : null}
                    </span>
                    {day.officeInterest ? <span className="absolute bottom-1 left-1 right-1 rounded-md bg-[#EA4335]/15 px-1 py-0.5 text-center text-[7px] font-black leading-tight text-[#c9342d] sm:text-[8px]">They are interested</span> : day.interested ? <span className="absolute bottom-1 left-1 right-1 rounded-md bg-[#002757] px-1 py-0.5 text-center text-[7px] font-black leading-tight text-white sm:text-[8px]">✓ I’m Interested</span> : day.available ? <span className="absolute bottom-1 left-1 right-1 rounded-md bg-[#eaf8ee] px-1 py-0.5 text-center text-[7px] font-black leading-tight text-[#017f27] sm:text-[8px]">✓ I’m Available</span> : null}
                  </>}
                </div>
              ))}
            </div>
          </div>

          <aside className="border-t border-slate-200 bg-white p-4 lg:border-t-0">
            <p className="text-[10px] font-black uppercase tracking-[.12em] text-[#4285F4]">Selected date</p>
            <h3 className="mt-1 text-lg font-black text-[#002757]">Friday, September 18</h3>

            <section className="mt-4 overflow-hidden rounded-2xl border-2 border-[#01A32E] bg-white shadow-sm">
              <div className="flex items-center gap-2 bg-[#01A32E] px-3 py-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] font-black text-[#017f27]">✓</span><p className="text-xs font-black tracking-wide text-white">I’m Available</p></div>
              <div className="p-3">
                <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 text-xs font-black text-[#002757]"><Clock3 size={13} className="text-[#017f27]"/>8:00 AM–4:30 PM</span><span className="rounded-full bg-[#eaf8ee] px-2 py-1 text-[10px] font-black text-[#017f27]">$58.00/hr</span></div>
              </div>
            </section>

            <section className="mt-4 rounded-2xl border-2 border-[#0078FE] bg-white p-3">
              <div className="inline-flex rounded-lg bg-[#0078FE] px-2.5 py-1 text-[10px] font-black text-white">Dental Office</div>
              <p className="mt-2 text-xs font-black text-slate-700">Registered Dental Hygienist</p>
              <p className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-600"><Clock3 size={12}/>8:00 AM–4:30 PM</p>
              <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-[#EA4335]/35 bg-red-50 px-2.5 py-2">
                <span className="text-[10px] font-black text-[#EA4335]">✓ They are interested</span>
                <span className="font-mono text-[9px] font-black text-[#EA4335]">00:12:41</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2"><span className="rounded-xl border border-[#EA4335]/30 px-2 py-2 text-center text-[9px] font-black text-[#c9342d]">I’m not interested</span><span className="rounded-xl bg-[#002757] px-2 py-2 text-center text-[9px] font-black text-white">Book appointment</span></div>
            </section>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[10px] font-semibold leading-4 text-slate-500"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#34A853]"/><span>Identity and contact details stay protected until both sides agree and the shift is booked.</span></div>
          </aside>
        </div>
      </div>

      <div className="pointer-events-none absolute -left-2 top-[34%] hidden rounded-xl border-2 border-[#CF9504] bg-[#FDB605] px-3 py-2 text-xs font-black text-[#002757] shadow-lg shadow-amber-300/30 xl:block">See opportunities at a glance →</div>
      <div className="pointer-events-none absolute -right-2 top-[54%] hidden rounded-xl border-2 border-[#CF9504] bg-[#FDB605] px-3 py-2 text-xs font-black text-[#002757] shadow-lg shadow-amber-300/30 xl:block">Either side can move first</div>
      <div className="pointer-events-none absolute -bottom-3 right-8 hidden rounded-xl border-2 border-[#CF9504] bg-[#FDB605] px-3 py-2 text-xs font-black text-[#002757] shadow-lg shadow-amber-300/30 xl:block">Private until both sides agree</div>
    </div>
  );
}
