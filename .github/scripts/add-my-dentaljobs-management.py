from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

# Add management icon import.
old = 'import { BriefcaseBusiness, Building2, Check, ChevronLeft, Clock3, FileText, Filter, MapPin, Search, ShieldCheck, Star, UserRound, X } from "lucide-react";'
new = 'import { BriefcaseBusiness, Building2, Check, ChevronLeft, Clock3, FileText, Filter, MapPin, MoreVertical, Pencil, Pause, Play, RefreshCw, Search, ShieldCheck, Star, Trash2, UserRound, X } from "lucide-react";'
if old not in text: raise RuntimeError('icon import not found')
text = text.replace(old,new,1)

# Add type.
marker = 'type PostingMode = "office" | "professional" | null;'
insert = '''type OfficeJobListing = {\n  id: string;\n  profession: string;\n  employment_type: string;\n  city: string;\n  province: string;\n  days_per_week: string | null;\n  pay_min: number | null;\n  pay_max: number | null;\n  schedule: string | null;\n  description: string;\n  status: string;\n  expires_at: string;\n  created_at: string;\n};\n\n'''+marker
if marker not in text: raise RuntimeError('PostingMode marker missing')
text=text.replace(marker,insert,1)

# Add state.
marker='  const [portalRole, setPortalRole] = useState<"office" | "professional" | null>(null);'
insert=marker+'''\n  const [myOfficeJobs, setMyOfficeJobs] = useState<OfficeJobListing[]>([]);\n  const [managingId, setManagingId] = useState<string | null>(null);\n  const [editingListing, setEditingListing] = useState<OfficeJobListing | null>(null);\n  const [manageError, setManageError] = useState("");'''
if marker not in text: raise RuntimeError('portal role state missing')
text=text.replace(marker,insert,1)

# Insert helper functions before publishOfficeAd.
marker='  const publishOfficeAd = async () => {'
helpers='''  const loadMyOfficeJobs = async (targetOfficeId: string) => {\n    const { data, error } = await supabase\n      .from("job_listings")\n      .select("id,profession,employment_type,city,province,days_per_week,pay_min,pay_max,schedule,description,status,expires_at,created_at")\n      .eq("office_id", targetOfficeId)\n      .eq("listing_type", "office_hiring")\n      .order("created_at", { ascending: false });\n    if (!error && data) setMyOfficeJobs(data as OfficeJobListing[]);\n  };\n\n  const manageOfficeJob = async (listing: OfficeJobListing, action: "pause" | "resume" | "filled" | "renew" | "close" | "delete") => {\n    setManageError("");\n    setManagingId(listing.id);\n    try {\n      if (action === "delete") {\n        if (!window.confirm("Permanently delete this posting? This cannot be undone.")) return;\n        const { error } = await supabase.from("job_listings").delete().eq("id", listing.id);\n        if (error) throw error;\n      } else {\n        const now = new Date().toISOString();\n        const values: Record<string, unknown> = { updated_at: now };\n        if (action === "pause") values.status = "paused";\n        if (action === "resume") { values.status = "active"; values.closed_at = null; values.close_reason = null; }\n        if (action === "filled") { values.status = "filled"; values.closed_at = now; values.close_reason = "position_filled"; }\n        if (action === "close") { values.status = "closed"; values.closed_at = now; values.close_reason = "closed_by_office"; }\n        if (action === "renew") { values.status = "active"; values.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); values.closed_at = null; values.close_reason = null; }\n        const { error } = await supabase.from("job_listings").update(values).eq("id", listing.id);\n        if (error) throw error;\n      }\n      if (officeId) await loadMyOfficeJobs(officeId);\n      setLiveAds((current) => current.filter((ad) => ad.id !== listing.id));\n      if (["resume","renew"].includes(action)) window.location.reload();\n    } catch (value) {\n      setManageError(value instanceof Error ? value.message : "Could not update this posting.");\n    } finally {\n      setManagingId(null);\n    }\n  };\n\n  const openEditListing = (listing: OfficeJobListing) => {\n    setEditingListing(listing);\n    setPostingMode("office");\n    setSubmitted(false);\n    setPosted(false);\n    setPublishError("");\n    setPreview(null);\n  };\n\n  const saveEditedOfficeAd = async () => {\n    if (!editingListing || !preview) return;\n    setPublishing(true);\n    setPublishError("");\n    try {\n      const { error } = await supabase.from("job_listings").update({\n        profession: preview.position, employment_type: preview.employment, city: preview.city.trim(), province: preview.province,\n        days_per_week: preview.days || null, pay_min: preview.payFrom ? Number(preview.payFrom) : null, pay_max: preview.payTo ? Number(preview.payTo) : null,\n        schedule: preview.schedule.trim() || null, description: preview.description.trim(), updated_at: new Date().toISOString()\n      }).eq("id", editingListing.id);\n      if (error) throw error;\n      if (officeId) await loadMyOfficeJobs(officeId);\n      setPosted(true);\n      setEditingListing(null);\n    } catch (value) {\n      setPublishError(value instanceof Error ? value.message : "The changes could not be saved.");\n    } finally { setPublishing(false); }\n  };\n\n'''+marker
if marker not in text: raise RuntimeError('publish marker missing')
text=text.replace(marker,helpers,1)

