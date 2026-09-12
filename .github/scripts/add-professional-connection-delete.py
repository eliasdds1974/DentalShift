from pathlib import Path

path = Path('app/classifieds/page.tsx')
s = path.read_text()

old = '  const [connectionBusy, setConnectionBusy] = useState(false);\n  const [connectionError, setConnectionError] = useState("");'
new = '  const [connectionBusy, setConnectionBusy] = useState(false);\n  const [connectionDeletingId, setConnectionDeletingId] = useState<string | null>(null);\n  const [connectionError, setConnectionError] = useState("");'
if old not in s:
    raise SystemExit('connection state anchor not found')
s = s.replace(old, new, 1)

# Make initial loads role-aware so professional-hidden cards are filtered correctly on first render.
s = s.replace('          await loadConnections();\n          await loadNotifications();', '          await loadConnections("office");\n          await loadNotifications();', 1)
s = s.replace('          await loadConnections();\n          await loadNotifications();', '          await loadConnections("professional");\n          await loadNotifications();', 1)

old = '  const loadConnections = async () => {\n    const { data, error } = await supabase\n      .from("job_applications")\n      .select("id,listing_id,professional_id,office_id,initiator_role,status,message,resume_path_snapshot,created_at,job_listings(profession,employment_type,city,province,listing_type)")\n      .order("created_at", { ascending: false });\n    if (error || !data) return;\n    const rows = data as any[];'
new = '  const loadConnections = async (roleOverride?: "office" | "professional" | null) => {\n    const { data, error } = await supabase\n      .from("job_applications")\n      .select("id,listing_id,professional_id,office_id,initiator_role,status,message,resume_path_snapshot,created_at,professional_hidden_at,job_listings(profession,employment_type,city,province,listing_type)")\n      .order("created_at", { ascending: false });\n    if (error || !data) return;\n    const effectiveRole = roleOverride || portalRole;\n    const rows = (data as any[]).filter((row) => effectiveRole !== "professional" || !row.professional_hidden_at);'
if old not in s:
    raise SystemExit('loadConnections anchor not found')
s = s.replace(old, new, 1)

anchor = '  const existingConnectionFor = (ad: JobCard) => connections.find((item) => item.listingId === String(ad.id));'
handler = '''  const deleteConnectionFromProfessionalView = async (connection: JobConnection) => {
    if (portalRole !== "professional" || connectionDeletingId) return;
    if (!window.confirm("Remove this item from My Applications & Office Interest?")) return;
    setConnectionDeletingId(connection.id);
    setConnectionError("");
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ professional_hidden_at: new Date().toISOString() })
        .eq("id", connection.id);
      if (error) throw error;
      setConnections((current) => current.filter((item) => item.id !== connection.id));
      if (activeChat?.id === connection.id) setActiveChat(null);
    } catch (value) {
      setConnectionError(value instanceof Error ? value.message : "Could not remove this item.");
    } finally {
      setConnectionDeletingId(null);
    }
  };

'''
if anchor not in s:
    raise SystemExit('existingConnectionFor anchor not found')
s = s.replace(anchor, handler + anchor, 1)

old = 'return <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">'
new = '''return <article key={item.id} className={`relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${portalRole === "professional" ? "pt-12" : ""}`}>{portalRole === "professional" && <button type="button" disabled={connectionDeletingId === item.id} onClick={() => void deleteConnectionFromProfessionalView(item)} className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-black text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"><Trash2 size={12}/>{connectionDeletingId === item.id ? "Deleting…" : "Delete"}</button>}<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">'''
if old not in s:
    raise SystemExit('connection card anchor not found')
s = s.replace(old, new, 1)

path.write_text(s)
