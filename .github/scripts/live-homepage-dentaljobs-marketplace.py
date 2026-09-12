from pathlib import Path

p = Path('components/MarketingHome.tsx')
s = p.read_text()

s = s.replace('import { useState } from "react";', 'import { useEffect, useState } from "react";', 1)
s = s.replace('import { MarketingCalendarPreview } from "./MarketingCalendarPreview";', 'import { MarketingCalendarPreview } from "./MarketingCalendarPreview";\nimport { supabase } from "@/lib/supabase";', 1)

anchor = 'type Audience = "office" | "professional";\n'
insert = '''type Audience = "office" | "professional";\n\ntype MarketplaceListing = {\n  id: string;\n  listing_type: "office_hiring" | "professional_available";\n  profession: string;\n  employment_type: string;\n  city: string;\n  province: string;\n  pay_min: number | null;\n  pay_max: number | null;\n  created_at: string;\n};\n\nfunction marketplacePay(listing: MarketplaceListing) {\n  const min = listing.pay_min == null ? null : Number(listing.pay_min);\n  const max = listing.pay_max == null ? null : Number(listing.pay_max);\n  if (min == null && max == null) return "Compensation discussed privately";\n  if (min != null && max != null) return `$${min}–$${max}/hr`;\n  if (min != null) return `$${min}+/hr`;\n  return `Up to $${max}/hr`;\n}\n'''
if anchor not in s:
    raise SystemExit('Audience type anchor not found')
s = s.replace(anchor, insert, 1)

state_anchor = '  const [audience, setAudience] = useState<Audience>("office");\n\n'
state_insert = '''  const [audience, setAudience] = useState<Audience>("office");\n  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>([]);\n\n  useEffect(() => {\n    let cancelled = false;\n\n    const loadMarketplaceListings = async () => {\n      const { data, error } = await supabase\n        .from("job_listings")\n        .select("id,listing_type,profession,employment_type,city,province,pay_min,pay_max,created_at")\n        .eq("status", "active")\n        .gt("expires_at", new Date().toISOString())\n        .order("created_at", { ascending: false })\n        .limit(4);\n\n      if (!cancelled && !error) {\n        setMarketplaceListings((data || []) as MarketplaceListing[]);\n      }\n    };\n\n    void loadMarketplaceListings();\n\n    const channel = supabase\n      .channel("marketing-home-dentaljobs")\n      .on("postgres_changes", { event: "*", schema: "public", table: "job_listings" }, () => {\n        void loadMarketplaceListings();\n      })\n      .subscribe();\n\n    return () => {\n      cancelled = true;\n      void supabase.removeChannel(channel);\n    };\n  }, []);\n\n'''
if state_anchor not in s:
    raise SystemExit('state anchor not found')
s = s.replace(state_anchor, state_insert, 1)

old = '''          <div className="grid gap-4 sm:grid-cols-2"><article className="rounded-2xl border-2 border-[#4285F4]/15 bg-[#f7faff] p-5"><p className="text-xs font-black uppercase tracking-[.12em] text-[#245FB8]">Dental office hiring</p><h3 className="mt-2 text-xl font-black text-[#002757]">Registered Dental Hygienist Wanted</h3><p className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-600"><MapPin size={15}/> Calgary, AB</p><p className="mt-2 text-sm text-slate-500">Full-Time · $55–$62/hr</p></article><article className="rounded-2xl border-2 border-[#01A32E]/15 bg-[#f7fcf8] p-5"><p className="text-xs font-black uppercase tracking-[.12em] text-[#017f27]">Professional available</p><h3 className="mt-2 text-xl font-black text-[#002757]">Dental Administrator Available</h3><p className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-600"><MapPin size={15}/> Edmonton, AB</p><p className="mt-2 text-sm text-slate-500">Full-Time · Experienced</p></article></div>'''
new = '''          <div className="grid gap-4 sm:grid-cols-2">\n            {marketplaceListings.length === 0 ? (\n              <div className="sm:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">Active DentalJobs listings will appear here automatically.</div>\n            ) : marketplaceListings.map((listing) => {\n              const professional = listing.listing_type === "professional_available";\n              return (\n                <a key={listing.id} href={`/jobs/${listing.id}`} className={`rounded-2xl border-2 p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${professional ? "border-[#01A32E]/15 bg-[#f7fcf8]" : "border-[#4285F4]/15 bg-[#f7faff]"}`}>\n                  <p className={`text-xs font-black uppercase tracking-[.12em] ${professional ? "text-[#017f27]" : "text-[#245FB8]"}`}>{professional ? "Professional available" : "Dental office hiring"}</p>\n                  <h3 className="mt-2 text-xl font-black text-[#002757]">{professional ? `${listing.profession} Available` : `${listing.profession} Wanted`}</h3>\n                  <p className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-600"><MapPin size={15}/>{listing.city}, {listing.province}</p>\n                  <p className="mt-2 text-sm text-slate-500">{listing.employment_type} · {marketplacePay(listing)}</p>\n                </a>\n              );\n            })}\n          </div>'''
if old not in s:
    raise SystemExit('static marketplace cards not found')
s = s.replace(old, new, 1)

p.write_text(s)