# Load own office jobs when account is loaded.
old='          setOfficeId(details.office?.id || null);'
new='          setOfficeId(details.office?.id || null);\n          if (details.office?.id) await loadMyOfficeJobs(details.office.id);'
if old not in text: raise RuntimeError('setOfficeId missing')
text=text.replace(old,new,1)

# After posting, refresh own jobs.
old='      setPosted(true);\n      setKind("office");'
new='      setPosted(true);\n      setKind("office");\n      if (officeId) await loadMyOfficeJobs(officeId);'
if old not in text: raise RuntimeError('post success missing')
text=text.replace(old,new,1)

# Add My DentalJobs section after action cards and before filters.
needle='''        </div>\n\n        <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-[#f8fafc] p-3 md:grid-cols-[1.4fr_.8fr_.9fr] lg:grid-cols-[1.5fr_.7fr_.9fr_auto]">'''
section='''        </div>\n\n        {portalRole === "office" && <section className="mt-6 rounded-2xl border border-slate-200 bg-[#f8fafc] p-4 sm:p-5"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#01A32E]">Office postings</p><h2 className="mt-1 text-xl font-black text-[#002757]">My DentalJobs</h2><p className="mt-1 text-sm text-slate-500">Manage your active and previous job ads.</p></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-500">{myOfficeJobs.length} posting{myOfficeJobs.length === 1 ? "" : "s"}</span></div>{manageError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{manageError}</p>}<div className="mt-4 grid gap-3">{myOfficeJobs.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm font-semibold text-slate-500">You have no DentalJobs postings yet.</div> : myOfficeJobs.map((job) => { const daysLeft = Math.max(0, Math.ceil((new Date(job.expires_at).getTime() - Date.now()) / 86400000)); const isActive = job.status === "active" && daysLeft > 0; const displayStatus = job.status === "active" && daysLeft === 0 ? "expired" : job.status; return <article key={job.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${isActive ? "bg-[#eaf8ee] text-[#017f27]" : displayStatus === "paused" ? "bg-amber-50 text-amber-700" : displayStatus === "filled" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{displayStatus}</span>{isActive && <span className="text-xs font-bold text-slate-400">{daysLeft} day{daysLeft === 1 ? "" : "s"} remaining</span>}</div><h3 className="mt-2 font-black text-slate-900">{job.profession} — {job.employment_type}</h3><p className="mt-1 text-sm text-slate-500">{job.city}, {job.province}</p></div><div className="relative"><button type="button" onClick={() => setManagingId(managingId === job.id ? null : job.id)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#002757]/15 bg-white px-4 py-2.5 text-sm font-black text-[#002757] sm:w-auto">Manage Posting <MoreVertical size={16} /></button>{managingId === job.id && <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"><button type="button" onClick={() => openEditListing(job)} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><Pencil size={15}/> Edit Posting</button>{displayStatus === "paused" ? <button type="button" onClick={() => void manageOfficeJob(job,"resume")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><Play size={15}/> Resume Posting</button> : isActive && <button type="button" onClick={() => void manageOfficeJob(job,"pause")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><Pause size={15}/> Pause Posting</button>}<button type="button" onClick={() => void manageOfficeJob(job,"filled")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><Check size={15}/> Mark Position Filled</button><button type="button" onClick={() => void manageOfficeJob(job,"renew")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><RefreshCw size={15}/> Renew for 30 Days</button><button type="button" onClick={() => void manageOfficeJob(job,"close")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><X size={15}/> Close Posting</button><button type="button" onClick={() => void manageOfficeJob(job,"delete")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50"><Trash2 size={15}/> Delete Posting</button></div>}</div></div></article>})}</div></section>}\n\n        <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-[#f8fafc] p-3 md:grid-cols-[1.4fr_.8fr_.9fr] lg:grid-cols-[1.5fr_.7fr_.9fr_auto]">'''
if needle not in text: raise RuntimeError('action cards/filter boundary missing')
text=text.replace(needle,section,1)

