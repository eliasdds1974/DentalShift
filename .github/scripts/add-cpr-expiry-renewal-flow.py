from pathlib import Path

app_path = Path('app/page.tsx')
lib_path = Path('lib/dentalshift.ts')

app = app_path.read_text()
lib = lib_path.read_text()

# ---------- lib/dentalshift.ts ----------
if 'cpr_status: string;' not in lib:
    lib = lib.replace(
        '  cpr_path: string | null;\n  resume_path: string | null;\n',
        '  cpr_path: string | null;\n  cpr_status: string;\n  cpr_expiry_month: string | null;\n  cpr_submitted_at: string | null;\n  cpr_grace_until: string | null;\n  cpr_verified_at: string | null;\n  resume_path: string | null;\n',
        1,
    )

lib = lib.replace(
    'skills,cpr_path,resume_path,available_for_work',
    'skills,cpr_path,cpr_status,cpr_expiry_month,cpr_submitted_at,cpr_grace_until,cpr_verified_at,resume_path,available_for_work',
)

# Make every CPR upload go through the renewal/grace RPC instead of a direct profile update.
old_upload_save = '''  const { data, error } = await supabase\n    .from("professional_profiles")\n    .update({ cpr_path: path })\n    .eq("user_id", userId)\n    .select("cpr_path")\n    .single();\n  if (error || !data?.cpr_path) throw new Error(`The CPR certificate uploaded, but it could not be saved to your profile: ${error?.message || "No path returned"}`);\n  return data.cpr_path as string;'''
new_upload_save = '''  const { data, error } = await supabase.rpc("submit_professional_cpr", { p_path: path });\n  if (error) throw new Error(`The CPR certificate uploaded, but it could not be submitted for review: ${error.message}`);\n  const result = data as { cprPath?: string } | null;\n  return result?.cprPath || path;'''
if old_upload_save in lib:
    lib = lib.replace(old_upload_save, new_upload_save, 1)

if 'export async function verifyProfessionalCpr' not in lib:
    anchor = 'export async function uploadProfessionalResume(userId: string, file: File) {'
    helper = '''export async function verifyProfessionalCpr(professionalId: string, expiryMonth: string) {\n  if (!/^\\d{4}-\\d{2}$/.test(expiryMonth)) throw new Error("Enter the CPR expiry month and year.");\n  const { error } = await supabase.rpc("admin_verify_professional_cpr", {\n    p_professional_id: professionalId,\n    p_expiry_month: `${expiryMonth}-01`,\n  });\n  if (error) throw error;\n}\n\n'''
    if anchor not in lib:
        raise SystemExit('Could not find resume helper anchor')
    lib = lib.replace(anchor, helper + anchor, 1)

# Include CPR renewal submissions in the admin verification queue.
queue_select_old = '.select("user_id,profession,licence_number,licence_province,licence_status,created_at,profiles!professional_profiles_user_id_fkey(first_name,last_name)")\n      .in("licence_status", ["pending", "needs_review"])'
queue_select_new = '.select("user_id,profession,licence_number,licence_province,licence_status,cpr_status,cpr_expiry_month,cpr_submitted_at,created_at,profiles!professional_profiles_user_id_fkey(first_name,last_name)")\n      .or("licence_status.in.(pending,needs_review),cpr_status.eq.pending")'
if queue_select_old in lib:
    lib = lib.replace(queue_select_old, queue_select_new, 1)

lib = lib.replace(
    '      status: row.licence_status,\n      submittedAt: row.created_at,',
    '      status: row.cpr_status === "pending" && row.licence_status === "verified" ? "CPR pending" : row.licence_status,\n      submittedAt: row.cpr_status === "pending" && row.cpr_submitted_at ? row.cpr_submitted_at : row.created_at,',
    1,
)

