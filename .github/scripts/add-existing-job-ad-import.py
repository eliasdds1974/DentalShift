from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

# 1) Add import parser helpers before the component.
marker = '''function getProfessionalCardTheme(profession: string) {
  return professionalCardThemes[profession] || { accent: "#01A32E", border: "#01A32E55", pale: "#EAF8EE", text: "#017F27" };
}
'''
helper = marker + r'''
function parseImportedOfficeAd(rawText: string, fallbackCity: string, fallbackProvince: string): PostingPreview {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  let position = "";
  if (/\b(rdh|registered dental hygienist|dental hygienist|hygienist)\b/i.test(text)) position = "Registered Dental Hygienist";
  else if (/\b(cda|certified dental assistant|dental assistant)\b/i.test(text)) position = "Certified Dental Assistant";
  else if (/\b(sterilization|sterilisation|steri tech|sterilization technician)\b/i.test(text)) position = "Sterilization Technician";
  else if (/\b(associate dentist|general dentist|dentist associate|dentist)\b/i.test(text)) position = "Associate Dentist";
  else if (/\b(dental administrator|administrator|receptionist|front desk|treatment coordinator)\b/i.test(text)) position = "Dental Administrator";

  let employment = "Full-Time";
  if (/\b(part[- ]?time|part time)\b/i.test(text)) employment = "Part-Time";
  else if (/\b(temporary|contract|locum)\b/i.test(text)) employment = "Temporary / Contract";
  else if (/\b(flexible|casual)\b/i.test(text)) employment = "Flexible";
  else if (/\b(full[- ]?time|full time)\b/i.test(text)) employment = "Full-Time";

  const payRange = text.match(/\$\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:[-–—]|to)\s*\$?\s*(\d{2,3}(?:\.\d{1,2})?)/i);
  const singlePay = text.match(/\$\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:\/\s*(?:hr|hour)|per\s+hour|hourly)/i);
  const payFrom = payRange?.[1] || singlePay?.[1] || "";
  const payTo = payRange?.[2] || "";

  const daysMatch = text.match(/\b([1-5])\s*(?:days?|d)\s*(?:\/|per)\s*week\b/i) || text.match(/\b([1-5])\s+days?\s+(?:a|each)\s+week\b/i);
  const days = daysMatch?.[1] || (/\bflexible\b/i.test(text) ? "Flexible" : "4");

  const provinceNames: Record<string, string> = {
    alberta: "AB", "british columbia": "BC", manitoba: "MB", "new brunswick": "NB", "newfoundland and labrador": "NL",
    "nova scotia": "NS", "northwest territories": "NT", nunavut: "NU", ontario: "ON", "prince edward island": "PE",
    quebec: "QC", saskatchewan: "SK", yukon: "YT"
  };
  let province = fallbackProvince || "AB";
  for (const [name, abbreviation] of Object.entries(provinceNames)) {
    if (lower.includes(name)) {
      province = abbreviation;
      break;
    }
  }
  const provinceCodeMatch = text.match(/(?:,|\s)\b(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)\b/i);
  if (provinceCodeMatch) province = provinceCodeMatch[1].toUpperCase();

  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const scheduleLine = lines.find((line) => /\b(schedule|hours?|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(line) && line.length <= 180) || "";

  return {
    position,
    employment,
    city: fallbackCity,
    province,
    days,
    payFrom,
    payTo,
    schedule: scheduleLine,
    description: text.slice(0, 1500),
  };
}
'''
if 'function parseImportedOfficeAd(' not in text:
    if marker not in text:
        raise SystemExit('Could not find professional theme helper marker')
    text = text.replace(marker, helper, 1)

# 2) Add state for the import dialog and imported field defaults.
state_marker = '  const [unlockedCandidate, setUnlockedCandidate] = useState<UnlockedCandidate | null>(null);\n'
state_add = state_marker + '''  const [importingOfficeAd, setImportingOfficeAd] = useState(false);\n  const [importAdText, setImportAdText] = useState("");\n  const [importError, setImportError] = useState("");\n  const [importPrefill, setImportPrefill] = useState<PostingPreview | null>(null);\n'''
if 'const [importingOfficeAd' not in text:
    if state_marker not in text:
        raise SystemExit('Could not find state insertion marker')
    text = text.replace(state_marker, state_add, 1)

