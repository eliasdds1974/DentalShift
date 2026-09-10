from pathlib import Path

app_path = Path('app/page.tsx')
lib_path = Path('lib/dentalshift.ts')

app = app_path.read_text()
lib = lib_path.read_text()

# lib/dentalshift.ts
if 'cpr_path: string | null;' not in lib:
    lib = lib.replace('  resume_path: string | null;\n', '  cpr_path: string | null;\n  resume_path: string | null;\n', 1)

lib = lib.replace('skills,resume_path,available_for_work', 'skills,cpr_path,resume_path,available_for_work')

if 'export async function uploadProfessionalCpr' not in lib:
    anchor = 'export async function uploadProfessionalResume(userId: string, file: File) {'
    insertion = '''export async function uploadProfessionalCpr(userId: string, file: File) {\n  const extensions: Record<string, string> = {\n    "application/pdf": "pdf",\n    "image/jpeg": "jpg",\n    "image/png": "png",\n    "image/webp": "webp",\n  };\n  if (!file || file.size === 0) throw new Error("Choose a CPR certificate to upload.");\n  const extension = extensions[file.type];\n  if (!extension) throw new Error("Choose a PDF, JPG, PNG or WebP CPR certificate.");\n  if (file.size > 5 * 1024 * 1024) throw new Error("Your CPR certificate must be smaller than 5 MB.");\n  const path = `${userId}/cpr.${extension}`;\n  const { error: uploadError } = await supabase.storage\n    .from("professional-cpr")\n    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });\n  if (uploadError) throw new Error(`Your CPR certificate could not be uploaded: ${uploadError.message}`);\n  const { data, error } = await supabase\n    .from("professional_profiles")\n    .update({ cpr_path: path })\n    .eq("user_id", userId)\n    .select("cpr_path")\n    .single();\n  if (error || !data?.cpr_path) throw new Error(`The CPR certificate uploaded, but it could not be saved to your profile: ${error?.message || "No path returned"}`);\n  return data.cpr_path as string;\n}\n\nexport async function openProfessionalCpr(path: string) {\n  const { data, error } = await supabase.storage.from("professional-cpr").createSignedUrl(path, 60);\n  if (error || !data?.signedUrl) throw new Error(error?.message || "Your CPR certificate could not be opened.");\n  return data.signedUrl;\n}\n\n'''
    if anchor not in lib:
        raise SystemExit('Could not find uploadProfessionalResume anchor')
    lib = lib.replace(anchor, insertion + anchor, 1)

# app/page.tsx import helpers
if 'openProfessionalCpr' not in app:
    app = app.replace('loadVerificationQueue, openProfessionalResume,', 'loadVerificationQueue, openProfessionalCpr, openProfessionalResume,', 1)
if 'uploadProfessionalCpr' not in app:
    app = app.replace('uploadOfficeLogo, uploadProfessionalResume,', 'uploadOfficeLogo, uploadProfessionalCpr, uploadProfessionalResume,', 1)

# handlers before existing resume handler
if 'const uploadCpr = async' not in app:
    anchor = '  const uploadResume = async (file?: File) => {'
    handlers = '''  const uploadCpr = async (file?: File) => {\n    if (!file || !session || !details?.professional) return;\n    setBusy(true); setError(""); setNotice("");\n    try {\n      const cprPath = await uploadProfessionalCpr(session.user.id, file);\n      setDetails({ ...details, professional: { ...details.professional, cpr_path: cprPath } });\n      setNotice("Your CPR certificate was uploaded securely for DentalShift Admin review.");\n      onSaved();\n    } catch (value) { setError(value instanceof Error ? value.message : "Your CPR certificate could not be uploaded."); }\n    finally { setBusy(false); }\n  };\n\n  const viewCpr = async () => {\n    if (!details?.professional?.cpr_path) return;\n    setError("");\n    try { window.open(await openProfessionalCpr(details.professional.cpr_path), "_blank", "noopener,noreferrer"); }\n    catch (value) { setError(value instanceof Error ? value.message : "Your CPR certificate could not be opened."); }\n  };\n\n'''
    if anchor not in app:
        raise SystemExit('Could not find uploadResume anchor')
    app = app.replace(anchor, handlers + anchor, 1)

# CPR section immediately before existing Professional résumé/CV section
if 'Current CPR certificate' not in app:
    resume_anchor = '                <div className="rounded-xl border border-dashed border-[#0078FE]/40 bg-[#edf3fa] p-3 sm:col-span-2 lg:col-span-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#0078FE] shadow-sm"><FileText size={23} /></span><div className="min-w-0 flex-1"><h3 className="font-extrabold text-[#002757]">Professional résumé/CV</h3>'
    cpr_section = '''                {(["Registered Dental Hygienist", "Certified Dental Assistant"].includes(details.professional.profession)) && <div className="rounded-xl border border-dashed border-[#01A32E]/45 bg-[#f3fbf5] p-3 sm:col-span-2 lg:col-span-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#01A32E] shadow-sm"><FileCheck2 size={23} /></span><div className="min-w-0 flex-1"><h3 className="font-extrabold text-[#002757]">Current CPR certificate</h3><p className="mt-1 text-xs leading-5 text-slate-500">Required for RDH and CDA verification. Upload a PDF or image, or take a clear photo with your phone. Maximum size 5 MB. The certificate is private and reviewed only by DentalShift Admin.</p>{details.professional.cpr_path && <p className="mt-2 text-xs font-extrabold text-[#017f27]"><Check size={14} className="mr-1 inline" />CPR certificate on file</p>}</div><div className="flex flex-wrap gap-2"><label className="primary-btn cursor-pointer justify-center"><Upload size={16} />{busy ? "Please wait…" : details.professional.cpr_path ? "Replace CPR" : "Upload CPR"}<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(event) => void uploadCpr(event.target.files?.[0])} /></label><label className="secondary-btn cursor-pointer justify-center"><FileCheck2 size={16} />Take photo<input type="file" accept="image/*" capture="environment" className="sr-only" disabled={busy} onChange={(event) => void uploadCpr(event.target.files?.[0])} /></label>{details.professional.cpr_path && <button type="button" onClick={() => void viewCpr()} className="secondary-btn">View CPR</button>}</div></div></div>}\n'''
    if resume_anchor not in app:
        raise SystemExit('Could not find Professional resume UI anchor')
    app = app.replace(resume_anchor, cpr_section + resume_anchor, 1)

lib_path.write_text(lib)
app_path.write_text(app)
print('CPR upload feature patched successfully')
