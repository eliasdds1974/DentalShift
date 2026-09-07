from pathlib import Path
p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()
s = s.replace('  const [pairingNow, setPairingNow] = useState(() => Date.now());\n', '')
s = s.replace('  useEffect(() => { const timer = window.setInterval(() => setPairingNow(Date.now()), 60000); return () => window.clearInterval(timer); }, []);\n', '')
a = s.index('function interestAge(')
b = s.index('function OfficeCalendar(', a)
s = s[:a] + s[b:]
s = s.replace('  const selectedAvailability = data.availability\n', '  const interestedIds = new Set(selectedShifts.flatMap((shift) => (shift.applications || []).filter((application) => application.status === "applied").map((application) => application.professional_id)));\n  const selectedAvailability = data.availability\n    .filter((slot) => !interestedIds.has(slot.professional_id))\n')
s = s.replace('const pendingPairings = (shift.applications || []).filter((application) => application.status === "applied" || application.status === "invited");', 'const pendingPairings = applicants;')
s = s.replace('data.availability.filter((slot) => slot.professional_profiles?.profession === shift.profession', 'data.availability.filter((slot) => !interestedIds.has(slot.professional_id) && slot.professional_profiles?.profession === shift.profession')
a = s.index('                <div className="mt-4"><p className="text-xs font-black uppercase tracking-wide text-slate-500">Pairings (')
b = s.index('                {shift.status === "open" && availableMatches.length', a)
new = '''                {pendingPairings.length > 0 && <section className="mt-4 rounded-2xl bg-[#F21C13] p-2 sm:p-3"><h4 className="mb-3 text-center text-lg font-black text-white">Who’s Interested</h4><div className="space-y-3">{pendingPairings.map((application) => { const profile = application.professional_profiles; return <div key={application.id} className="rounded-xl bg-white p-4"><h5 className="font-black text-[#032757]">{profile?.profession || shift.profession}</h5><p className="mt-2 text-xs font-bold text-[#017f27]">{profile?.licence_province ? `Licence province: ${profile.licence_province}` : "Credential status unavailable"}</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600"><span>Rating: <strong>{profile?.rating ? `${profile.rating}★` : "No rating yet"}</strong></span><span>Completed: <strong>{profile?.completed_shifts || 0}</strong></span><span>Reliability: <strong>{profile?.reliability_score != null ? `${profile.reliability_score}%` : "Not enough history"}</strong></span><span>Requested rate: <strong>{application.proposed_rate != null ? `$${Number(application.proposed_rate).toFixed(2)}/hr` : "Not specified"}</strong></span></div><p className="mt-3 text-xs text-slate-500">Identity and contact details are shared after booking confirmation.</p><button disabled={busy === application.id} onClick={() => void act(application.id, () => acceptApplication(application.id))} className="primary-btn mt-3 w-full justify-center"><Check size={15} />{busy === application.id ? "Booking…" : "Book Now"}</button></div>; })}</div></section>}
'''
s = s[:a] + new + s[b:]
assert 'Interest open' not in s and 'pairingNow' not in s
p.write_text(s)
