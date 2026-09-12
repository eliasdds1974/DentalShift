from pathlib import Path
import re

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
text = text[:start] + handler + text[end:]

# The current card already has a professional-only delete button. Make it shared by both portals.
pattern = re.compile(r'\{portalRole === "professional" && (<button type="button" disabled=\{connectionDeletingId === item\.id\} onClick=\{\(\) => void deleteConnectionFromProfessionalView\(item\)\}.*?</button>)\}', re.S)
match = pattern.search(text)
if not match:
    raise SystemExit('professional delete button anchor not found')
shared_button = match.group(1).replace('deleteConnectionFromProfessionalView(item)', 'softDeleteConnection(item)')
text = text[:match.start()] + shared_button + text[match.end():]

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
