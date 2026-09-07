"use client";

import { MapPin, ShieldCheck, Star, UsersRound } from "lucide-react";

export type AvailableStaffRole = "RDH" | "CDA" | "DA" | "ST";

export type AnonymousAvailableStaff = {
  id: string;
  role: AvailableStaffRole;
  profession: string;
  distanceKm: number | null;
  startsAt: string;
  endsAt: string;
  yearsExperience: number | null;
  rating: number | null;
  reviewCount?: number | null;
  completedShifts: number | null;
  reliabilityScore: number | null;
  cancellations: number | null;
  skills?: string[] | null;
  software?: string[] | null;
  qualifications?: { label: string; verified: boolean }[];
  preferred?: boolean;
};

const roleStyles: Record<AvailableStaffRole, { title: string; badge: string; border: string; soft: string; text: string }> = {
  RDH: { title: "Registered Dental Hygienist", badge: "bg-[#0078FE]", border: "border-blue-200", soft: "bg-blue-50", text: "text-[#0064d8]" },
  CDA: { title: "Certified Dental Assistant", badge: "bg-[#F21C13]", border: "border-red-200", soft: "bg-red-50", text: "text-[#d9160f]" },
  DA: { title: "Dental Assistant", badge: "bg-[#F59E0B]", border: "border-orange-200", soft: "bg-orange-50", text: "text-orange-700" },
  ST: { title: "Sterilization Technician", badge: "bg-[#8B5CF6]", border: "border-violet-200", soft: "bg-violet-50", text: "text-violet-700" },
};

function shortTime(value: string) {
  return new Date(value).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
}

function anonymousId(item: AnonymousAvailableStaff) {
  const suffix = item.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "0000";
  return `${item.role} #${suffix}`;
}

export function AnonymousAvailableStaffPanel({
  staff,
  radiusKm,
  onRadiusChange,
  onViewProfile,
}: {
  staff: AnonymousAvailableStaff[];
  radiusKm: number;
  onRadiusChange?: (radiusKm: number) => void;
  onViewProfile?: (professionalId: string) => void;
}) {
  const groups = (["RDH", "CDA", "DA", "ST"] as AvailableStaffRole[])
    .map((role) => ({ role, items: staff.filter((item) => item.role === role) }))
    .filter((group) => group.items.length > 0);

  return <aside className="space-y-3">
    <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[.12em] text-[#F21C13]">Available Staff</p>
          <h3 className="mt-1 text-xl font-black text-[#991b1b]">{staff.length} professional{staff.length === 1 ? "" : "s"} nearby</h3>
          <p className="mt-1 text-xs font-bold text-red-700">Anonymous until booking or authorized disclosure.</p>
        </div>
        <UsersRound className="text-[#F21C13]" size={22} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
        <span className="flex items-center gap-2 text-xs font-black text-slate-600"><MapPin size={14} />Within {radiusKm} km</span>
        {onRadiusChange && <select aria-label="Search radius" value={radiusKm} onChange={(event) => onRadiusChange(Number(event.target.value))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-black text-[#032757]">
          {[5, 10, 15, 20, 25, 30, 40, 50, 75, 100].map((value) => <option key={value} value={value}>{value} km</option>)}
        </select>}
      </div>
    </section>

    {groups.map(({ role, items }) => {
      const style = roleStyles[role];
      return <section key={role} className={`overflow-hidden rounded-2xl border ${style.border} bg-white shadow-sm`}>
        <header className={`flex items-center justify-between gap-3 px-3 py-2 ${style.soft}`}>
          <div className="flex items-center gap-2"><span className={`rounded-lg px-2.5 py-1 text-xs font-black text-white ${style.badge}`}>{role}</span><strong className={`text-sm ${style.text}`}>{style.title} ({items.length})</strong></div>
        </header>
        <div className="divide-y divide-slate-100">
          {items.map((item) => <article key={item.id} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-[#032757]">{anonymousId(item)}</strong>{item.preferred && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">Preferred</span>}</div>
                <p className="mt-1 text-xs font-bold text-slate-500">{item.distanceKm == null ? "Distance unavailable" : `${item.distanceKm.toFixed(1)} km away`} · {shortTime(item.startsAt)}–{shortTime(item.endsAt)}</p>
              </div>
              {onViewProfile && <button type="button" onClick={() => onViewProfile(item.id)} className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-black text-[#032757] hover:bg-slate-50">View Anonymous Profile</button>}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-bold text-slate-600">
              <span>Reliability: <strong className="text-[#032757]">{item.reliabilityScore == null ? "Not enough history" : `${item.reliabilityScore}%`}</strong></span>
              <span>Completed: <strong className="text-[#032757]">{item.completedShifts == null ? "—" : item.completedShifts}</strong></span>
              <span>Cancellations: <strong className="text-[#032757]">{item.cancellations == null ? "—" : item.cancellations}</strong></span>
              <span>Experience: <strong className="text-[#032757]">{item.yearsExperience == null ? "—" : `${item.yearsExperience} yr${item.yearsExperience === 1 ? "" : "s"}`}</strong></span>
              <span className="col-span-2 flex items-center gap-1">Rating: <Star size={12} className="fill-current text-amber-500" /><strong className="text-[#032757]">{item.rating == null ? "No rating yet" : `${item.rating.toFixed(1)}${item.reviewCount ? ` (${item.reviewCount})` : ""}`}</strong></span>
            </div>

            {!!item.qualifications?.length && <div className="mt-3 flex flex-wrap gap-1.5">{item.qualifications.map((qualification) => <span key={qualification.label} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${qualification.verified ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{qualification.verified && <ShieldCheck size={11} />}{qualification.label}{qualification.verified ? " · Verified" : " · Self-declared"}</span>)}</div>}
            {!!item.skills?.length && <p className="mt-2 text-[11px] text-slate-500"><strong>Skills:</strong> {item.skills.slice(0, 4).join(" · ")}</p>}
            {!!item.software?.length && <p className="mt-1 text-[11px] text-slate-500"><strong>Software:</strong> {item.software.slice(0, 4).join(" · ")}</p>}
          </article>)}
        </div>
      </section>;
    })}
  </aside>;
}
