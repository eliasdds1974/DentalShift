from pathlib import Path

# Make /?signin=1 open the existing Choose your sign-in dialog.
p = Path('app/page.tsx')
s = p.read_text()
needle = '  const [refreshKey, setRefreshKey] = useState(0);\n\n  const navigate = useCallback'
insert = '''  const [refreshKey, setRefreshKey] = useState(0);\n\n  useEffect(() => {\n    const params = new URLSearchParams(window.location.search);\n    if (params.get("signin") !== "1") return;\n    setAccountIntent({ mode: "signin", role: "office" });\n    setAccountOpen(true);\n    const clean = new URL(window.location.href);\n    clean.searchParams.delete("signin");\n    window.history.replaceState(null, "", `${clean.pathname}${clean.search}${clean.hash}`);\n  }, []);\n\n  const navigate = useCallback'''
assert needle in s, 'app/page.tsx refreshKey anchor not found'
s = s.replace(needle, insert, 1)
p.write_text(s)

# Add sharing controls to DentalJobs owner cards and public listing cards.
p = Path('app/classifieds/page.tsx')
s = p.read_text()
import_anchor = 'import { loadAccountDetails } from "@/lib/dentalshift";'
assert import_anchor in s, 'classifieds import anchor not found'
s = s.replace(import_anchor, 'import { ShareListingButton } from "@/components/ShareListingButton";\n' + import_anchor, 1)

owner_anchor = '<p className="mt-1 text-sm text-slate-500">{job.city}, {job.province}</p></div><div className="relative">'
owner_replace = '<p className="mt-1 text-sm text-slate-500">{job.city}, {job.province}</p><div className="mt-3"><ShareListingButton listingId={job.id} compact /></div></div><div className="relative">'
count = s.count(owner_anchor)
assert count >= 2, f'expected owner card anchors, found {count}'
s = s.replace(owner_anchor, owner_replace, 2)

public_anchor = '<span className={`text-xs font-black ${ad.kind === "office" ? "text-[#002757]" : ""}`} style={ad.kind === "professional" ? { color: getProfessionalCardTheme(ad.profession).text } : undefined}>{ad.kind === "office" ? "Anonymous office opportunity" : "Anonymous professional profile"}</span>{(() => {'
public_replace = '<span className={`text-xs font-black ${ad.kind === "office" ? "text-[#002757]" : ""}`} style={ad.kind === "professional" ? { color: getProfessionalCardTheme(ad.profession).text } : undefined}>{ad.kind === "office" ? "Anonymous office opportunity" : "Anonymous professional profile"}</span><div className="flex flex-wrap items-center justify-end gap-2">{typeof ad.id === "string" && <ShareListingButton listingId={ad.id} compact />}{(() => {'
assert public_anchor in s, 'public listing footer anchor not found'
s = s.replace(public_anchor, public_replace, 1)
public_end = '>{label}</button>; })()}</div></article>)}</div>'
public_end_replace = '>{label}</button>; })()}</div></div></article>)}</div>'
assert public_end in s, 'public listing footer closing anchor not found'
s = s.replace(public_end, public_end_replace, 1)
p.write_text(s)
