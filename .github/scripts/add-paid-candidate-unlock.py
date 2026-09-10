from pathlib import Path
import re

path = Path('app/classifieds/page.tsx')
text = path.read_text()

old_import = 'import { Bell, BriefcaseBusiness, Building2, Check, ChevronLeft, Clock3, FileText, Filter, LockKeyhole, MapPin, MessageCircle, MoreVertical, Pencil, Pause, Play, RefreshCw, Search, Send, ShieldCheck, Star, Trash2, UserRound, X } from "lucide-react";'
new_import = 'import { Bell, BriefcaseBusiness, Building2, Check, ChevronLeft, Clock3, CreditCard, Download, FileText, Filter, LockKeyhole, Mail, MapPin, MessageCircle, MoreVertical, Pencil, Pause, Phone, Play, RefreshCw, Search, Send, ShieldCheck, Star, Trash2, UserRound, X } from "lucide-react";'
assert old_import in text
text = text.replace(old_import, new_import, 1)

type_anchor = '''type DentalJobsNotification = {
  id: string;
  applicationId: string;
  eventType: "application_created" | "response_interested" | "response_declined" | "chat_message";
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};
'''
assert type_anchor in text
text = text.replace(type_anchor, type_anchor + '''
type UnlockedCandidate = {
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  address: string | null;
  postalCode: string | null;
  profession: string | null;
  licenceNumber: string | null;
  licenceProvince: string | null;
  resumeUrl: string | null;
};
''', 1)

state_anchor = '  const [notificationsOpen, setNotificationsOpen] = useState(false);\n'
assert state_anchor in text
text = text.replace(state_anchor, state_anchor + '''  const [paidUnlockPairs, setPaidUnlockPairs] = useState<string[]>([]);
  const [unlockBusyId, setUnlockBusyId] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState("");
  const [unlockedCandidate, setUnlockedCandidate] = useState<UnlockedCandidate | null>(null);
''', 1)

# Add loading of paid unlock status after notifications in both role bootstraps.
text = text.replace('          await loadNotifications();\n        } catch {', '          await loadNotifications();\n          await loadUnlocks();\n        } catch {', 2)

func_anchor = '  const loadNotifications = async () => {\n'
assert func_anchor in text
helpers = '''  const loadUnlocks = async () => {
    const { data, error } = await supabase.from("candidate_unlocks").select("office_id,professional_id,status").eq("status", "paid");
    if (error || !data) return;
    setPaidUnlockPairs(data.map((row: any) => `${row.office_id}:${row.professional_id}`));
  };

  const isCandidateUnlocked = (connection: JobConnection) => paidUnlockPairs.includes(`${connection.officeId}:${connection.professionalId}`);

  const startCandidateUnlock = async (connection: JobConnection) => {
    setUnlockBusyId(connection.id);
    setUnlockError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in again.");
      const response = await fetch("/api/dentaljobs/unlock/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: connection.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not start candidate unlock.");
      if (result.unlocked) {
        await loadUnlocks();
        await viewUnlockedCandidate(connection);
        return;
      }
      if (!result.checkoutUrl) throw new Error("Stripe checkout could not be opened.");
      window.location.assign(result.checkoutUrl);
    } catch (value) {
      setUnlockError(value instanceof Error ? value.message : "Could not unlock this candidate.");
    } finally { setUnlockBusyId(null); }
  };

  const viewUnlockedCandidate = async (connection: JobConnection) => {
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
      setUnlockedCandidate(result.candidate as UnlockedCandidate);
    } catch (value) {
      setUnlockError(value instanceof Error ? value.message : "Could not load unlocked candidate details.");
    } finally { setUnlockBusyId(null); }
  };

'''
text = text.replace(func_anchor, helpers + func_anchor, 1)

# Update applicant-side privacy copy now that the actual paid unlock exists.
text = text.replace('Your original résumé, name and direct contact details stay private until a future candidate-unlock step.', 'Your original résumé, name and direct contact details stay private until a dental office purchases Candidate Unlock.')