# 3) Add handler before submitPreview.
submit_marker = '  const submitPreview = (event: FormEvent<HTMLFormElement>) => {\n'
handler = r'''  const importExistingOfficeAd = () => {
    const value = importAdText.trim();
    if (value.length < 40) {
      setImportError("Paste the text from your existing job ad so DentalShift has enough information to fill the posting form.");
      return;
    }
    const parsed = parseImportedOfficeAd(value, officeLocation.city, officeLocation.province);
    setImportPrefill(parsed);
    setImportError("");
    setImportingOfficeAd(false);
    setEditingListing(null);
    setPostingMode("office");
    setSubmitted(false);
    setPosted(false);
    setPreview(null);
    setPublishError("");
  };

'''
if 'const importExistingOfficeAd = () =>' not in text:
    if submit_marker not in text:
        raise SystemExit('Could not find submitPreview marker')
    text = text.replace(submit_marker, handler + submit_marker, 1)

# 4) Refactor the office Post a Position card so the import control can sit at its bottom without nesting buttons.
old_card = '''{portalRole !== "professional" && <button type="button" onClick={() => { setEditingListing(null); setPostingMode("office"); setSubmitted(false); setPosted(false); setPublishError(""); }} className="group relative overflow-hidden rounded-2xl border-2 border-[#002757] bg-[#002757] p-5 text-left shadow-xl transition hover:-translate-y-1 hover:border-[#01A32E] hover:shadow-2xl"><div className="absolute inset-x-0 top-0 h-1.5 bg-[#01A32E]" /><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#01A32E] text-white shadow-md ring-4 ring-white/10"><Building2 size={24} /></span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#9be3ad]">Dental Office</p><h2 className="mt-1 text-xl font-black text-white">Post a Position</h2><p className="mt-2 text-sm leading-6 text-slate-200">Advertise an opening anonymously. Your office name, exact address and contact information stay private.</p><span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#01A32E] px-4 py-2.5 text-sm font-black text-white shadow-md transition group-hover:bg-white group-hover:text-[#002757]">Create office posting <BriefcaseBusiness size={16} /></span></div></div></button>}'''
new_card = '''{portalRole !== "professional" && <div className="relative overflow-hidden rounded-2xl border-2 border-[#002757] bg-[#002757] p-5 shadow-xl transition hover:border-[#01A32E] hover:shadow-2xl"><div className="absolute inset-x-0 top-0 h-1.5 bg-[#01A32E]" /><button type="button" onClick={() => { setImportPrefill(null); setEditingListing(null); setPostingMode("office"); setSubmitted(false); setPosted(false); setPublishError(""); }} className="group block w-full text-left"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#01A32E] text-white shadow-md ring-4 ring-white/10"><Building2 size={24} /></span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#9be3ad]">Dental Office</p><h2 className="mt-1 text-xl font-black text-white">Post a Position</h2><p className="mt-2 text-sm leading-6 text-slate-200">Advertise an opening anonymously. Your office name, exact address and contact information stay private.</p><span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#01A32E] px-4 py-2.5 text-sm font-black text-white shadow-md transition group-hover:bg-white group-hover:text-[#002757]">Create office posting <BriefcaseBusiness size={16} /></span></div></div></button><div className="mt-5 border-t border-white/15 pt-4"><p className="text-xs leading-5 text-slate-300">Already posted on Indeed or another job site? Paste your existing ad and we’ll fill in the details for you.</p><button type="button" onClick={() => { setImportAdText(""); setImportError(""); setImportingOfficeAd(true); }} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white px-4 py-2.5 text-sm font-black text-[#002757] shadow-sm transition hover:border-[#01A32E] hover:bg-[#effaf2] sm:w-auto"><FileText size={16} /> Import Existing Job Ad</button></div></div>}'''
if 'Import Existing Job Ad' not in text:
    if old_card not in text:
        raise SystemExit('Could not find office posting card')
    text = text.replace(old_card, new_card, 1)

