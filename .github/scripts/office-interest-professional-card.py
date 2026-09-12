from pathlib import Path

page = Path('app/classifieds/page.tsx')
text = page.read_text()

# Add safe office interest snapshot type.
anchor = '''type JobConnection = {\n  id: string;'''
insert = '''type OfficeInterestSnapshot = {\n  label?: string | null;\n  city?: string | null;\n  province?: string | null;\n  profession?: string | null;\n  employment_type?: string | null;\n  days_per_week?: string | null;\n  pay_min?: number | string | null;\n  pay_max?: number | string | null;\n  schedule?: string | null;\n};\n\ntype JobConnection = {\n  id: string;'''
if anchor not in text:
    raise SystemExit('JobConnection type anchor not found')
text = text.replace(anchor, insert, 1)

anchor = '''  candidatePreview?: CandidatePreview | null;\n};'''
replace = '''  candidatePreview?: CandidatePreview | null;\n  officeInterestSnapshot?: OfficeInterestSnapshot | null;\n};'''
if anchor not in text:
    raise SystemExit('candidate preview type anchor not found')
text = text.replace(anchor, replace, 1)

# Load the privacy-safe snapshot on connection records.
old = '.select("id,listing_id,professional_id,office_id,initiator_role,status,message,resume_path_snapshot,created_at,professional_hidden_at,deleted_at,job_listings(profession,employment_type,city,province,listing_type)")'
new = '.select("id,listing_id,professional_id,office_id,initiator_role,status,message,resume_path_snapshot,created_at,professional_hidden_at,deleted_at,source_office_listing_id,office_interest_snapshot,job_listings(profession,employment_type,city,province,listing_type)")'
if old not in text:
    raise SystemExit('loadConnections select anchor not found')
text = text.replace(old, new, 1)

anchor = '''        candidatePreview: previewMap.get(String(row.professional_id)) || null,\n      } as JobConnection;'''
replace = '''        candidatePreview: previewMap.get(String(row.professional_id)) || null,\n        officeInterestSnapshot: row.office_interest_snapshot || null,\n      } as JobConnection;'''
if anchor not in text:
    raise SystemExit('connection mapping anchor not found')
text = text.replace(anchor, replace, 1)

# A professional's connection card is now specifically incoming Office Interest.
anchor = '''  const existingConnectionFor = (ad: JobCard) => connections.find((item) => item.listingId === String(ad.id));'''
replace = '''  const visibleConnections = portalRole === "professional"\n    ? connections.filter((item) => item.initiatorRole === "office")\n    : connections;\n\n  const existingConnectionFor = (ad: JobCard) => connections.find((item) => item.listingId === String(ad.id));'''
if anchor not in text:
    raise SystemExit('visibleConnections anchor not found')
text = text.replace(anchor, replace, 1)

text = text.replace('portalRole === "office" ? "Applications & Interest" : "My Applications & Office Interest"', 'portalRole === "office" ? "Applications & Interest" : "Office Interest"', 1)
text = text.replace('portalRole === "office" ? "Review professionals who applied and track professionals your office contacted." : "Track your applications and offices that expressed interest in you."', 'portalRole === "office" ? "Review professionals who applied and track professionals your office contacted." : "Review dental offices that expressed interest in your DentalJobs ad."', 1)
text = text.replace('{connections.length} connection{connections.length === 1 ? "" : "s"}', '{visibleConnections.length} connection{visibleConnections.length === 1 ? "" : "s"}', 1)
text = text.replace('{connections.length === 0 ?', '{visibleConnections.length === 0 ?', 1)
text = text.replace(' : connections.map((item) => {', ' : visibleConnections.map((item) => {', 1)

# Replace the generic professional-facing connection heading/location with the office posting snapshot.
old = '''<h3 className="mt-2 font-black text-[#002757]">{item.profession}{item.employment ? ` — ${item.employment}` : ""}</h3><p className="mt-1 text-sm text-slate-500">{item.city}{item.city && item.province ? ", " : ""}{item.province}</p>{item.message && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">“{item.message}”</p>}'''
new = '''{portalRole === "professional" && item.initiatorRole === "office" && item.officeInterestSnapshot ? (() => { const office = item.officeInterestSnapshot; const min = office.pay_min == null ? null : Number(office.pay_min); const max = office.pay_max == null ? null : Number(office.pay_max); const pay = min != null || max != null ? `${min != null ? `$${min}` : ""}${min != null && max != null ? "–" : ""}${max != null ? `$${max}` : ""}/hr` : "Not specified"; return <div className="mt-3 max-w-2xl rounded-2xl border border-[#4285F4]/20 bg-[#f7faff] p-4"><div className="flex items-center gap-2"><Building2 size={17} className="text-[#002757]"/><p className="font-black text-[#002757]">Dental Office</p></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="rounded-xl bg-white p-3 ring-1 ring-slate-200"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Location</p><p className="mt-1 text-sm font-bold text-[#002757]">{[office.city, office.province].filter(Boolean).join(", ") || "Not specified"}</p></div><div className="rounded-xl bg-white p-3 ring-1 ring-slate-200"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Position</p><p className="mt-1 text-sm font-bold text-[#002757]">{office.profession || "Dental position"}</p></div><div className="rounded-xl bg-white p-3 ring-1 ring-slate-200"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Employment</p><p className="mt-1 text-sm font-bold text-[#002757]">{office.employment_type || "Not specified"}</p></div><div className="rounded-xl bg-white p-3 ring-1 ring-slate-200"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Approx. Days</p><p className="mt-1 text-sm font-bold text-[#002757]">{office.days_per_week ? `${office.days_per_week} day${String(office.days_per_week) === "1" ? "" : "s"} / week` : "Not specified"}</p></div><div className="rounded-xl bg-white p-3 ring-1 ring-slate-200"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Pay</p><p className="mt-1 text-sm font-bold text-[#002757]">{pay}</p></div><div className="rounded-xl bg-white p-3 ring-1 ring-slate-200"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Schedule / Hours</p><p className="mt-1 text-sm font-bold text-[#002757]">{office.schedule || "Not specified"}</p></div></div></div>; })() : <><h3 className="mt-2 font-black text-[#002757]">{item.profession}{item.employment ? ` — ${item.employment}` : ""}</h3><p className="mt-1 text-sm text-slate-500">{item.city}{item.city && item.province ? ", " : ""}{item.province}</p></>}{item.message && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">“{item.message}”</p>}'''
if old not in text:
    raise SystemExit('connection display anchor not found')