# Merge private CPR review metadata into the existing admin verification case.
old_case = '''export async function loadVerificationCase(item: VerificationItem): Promise<VerificationCase> {\n  const { data, error } = await supabase.rpc("admin_get_verification_case", {\n    p_target_kind: item.kind,\n    p_target_id: item.id,\n  });\n  if (error) throw error;\n  return data as VerificationCase;\n}'''
new_case = '''export async function loadVerificationCase(item: VerificationItem): Promise<VerificationCase> {\n  const { data, error } = await supabase.rpc("admin_get_verification_case", {\n    p_target_kind: item.kind,\n    p_target_id: item.id,\n  });\n  if (error) throw error;\n  const record = data as VerificationCase;\n  if (item.kind === "professional") {\n    const { data: cprData, error: cprError } = await supabase.rpc("admin_get_professional_cpr", { p_professional_id: item.id });\n    if (cprError) throw cprError;\n    record.details = { ...record.details, ...((cprData as Record<string, unknown> | null) || {}) };\n  }\n  return record;\n}'''
if old_case in lib:
    lib = lib.replace(old_case, new_case, 1)

# ---------- app/page.tsx ----------
if 'verifyProfessionalCpr' not in app.split('\n', 12)[8]:
    app = app.replace('uploadProfessionalCpr, uploadProfessionalResume, normalizeWebsite,', 'uploadProfessionalCpr, uploadProfessionalResume, verifyProfessionalCpr, normalizeWebsite,', 1)

# Add Admin CPR expiry state / actions to the existing review modal.
if 'const [cprExpiry, setCprExpiry]' not in app:
    state_anchor = '  const [savingNote, setSavingNote] = useState(false);\n  const [error, setError] = useState("");\n'
    state_new = '''  const [savingNote, setSavingNote] = useState(false);\n  const [cprExpiry, setCprExpiry] = useState("");\n  const [savingCpr, setSavingCpr] = useState(false);\n  const [error, setError] = useState("");\n'''
    if state_anchor not in app:
        raise SystemExit('Could not find verification modal state anchor')
    app = app.replace(state_anchor, state_new, 1)

if 'const saveCprVerification = async' not in app:
    add_note_anchor = '  const addNote = async () => { if (note.trim().length < 2) return; setSavingNote(true); setError(""); try { await addVerificationInternalNote(item, note); setNote(""); setRecord(await loadVerificationCase(item)); } catch (noteError) { setError(noteError instanceof Error ? noteError.message : "Could not save the private note."); } finally { setSavingNote(false); } };\n'
    add_note_new = add_note_anchor + '''  useEffect(() => {\n    const value = record?.details?.cprExpiryMonth;\n    if (typeof value === "string" && value.length >= 7) setCprExpiry(value.slice(0, 7));\n  }, [record]);\n  const saveCprVerification = async () => {\n    if (item.kind !== "professional" || !cprExpiry) return;\n    setSavingCpr(true); setError("");\n    try {\n      await verifyProfessionalCpr(item.id, cprExpiry);\n      setRecord(await loadVerificationCase(item));\n    } catch (value) { setError(value instanceof Error ? value.message : "Could not verify this CPR certificate."); }\n    finally { setSavingCpr(false); }\n  };\n  const viewAdminCpr = async () => {\n    const path = record?.details?.cprPath;\n    if (typeof path !== "string" || !path) return;\n    setError("");\n    try { window.open(await openProfessionalCpr(path), "_blank", "noopener,noreferrer"); }\n    catch (value) { setError(value instanceof Error ? value.message : "The CPR certificate could not be opened."); }\n  };\n'''
    if add_note_anchor not in app:
        raise SystemExit('Could not find add-note anchor')
    app = app.replace(add_note_anchor, add_note_new, 1)

