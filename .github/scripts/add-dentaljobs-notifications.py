from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

old_import = 'import { BriefcaseBusiness, Building2, Check, ChevronLeft, Clock3, FileText, Filter, LockKeyhole, MapPin, MessageCircle, MoreVertical, Pencil, Pause, Play, RefreshCw, Search, Send, ShieldCheck, Star, Trash2, UserRound, X } from "lucide-react";'
new_import = 'import { Bell, BriefcaseBusiness, Building2, Check, ChevronLeft, Clock3, FileText, Filter, LockKeyhole, MapPin, MessageCircle, MoreVertical, Pencil, Pause, Play, RefreshCw, Search, Send, ShieldCheck, Star, Trash2, UserRound, X } from "lucide-react";'
assert old_import in text
text = text.replace(old_import, new_import, 1)

anchor = '''type JobMessage = {
  id: string;
  applicationId: string;
  senderRole: "professional" | "office";
  senderUserId: string;
  body: string;
  createdAt: string;
};
'''
assert anchor in text
text = text.replace(anchor, anchor + '''
type DentalJobsNotification = {
  id: string;
  applicationId: string;
  eventType: "application_created" | "response_interested" | "response_declined" | "chat_message";
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};
''', 1)

state_anchor = '  const [chatError, setChatError] = useState("");\n'
assert state_anchor in text
text = text.replace(state_anchor, state_anchor + '''  const [notifications, setNotifications] = useState<DentalJobsNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
''', 1)

# Load notifications after account initialization in both role flows.
text = text.replace('          await loadConnections();\n        } catch {', '          await loadConnections();\n          await loadNotifications();\n        } catch {', 2)

# Insert helpers before loadConnections.
func_anchor = '  const loadConnections = async () => {\n'
assert func_anchor in text
helpers = '''  const loadNotifications = async () => {
    const { data, error } = await supabase
      .from("dentaljobs_notifications")
      .select("id,application_id,event_type,title,body,href,read_at,created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error || !data) return;
    setNotifications(data.map((row: any) => ({
      id: row.id,
      applicationId: row.application_id,
      eventType: row.event_type,
      title: row.title,
      body: row.body,
      href: row.href,
      readAt: row.read_at,
      createdAt: row.created_at,
    })));
  };

  const notifyDentalJobs = async (applicationId: string, eventType: "application_created" | "response_interested" | "response_declined" | "chat_message", messageId?: string | null) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      await fetch("/api/dentaljobs/notify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ applicationId, eventType, messageId: messageId || null }),
      });
    } catch {
      // Core DentalJobs action should still succeed if an email notification cannot be sent.
    }
  };

  const markNotificationRead = async (notification: DentalJobsNotification) => {
    if (notification.readAt) return;
    const readAt = new Date().toISOString();
    const { error } = await supabase.from("dentaljobs_notifications").update({ read_at: readAt }).eq("id", notification.id);
    if (!error) setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt } : item));
  };

  const markAllNotificationsRead = async () => {
    const unread = notifications.filter((item) => !item.readAt);
    if (!unread.length) return;
    const readAt = new Date().toISOString();
    const { error } = await supabase.from("dentaljobs_notifications").update({ read_at: readAt }).is("read_at", null);
    if (!error) setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || readAt })));
  };

'''
text = text.replace(func_anchor, helpers + func_anchor, 1)

# Patch professional application insert to return id and trigger notification.
old = '''        const { error } = await supabase.from("job_applications").insert({
          listing_id: selectedOpportunity.id, professional_id: professionalId, office_id: selectedOpportunity.ownerOfficeId,
          initiator_role: "professional", status: "pending", message: connectionMessage.trim() || null, resume_path_snapshot: resumePath,
        });
        if (error) { if (error.code === "23505") throw new Error("You have already applied to this opportunity."); throw error; }
'''
new = '''        const { data: created, error } = await supabase.from("job_applications").insert({
          listing_id: selectedOpportunity.id, professional_id: professionalId, office_id: selectedOpportunity.ownerOfficeId,
          initiator_role: "professional", status: "pending", message: connectionMessage.trim() || null, resume_path_snapshot: resumePath,
        }).select("id").single();
        if (error) { if (error.code === "23505") throw new Error("You have already applied to this opportunity."); throw error; }
        if (created?.id) void notifyDentalJobs(created.id, "application_created");
'''
assert old in text
text = text.replace(old, new, 1)

