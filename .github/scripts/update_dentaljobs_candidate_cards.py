from pathlib import Path

p = Path('app/classifieds/page.tsx')
s = p.read_text()

s = s.replace('professional_hidden_at,deleted_at,source_office_listing_id', 'professional_hidden_at,office_hidden_at,deleted_at,source_office_listing_id', 1)
s = s.replace('const rows = (data as any[]).filter((row) => effectiveRole !== "professional" || !row.professional_hidden_at);', 'const rows = (data as any[]).filter((row) => effectiveRole === "professional" ? !row.professional_hidden_at : effectiveRole === "office" ? !row.office_hidden_at : true);', 1)

s = s.replace('''  const openConnection = (ad: JobCard) => {
    setConnectionError("");
    setConnectionMessage("");
    setSelectedOpportunity(ad);
  };''', '''  const openConnection = (ad: JobCard) => {
    setConnectionError("");
    setConnectionMessage("");
    if (portalRole === "professional" && ad.kind === "office" && !resumePath) {
      window.alert("Résumé/CV Required\\n\\nYou need to upload a résumé or CV to your Professional Account before you can apply for DentalJobs positions.");
      return;
    }
    setSelectedOpportunity(ad);
  };''', 1)

s = s.replace('if (!professionalId || !selectedOpportunity.ownerOfficeId) throw new Error("This opportunity is not available for applications yet.");', 'if (!professionalId || !selectedOpportunity.ownerOfficeId) throw new Error("This opportunity is not available for applications yet.");\n        if (!resumePath) throw new Error("A résumé/CV is required before you can apply for a DentalJobs position.");', 1)

old = '''  const softDeleteConnection = async (connection: JobConnection) => {
    if (!portalRole || connectionDeletingId) return;
    if (!window.confirm("Delete this connection? It will be removed from both the office and professional DentalJobs connection lists. Either side can start the interaction again later.")) return;
    setConnectionDeletingId(connection.id);
    setConnectionError("");
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", connection.id);
      if (error) throw error;
      setConnections((current) => current.filter((item) => item.id !== connection.id));
      if (activeChat?.id === connection.id) setActiveChat(null);
    } catch (value) {
      setConnectionError(value instanceof Error ? value.message : "Could not delete this connection.");
    } finally {
      setConnectionDeletingId(null);
    }
  };'''
new = '''  const softDeleteConnection = async (connection: JobConnection) => {
    if (!portalRole || connectionDeletingId) return;
    const matchedOfficeCard = portalRole === "office" && isCandidateUnlocked(connection);
    const message = matchedOfficeCard ? "Remove this matched professional card from your office view? The match and billing history will be retained." : "Delete this connection? It will be removed from both DentalJobs connection lists.";
    if (!window.confirm(message)) return;
    setConnectionDeletingId(connection.id);
    setConnectionError("");
    try {
      const values = matchedOfficeCard ? { office_hidden_at: new Date().toISOString(), updated_at: new Date().toISOString() } : { deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const { error } = await supabase.from("job_applications").update(values).eq("id", connection.id);
      if (error) throw error;
      setConnections((current) => current.filter((item) => item.id !== connection.id));
      if (activeChat?.id === connection.id) setActiveChat(null);
    } catch (value) {
      setConnectionError(value instanceof Error ? value.message : "Could not delete this connection.");
    } finally {
      setConnectionDeletingId(null);
    }
  };'''
if old not in s:
    raise SystemExit('delete block not found')
s = s.replace(old, new, 1)

anchor = '  const loadNotifications = async () => {'
helper = '''  const downloadMatchedResume = async (connection: JobConnection) => {
    setUnlockBusyId(connection.id);
    setUnlockError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in again.");
      const response = await fetch("/api/dentaljobs/unlock/details", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: connection.id }),
      });
      const result = await response.json();
      if (!response.ok || !result.unlocked) throw new Error(result.error || "Candidate details are still locked.");
      if (!result.candidate?.resumeUrl) throw new Error("This matched professional does not have a résumé/CV available.");
      window.open(result.candidate.resumeUrl, "_blank", "noopener,noreferrer");
    } catch (value) {
      setUnlockError(value instanceof Error ? value.message : "Could not open the résumé/CV.");
    } finally { setUnlockBusyId(null); }
  };

'''
if anchor not in s:
    raise SystemExit('notification anchor not found')
s = s.replace(anchor, helper + anchor, 1)

start = s.find('              <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(220px,.8fr)]">')
end = s.find('\n\n              <div className="mt-5 border-t border-slate-200 pt-5">', start)
if start < 0 or end < 0:
    raise SystemExit('office summary block not found')
s = s[:start] + '''              <div className="mt-5 border-t border-slate-200 pt-5">
                <p className="text-sm font-black text-[#002757]">Interested Dental Professionals</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-400">{jobConnections.length === 0 ? "No professional responses yet." : `${jobConnections.length} professional${jobConnections.length === 1 ? "" : "s"} responded to this ad.`}</p>
              </div>''' + s[end:]

old_actions = '''{unlocked ? <><button type="button" disabled={unlockBusyId === item.id} onClick={() => void viewUnlockedCandidate(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#01A32E]/30 bg-[#eaf8ee] px-3 py-2 text-xs font-black text-[#017f27]"><FileText size={14}/> View Candidate</button><button type="button" onClick={() => void openChat(item)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#002757] px-3 py-2 text-xs font-black text-white"><MessageCircle size={14}/> Message</button></>'''
new_actions = '''{unlocked ? <><button type="button" disabled={unlockBusyId === item.id} onClick={() => void downloadMatchedResume(item)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#EA4335] px-3 py-2 text-xs font-black text-white"><Download size={14}/> Résumé / CV</button><button type="button" disabled={unlockBusyId === item.id} onClick={() => void viewUnlockedCandidate(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#01A32E]/30 bg-[#eaf8ee] px-3 py-2 text-xs font-black text-[#017f27]"><FileText size={14}/> View Candidate</button><button type="button" onClick={() => void openChat(item)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#002757] px-3 py-2 text-xs font-black text-white"><MessageCircle size={14}/> Message</button><button type="button" disabled={connectionDeletingId === item.id} onClick={() => void softDeleteConnection(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-600"><Trash2 size={14}/> Delete</button></>'''
if old_actions not in s:
    raise SystemExit('matched actions not found')
s = s.replace(old_actions, new_actions, 1)

p.write_text(s)
print('updated candidate cards, resume guard, matched resume and delete behavior')
