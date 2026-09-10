from pathlib import Path
import re

path = Path('app/classifieds/page.tsx')
text = path.read_text()

old_import = 'import { BriefcaseBusiness, Building2, Check, ChevronLeft, Clock3, FileText, Filter, MapPin, MoreVertical, Pencil, Pause, Play, RefreshCw, Search, ShieldCheck, Star, Trash2, UserRound, X } from "lucide-react";'
new_import = 'import { BriefcaseBusiness, Building2, Check, ChevronLeft, Clock3, FileText, Filter, LockKeyhole, MapPin, MessageCircle, MoreVertical, Pencil, Pause, Play, RefreshCw, Search, Send, ShieldCheck, Star, Trash2, UserRound, X } from "lucide-react";'
assert old_import in text
text = text.replace(old_import, new_import, 1)

anchor_type = '''type JobConnection = {
  id: string;
  listingId: string;
  professionalId: string;
  officeId: string;
  initiatorRole: "professional" | "office";
  status: "pending" | "interested" | "declined" | "withdrawn";
  message: string;
  resumePath: string | null;
  createdAt: string;
  profession: string;
  employment: string;
  city: string;
  province: string;
  listingType: "office_hiring" | "professional_available";
};
'''
assert anchor_type in text
text = text.replace(anchor_type, anchor_type + '''
type JobMessage = {
  id: string;
  applicationId: string;
  senderRole: "professional" | "office";
  senderUserId: string;
  body: string;
  createdAt: string;
};
''', 1)

state_anchor = '  const [connectionError, setConnectionError] = useState("");\n'
assert state_anchor in text
text = text.replace(state_anchor, state_anchor + '''  const [activeChat, setActiveChat] = useState<JobConnection | null>(null);
  const [chatMessages, setChatMessages] = useState<JobMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState("");
''', 1)

func_anchor = '''  const updateConnection = async (connection: JobConnection, action: "interested" | "declined" | "withdrawn") => {
    setConnectionError("");
    setConnectionBusy(true);
    try {
      const values: Record<string, unknown> = { status: action, updated_at: new Date().toISOString() };
      if (action !== "withdrawn") values.responded_at = new Date().toISOString();
      const { error } = await supabase.from("job_applications").update(values).eq("id", connection.id);
      if (error) throw error;
      await loadConnections();
    } catch (value) {
      setConnectionError(value instanceof Error ? value.message : "Could not update this connection.");
    } finally { setConnectionBusy(false); }
  };
'''
assert func_anchor in text
chat_funcs = r'''

  const loadChatMessages = async (applicationId: string) => {
    const { data, error } = await supabase
      .from("job_messages")
      .select("id,application_id,sender_role,sender_user_id,body,created_at")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    setChatMessages((data || []).map((row: any) => ({
      id: row.id,
      applicationId: row.application_id,
      senderRole: row.sender_role,
      senderUserId: row.sender_user_id,
      body: row.body,
      createdAt: row.created_at,
    })));
  };

  const openChat = async (connection: JobConnection) => {
    if (connection.status !== "interested") return;
    setChatError("");
    setChatDraft("");
    setActiveChat(connection);
    try {
      await loadChatMessages(connection.id);
    } catch (value) {
      setChatError(value instanceof Error ? value.message : "Could not load this conversation.");
    }
  };

  const sendChatMessage = async () => {
    if (!activeChat || !portalRole || !chatDraft.trim()) return;
    setChatBusy(true);
    setChatError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again to send a message.");
      const { error } = await supabase.from("job_messages").insert({
        application_id: activeChat.id,
        sender_role: portalRole,
        sender_user_id: user.id,
        body: chatDraft.trim(),
      });
      if (error) throw error;
      setChatDraft("");
      await loadChatMessages(activeChat.id);
    } catch (value) {
      setChatError(value instanceof Error ? value.message : "Could not send your message.");
    } finally {
      setChatBusy(false);
    }
  };

  useEffect(() => {
    if (!activeChat) return;
    const channel = supabase
      .channel(`dentaljobs-chat-${activeChat.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "job_messages", filter: `application_id=eq.${activeChat.id}` }, () => {
        void loadChatMessages(activeChat.id);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [activeChat?.id]);
'''
text = text.replace(func_anchor, func_anchor + chat_funcs, 1)