# Replace the connection action block with paid unlock-aware controls.
old = '''{item.status === "pending" && <div className="flex flex-wrap gap-2 sm:justify-end">{initiatedByMe ? <button type="button" disabled={connectionBusy} onClick={() => void updateConnection(item,"withdrawn")} className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50">Withdraw</button> : <><button type="button" disabled={connectionBusy} onClick={() => void updateConnection(item,"declined")} className="rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 disabled:opacity-50">Not Interested</button><button type="button" disabled={connectionBusy} onClick={() => void updateConnection(item,"interested")} className="rounded-xl bg-[#01A32E] px-3.5 py-2 text-xs font-black text-white shadow-sm hover:bg-[#018a28] disabled:opacity-50">Interested</button></>}</div>}{item.status === "interested" && <div className="flex sm:justify-end"><button type="button" onClick={() => void openChat(item)} className="inline-flex items-center gap-2 rounded-xl bg-[#002757] px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#01A32E] hover:shadow-lg"><MessageCircle size={15}/> Message</button></div>}'''
assert old in text
new = '''{item.status === "pending" && <div className="flex flex-wrap gap-2 sm:justify-end">{portalRole === "professional" ? (initiatedByMe ? <button type="button" disabled={connectionBusy} onClick={() => void updateConnection(item,"withdrawn")} className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50">Withdraw</button> : <><button type="button" disabled={connectionBusy} onClick={() => void updateConnection(item,"declined")} className="rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 disabled:opacity-50">Not Interested</button><button type="button" disabled={connectionBusy} onClick={() => void updateConnection(item,"interested")} className="rounded-xl bg-[#01A32E] px-3.5 py-2 text-xs font-black text-white shadow-sm hover:bg-[#018a28] disabled:opacity-50">Interested</button></>) : <><button type="button" disabled={connectionBusy || unlockBusyId === item.id} onClick={() => void updateConnection(item,"declined")} className="rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 disabled:opacity-50">Not Interested</button><button type="button" disabled={unlockBusyId === item.id} onClick={() => void startCandidateUnlock(item)} className="inline-flex items-center gap-2 rounded-xl bg-[#01A32E] px-4 py-2.5 text-xs font-black text-white shadow-md hover:bg-[#018a28] disabled:opacity-50"><CreditCard size={15}/>{unlockBusyId === item.id ? "Opening checkout…" : "Unlock Candidate — $29 CAD"}</button></>}</div>}{item.status === "interested" && <div className="flex flex-wrap gap-2 sm:justify-end">{isCandidateUnlocked(item) ? <>{portalRole === "office" && <button type="button" disabled={unlockBusyId === item.id} onClick={() => void viewUnlockedCandidate(item)} className="inline-flex items-center gap-2 rounded-xl border border-[#01A32E]/30 bg-[#eaf8ee] px-4 py-2.5 text-xs font-black text-[#017f27] hover:bg-[#dff5e5]"><FileText size={15}/> View Candidate</button>}<button type="button" onClick={() => void openChat(item)} className="inline-flex items-center gap-2 rounded-xl bg-[#002757] px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#01A32E] hover:shadow-lg"><MessageCircle size={15}/> Message</button></> : portalRole === "office" ? <button type="button" disabled={unlockBusyId === item.id} onClick={() => void startCandidateUnlock(item)} className="inline-flex items-center gap-2 rounded-xl bg-[#01A32E] px-4 py-2.5 text-xs font-black text-white shadow-md hover:bg-[#018a28] disabled:opacity-50"><CreditCard size={15}/>{unlockBusyId === item.id ? "Opening checkout…" : "Unlock Candidate — $29 CAD"}</button> : <span className="rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-black text-amber-700">Waiting for office to unlock connection</span>}</div>}'''
text = text.replace(old, new, 1)

# Add a general error surface above connection list.
text = text.replace('{connectionError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{connectionError}</p>}', '{connectionError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{connectionError}</p>}{unlockError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{unlockError}</p>}', 1)