text = text.replace(old, new, 1)

# Legacy office-interest creation: snapshot the office's matching/recent active posting.
old = '''      } else if (portalRole === "office" && selectedOpportunity.kind === "professional") {\n        if (!officeId || !selectedOpportunity.ownerProfessionalId) throw new Error("This professional opportunity is not available for interest yet.");\n        const { data: created, error } = await supabase.from("job_applications").insert({\n          listing_id: selectedOpportunity.id, professional_id: selectedOpportunity.ownerProfessionalId, office_id: officeId,\n          initiator_role: "office", status: "pending", message: connectionMessage.trim() || null, resume_path_snapshot: null,\n        }).select("id").single();'''
new = '''      } else if (portalRole === "office" && selectedOpportunity.kind === "professional") {\n        if (!officeId || !selectedOpportunity.ownerProfessionalId) throw new Error("This professional opportunity is not available for interest yet.");\n        const { data: officePostings } = await supabase.from("job_listings").select("id,profession,employment_type,city,province,days_per_week,pay_min,pay_max,schedule,created_at").eq("office_id", officeId).eq("listing_type", "office_hiring").eq("status", "active").gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false });\n        const sourcePosting = (officePostings || []).find((job: any) => job.profession === selectedOpportunity.profession) || (officePostings || [])[0] || null;\n        const officeInterestSnapshot = sourcePosting ? { label: "Dental Office", city: sourcePosting.city, province: sourcePosting.province, profession: sourcePosting.profession, employment_type: sourcePosting.employment_type, days_per_week: sourcePosting.days_per_week, pay_min: sourcePosting.pay_min, pay_max: sourcePosting.pay_max, schedule: sourcePosting.schedule } : { label: "Dental Office", city: officeLocation.city, province: officeLocation.province, profession: selectedOpportunity.profession };\n        const { data: created, error } = await supabase.from("job_applications").insert({\n          listing_id: selectedOpportunity.id, professional_id: selectedOpportunity.ownerProfessionalId, office_id: officeId,\n          initiator_role: "office", status: "pending", message: null, resume_path_snapshot: null, source_office_listing_id: sourcePosting?.id || null, office_interest_snapshot: officeInterestSnapshot,\n        }).select("id").single();'''
if old not in text:
    raise SystemExit('legacy office interest anchor not found')
text = text.replace(old, new, 1)

page.write_text(text)

# Native marketplace: save the same safe snapshot when the office clicks I'm Interested.
native = Path('components/DentalJobsNativeMarketplace.tsx')
ntext = native.read_text()
old = '''      const { data, error: insertError } = await supabase\n        .from("job_applications")\n        .insert({\n          listing_id: listing.id,\n          professional_id: professionalId,\n          office_id: officeId,\n          initiator_role: "office",\n          status: "pending",\n          message: "",\n          resume_path_snapshot: null,\n        })'''
new = '''      const { data: officePostings } = await supabase\n        .from("job_listings")\n        .select("id,profession,employment_type,city,province,days_per_week,pay_min,pay_max,schedule,created_at")\n        .eq("office_id", officeId)\n        .eq("listing_type", "office_hiring")\n        .eq("status", "active")\n        .gt("expires_at", new Date().toISOString())\n        .order("created_at", { ascending: false });\n\n      const sourcePosting = (officePostings || []).find((job) => job.profession === listing.profession) || (officePostings || [])[0] || null;\n      const officeInterestSnapshot = sourcePosting\n        ? { label: "Dental Office", city: sourcePosting.city, province: sourcePosting.province, profession: sourcePosting.profession, employment_type: sourcePosting.employment_type, days_per_week: sourcePosting.days_per_week, pay_min: sourcePosting.pay_min, pay_max: sourcePosting.pay_max, schedule: sourcePosting.schedule }\n        : { label: "Dental Office", city: details.office?.city || details.profile.city || "", province: details.office?.province || details.profile.province || "", profession: listing.profession };\n\n      const { data, error: insertError } = await supabase\n        .from("job_applications")\n        .insert({\n          listing_id: listing.id,\n          professional_id: professionalId,\n          office_id: officeId,\n          initiator_role: "office",\n          status: "pending",\n          message: "",\n          resume_path_snapshot: null,\n          source_office_listing_id: sourcePosting?.id || null,\n          office_interest_snapshot: officeInterestSnapshot,\n        })'''
if old not in ntext:
    raise SystemExit('native office interest insert anchor not found')
ntext = ntext.replace(old, new, 1)
native.write_text(ntext)

print('Patched professional Office Interest card and privacy-safe office posting snapshots')
