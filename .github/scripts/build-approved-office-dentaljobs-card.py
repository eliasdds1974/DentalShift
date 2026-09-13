from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()
start = text.find('{portalRole === "office" && <section id="my-dentaljobs"')
end = text.find('\n\n        {portalRole === "professional" && <section', start)
if start == -1 or end == -1:
    raise SystemExit('office DentalJobs section not found')

section = r'''{portalRole === "office" && <section id="my-dentaljobs" className="relative w-full min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border-2 border-[#01A32E]/45 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-[#01A32E]/20 bg-[#f7fcf8] px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#017f27]">Office Postings</p>
                <h2 className="mt-1 text-2xl font-black text-[#002757]">My DentalJobs</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Manage your postings and review each professional who responds.</p>
              </div>
              <span className="rounded-full border border-[#01A32E]/25 bg-white px-4 py-2 text-sm font-black text-[#017f27]">{myOfficeJobs.length} posting{myOfficeJobs.length === 1 ? "" : "s"}</span>
            </div>
          </div>
          {manageError && <p className="m-5 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{manageError}</p>}
          {connectionError && <p className="m-5 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{connectionError}</p>}
          {unlockError && <div className="m-5 flex flex-col gap-2 rounded-xl bg-rose-50 p-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-bold text-rose-700">{unlockError}</p>{unlockError.toLowerCase().includes("credit card") && <button type="button" onClick={() => void setupBillingCard()} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#002757] px-3.5 py-2 text-xs font-black text-white"><CreditCard size={14}/> Add Card</button>}</div>}
          <div className="grid gap-5 p-4 sm:p-5">{myOfficeJobs.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm font-semibold text-slate-500">You have no DentalJobs postings yet.</div> : myOfficeJobs.map((job) => {
            const daysLeft = Math.max(0, Math.ceil((new Date(job.expires_at).getTime() - Date.now()) / 86400000));
            const isActive = job.status === "active" && daysLeft > 0;
            const displayStatus = job.status === "active" && daysLeft === 0 ? "expired" : job.status;
            const theme = getProfessionalCardTheme(job.profession);
            const jobConnections = connections.filter((item) => (item.listingId === job.id || item.sourceOfficeListingId === job.id) && item.status !== "declined" && item.status !== "withdrawn").sort((a, b) => {
              const rank = (item: JobConnection) => isCandidateUnlocked(item) ? 0 : item.initiatorRole === "office" && item.status === "interested" ? 1 : item.initiatorRole === "professional" && item.status === "pending" ? 2 : item.initiatorRole === "office" && item.status === "pending" ? 3 : 4;
              return rank(a) - rank(b) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            const newCount = jobConnections.filter((item) => item.initiatorRole === "professional" && item.status === "pending" && !isCandidateUnlocked(item)).length;
            const expanded = !!expandedOfficeInterestJobs[job.id];
            const shownConnections = expanded ? jobConnections : jobConnections.slice(0, 3);
            return <article key={job.id} className="overflow-hidden rounded-2xl border border-[#01A32E]/35 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-[#f5fbf6] to-white px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${isActive ? "bg-[#01A32E] text-white" : displayStatus === "paused" ? "bg-amber-50 text-amber-700" : displayStatus === "filled" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{displayStatus}</span>
                      {isActive && <span className="text-sm font-bold text-slate-500">{daysLeft} day{daysLeft === 1 ? "" : "s"} remaining</span>}
                      {newCount > 0 && <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">{newCount} New</span>}
                    </div>
                    <h3 className="mt-3 break-words text-xl font-black leading-tight text-[#002757] sm:text-2xl">{job.profession} — {job.employment_type}</h3>
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-slate-500">
                      <span className="inline-flex items-center gap-2"><MapPin size={16}/>{job.city}, {job.province}</span>
                      <span className="inline-flex items-center gap-2"><BriefcaseBusiness size={16}/>{job.employment_type}</span>
                      <span className="inline-flex items-center gap-2"><CalendarDays size={16}/>Posted {new Date(job.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>
                  <div className="flex min-w-[120px] items-center justify-center border-l border-slate-200 px-5 py-2 text-center max-lg:border-l-0 max-lg:border-t max-lg:pt-4">
                    <div><p className="text-3xl font-black text-[#01A32E]">{jobConnections.length}</p><p className="text-sm font-black text-[#017f27]">Interested</p></div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 border-y border-slate-200 bg-white px-5 py-4 sm:px-6">
                <button type="button" onClick={() => setOfficeManageListing(job)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#002757] px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#01A32E]"><MoreVertical size={16}/> Manage</button>
                <Link href={`/jobs/${job.id}?returnTo=${encodeURIComponent("/dental-jobs")}`} className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#002757]/25 bg-white px-5 py-2.5 text-sm font-black text-[#002757] transition hover:bg-[#edf3fa]"><FileText size={16}/> View Ad</Link>
                <div className="inline-flex shrink-0"><ShareListingButton listingId={job.id} compact /></div>
                <button type="button" onClick={() => openEditListing(job)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#002757]/25 bg-white px-5 py-2.5 text-sm font-black text-[#002757] transition hover:bg-[#edf3fa] sm:ml-auto"><Pencil size={16}/> Edit Posting</button>
              </div>
              <div className="bg-[#fbfdfc] px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="text-lg font-black text-[#002757]">Interested Dental Professionals ({jobConnections.length})</p></div>
                  {jobConnections.length > 3 && <button type="button" onClick={() => setExpandedOfficeInterestJobs((current) => ({ ...current, [job.id]: !expanded }))} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-[#002757]">{expanded ? "Show less" : `View all ${jobConnections.length}`}</button>}
                </div>
                {jobConnections.length === 0 ? <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center"><UserRound size={22} className="mx-auto text-slate-400"/><p className="mt-2 text-xs font-bold text-slate-500">When a professional selects I’m Interested or Apply to this Position, their card will appear here.</p></div> : <div className="mt-4 grid gap-4">{shownConnections.map((item) => {
                  const preview = item.candidatePreview;
                  const unlocked = isCandidateUnlocked(item);
                  const candidateProfession = preview?.profession || item.profession || "Dental Professional";
                  const statusLabel = unlocked ? "Connected" : item.initiatorRole === "office" && item.status === "interested" ? "Mutual Interest" : item.initiatorRole === "professional" && item.status === "pending" ? "New" : item.initiatorRole === "office" && item.status === "pending" ? "Awaiting Professional" : "Interested";
                  const statusClass = unlocked ? "bg-blue-100 text-blue-700" : statusLabel === "Mutual Interest" ? "bg-[#eaf8ee] text-[#017f27]" : statusLabel === "New" ? "bg-blue-100 text-blue-700" : "bg-amber-50 text-amber-700";
                  return <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
                      <div className="p-5 sm:p-6">
                        <div className="flex gap-4">
                          <div className="relative hidden h-16 w-16 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400 sm:grid"><UserRound size={34}/><span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-[#01A32E]"/></div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2"><p className="text-lg font-black text-[#002757]">{candidateProfession}</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${statusClass}`}>{statusLabel}</span></div>
                            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-500"><span className="inline-flex items-center gap-1.5"><MapPin size={15}/>{[preview?.safeCity || item.city, preview?.safeProvince || item.province].filter(Boolean).join(", ") || "Location not specified"}</span>{preview?.yearsExperience != null && <span className="inline-flex items-center gap-1.5"><BriefcaseBusiness size={15}/>{preview.yearsExperience} year{preview.yearsExperience === 1 ? "" : "s"} experience</span>}</div>
                            {preview?.skills?.length ? <div className="mt-4 flex flex-wrap gap-2">{preview.skills.slice(0, 5).map((skill) => <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">{skill}</span>)}</div> : null}
                            {preview?.summary && <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">{preview.summary}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col justify-center gap-3 border-t border-slate-200 bg-white p-5 lg:border-l lg:border-t-0">
                        {unlocked ? <>
                          <button type="button" disabled={unlockBusyId === item.id} onClick={() => void downloadMatchedResume(item)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#EA4335] px-4 py-2.5 text-sm font-black text-white"><Download size={16}/> Résumé / CV</button>
                          <button type="button" disabled={unlockBusyId === item.id} onClick={() => void viewUnlockedCandidate(item)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#01A32E]/30 bg-[#eaf8ee] px-4 py-2.5 text-sm font-black text-[#017f27]"><FileText size={16}/> View Candidate</button>
                          <button type="button" onClick={() => void openChat(item)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#002757] px-4 py-2.5 text-sm font-black text-white"><MessageCircle size={16}/> Message</button>
                          <button type="button" disabled={connectionDeletingId === item.id} onClick={() => void softDeleteConnection(item)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-black text-rose-600"><Trash2 size={16}/> Delete</button>
                        </> : item.initiatorRole === "professional" && item.status === "pending" ? <>
                          <button type="button" disabled={connectionBusy || unlockBusyId === item.id} onClick={() => void updateConnection(item, "declined")} className="min-h-12 rounded-xl border-2 border-rose-300 bg-white px-4 py-3 text-sm font-black text-rose-600">Not Interested</button>
                          <button type="button" disabled={unlockBusyId === item.id} onClick={() => void startCandidateUnlock(item)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#01A32E] px-4 py-3 text-sm font-black text-white shadow-sm"><CreditCard size={16}/>{unlockBusyId === item.id ? "Matching…" : "LET’S MATCH"}</button>
                          <p className="text-center text-xs font-semibold leading-5 text-slate-500">Contact details remain private until a match is made.</p>
                        </> : item.initiatorRole === "office" && item.status === "interested" ? <><button type="button" disabled={unlockBusyId === item.id} onClick={() => void startCandidateUnlock(item)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#01A32E] px-4 py-3 text-sm font-black text-white"><CreditCard size={16}/>{unlockBusyId === item.id ? "Matching…" : "LET’S MATCH"}</button><p className="text-center text-xs font-semibold leading-5 text-slate-500">Contact details remain private until a match is made.</p></> : <span className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-black text-amber-700">Awaiting Response</span>}
                      </div>
                    </div>
                  </div>;
                })}</div>}
              </div>
            </article>;
          })}</div>
        </section>}'''

text = text[:start] + section + text[end:]
path.write_text(text)
print('Built approved office posting + interested professionals card only')
