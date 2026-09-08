from pathlib import Path


def must_replace(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f"Missing expected block: {label}")
    return text.replace(old, new, 1)

# Professional portal
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()

s = must_replace(s,
'''function shortTime(value: string) {\n  return new Date(value).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });\n}\n''',
'''function shortTime(value: string) {\n  return new Date(value).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });\n}\n\nfunction interestElapsed(startedAt: string, nowMs: number) {\n  const total = Math.max(0, Math.floor((nowMs - new Date(startedAt).getTime()) / 1000));\n  const hours = Math.floor(total / 3600);\n  const minutes = Math.floor((total % 3600) / 60);\n  const seconds = total % 60;\n  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;\n}\n''', 'professional elapsed helper')

s = must_replace(s,
'''  const [availabilityOpen, setAvailabilityOpen] = useState(false);\n  const resultsRef = useRef<HTMLDivElement | null>(null);\n''',
'''  const [availabilityOpen, setAvailabilityOpen] = useState(false);\n  const [nowMs, setNowMs] = useState(() => Date.now());\n  const resultsRef = useRef<HTMLDivElement | null>(null);\n''', 'professional timer state')

s = must_replace(s,
'''  useEffect(() => { void refresh(); }, [userId, refreshKey]);\n\n  const signedRole = roleCode(profession);\n''',
'''  useEffect(() => { void refresh(); }, [userId, refreshKey]);\n  useEffect(() => {\n    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);\n    return () => window.clearInterval(timer);\n  }, []);\n\n  const signedRole = roleCode(profession);\n''', 'professional timer effect')

s = must_replace(s,
'''  const activeInterestDateKeys = useMemo(() => new Set(\n    applied\n      .filter((item) => item.application_kind === "application" && item.shifts)\n      .map((item) => localDateKey(item.shifts!.starts_at)),\n  ), [applied]);\n\n''',
'''  // Interest no longer changes availability or hides other qualifying office postings.\n''', 'remove single-day interest state')

s = must_replace(s,
'''    matchingOpen.forEach((shift) => {\n      const key = localDateKey(shift.starts_at);\n      if (!activeInterestDateKeys.has(key)) ensure(key).open += 1;\n    });\n''',
'''    matchingOpen.forEach((shift) => { ensure(localDateKey(shift.starts_at)).open += 1; });\n''', 'restore open counts')

s = must_replace(s,
'''  }, [matchingOpen, invitations, applied, booked, activeInterestDateKeys]);\n''',
'''  }, [matchingOpen, invitations, applied, booked]);\n''', 'counts dependency')

s = must_replace(s,
'''  const selectedInterest = selectedApplied.find((item) => item.application_kind === "application" && item.shifts) ?? null;\n  const visibleOpen = selectedInterest ? [] : selectedOpen.filter((shift) => !openShiftIdsAlreadyApplied.has(shift.id));\n''',
'''  const selectedInterests = selectedApplied.filter((item) => item.application_kind === "application" && item.shifts);\n  const visibleOpen = selectedOpen.filter((shift) => !openShiftIdsAlreadyApplied.has(shift.id));\n''', 'multiple selected interests')

s = must_replace(s,
'''            const availableOnDate = !activeInterestDateKeys.has(key) && workflow.availability.some((slot) => slot.available && localDateKey(slot.starts_at) === key);\n''',
'''            const availableOnDate = workflow.availability.some((slot) => slot.available && localDateKey(slot.starts_at) === key);\n''', 'availability remains visible')

s = must_replace(s,
'''              {visibleOpen.length > 0 && <span className="rounded-full bg-[#4285F4] px-2.5 py-1 text-white">{visibleOpen.length} Open</span>}\n''',
'''              {selectedOpen.length > 0 && <span className="rounded-full bg-[#4285F4] px-2.5 py-1 text-white">{selectedOpen.length} Open</span>}\n''', 'sidebar open count')