# 5) Use imported values as defaults in the normal office posting form.
replacements = [
    ('defaultValue={editingListing?.profession || (postingMode === "professional" ? professionalProfession : "")}', 'defaultValue={editingListing?.profession || (postingMode === "office" ? importPrefill?.position || "" : professionalProfession)}'),
    ('defaultValue={editingListing?.employment_type || "Full-Time"}', 'defaultValue={editingListing?.employment_type || (postingMode === "office" ? importPrefill?.employment || "Full-Time" : "Full-Time")}'),
    ('defaultValue={editingListing?.city || (postingMode === "office" ? officeLocation.city : professionalLocation.city)}', 'defaultValue={editingListing?.city || (postingMode === "office" ? importPrefill?.city || officeLocation.city : professionalLocation.city)}'),
    ('defaultValue={editingListing?.province || (postingMode === "office" ? officeLocation.province : professionalLocation.province)}', 'defaultValue={editingListing?.province || (postingMode === "office" ? importPrefill?.province || officeLocation.province : professionalLocation.province)}'),
    ('defaultValue={editingListing?.days_per_week || "4"}', 'defaultValue={editingListing?.days_per_week || (postingMode === "office" ? importPrefill?.days || "4" : "4")}'),
    ('name="pay_from" defaultValue={editingListing?.pay_min ?? ""}', 'name="pay_from" defaultValue={editingListing?.pay_min ?? (postingMode === "office" ? importPrefill?.payFrom || "" : "")}'),
    ('name="pay_to" defaultValue={editingListing?.pay_max ?? ""}', 'name="pay_to" defaultValue={editingListing?.pay_max ?? (postingMode === "office" ? importPrefill?.payTo || "" : "")}'),
    ('name="schedule" defaultValue={editingListing?.schedule || ""}', 'name="schedule" defaultValue={editingListing?.schedule || (postingMode === "office" ? importPrefill?.schedule || "" : "")}'),
    ('name="description" defaultValue={editingListing?.description || ""}', 'name="description" defaultValue={editingListing?.description || (postingMode === "office" ? importPrefill?.description || "" : "")}'),
]
for old, new in replacements:
    if new not in text:
        if old not in text:
            raise SystemExit(f'Could not find form default: {old}')
        text = text.replace(old, new, 1)

# 6) Insert the paste/import dialog immediately before the existing posting dialog.
posting_dialog_marker = '    {postingMode && <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#002757]/65 p-4 sm:p-6">'
import_dialog = '''    {importingOfficeAd && <div className="fixed inset-0 z-[92] overflow-y-auto bg-[#002757]/70 p-4 sm:p-6"><button type="button" aria-label="Close import job ad" onClick={() => setImportingOfficeAd(false)} className="fixed inset-0" /><section role="dialog" aria-modal="true" className="relative mx-auto my-8 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#002757] p-5 text-white sm:p-6"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#9be3ad]">Quick Import</p><h2 className="mt-1 text-2xl font-black">Import Existing Job Ad</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">Paste an ad your office already posted on Indeed or another job site. DentalShift will use it to fill in the posting form for you.</p></div><button type="button" onClick={() => setImportingOfficeAd(false)} className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20"><X size={22} /></button></div><div className="p-5 sm:p-6"><label className="block"><span className="text-sm font-black text-[#002757]">Paste your existing job ad</span><textarea autoFocus value={importAdText} onChange={(e) => { setImportAdText(e.target.value); if (importError) setImportError(""); }} rows={12} placeholder="Copy the text from your existing Indeed or other job posting and paste it here…" className="mt-2 w-full resize-y rounded-2xl border border-slate-300 p-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-[#01A32E] focus:ring-2 focus:ring-[#01A32E]/15" /></label><div className="mt-4 rounded-2xl border border-[#01A32E]/25 bg-[#f3fbf5] p-4"><div className="flex items-start gap-3"><FileText size={20} className="mt-0.5 shrink-0 text-[#01A32E]" /><div><p className="font-black text-[#002757]">We’ll organize it for you</p><p className="mt-1 text-sm leading-6 text-slate-600">DentalShift will identify the likely position, employment type, pay range, days per week and province when they appear in the ad. You can review and change every field before posting.</p></div></div></div>{importError && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{importError}</p>}<div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => setImportingOfficeAd(false)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-[#002757]">Cancel</button><button type="button" onClick={importExistingOfficeAd} className="rounded-xl bg-[#01A32E] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#018a28]">Fill Posting Form</button></div></div></section></div>}

'''
if '{importingOfficeAd &&' not in text:
    if posting_dialog_marker not in text:
        raise SystemExit('Could not find posting dialog insertion marker')
    text = text.replace(posting_dialog_marker, import_dialog + posting_dialog_marker, 1)

path.write_text(text)
print('Existing job ad import added to DentalJobs')
