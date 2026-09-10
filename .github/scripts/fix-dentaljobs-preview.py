from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

text = text.replace('type PostingMode = "office" | "professional" | null;','''type PostingMode = "office" | "professional" | null;
type PostingPreview = {
  position: string;
  employment: string;
  city: string;
  province: string;
  days: string;
  payFrom: string;
  payTo: string;
  schedule: string;
  description: string;
};''',1)

text = text.replace('  const [submitted, setSubmitted] = useState(false);','''  const [submitted, setSubmitted] = useState(false);
  const [preview, setPreview] = useState<PostingPreview | null>(null);''',1)

old_submit = '''  const submitPreview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };'''
new_submit = '''  const submitPreview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPreview({
      position: String(form.get("position") || ""),
      employment: String(form.get("employment") || ""),
      city: String(form.get("city") || ""),
      province: String(form.get("province") || ""),
      days: String(form.get("days") || ""),
      payFrom: String(form.get("pay_from") || ""),
      payTo: String(form.get("pay_to") || ""),
      schedule: String(form.get("schedule") || ""),
      description: String(form.get("description") || ""),
    });
    setSubmitted(true);
  };'''
if old_submit not in text:
    raise RuntimeError('submitPreview block not found')
text = text.replace(old_submit,new_submit,1)

old_success = '''{submitted ? <div className="p-8 text-center sm:p-10"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#eaf8ee] text-[#01A32E]"><Check size={32} strokeWidth={3} /></div><h3 className="mt-5 text-2xl font-black text-[#002757]">Posting form ready</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">This preview confirms the posting form and anonymous presentation. Live publishing will be connected to the DentalShift database in the next step.</p><button type="button" onClick={() => setPostingMode(null)} className="mt-6 rounded-xl bg-[#002757] px-5 py-3 text-sm font-black text-white">Close</button></div> : <form'''
new_success = '''{submitted && preview ? <div className="p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#01A32E]">Posting Preview</p><h3 className="mt-1 text-2xl font-black text-[#002757]">Review your listing</h3><p className="mt-1 text-sm text-slate-500">This is how your anonymous DentalJobs posting will be presented.</p></div><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eaf8ee] text-[#01A32E]"><Check size={24} strokeWidth={3} /></div></div><article className="mt-5 overflow-hidden rounded-2xl border-2 border-[#002757]/15 bg-white shadow-sm"><div className="border-b border-slate-100 bg-[#f8fafc] p-5"><span className="rounded-full bg-[#edf3fa] px-2.5 py-1 text-[11px] font-black text-[#002757]">{postingMode === "office" ? "OFFICE HIRING" : "PROFESSIONAL LOOKING FOR AN OFFICE"}</span><h4 className="mt-3 text-xl font-black text-slate-900">{preview.position}</h4><p className="mt-1 text-sm font-bold text-slate-600">{postingMode === "office" ? "Verified Dental Office" : "Verified DentalShift Professional"}</p></div><div className="grid gap-4 p-5 sm:grid-cols-2"><div><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Employment</p><p className="mt-1 font-bold text-[#002757]">{preview.employment}</p></div><div><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Location</p><p className="mt-1 font-bold text-[#002757]">{preview.city}, {preview.province}</p></div><div><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Days / week</p><p className="mt-1 font-bold text-[#002757]">{preview.days || "Not specified"}</p></div><div><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Compensation</p><p className="mt-1 font-bold text-[#002757]">{preview.payFrom || preview.payTo ? `${preview.payFrom ? `$${preview.payFrom}` : ""}${preview.payFrom && preview.payTo ? " – " : ""}${preview.payTo ? `$${preview.payTo}` : ""}/hr` : "Not specified"}</p></div>{preview.schedule && <div className="sm:col-span-2"><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Schedule / hours</p><p className="mt-1 font-bold text-[#002757]">{preview.schedule}</p></div>}<div className="sm:col-span-2"><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">About the opportunity</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{preview.description}</p></div></div></article><div className="mt-5 rounded-2xl border border-[#01A32E]/25 bg-[#f3fbf5] p-4"><div className="flex items-start gap-3"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#01A32E]" /><div><p className="font-black text-[#002757]">Anonymous preview</p><p className="mt-1 text-sm leading-6 text-slate-600">Your identity and direct contact information remain hidden from this public listing.</p></div></div></div><div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setSubmitted(false)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-[#002757]">Back to Edit</button><button type="button" onClick={() => setPostingMode(null)} className="rounded-xl bg-[#002757] px-5 py-3 text-sm font-black text-white">Close Preview</button></div></div> : <form'''
if old_success not in text:
    raise RuntimeError('submitted preview block not found')
text = text.replace(old_success,new_success,1)

replacements = {
'<select required defaultValue=""><option value="" disabled>Select a position</option>':'<select name="position" required defaultValue=""><option value="" disabled>Select a position</option>',
'<select required defaultValue="Full-Time">{employmentOptions.map':'<select name="employment" required defaultValue="Full-Time">{employmentOptions.map',
'<input required placeholder="e.g. Calgary NW" />':'<input name="city" required placeholder="e.g. Calgary NW" />',
'<select required defaultValue="AB">{["AB"':'<select name="province" required defaultValue="AB">{["AB"',
'<select defaultValue="4"><option>1</option>':'<select name="days" defaultValue="4"><option>1</option>',
'<input type="number" min="0" step="1" placeholder="$ / hour" />':'<input name="pay_from" type="number" min="0" step="1" placeholder="$ / hour" />',
'<input type="number" min="0" step="1" placeholder="$ / hour" /></label>\n        <label className="field sm:col-span-2"><span>{postingMode === "office" ? "Schedule / hours"':'<input name="pay_to" type="number" min="0" step="1" placeholder="$ / hour" /></label>\n        <label className="field sm:col-span-2"><span>{postingMode === "office" ? "Schedule / hours"',
'<input placeholder={postingMode === "office" ? "e.g. Monday–Thursday, 8:00 AM–4:30 PM"':'<input name="schedule" placeholder={postingMode === "office" ? "e.g. Monday–Thursday, 8:00 AM–4:30 PM"',
'<textarea required rows={5} maxLength={1500} placeholder={postingMode === "office" ?':'<textarea name="description" required rows={5} maxLength={1500} placeholder={postingMode === "office" ?'
}
# Handle pay fields carefully: first replacement only first occurrence
for old,new in list(replacements.items())[:5]:
    if old not in text: raise RuntimeError(f'field pattern missing: {old[:30]}')
    text = text.replace(old,new,1)
# Replace two identical pay inputs sequentially
old_pay='<input type="number" min="0" step="1" placeholder="$ / hour" />'
if text.count(old_pay) < 2: raise RuntimeError('pay inputs missing')
text=text.replace(old_pay,'<input name="pay_from" type="number" min="0" step="1" placeholder="$ / hour" />',1)
text=text.replace(old_pay,'<input name="pay_to" type="number" min="0" step="1" placeholder="$ / hour" />',1)
for old,new in list(replacements.items())[7:]:
    if old not in text: raise RuntimeError(f'field pattern missing: {old[:30]}')
    text=text.replace(old,new,1)

path.write_text(text)
print('DentalJobs preview now captures and displays actual listing details.')