# Edit form defaults.
text=text.replace('name="position" required defaultValue=""','name="position" required defaultValue={editingListing?.profession || ""}',1)
text=text.replace('name="employment" required defaultValue="Full-Time"','name="employment" required defaultValue={editingListing?.employment_type || "Full-Time"}',1)
text=text.replace('defaultValue={postingMode === "office" ? officeLocation.city : ""}','defaultValue={editingListing?.city || (postingMode === "office" ? officeLocation.city : "")}',1)
text=text.replace('defaultValue={postingMode === "office" ? officeLocation.province : "AB"}','defaultValue={editingListing?.province || (postingMode === "office" ? officeLocation.province : "AB")}',1)
text=text.replace('name="days" defaultValue="4"','name="days" defaultValue={editingListing?.days_per_week || "4"}',1)
text=text.replace('name="pay_from" type="number"','name="pay_from" defaultValue={editingListing?.pay_min ?? ""} type="number"',1)
text=text.replace('name="pay_to" type="number"','name="pay_to" defaultValue={editingListing?.pay_max ?? ""} type="number"',1)
text=text.replace('name="schedule" placeholder=','name="schedule" defaultValue={editingListing?.schedule || ""} placeholder=',1)
text=text.replace('name="description" required rows={5}','name="description" defaultValue={editingListing?.description || ""} required rows={5}',1)

# Modal headings for edit.
text=text.replace('{postingMode === "office" ? "Post a Position" : "Looking for an Office"}','{editingListing ? "Edit Posting" : postingMode === "office" ? "Post a Position" : "Looking for an Office"}',1)

# Review publish button saves edit when relevant.
old='<button type="button" disabled={publishing} onClick={() => void publishOfficeAd()} className="rounded-xl bg-[#01A32E] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#018a28] disabled:opacity-50">{publishing ? "Posting…" : "Post Ad"}</button>'
new='<button type="button" disabled={publishing} onClick={() => void (editingListing ? saveEditedOfficeAd() : publishOfficeAd())} className="rounded-xl bg-[#01A32E] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#018a28] disabled:opacity-50">{publishing ? (editingListing ? "Saving…" : "Posting…") : (editingListing ? "Save Changes" : "Post Ad")}</button>'
if old not in text: raise RuntimeError('Post Ad button missing')
text=text.replace(old,new,1)

# New posting should clear editing state.
text=text.replace('setPostingMode("office"); setSubmitted(false); setPosted(false); setPublishError("");','setEditingListing(null); setPostingMode("office"); setSubmitted(false); setPosted(false); setPublishError("");',1)

path.write_text(text)
print('Added My DentalJobs office management controls.')