# Add Message button for mutually interested connections after the pending action block.
pattern = re.compile(r'(\{item\.status === "pending" && <div className="flex flex-wrap gap-2 sm:justify-end">.*?</div>\})(</div></article>\}\)\}</div></section>\})', re.S)
match = pattern.search(text)
assert match, 'Could not find DentalJobs connection action block'
replacement = match.group(1) + '{item.status === "interested" && <div className="flex sm:justify-end"><button type="button" onClick={() => void openChat(item)} className="inline-flex items-center gap-2 rounded-xl bg-[#002757] px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#01A32E] hover:shadow-lg"><MessageCircle size={15}/> Message</button></div>}' + match.group(2)
text = text[:match.start()] + replacement + text[match.end():]

modal_anchor = '    {selectedOpportunity && <div className="fixed inset-0 z-[95] overflow-y-auto bg-[#002757]/65 p-4 sm:p-6">'
assert modal_anchor in text
chat_modal = r'''    {activeChat && <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#002757]/70 p-3 sm:p-6"><button type="button" aria-label="Close conversation" onClick={() => setActiveChat(null)} className="fixed inset-0" /><section role="dialog" aria-modal="true" className="relative mx-auto my-3 flex h-[min(760px,calc(100vh-24px))] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:my-6 sm:h-[min(760px,calc(100vh-48px))]"><div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#002757] p-4 text-white sm:p-5"><div className="min-w-0"><div className="flex items-center gap-2"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#01A32E]"><MessageCircle size={18}/></span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#9be3ad]">Private DentalShift conversation</p><h2 className="truncate text-lg font-black">{activeChat.profession}{activeChat.employment ? ` — ${activeChat.employment}` : ""}</h2></div></div><p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-300"><LockKeyhole size={13}/> Identities and direct contact details remain hidden.</p></div><button type="button" onClick={() => setActiveChat(null)} className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20"><X size={21}/></button></div><div className="flex-1 overflow-y-auto bg-[#f5f8fb] p-4 sm:p-5"><div className="mb-4 rounded-2xl border border-[#4285F4]/20 bg-white p-3 text-sm text-slate-600"><span className="font-black text-[#002757]">Opportunity:</span> {activeChat.city}{activeChat.city && activeChat.province ? ", " : ""}{activeChat.province}. You are chatting as <span className="font-black text-[#002757]">{portalRole === "office" ? "Dental Office" : "Dental Professional"}</span>.</div>{chatMessages.length === 0 ? <div className="grid min-h-[220px] place-items-center text-center"><div><MessageCircle size={34} className="mx-auto text-slate-300"/><p className="mt-3 font-black text-[#002757]">Start the conversation</p><p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">Both sides have expressed interest. Use DentalShift messaging to discuss the opportunity without sharing direct contact details yet.</p></div></div> : <div className="space-y-3">{chatMessages.map((message) => { const mine = message.senderRole === portalRole; return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${mine ? "bg-[#002757] text-white" : "border border-slate-200 bg-white text-slate-700"}`}><p className={`mb-1 text-[10px] font-black uppercase tracking-wide ${mine ? "text-[#9be3ad]" : "text-[#4285F4]"}`}>{mine ? "You" : portalRole === "office" ? "Dental Professional" : "Dental Office"}</p><p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p><p className={`mt-1.5 text-[10px] font-bold ${mine ? "text-slate-300" : "text-slate-400"}`}>{new Date(message.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p></div></div>})}</div>}{chatError && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{chatError}</p>}</div><div className="border-t border-slate-200 bg-white p-3 sm:p-4"><div className="flex items-end gap-2"><textarea value={chatDraft} onChange={(e) => setChatDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendChatMessage(); } }} rows={2} maxLength={2000} placeholder="Write a private message…" className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#4285F4]"/><button type="button" disabled={chatBusy || !chatDraft.trim()} onClick={() => void sendChatMessage()} className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl bg-[#01A32E] text-white shadow-md transition hover:bg-[#018a28] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message"><Send size={20}/></button></div><p className="mt-2 text-center text-[11px] font-semibold text-slate-400">Press Enter to send · Shift+Enter for a new line</p></div></section></div>}

'''
text = text.replace(modal_anchor, chat_modal + modal_anchor, 1)

path.write_text(text)
print('Anonymous DentalJobs messaging patch applied')
