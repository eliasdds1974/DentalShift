from pathlib import Path
import re

page = Path('app/classifieds/page.tsx')
text = page.read_text()

# 1) Track expanded posting interest lists.
state_anchor = '  const [officeManageListing, setOfficeManageListing] = useState<OfficeJobListing | null>(null);\n'
state_insert = state_anchor + '  const [expandedOfficeInterestJobs, setExpandedOfficeInterestJobs] = useState<Record<string, boolean>>({});\n'
if state_anchor not in text:
    raise SystemExit('office manage state anchor not found')
if 'expandedOfficeInterestJobs' not in text:
    text = text.replace(state_anchor, state_insert, 1)

# 2) Keep source office posting id on each connection so office-initiated interest returns to the right posting card.
type_anchor = '  listingType: "office_hiring" | "professional_available";\n'
if 'sourceOfficeListingId?: string | null;' not in text:
    text = text.replace(type_anchor, type_anchor + '  sourceOfficeListingId?: string | null;\n', 1)

map_anchor = '        candidatePreview: previewMap.get(String(row.professional_id)) || (row.professional_interest_snapshot ? {'
if map_anchor not in text:
    raise SystemExit('connection mapping anchor not found')
# Insert sourceOfficeListingId just before candidatePreview mapping, once.
if 'sourceOfficeListingId: row.source_office_listing_id || null,' not in text:
    text = text.replace(map_anchor, '        sourceOfficeListingId: row.source_office_listing_id || null,\n' + map_anchor, 1)

# 3) Replace the office My DentalJobs section with posting-scoped interest management.
start = text.find('{portalRole === "office" && <section id="my-dentaljobs"')
end_marker = '\n\n        {portalRole === "professional" && <section'
end = text.find(end_marker, start)
if start == -1 or end == -1:
    raise SystemExit('office My DentalJobs section bounds not found')