if 'CPR certificate review' not in app:
    history_anchor = '</div></div><div className="mt-5 rounded-2xl border border-slate-200 p-5"><h3 className="font-extrabold text-slate-900">Verification history</h3>'
    cpr_card = '''</div></div>{record.kind === "professional" && ["Registered Dental Hygienist", "Certified Dental Assistant"].includes(String(detail("profession"))) && <div className="mt-5 rounded-2xl border border-[#01A32E]/25 bg-[#f3fbf5] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-extrabold text-slate-900">CPR certificate review</h3><p className="mt-1 text-sm text-slate-600">Review the private certificate, then enter the expiry month shown on it.</p></div><StatusPill tone={detail("cprStatus") === "verified" ? "green" : "amber"}>{text(detail("cprStatus")).replace("_", " ")}</StatusPill></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-white p-3 text-sm text-slate-600"><p><b>Current expiry:</b> {detail("cprExpiryMonth") ? new Date(String(detail("cprExpiryMonth")) + "T12:00:00").toLocaleDateString("en-CA", { month: "2-digit", year: "2-digit" }) : "Not verified yet"}</p><p className="mt-1"><b>Submitted:</b> {detail("cprSubmittedAt") ? new Date(String(detail("cprSubmittedAt"))).toLocaleString("en-CA") : "Not submitted"}</p>{detail("cprGraceUntil") && <p className="mt-1 font-bold text-amber-700"><b>30-day grace access until:</b> {new Date(String(detail("cprGraceUntil"))).toLocaleDateString("en-CA", { dateStyle: "medium" })}</p>}</div><div className="rounded-xl bg-white p-3"><label className="field"><span>CPR expiry (MM/YY)</span><input type="month" value={cprExpiry} onChange={(event) => setCprExpiry(event.target.value)} /></label></div></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={!detail("cprPath")} onClick={() => void viewAdminCpr()} className="secondary-btn">View CPR certificate</button><button type="button" disabled={savingCpr || !detail("cprPath") || !cprExpiry} onClick={() => void saveCprVerification()} className="primary-btn"><ShieldCheck size={17} />{savingCpr ? "Saving…" : "Verify CPR & save expiry"}</button></div><p className="mt-3 text-xs leading-5 text-slate-500">The professional remains active through the end of the verified expiry month. A replacement submitted after expiry receives 30 days of temporary access while awaiting Admin review.</p></div>}<div className="mt-5 rounded-2xl border border-slate-200 p-5"><h3 className="font-extrabold text-slate-900">Verification history</h3>'''
    if history_anchor not in app:
        raise SystemExit('Could not find verification-history anchor')
    app = app.replace(history_anchor, cpr_card, 1)

# Add a dedicated CPR renewal gate before Home.
if 'function ProfessionalCprRenewalGate' not in app:
    home_anchor = 'export default function Home() {'
    gate = '''function cprRenewalBlocked(professional: AccountDetails["professional"]) {\n  if (!professional || !["Registered Dental Hygienist", "Certified Dental Assistant"].includes(professional.profession) || !professional.cpr_expiry_month) return false;\n  const [year, month] = professional.cpr_expiry_month.slice(0, 7).split("-").map(Number);\n  if (!year || !month) return false;\n  const expiryEnd = new Date(year, month, 0, 23, 59, 59, 999);\n  if (Date.now() <= expiryEnd.getTime()) return false;\n  if (professional.cpr_status === "pending" && professional.cpr_grace_until && Date.now() <= new Date(professional.cpr_grace_until).getTime()) return false;\n  return true;\n}\n\nfunction ProfessionalCprRenewalGate({ userId, onRenewed }: { userId: string; onRenewed: (professional: AccountDetails["professional"]) => void }) {\n  const [busy, setBusy] = useState(false);\n  const [error, setError] = useState("");\n  const renew = async (file?: File) => {\n    if (!file) return;\n    setBusy(true); setError("");\n    try {\n      await uploadProfessionalCpr(userId, file);\n      const refreshed = await loadAccountDetails(userId);\n      onRenewed(refreshed.professional);\n    } catch (value) { setError(value instanceof Error ? value.message : "Your updated CPR certificate could not be submitted."); }\n    finally { setBusy(false); }\n  };\n  return <div className="page-wrap"><div className="panel mx-auto max-w-2xl p-6 sm:p-8"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eaf8ee] text-[#01A32E]"><FileCheck2 size={28} /></div><div className="mt-5 text-center"><h1 className="text-2xl font-black text-[#002757]">Update your CPR certificate</h1><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">Your previously verified CPR has expired. Upload a current certificate or take a clear photo to continue using your DentalShift Professional account.</p></div><div className="mt-6 rounded-2xl border border-[#01A32E]/25 bg-[#f3fbf5] p-4 text-sm leading-6 text-slate-600"><b className="text-[#002757]">Immediate access after submission:</b> once your replacement CPR is submitted, your account will be active for 30 days while DentalShift Admin reviews the certificate and records its new expiry date.</div>{error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}<div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><label className="primary-btn cursor-pointer justify-center"><Upload size={17} />{busy ? "Please wait…" : "Upload CPR"}<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(event) => void renew(event.target.files?.[0])} /></label><label className="secondary-btn cursor-pointer justify-center"><FileCheck2 size={17} />Take photo<input type="file" accept="image/*" capture="environment" className="sr-only" disabled={busy} onChange={(event) => void renew(event.target.files?.[0])} /></label></div></div></div>;\n}\n\n'''
    if home_anchor not in app:
        raise SystemExit('Could not find Home anchor')
    app = app.replace(home_anchor, gate + home_anchor, 1)