old_top = '''          <div className="mt-4 space-y-5">\n            {selectedInterest?.shifts && <section className="overflow-hidden rounded-3xl border-2 border-[#19a93b] bg-[#19a93b] shadow-[0_10px_28px_rgba(25,169,59,0.20)]">\n              <div className="flex items-center justify-between gap-2 px-4 py-3">\n                <h4 className="flex items-center gap-2 text-base font-black text-white"><span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[12px] font-black text-[#19a93b]">✓</span>I’m Interested</h4>\n                <span className="text-[10px] font-black uppercase tracking-wide text-white/90">Selected office</span>\n              </div>\n              <div className="m-2 rounded-2xl border-2 border-[#EA4335] bg-white p-1 shadow-sm">\n                <ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} shift={selectedInterest.shifts} tone="red" officeHeader action={<button type="button" disabled={busy === `cancel-interest-${selectedInterest.id}`} onClick={() => void run(`cancel-interest-${selectedInterest.id}`, () => cancelShiftInterest(selectedInterest.id))} className="secondary-btn w-full justify-center border-[#19a93b] font-black text-[#017f27] hover:bg-[#edf9f0]">{busy === `cancel-interest-${selectedInterest.id}` ? "Cancelling…" : "Cancel Interest"}</button>} />\n              </div>\n            </section>}\n            {!selectedInterest && (selectedAvailability.length > 0 ? <section className="rounded-2xl border border-[#34A853]/25 bg-green-50 p-4">\n              <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-[#34A853]">I’m Available</p>{selectedAvailability.map((slot) => <div key={slot.id}><p className="mt-1 text-sm font-black text-[#002757]">{shortTime(slot.starts_at)}–{shortTime(slot.ends_at)}</p><p className="mt-0.5 text-xs font-extrabold text-[#017f27]">${Number(slot.hourly_rate)}/hr</p></div>)}</div><button type="button" disabled={busy === selectedAvailability[0].id} onClick={() => void run(selectedAvailability[0].id, () => removeProfessionalAvailability(selectedAvailability[0].id)).then((removed) => { if (removed) setAvailabilityOpen(true); })} className="secondary-btn">Cancel / Repost</button></div>\n            </section> : <button type="button" onClick={() => setAvailabilityOpen(true)} className="secondary-btn w-full justify-center"><CalendarDays size={17} />Set my availability for this day</button>)}\n'''
new_top = '''          <div className="mt-4 space-y-5">\n            {selectedAvailability.length > 0 ? <section className="rounded-2xl border border-[#34A853]/25 bg-green-50 p-4">\n              <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-[#34A853]">I’m Available</p>{selectedAvailability.map((slot) => <div key={slot.id}><p className="mt-1 text-sm font-black text-[#002757]">{shortTime(slot.starts_at)}–{shortTime(slot.ends_at)}</p><p className="mt-0.5 text-xs font-extrabold text-[#017f27]">${Number(slot.hourly_rate)}/hr</p></div>)}</div><button type="button" disabled={busy === selectedAvailability[0].id} onClick={() => void run(selectedAvailability[0].id, () => removeProfessionalAvailability(selectedAvailability[0].id)).then((removed) => { if (removed) setAvailabilityOpen(true); })} className="secondary-btn">Cancel / Repost</button></div>\n            </section> : <button type="button" onClick={() => setAvailabilityOpen(true)} className="secondary-btn w-full justify-center"><CalendarDays size={17} />Set my availability for this day</button>}\n\n            {selectedInterests.map((interest) => interest.shifts ? <section key={interest.id} className="overflow-hidden rounded-3xl border-2 border-[#19a93b] bg-[#19a93b] shadow-[0_10px_28px_rgba(25,169,59,0.20)]">\n              <div className="flex items-center justify-between gap-2 px-4 py-3">\n                <h4 className="flex items-center gap-2 text-base font-black text-white"><span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[12px] font-black text-[#19a93b]">✓</span>I’m Interested</h4>\n                <span className="rounded-full bg-white px-2.5 py-1 font-mono text-xs font-black tabular-nums text-[#017f27]">{interestElapsed(interest.created_at, nowMs)}</span>\n              </div>\n              <div className="m-2 rounded-2xl border-2 border-[#EA4335] bg-white p-1 shadow-sm">\n                <ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} shift={interest.shifts} tone="red" officeHeader action={<button type="button" disabled={busy === `cancel-interest-${interest.id}`} onClick={() => void run(`cancel-interest-${interest.id}`, () => cancelShiftInterest(interest.id))} className="secondary-btn w-full justify-center border-[#19a93b] font-black text-[#017f27] hover:bg-[#edf9f0]">{busy === `cancel-interest-${interest.id}` ? "Cancelling…" : "Cancel Interest"}</button>} />\n              </div>\n            </section> : null)}\n'''
s = must_replace(s, old_top, new_top, 'availability and multiple interest cards')