new_section = r'''{portalRole === "office" && <section id="my-dentaljobs" className="relative h-full min-h-[250px] min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border-2 border-[#01A32E]/55 bg-[#effaf2] p-4 shadow-md sm:p-5"><div className="absolute inset-y-0 left-0 w-1.5 bg-[#01A32E]" /><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#017f27]">Office postings</p><h2 className="mt-1 text-xl font-black text-[#002757]">My DentalJobs</h2><p className="mt-1 text-sm text-slate-500">Manage each job and the professionals interested in it.</p></div><span className="rounded-full border border-[#01A32E]/30 bg-white px-3 py-1.5 text-xs font-black text-[#017f27] shadow-sm">{myOfficeJobs.length} posting{myOfficeJobs.length === 1 ? "" : "s"}</span></div>{manageError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{manageError}</p>}{connectionError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{connectionError}</p>}{unlockError && <div className="mt-3 flex flex-col gap-2 rounded-xl bg-rose-50 p-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-bold text-rose-700">{unlockError}</p>{unlockError.toLowerCase().includes("credit card") && <button type="button" onClick={() => void setupBillingCard()} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#002757] px-3.5 py-2 text-xs font-black text-white"><CreditCard size={14}/> Add Card</button>}</div>}<div className="mt-4 grid gap-4">{myOfficeJobs.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm font-semibold text-slate-500">You have no DentalJobs postings yet.</div> : myOfficeJobs.map((job) => {
          const daysLeft = Math.max(0, Math.ceil((new Date(job.expires_at).getTime() - Date.now()) / 86400000));
          const isActive = job.status === "active" && daysLeft > 0;
          const displayStatus = job.status === "active" && daysLeft === 0 ? "expired" : job.status;
          const theme = getProfessionalCardTheme(job.profession);
          const jobConnections = connections
            .filter((item) => (item.listingId === job.id || item.sourceOfficeListingId === job.id) && item.status !== "declined" && item.status !== "withdrawn")
            .sort((a, b) => {
              const rank = (item: JobConnection) => {
                if (isCandidateUnlocked(item)) return 0;
                if (item.initiatorRole === "office" && item.status === "interested") return 1;
                if (item.initiatorRole === "professional" && item.status === "pending") return 2;
                if (item.initiatorRole === "office" && item.status === "pending") return 3;
                return 4;
              };
              return rank(a) - rank(b) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
          const newCount = jobConnections.filter((item) => item.initiatorRole === "professional" && item.status === "pending" && !isCandidateUnlocked(item)).length;
          const mutualCount = jobConnections.filter((item) => item.initiatorRole === "office" && item.status === "interested" && !isCandidateUnlocked(item)).length;
          const expanded = !!expandedOfficeInterestJobs[job.id];
          const shownConnections = expanded ? jobConnections : jobConnections.slice(0, 3);
          return <article key={job.id} className="rounded-2xl border-2 bg-white p-5 shadow-sm" style={{ borderColor: theme.border }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${isActive ? "bg-[#eaf8ee] text-[#017f27]" : displayStatus === "paused" ? "bg-amber-50 text-amber-700" : displayStatus === "filled" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{displayStatus}</span>{isActive && <span className="text-xs font-bold text-slate-400">{daysLeft} day{daysLeft === 1 ? "" : "s"} remaining</span>}{newCount > 0 && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-black text-rose-700">{newCount} New</span>}{mutualCount > 0 && <span className="rounded-full bg-[#eaf8ee] px-2.5 py-1 text-[11px] font-black text-[#017f27]">{mutualCount} Mutual</span>}</div><h3 className="mt-2 font-black" style={{ color: theme.text }}>{job.profession} — {job.employment_type}</h3><p className="mt-1 text-sm text-slate-500">{job.city}, {job.province}</p><div className="mt-3"><ShareListingButton listingId={job.id} compact /></div></div><div className="flex w-full justify-end sm:w-auto"><button type="button" onClick={() => setOfficeManageListing(job)} className="inline-flex items-center justify-center gap-1 rounded-md bg-[#002757] px-2.5 py-1 text-[10px] font-black text-white shadow-sm transition hover:bg-[#01A32E]"><MoreVertical size={12}/> Manage</button></div></div>

            <div className="mt-5 border-t border-slate-200 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#017f27]">Interested Professionals</p><p className="mt-0.5 text-xs font-semibold text-slate-400">{jobConnections.length} active connection{jobConnections.length === 1 ? "" : "s"}</p></div>{jobConnections.length > 3 && <button type="button" onClick={() => setExpandedOfficeInterestJobs((current) => ({ ...current, [job.id]: !expanded }))} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-[#002757] hover:bg-slate-50">{expanded ? "Show less" : `View all ${jobConnections.length}`}</button>}</div>
              {jobConnections.length === 0 ? <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-400">No professionals have expressed interest in this posting yet.</div> : <div className="mt-3 grid gap-2">{shownConnections.map((item) => {
                const preview = item.candidatePreview;
                const unlocked = isCandidateUnlocked(item);
                const statusLabel = unlocked ? "Connected" : item.initiatorRole === "office" && item.status === "interested" ? "Mutual Interest" : item.initiatorRole === "professional" && item.status === "pending" ? "New Interest" : item.initiatorRole === "office" && item.status === "pending" ? "Awaiting Professional" : "Interested";
                const statusClass = unlocked ? "bg-blue-50 text-blue-700" : statusLabel === "Mutual Interest" ? "bg-[#eaf8ee] text-[#017f27]" : statusLabel === "New Interest" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700";
                return <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-black text-[#002757]">Dental Professional</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${statusClass}`}>{statusLabel}</span></div><p className="mt-1 text-sm font-bold text-slate-600">{preview?.profession || item.profession || "Dental Professional"}</p><p className="mt-0.5 text-xs font-semibold text-slate-400">{[preview?.safeCity || item.city, preview?.safeProvince || item.province].filter(Boolean).join(", ") || "Location not specified"}{preview?.yearsExperience != null ? ` · ${preview.yearsExperience} yr${preview.yearsExperience === 1 ? "" : "s"} experience` : ""}</p>{preview?.skills?.length ? <div className="mt-2 flex flex-wrap gap-1.5">{preview.skills.slice(0, 3).map((skill) => <span key={skill} className="rounded-md bg-white px-2 py-1 text-[10px] font-black text-slate-500 ring-1 ring-slate-200">{skill}</span>)}</div> : null}</div>
                    <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">{unlocked ? <><button type="button" disabled={unlockBusyId === item.id} onClick={() => void viewUnlockedCandidate(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#01A32E]/30 bg-[#eaf8ee] px-3 py-2 text-xs font-black text-[#017f27]"><FileText size={14}/> View Candidate</button><button type="button" onClick={() => void openChat(item)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#002757] px-3 py-2 text-xs font-black text-white"><MessageCircle size={14}/> Message</button></> : item.initiatorRole === "professional" && item.status === "pending" ? <><button type="button" disabled={connectionBusy || unlockBusyId === item.id} onClick={() => void updateConnection(item, "declined")} className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-600">Not Interested</button><button type="button" disabled={unlockBusyId === item.id} onClick={() => void startCandidateUnlock(item)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#01A32E] px-3 py-2 text-xs font-black text-white"><CreditCard size={14}/>{unlockBusyId === item.id ? "Unlocking…" : "Connect & Unlock — $29 CAD"}</button></> : item.initiatorRole === "office" && item.status === "interested" ? <button type="button" disabled={unlockBusyId === item.id} onClick={() => void startCandidateUnlock(item)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#01A32E] px-3 py-2 text-xs font-black text-white"><CreditCard size={14}/>{unlockBusyId === item.id ? "Unlocking…" : "Connect & Unlock — $29 CAD"}</button> : <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">Awaiting Response</span>}</div></div>
                </div>;
              })}</div>}
            </div>
          </article>;
        })}</div></section>}'''

text = text[:start] + new_section + text[end:]
page.write_text(text)
