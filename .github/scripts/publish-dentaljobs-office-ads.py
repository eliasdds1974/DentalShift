from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

# Give both sample and live cards one compatible type.
marker = 'const ads = ['
insert = '''type JobCard = {\n  id: string | number;\n  kind: "office" | "professional";\n  title: string;\n  name: string;\n  city: string;\n  distance: number;\n  profession: string;\n  employment: string;\n  pay: string;\n  posted: string;\n  featured: boolean;\n  description: string;\n};\n\nconst ads: JobCard[] = ['''
if marker not in text:
    raise RuntimeError('ads marker not found')
text = text.replace(marker, insert, 1)

# Add publishing state.
old_state = '  const [officeLocation, setOfficeLocation] = useState({ city: "", province: "AB" });'
new_state = '''  const [officeLocation, setOfficeLocation] = useState({ city: "", province: "AB" });\n  const [officeId, setOfficeId] = useState<string | null>(null);\n  const [liveAds, setLiveAds] = useState<JobCard[]>([]);\n  const [publishing, setPublishing] = useState(false);\n  const [publishError, setPublishError] = useState("");\n  const [posted, setPosted] = useState(false);'''
if old_state not in text:
    raise RuntimeError('officeLocation state not found')
text = text.replace(old_state, new_state, 1)

# Capture office id when account data loads.
old_loc = '          const city = details.office?.city || details.profile.city || "";\n          const province = details.office?.province || details.profile.province || "AB";\n          setOfficeLocation({ city, province });'
new_loc = '          const city = details.office?.city || details.profile.city || "";\n          const province = details.office?.province || details.profile.province || "AB";\n          setOfficeLocation({ city, province });\n          setOfficeId(details.office?.id || null);'
if old_loc not in text:
    raise RuntimeError('office location load block not found')
text = text.replace(old_loc, new_loc, 1)

# Load active persisted listings on page load.
effect_end = '''    if (portalRole === "office") {\n      void (async () => {\n        const { data: { user } } = await supabase.auth.getUser();\n        if (!user) return;\n        try {\n          const details = await loadAccountDetails(user.id);'''
if effect_end not in text:
    raise RuntimeError('useEffect office load start not found')

# Inject public listing loader immediately before the useEffect closes.
needle = '''    }\n  }, []);\n\n  const visibleAds = useMemo(() => ads.filter((ad) => {'''
replacement = '''    }\n\n    void (async () => {\n      const { data, error } = await supabase\n        .from("job_listings")\n        .select("id,listing_type,profession,employment_type,city,province,days_per_week,pay_min,pay_max,schedule,description,created_at")\n        .eq("status", "active")\n        .gt("expires_at", new Date().toISOString())\n        .order("created_at", { ascending: false });\n      if (error || !data) return;\n      setLiveAds(data.map((row) => {\n        const min = row.pay_min == null ? null : Number(row.pay_min);\n        const max = row.pay_max == null ? null : Number(row.pay_max);\n        const pay = min != null || max != null\n          ? `${min != null ? `$${min}` : ""}${min != null && max != null ? "–" : ""}${max != null ? `$${max}` : ""}/hr`\n          : "Compensation discussed privately";\n        return {\n          id: row.id,\n          kind: row.listing_type === "office_hiring" ? "office" as const : "professional" as const,\n          title: row.listing_type === "office_hiring" ? `${row.profession} — ${row.employment_type}` : `${row.profession} Looking for an Office`,\n          name: row.listing_type === "office_hiring" ? "Verified Dental Office" : "Verified DentalShift Professional",\n          city: `${row.city}, ${row.province}`,\n          distance: 0,\n          profession: row.profession,\n          employment: row.employment_type,\n          pay,\n          posted: "Recently",\n          featured: false,\n          description: row.description,\n        };\n      }));\n    })();\n  }, []);\n\n  const allAds = useMemo(() => [...liveAds, ...ads], [liveAds]);\n\n  const visibleAds = useMemo(() => allAds.filter((ad) => {'''
if needle not in text:
    raise RuntimeError('visibleAds insertion point not found')
text = text.replace(needle, replacement, 1)
text = text.replace('  }), [radius, kind, profession, query]);', '  }), [allAds, radius, kind, profession, query]);', 1)

# Add the real publish function before the page return.
needle = '''  const submitPreview = (event: FormEvent<HTMLFormElement>) => {\n    event.preventDefault();\n    const form = new FormData(event.currentTarget);'''
if needle not in text:
    raise RuntimeError('submitPreview not found')

