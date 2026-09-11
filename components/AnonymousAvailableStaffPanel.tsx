"use client";

import { useState } from "react";
import { Clock3, MapPin, Star } from "lucide-react";

export type AvailableStaffRole = "RDH" | "CDA" | "DA" | "ST" | "DT";

export type AnonymousAvailableStaff = {
  id: string;
  role: AvailableStaffRole;
  profession: string;
  minimumHourlyRate?: number | null;
  distanceKm: number | null;
  startsAt: string;
  endsAt: string;
  notes?: string | null;
  yearsExperience: number | null;
  rating: number | null;
  reviewCount?: number | null;
  completedShifts: number | null;
  totalCancellations: number;
  cancellationsUnder24h: number;
  skills?: string[] | null;
  software?: string[] | null;
  languages?: string[] | null;
  qualifications?: { label: string; verified: boolean }[];
  preferred?: boolean;
  preferredFirst?: boolean;
  preferredUntil?: string | null;
  interested?: boolean;
  interestApplicationId?: string | null;
  interestElapsed?: string | null;
  licenceProvince?: string | null;
  requestedRate?: number | null;
  shiftId?: string | null;
  availabilityId?: string | null;
  officeInterested?: boolean;
  officeInterestElapsed?: string | null;
};

const roleStyles: Record<AvailableStaffRole, { title: string; badge: string; border: string; soft: string; text: string }> = {
  RDH: { title: "Registered Dental Hygienist", badge: "bg-[#0078FE]", border: "border-blue-200", soft: "bg-blue-50", text: "text-[#0064d8]" },
  CDA: { title: "Certified Dental Assistant", badge: "bg-[#04A62F]", border: "border-emerald-200", soft: "bg-[#eaf8ee]", text: "text-[#017f27]" },
  DA: { title: "Dental Assistant", badge: "bg-[#F59E0B]", border: "border-orange-200", soft: "bg-orange-50", text: "text-orange-700" },
  ST: { title: "Sterilization Technician", badge: "bg-[#8B5CF6]", border: "border-violet-200", soft: "bg-violet-50", text: "text-violet-700" },
  DT: { title: "Associate Dentist", badge: "bg-[#7C3AED]", border: "border-purple-200", soft: "bg-purple-50", text: "text-purple-800" },
};

function shortTime(value: string) {
  return new Date(value).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
}

