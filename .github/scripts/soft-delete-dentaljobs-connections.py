from pathlib import Path

classifieds = Path('app/classifieds/page.tsx')
text = classifieds.read_text()

# Active connections only. Soft-deleted connections disappear for both sides.
old = '.select("id,listing_id,professional_id,office_id,initiator_role,status,message,resume_path_snapshot,created_at,professional_hidden_at,job_listings(profession,employment_type,city,province,listing_type)")\n      .order("created_at", { ascending: false });'
new = '.select("id,listing_id,professional_id,office_id,initiator_role,status,message,resume_path_snapshot,created_at,professional_hidden_at,deleted_at,job_listings(profession,employment_type,city,province,listing_type)")\n      .is("deleted_at", null)\n      .order("created_at", { ascending: false });'
if old not in text:
    raise SystemExit('loadConnections query anchor not found')
text = text.replace(old, new, 1)

# Replace professional-only hide with a shared soft delete that resets the connection for both portals.
start = text.find('  const deleteConnectionFromProfessionalView = async (connection: JobConnection) => {')
end = text.find('\n\n  const existingConnectionFor', start)
if start == -1 or end == -1:
    raise SystemExit('old delete handler not found')
handler = '''  const softDeleteConnection = async (connection: JobConnection) => {
    if (!portalRole || connectionDeletingId) return;
    if (!window.confirm("Delete this connection? It will be removed from both your office/professional DentalJobs connection lists and the interaction can be started again later.")) return;
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
text = text[:start] + handler + text[end:]

# Make connection cards positionable and insert a small soft-delete control in the upper-right.
old_article = 'return <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">'
new_article = '''return <article key={item.id} className="relative rounded-2xl border border-slate-200 bg-white p-4 pt-11 shadow-sm"><button type="button" disabled={connectionDeletingId === item.id} onClick={() => void softDeleteConnection(item)} className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-slate-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50" title="Delete connection"><Trash2 size={12}/>{connectionDeletingId === item.id ? "Deleting…" : "Delete"}</button><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">'''
if old_article not in text:
    raise SystemExit('connection card anchor not found')
text = text.replace(old_article, new_article, 1)

# Office-initiated pending interest is waiting on the professional; don't offer the office a decline button.
old_office_pending = ''' : <><button type="button" disabled={connectionBusy || unlockBusyId === item.id} onClick={() => void updateConnection(item,"declined")} className="rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 disabled:opacity-50">Not Interested</button><button type="button" disabled={unlockBusyId === item.id} onClick={() => void startCandidateUnlock(item)} className="inline-flex items-center gap-2 rounded-xl bg-[#01A32E] px-4 py-2.5 text-xs font-black text-white shadow-md hover:bg-[#018a28] disabled:opacity-50"><CreditCard size={15}/>{unlockBusyId === item.id ? "Unlocking…" : "Unlock Candidate — $29 CAD · billed monthly"}</button></>}'''
new_office_pending = ''' : initiatedByMe ? <span className="rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-black text-amber-700">Awaiting Response</span> : <><button type="button" disabled={connectionBusy || unlockBusyId === item.id} onClick={() => void updateConnection(item,"declined")} className="rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 disabled:opacity-50">Not Interested</button><button type="button" disabled={unlockBusyId === item.id} onClick={() => void startCandidateUnlock(item)} className="inline-flex items-center gap-2 rounded-xl bg-[#01A32E] px-4 py-2.5 text-xs font-black text-white shadow-md hover:bg-[#018a28] disabled:opacity-50"><CreditCard size={15}/>{unlockBusyId === item.id ? "Unlocking…" : "Unlock Candidate — $29 CAD · billed monthly"}</button></>}'''
if old_office_pending not in text:
    raise SystemExit('office pending actions anchor not found')
text = text.replace(old_office_pending, new_office_pending, 1)

classifieds.write_text(text)

native = Path('components/DentalJobsNativeMarketplace.tsx')
ntext = native.read_text()
old_native = 'let applicationQuery = supabase.from("job_applications").select("id,listing_id,status");'
new_native = 'let applicationQuery = supabase.from("job_applications").select("id,listing_id,status").is("deleted_at", null);'
if old_native not in ntext:
    raise SystemExit('native application query anchor not found')
ntext = ntext.replace(old_native, new_native, 1)
native.write_text(ntext)

print('Patched shared DentalJobs soft delete and office awaiting response behavior')