insert_after = '''  const publishOfficeAd = async () => {\n    if (!preview || postingMode !== "office") return;\n    setPublishError("");\n    if (!officeId) {\n      setPublishError("DentalShift could not identify the signed-in office. Return to the office portal and try again.");\n      return;\n    }\n    setPublishing(true);\n    try {\n      const { data, error } = await supabase\n        .from("job_listings")\n        .insert({\n          listing_type: "office_hiring",\n          profession: preview.position,\n          office_id: officeId,\n          employment_type: preview.employment,\n          city: preview.city.trim(),\n          province: preview.province,\n          days_per_week: preview.days || null,\n          pay_min: preview.payFrom ? Number(preview.payFrom) : null,\n          pay_max: preview.payTo ? Number(preview.payTo) : null,\n          schedule: preview.schedule.trim() || null,\n          description: preview.description.trim(),\n          status: "active",\n          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),\n        })\n        .select("id")\n        .single();\n      if (error) throw error;\n\n      const pay = preview.payFrom || preview.payTo\n        ? `${preview.payFrom ? `$${preview.payFrom}` : ""}${preview.payFrom && preview.payTo ? "–" : ""}${preview.payTo ? `$${preview.payTo}` : ""}/hr`\n        : "Compensation discussed privately";\n      setLiveAds((current) => [{\n        id: data.id,\n        kind: "office",\n        title: `${preview.position} — ${preview.employment}`,\n        name: "Verified Dental Office",\n        city: `${preview.city}, ${preview.province}`,\n        distance: 0,\n        profession: preview.position,\n        employment: preview.employment,\n        pay,\n        posted: "Just now",\n        featured: false,\n        description: preview.description,\n      }, ...current]);\n      setPosted(true);\n      setKind("office");\n    } catch (value) {\n      setPublishError(value instanceof Error ? value.message : "The ad could not be published. Please try again.");\n    } finally {\n      setPublishing(false);\n    }\n  };\n\n'''
# Place publish function just before return.
return_marker = '  return <main className="min-h-screen bg-[#f5f8fb] text-slate-900">'
if return_marker not in text:
    raise RuntimeError('return marker not found')
text = text.replace(return_marker, insert_after + return_marker, 1)

# Reset posting state when creating a new office posting from the landing card.
text = text.replace('onClick={() => { setPostingMode("office"); setSubmitted(false); }}', 'onClick={() => { setPostingMode("office"); setSubmitted(false); setPosted(false); setPublishError(""); }}', 1)

# Add success screen before the existing review screen.
review_marker = '{submitted && preview ? <div className="p-5 sm:p-6">'
success = '''{posted ? <div className="p-8 text-center sm:p-10"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#eaf8ee] text-[#01A32E]"><Check size={32} strokeWidth={3} /></div><h3 className="mt-5 text-2xl font-black text-[#002757]">Your ad is now live</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Your anonymous DentalJobs posting has been published and is now visible in the active job listings. It will remain active for 30 days unless you close it earlier.</p><button type="button" onClick={() => { setPostingMode(null); setSubmitted(false); setPosted(false); setPreview(null); }} className="mt-6 rounded-xl bg-[#002757] px-5 py-3 text-sm font-black text-white">View DentalJobs</button></div> : submitted && preview ? <div className="p-5 sm:p-6">'''
if review_marker not in text:
    raise RuntimeError('review marker not found')
text = text.replace(review_marker, success, 1)

# Replace office review action button with Post Ad while preserving professional preview behavior.
old_buttons = '''<div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setSubmitted(false)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-[#002757]">Back to Edit</button><button type="button" onClick={() => setPostingMode(null)} className="rounded-xl bg-[#002757] px-5 py-3 text-sm font-black text-white">Close Preview</button></div>'''
new_buttons = '''{publishError && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{publishError}</p>}<div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" disabled={publishing} onClick={() => { setSubmitted(false); setPublishError(""); }} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-[#002757] disabled:opacity-50">Back to Edit</button>{postingMode === "office" ? <button type="button" disabled={publishing} onClick={() => void publishOfficeAd()} className="rounded-xl bg-[#01A32E] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#018a28] disabled:opacity-50">{publishing ? "Posting…" : "Post Ad"}</button> : <button type="button" onClick={() => setPostingMode(null)} className="rounded-xl bg-[#002757] px-5 py-3 text-sm font-black text-white">Close Preview</button>}</div>'''
if old_buttons not in text:
    raise RuntimeError('review buttons block not found')
text = text.replace(old_buttons, new_buttons, 1)

path.write_text(text)
print('Connected office DentalJobs preview to live Supabase publishing.')