# Gate openChat defensively too.
text = text.replace('  const openChat = async (connection: JobConnection) => {\n    if (connection.status !== "interested") return;', '  const openChat = async (connection: JobConnection) => {\n    if (connection.status !== "interested" || !isCandidateUnlocked(connection)) return;', 1)

# Add unlocked candidate modal immediately before chat modal.
modal_anchor = '    {activeChat && <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#002757]/70 p-3 sm:p-6">'
assert modal_anchor in text
candidate_modal = '''    {unlockedCandidate && <div className="fixed inset-0 z-[110] overflow-y-auto bg-[#002757]/70 p-4 sm:p-6"><button type="button" aria-label="Close candidate details" onClick={() => setUnlockedCandidate(null)} className="fixed inset-0"/><section role="dialog" aria-modal="true" className="relative mx-auto my-6 w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-start justify-between gap-4 bg-[#002757] p-5 text-white"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#9be3ad]">Candidate Unlocked</p><h2 className="mt-1 text-2xl font-black">{unlockedCandidate.name}</h2><p className="mt-1 text-sm text-slate-300">{unlockedCandidate.profession || "Dental Professional"}</p></div><button type="button" onClick={() => setUnlockedCandidate(null)} className="rounded-xl bg-white/10 p-2 hover:bg-white/20"><X size={21}/></button></div><div className="p-5 sm:p-6"><div className="rounded-2xl border border-[#01A32E]/25 bg-[#f3fbf5] p-4"><p className="text-sm font-black text-[#017f27]">This candidate has been unlocked for your office.</p><p className="mt-1 text-xs leading-5 text-slate-600">Your office will not be charged again for this same professional on DentalShift.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{unlockedCandidate.email && <a href={`mailto:${unlockedCandidate.email}`} className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50"><Mail size={17} className="text-[#4285F4]"/><p className="mt-2 text-xs font-black uppercase text-slate-400">Email</p><p className="mt-1 break-all text-sm font-bold text-[#002757]">{unlockedCandidate.email}</p></a>}{unlockedCandidate.phone && <a href={`tel:${unlockedCandidate.phone}`} className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50"><Phone size={17} className="text-[#01A32E]"/><p className="mt-2 text-xs font-black uppercase text-slate-400">Phone</p><p className="mt-1 text-sm font-bold text-[#002757]">{unlockedCandidate.phone}</p></a>}<div className="rounded-2xl border border-slate-200 p-4"><MapPin size={17} className="text-[#EA4335]"/><p className="mt-2 text-xs font-black uppercase text-slate-400">Location</p><p className="mt-1 text-sm font-bold text-[#002757]">{[unlockedCandidate.address, unlockedCandidate.city, unlockedCandidate.province, unlockedCandidate.postalCode].filter(Boolean).join(", ") || "Not listed"}</p></div><div className="rounded-2xl border border-slate-200 p-4"><ShieldCheck size={17} className="text-[#7C3AED]"/><p className="mt-2 text-xs font-black uppercase text-slate-400">Licence / Registration</p><p className="mt-1 text-sm font-bold text-[#002757]">{[unlockedCandidate.licenceProvince, unlockedCandidate.licenceNumber].filter(Boolean).join(" ") || "Not listed"}</p></div></div>{unlockedCandidate.resumeUrl ? <a href={unlockedCandidate.resumeUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#01A32E] px-5 py-3.5 text-sm font-black text-white shadow-md hover:bg-[#018a28]"><Download size={18}/> Open Original Résumé / CV</a> : <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">No original résumé is currently available.</p>}</div></section></div>}

'''
text = text.replace(modal_anchor, candidate_modal + modal_anchor, 1)

# Update stale chat explanatory text from pre-preview model.
text = text.replace('A résumé may already identify the professional; DentalShift does not automatically reveal additional account contact details.', 'Candidate Unlock is complete for this connection. Continue the conversation inside DentalShift or use the unlocked contact details.')

path.write_text(text)
print('Paid Candidate Unlock UI patch applied')