export function AnonymousAvailableStaffPanel({
  staff,
  onBookInterest,
  busyApplicationId,
  onExpressInterest,
  onRemoveInterest,
  onDeclineInterest,
}: {
  staff: AnonymousAvailableStaff[];
  onBookInterest?: (applicationId: string) => void;
  onExpressInterest?: (shiftId: string | null, professionalId: string, availabilityId: string | null) => void;
  onRemoveInterest?: (shiftId: string, professionalId: string) => void;
  onDeclineInterest?: (applicationId: string) => void;
  busyApplicationId?: string | null;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const toggleDetails = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const groups = (["RDH", "CDA", "DA", "ST", "DT"] as AvailableStaffRole[])
    .map((role) => ({ role, items: staff.filter((item) => item.role === role) }))
    .filter((group) => group.items.length > 0);

  return <aside className="space-y-3">
    {groups.map(({ role, items }) => {
      const style = roleStyles[role];
      return <section key={role} className={`overflow-hidden rounded-2xl border ${style.border} bg-white shadow-sm`}>
        <header className={`flex items-center justify-between gap-3 px-3 py-2 ${style.soft}`}>
          <div className="flex items-center gap-2">
            <span className={`rounded-lg px-2.5 py-1 text-xs font-black text-white ${style.badge}`}>{role}</span>
            <strong className={`text-sm ${style.text}`}>{style.title}</strong>
          </div>
        </header>
        <div className="divide-y divide-slate-100">
          {items.map((item) => {
            const expanded = expandedIds.has(item.id);
            return <article key={item.id} className={`p-3 ${item.interested ? "bg-[#f3fbf5]" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-[#032757]">{item.role} available</strong>
                    {item.preferred && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={11} className="fill-[#FDB605] text-[#FDB605]" />Preferred</span>}{item.preferredFirst && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] px-2 py-0.5 text-[10px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45"><Star size={11} className="fill-[#FDB605] text-[#FDB605]" />Preferred First</span>}
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-500">{shortTime(item.startsAt)}–{shortTime(item.endsAt)}{item.minimumHourlyRate != null ? ` · $${item.minimumHourlyRate.toFixed(2)}/hr` : ""}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
                  <MapPin size={12} />{item.distanceKm == null ? "Distance unavailable" : `${item.distanceKm.toFixed(1)} km`}
                </span>
              </div>

              <div className="mt-2 flex justify-end">
                <button type="button" onClick={() => toggleDetails(item.id)} className="inline-flex items-center rounded-full border border-[#002757] bg-[#002757] px-3 py-1.5 text-[10px] font-black text-white shadow-sm transition hover:bg-[#0a3568] focus:outline-none focus:ring-2 focus:ring-[#002757]/25">
                  {expanded ? "Hide Details" : "Details"}
                </button>
              </div>

              {expanded && <div className="mt-2 border-t border-slate-200 pt-2">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-slate-600">
                  <span>Years experience: <strong>{item.yearsExperience != null ? `${item.yearsExperience} year${item.yearsExperience === 1 ? "" : "s"}` : "Not listed"}</strong></span>
                  <span>Licence province: <strong>{item.licenceProvince || "Unavailable"}</strong></span>
                  <span>Completed shifts: <strong>{item.completedShifts || 0}</strong></span>
                  <span>Rating: <strong>{item.rating ? `${item.rating}★` : "No rating yet"}</strong></span>
                  <span>Total cancellations: <strong>{item.totalCancellations}</strong></span>
                  <span>Cancellations &lt;24 hours: <strong>{item.cancellationsUnder24h}</strong></span>
                  <span>Rate: <strong>{item.requestedRate != null ? `$${item.requestedRate.toFixed(2)}/hr` : (item.minimumHourlyRate != null ? `$${item.minimumHourlyRate.toFixed(2)}/hr` : "Not specified")}</strong></span>
                </div>
                {item.qualifications?.length ? <div className="mt-2 text-[11px] text-slate-600"><span className="font-black text-[#002757]">Qualifications: </span>{item.qualifications.map((qualification) => `${qualification.label}${qualification.verified ? " ✓" : ""}`).join(", ")}</div> : null}
                {item.software?.length ? <div className="mt-1 text-[11px] text-slate-600"><span className="font-black text-[#002757]">Dental Software Experience: </span>{item.software.join(", ")}</div> : null}
                {item.languages?.length ? <div className="mt-1 text-[11px] text-slate-600"><span className="font-black text-[#002757]">Languages Spoken: </span>{item.languages.join(", ")}</div> : null}
                <p className="mt-2 text-[10px] leading-4 text-slate-500">Identity and contact details are shared after booking confirmation.</p>
              </div>}

              {!item.interested && <div className="mt-3 border-t border-[#34A853]/25 pt-3">
                {item.officeInterested ? <div className="space-y-2"><div className="flex items-center justify-between gap-2 rounded-xl bg-[#eaf8ee] px-3 py-2"><span className="text-xs font-black text-[#017f27]">✓ I’m Interested</span><span className="inline-flex items-center gap-1.5 font-mono text-xs font-black tabular-nums text-[#017f27]"><Clock3 size={13} />{item.officeInterestElapsed || "00:00:00"}</span></div>{item.shiftId && onRemoveInterest && <button type="button" disabled={busyApplicationId === `office-remove-interest-${item.id}`} onClick={() => onRemoveInterest(item.shiftId!, item.id)} className="secondary-btn w-full justify-center border-[#01A32E]/30 py-2 text-xs font-black text-[#017f27]">{busyApplicationId === `office-remove-interest-${item.id}` ? "Removing…" : "Cancel Interest"}</button>}</div> : onExpressInterest ? <button type="button" disabled={(!item.shiftId && !item.availabilityId) || busyApplicationId === `office-interest-${item.id}`} title={!item.shiftId && !item.availabilityId ? "This professional is no longer available" : undefined} onClick={() => onExpressInterest(item.shiftId || null, item.id, item.availabilityId || null)} className="w-full rounded-xl border border-[#002757] bg-[#002757] px-3 py-2 text-sm font-black text-white transition hover:bg-[#0a3568] disabled:cursor-not-allowed disabled:opacity-50">{busyApplicationId === `office-interest-${item.id}` ? "Saving…" : "I’m Interested"}</button> : null}
              </div>}

              {item.interested && <div className="mt-3 border-t border-[#EA4335]/25 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-[#EA4335]">✓ They are interested</span>
                  {item.interestElapsed && <span className="inline-flex items-center gap-1.5 font-mono text-xs font-black tabular-nums text-[#EA4335]"><Clock3 size={13} />{item.interestElapsed}</span>}
                </div>
                {item.interestApplicationId && <div className="mt-2 grid grid-cols-2 gap-2">{onDeclineInterest && <button type="button" disabled={busyApplicationId === `office-decline-${item.interestApplicationId}`} onClick={() => onDeclineInterest(item.interestApplicationId!)} className="secondary-btn justify-center border-[#EA4335]/30 py-2 text-xs font-black text-[#c9342d]">{busyApplicationId === `office-decline-${item.interestApplicationId}` ? "Removing…" : (item.availabilityId ? "I’m not interested" : "Cancel Interest")}</button>}{onBookInterest && <button type="button" disabled={busyApplicationId === item.interestApplicationId} onClick={() => onBookInterest(item.interestApplicationId!)} className="primary-btn justify-center py-2 text-xs">{busyApplicationId === item.interestApplicationId ? "Scheduling…" : `Schedule ${item.role}`}</button>}</div>}
              </div>}
            </article>;
          })}
        </div>
      </section>;
    })}
  </aside>;
}
