"use client";

import { MapPin } from "lucide-react";

export type AvailableStaffRole = "RDH" | "CDA" | "DA" | "ST";

export type AnonymousAvailableStaff = {
  id: string;
  role: AvailableStaffRole;
  profession: string;
  minimumHourlyRate?: number | null;
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
  interested?: boolean;
  interestApplicationId?: string | null;
  interestElapsed?: string | null;
  licenceProvince?: string | null;
  requestedRate?: number | null;
};

const roleStyles: Record<AvailableStaffRole, { title: string; badge: string; border: string; soft: string; text: string }> = {
  RDH: { title: "Registered Dental Hygienist", badge: "bg-[#0078FE]", border: "border-blue-200", soft: "bg-blue-50", text: "text-[#0064d8]" },
  CDA: { title: "Certified Dental Assistant", badge: "bg-[#04A62F]", border: "border-emerald-200", soft: "bg-[#eaf8ee]", text: "text-[#017f27]" },
  DA: { title: "Dental Assistant", badge: "bg-[#F59E0B]", border: "border-orange-200", soft: "bg-orange-50", text: "text-orange-700" },
  ST: { title: "Sterilization Technician", badge: "bg-[#8B5CF6]", border: "border-violet-200", soft: "bg-violet-50", text: "text-violet-700" },
};

function shortTime(value: string) {
  return new Date(value).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
}

export function AnonymousAvailableStaffPanel({
  staff,
  onBookInterest,
  busyApplicationId,
}: {
  staff: AnonymousAvailableStaff[];
  onBookInterest?: (applicationId: string) => void;
  busyApplicationId?: string | null;
}) {
  const groups = (["RDH", "CDA", "DA", "ST"] as AvailableStaffRole[])
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
          {items.map((item) => <article key={item.id} className={`p-3 ${item.interested ? "bg-[#f3fbf5]" : ""}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <strong className="text-sm text-[#032757]">{item.role} available</strong>
                <p className="mt-1 text-xs font-bold text-slate-500">{shortTime(item.startsAt)}–{shortTime(item.endsAt)}{item.minimumHourlyRate != null ? ` · Min $${item.minimumHourlyRate.toFixed(2)}/hr` : ""}</p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
                <MapPin size={12} />{item.distanceKm == null ? "Distance unavailable" : `${item.distanceKm.toFixed(1)} km`}
              </span>
            </div>
            {item.interested && <div className="mt-3 border-t border-[#34A853]/25 pt-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-[#017f27]">✓ I’m Interested</span>
                {item.interestElapsed && <span className="font-mono text-xs font-black tabular-nums text-[#017f27]">{item.interestElapsed}</span>}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-600">
                <span>Licence province: <strong>{item.licenceProvince || "Unavailable"}</strong></span>
                <span>Completed: <strong>{item.completedShifts || 0}</strong></span>
                <span>Rating: <strong>{item.rating ? `${item.rating}★` : "No rating yet"}</strong></span>
                <span>Reliability: <strong>{item.reliabilityScore != null ? `${item.reliabilityScore}%` : "Not enough history"}</strong></span>
                <span className="col-span-2">Requested rate: <strong>{item.requestedRate != null ? `$${item.requestedRate.toFixed(2)}/hr` : "Not specified"}</strong></span>
              </div>
              <p className="mt-2 text-[10px] leading-4 text-slate-500">Identity and contact details are shared after booking confirmation.</p>
              {item.interestApplicationId && onBookInterest && <button type="button" disabled={busyApplicationId === item.interestApplicationId} onClick={() => onBookInterest(item.interestApplicationId!)} className="primary-btn mt-2 w-full justify-center py-2 text-xs">{busyApplicationId === item.interestApplicationId ? "Booking…" : "✓ Book Now"}</button>}
            </div>}
          </article>)}
        </div>
      </section>;
    })}
  </aside>;
}