# Patch office interest insert.
old = '''        const { error } = await supabase.from("job_applications").insert({
          listing_id: selectedOpportunity.id, professional_id: selectedOpportunity.ownerProfessionalId, office_id: officeId,
          initiator_role: "office", status: "pending", message: connectionMessage.trim() || null, resume_path_snapshot: null,
        });
        if (error) { if (error.code === "23505") throw new Error("Your office has already expressed interest in this professional."); throw error; }
'''
new = '''        const { data: created, error } = await supabase.from("job_applications").insert({
          listing_id: selectedOpportunity.id, professional_id: selectedOpportunity.ownerProfessionalId, office_id: officeId,
          initiator_role: "office", status: "pending", message: connectionMessage.trim() || null, resume_path_snapshot: null,
        }).select("id").single();
        if (error) { if (error.code === "23505") throw new Error("Your office has already expressed interest in this professional."); throw error; }
        if (created?.id) void notifyDentalJobs(created.id, "application_created");
'''
assert old in text
text = text.replace(old, new, 1)

# Patch response notifications.
old = '''      const { error } = await supabase.from("job_applications").update(values).eq("id", connection.id);
      if (error) throw error;
      await loadConnections();
'''
new = '''      const { error } = await supabase.from("job_applications").update(values).eq("id", connection.id);
      if (error) throw error;
      if (action === "interested") void notifyDentalJobs(connection.id, "response_interested");
      if (action === "declined") void notifyDentalJobs(connection.id, "response_declined");
      await loadConnections();
'''
assert old in text
text = text.replace(old, new, 1)

# Patch chat insert to return message id and notify.
old = '''      const { error } = await supabase.from("job_messages").insert({
        application_id: activeChat.id,
        sender_role: portalRole,
        sender_user_id: user.id,
        body: chatDraft.trim(),
      });
      if (error) throw error;
      setChatDraft("");
'''
new = '''      const { data: createdMessage, error } = await supabase.from("job_messages").insert({
        application_id: activeChat.id,
        sender_role: portalRole,
        sender_user_id: user.id,
        body: chatDraft.trim(),
      }).select("id").single();
      if (error) throw error;
      if (createdMessage?.id) void notifyDentalJobs(activeChat.id, "chat_message", createdMessage.id);
      setChatDraft("");
'''
assert old in text
text = text.replace(old, new, 1)

# Replace header action with notification bell + back button.
old = '''        <Link href={backHref} className="inline-flex items-center gap-2 rounded-xl border border-[#002757]/15 bg-white px-4 py-2.5 text-sm font-black text-[#002757] shadow-sm hover:bg-[#edf3fa]"><ChevronLeft size={17} /> Back to Calendar</Link>
'''
new = '''        <div className="flex items-center gap-2">
          {portalRole && <div className="relative"><button type="button" onClick={() => setNotificationsOpen((value) => !value)} aria-label="DentalJobs notifications" className="relative grid h-11 w-11 place-items-center rounded-xl border border-[#002757]/15 bg-white text-[#002757] shadow-sm transition hover:bg-[#edf3fa]"><Bell size={19}/>{notifications.some((item) => !item.readAt) && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#EA4335] px-1 text-[10px] font-black text-white ring-2 ring-white">{Math.min(99, notifications.filter((item) => !item.readAt).length)}</span>}</button>{notificationsOpen && <div className="absolute right-0 z-50 mt-2 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#4285F4]">DentalJobs</p><h3 className="font-black text-[#002757]">Notifications</h3></div>{notifications.some((item) => !item.readAt) && <button type="button" onClick={() => void markAllNotificationsRead()} className="text-xs font-black text-[#01A32E] hover:underline">Mark all read</button>}</div><div className="max-h-[420px] overflow-y-auto">{notifications.length === 0 ? <div className="p-6 text-center text-sm font-semibold text-slate-500">No DentalJobs notifications yet.</div> : notifications.map((notification) => <button type="button" key={notification.id} onClick={() => void markNotificationRead(notification)} className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${notification.readAt ? "bg-white" : "bg-[#eef4ff]"}`}><div className="flex items-start gap-3">{!notification.readAt && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#4285F4]"/>}<div className="min-w-0"><p className="text-sm font-black text-[#002757]">{notification.title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{notification.body}</p><p className="mt-1.5 text-[10px] font-bold text-slate-400">{new Date(notification.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p></div></div></button>)}</div></div>}</div>}
          <Link href={backHref} className="inline-flex items-center gap-2 rounded-xl border border-[#002757]/15 bg-white px-4 py-2.5 text-sm font-black text-[#002757] shadow-sm hover:bg-[#edf3fa]"><ChevronLeft size={17} /> <span className="hidden sm:inline">Back to Calendar</span><span className="sm:hidden">Back</span></Link>
        </div>
'''
assert old in text
text = text.replace(old, new, 1)

path.write_text(text)
print('DentalJobs notifications UI and event hooks applied')