s = must_replace(s,
'''<button type="button" disabled={Boolean(selectedInterest) || busy === `apply-${shift.id}`} onClick={() => void run(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn w-full justify-center disabled:cursor-not-allowed disabled:opacity-45">{busy === `apply-${shift.id}` ? "Saving…" : selectedInterest ? "Cancel current interest first" : "I’m Interested"}</button>''',
'''<button type="button" disabled={busy === `apply-${shift.id}`} onClick={() => void run(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn w-full justify-center disabled:cursor-not-allowed disabled:opacity-45">{busy === `apply-${shift.id}` ? "Saving…" : "I’m Interested"}</button>''', 'allow any office interest')

s = must_replace(s,
'''            {selectedApplied.filter((item) => item.id !== selectedInterest?.id).length > 0 && <section>\n              <h4 className="mb-2 flex items-center gap-2 font-black text-[#34A853]"><span className="h-3 w-3 rounded-full bg-[#34A853]" />Applied</h4>\n              <div className="space-y-3">{selectedApplied.filter((item) => item.id !== selectedInterest?.id).map((application) => application.shifts ? <ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} key={application.id} shift={application.shifts} tone="green" status="Applied" /> : null)}</div>\n            </section>}\n''',
'''            {selectedApplied.filter((item) => item.application_kind !== "application").length > 0 && <section>\n              <h4 className="mb-2 flex items-center gap-2 font-black text-[#34A853]"><span className="h-3 w-3 rounded-full bg-[#34A853]" />Applied</h4>\n              <div className="space-y-3">{selectedApplied.filter((item) => item.application_kind !== "application").map((application) => application.shifts ? <ShiftCard professionalLatitude={profile.latitude} professionalLongitude={profile.longitude} key={application.id} shift={application.shifts} tone="green" status="Applied" /> : null)}</div>\n            </section>}\n''', 'avoid duplicate application cards')

p.write_text(s)

# Office portal
p = Path('components/OfficeWorkspaceV2.tsx')
s = p.read_text()

s = must_replace(s,
'''function shortTime(value: string) {\n  return new Date(value).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });\n}\n''',
'''function shortTime(value: string) {\n  return new Date(value).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });\n}\n\nfunction interestElapsed(startedAt: string, nowMs: number) {\n  const total = Math.max(0, Math.floor((nowMs - new Date(startedAt).getTime()) / 1000));\n  const hours = Math.floor(total / 3600);\n  const minutes = Math.floor((total % 3600) / 60);\n  const seconds = total % 60;\n  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;\n}\n''', 'office elapsed helper')

s = must_replace(s,
'''  const [postShiftOpen, setPostShiftOpen] = useState(false);\n  const resultsRef = useRef<HTMLElement | null>(null);\n''',
'''  const [postShiftOpen, setPostShiftOpen] = useState(false);\n  const [nowMs, setNowMs] = useState(() => Date.now());\n  const resultsRef = useRef<HTMLElement | null>(null);\n''', 'office timer state')

s = must_replace(s,
'''  useEffect(() => { void refresh(); }, [office.id, refreshKey]);\n\n  useEffect(() => {\n    if (office.latitude != null && office.longitude != null) {\n''',
'''  useEffect(() => { void refresh(); }, [office.id, refreshKey]);\n  useEffect(() => {\n    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);\n    return () => window.clearInterval(timer);\n  }, []);\n\n  useEffect(() => {\n    if (office.latitude != null && office.longitude != null) {\n''', 'office timer effect')

old_applicant = '''return <div key={application.id} className="rounded-lg bg-white p-3"><h5 className="font-black text-[#032757]">{profile?.profession || shift.profession}</h5><p className="mt-1 text-[11px] font-bold text-[#017f27]">{profile?.licence_province ? `Licence province: ${profile.licence_province}` : "Credential status unavailable"}</p>'''
new_applicant = '''return <div key={application.id} className="rounded-lg bg-white p-3"><div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-[#eaf8ee] px-2.5 py-2"><span className="text-xs font-black text-[#017f27]">✓ I’m Interested</span><span className="font-mono text-xs font-black tabular-nums text-[#017f27]">{interestElapsed(application.created_at, nowMs)}</span></div><h5 className="font-black text-[#032757]">{profile?.profession || shift.profession}</h5><p className="mt-1 text-[11px] font-bold text-[#017f27]">{profile?.licence_province ? `Licence province: ${profile.licence_province}` : "Credential status unavailable"}</p>'''
s = must_replace(s, old_applicant, new_applicant, 'office applicant interest timer')

p.write_text(s)
