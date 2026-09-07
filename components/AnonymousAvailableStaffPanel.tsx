"use client";

import { MapPin } from "lucide-react";

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
  CDA: { title: "Certified Dental Assistant", badge: "bg-[#04A62F]", border: "border-emerald-200", soft: "bg-[#eaf8ee]", text: "text-[#017f27]" },
  DA: { title: "Dental Assistant", badge: "bg-[#F59E0B]", border: "border-orange-200", soft: "bg-orange-50", text: "text-orange-700" },
  ST: { title: "Sterilization Technician", badge: "bg-[#8B5CF6]", border: "border-violet-200", soft: "bg-violet-50", text: "text-violet-700" },
};

function shortTime(value: string) {
  return new Date(value).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
}

export function AnonymousAvailableStaffPanel({
  staff,
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
          {items.map((item) => <article key={item.id} className="p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <strong className="text-sm text-[#032757]">Shift posted</strong>
                <p className="mt-1 text-xs font-bold text-slate-500">{shortTime(item.startsAt)}–{shortTime(item.endsAt)}</p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600">
                <MapPin size={12} />{item.distanceKm == null ? "Distance unavailable" : `${item.distanceKm.toFixed(1)} km`}
              </span>
            </div>
          </article>)}
        </div>
      </section>;
    })}
  </aside>;
}