# Track professional CPR state in Home login synchronization.
if 'const [professionalDetails, setProfessionalDetails]' not in app:
    home_state_anchor = '  const [profile, setProfile] = useState<AccountProfile | null>(null);\n'
    if home_state_anchor not in app:
        raise SystemExit('Could not find Home profile state')
    app = app.replace(home_state_anchor, home_state_anchor + '  const [professionalDetails, setProfessionalDetails] = useState<AccountDetails["professional"]>(null);\n', 1)

logout_anchor = '        setProfile(null);\n        setOfficeId(null);\n        setOffice(null);\n'
if 'setProfessionalDetails(null);' not in app and logout_anchor in app:
    app = app.replace(logout_anchor, '        setProfile(null);\n        setProfessionalDetails(null);\n        setOfficeId(null);\n        setOffice(null);\n', 1)

sync_anchor = '        setProfile(account.profile);\n        setOfficeId(account.officeId);\n        setOffice(activeOffice);\n'
if 'setProfessionalDetails(details.professional);' not in app:
    if sync_anchor not in app:
        raise SystemExit('Could not find account sync state anchor')
    app = app.replace(sync_anchor, '        setProfile(account.profile);\n        setProfessionalDetails(details.professional);\n        setOfficeId(account.officeId);\n        setOffice(activeOffice);\n', 1)

# Swap only the professional workspace render with the CPR renewal gate when required.
old_render = '? <ProfessionalWorkspace userId={session.user.id} profile={profile} refreshKey={refreshKey} view={view} onNavigate={(nextView) => navigate("professional", nextView)} />'
new_render = '? cprRenewalBlocked(professionalDetails)\n              ? <ProfessionalCprRenewalGate userId={session.user.id} onRenewed={setProfessionalDetails} />\n              : <ProfessionalWorkspace userId={session.user.id} profile={profile} refreshKey={refreshKey} view={view} onNavigate={(nextView) => navigate("professional", nextView)} />'
if old_render in app and 'ProfessionalCprRenewalGate userId={session.user.id}' not in app:
    app = app.replace(old_render, new_render, 1)

# Show CPR review status/expiry in the existing Professional Account CPR card without redesigning it.
old_cpr_status = '{details.professional.cpr_path && <p className="mt-2 text-xs font-extrabold text-[#017f27]"><Check size={14} className="mr-1 inline" />CPR certificate on file</p>}'
new_cpr_status = '''{details.professional.cpr_path && <p className="mt-2 text-xs font-extrabold text-[#017f27]"><Check size={14} className="mr-1 inline" />{details.professional.cpr_status === "verified" && details.professional.cpr_expiry_month ? `CPR current — expires ${new Date(details.professional.cpr_expiry_month + "T12:00:00").toLocaleDateString("en-CA", { month: "long", year: "numeric" })}` : details.professional.cpr_status === "pending" ? "CPR submitted — pending DentalShift Admin review" : "CPR certificate on file"}</p>}'''
if old_cpr_status in app:
    app = app.replace(old_cpr_status, new_cpr_status, 1)

lib_path.write_text(lib)
app_path.write_text(app)
print('CPR expiry/admin review/renewal flow patched successfully')
