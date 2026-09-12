from pathlib import Path

p = Path('app/classifieds/page.tsx')
s = p.read_text()

# Add a clear privacy/public-disclosure warning inside the Import Existing Job Ad modal.
needle = '''<div className="mt-4 rounded-2xl border border-[#01A32E]/25 bg-[#f3fbf5] p-4"><div className="flex items-start gap-3"><FileText size={20} className="mt-0.5 shrink-0 text-[#01A32E]" /><div><p className="font-black text-[#002757]">We’ll organize it for you</p><p className="mt-1 text-sm leading-6 text-slate-600">DentalShift will identify the likely position, employment type, pay range, days per week and province when they appear in the ad. You can review and change every field before posting.</p></div></div></div>{importError'''
replacement = '''<div className="mt-4 rounded-2xl border border-[#01A32E]/25 bg-[#f3fbf5] p-4"><div className="flex items-start gap-3"><FileText size={20} className="mt-0.5 shrink-0 text-[#01A32E]" /><div><p className="font-black text-[#002757]">We’ll organize it for you</p><p className="mt-1 text-sm leading-6 text-slate-600">DentalShift will identify the likely position, employment type, pay range, days per week and province when they appear in the ad. You can review and change every field before posting.</p></div></div></div><div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4"><div className="flex items-start gap-3"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-amber-600" /><div><p className="font-black text-[#7a4b00]">Review identifying details before posting</p><p className="mt-1 text-sm leading-6 text-amber-900">Your imported ad may contain your clinic name, address, phone number, email address or website. DentalShift will not remove those details automatically. If you leave them in the ad, they will be visible publicly. Remove or edit anything you prefer to keep private before you post.</p></div></div></div>{importError'''
if needle not in s:
    raise SystemExit('Import information block not found')
s = s.replace(needle, replacement, 1)

# Clarify the office posting form privacy statement so it never promises anonymity for text the office supplies.
old_header = '''{postingMode === "office" ? "Your office identity and exact contact information will not appear publicly." : "Your name and direct contact information will not appear publicly. DentalShift can use the résumé/CV already stored in your account when you apply."}'''
new_header = '''{postingMode === "office" ? "DentalShift does not automatically add your office account identity or contact details. Any clinic name, address, phone number, email or website you include in the ad itself will appear publicly." : "Your name and direct contact information will not appear publicly. DentalShift can use the résumé/CV already stored in your account when you apply."}'''
if old_header not in s:
    raise SystemExit('Posting privacy header not found')
s = s.replace(old_header, new_header, 1)

# Make the preview privacy notice accurate for imported/office-authored text.
old_preview = '''<div className="mt-5 rounded-2xl border border-[#01A32E]/25 bg-[#f3fbf5] p-4"><div className="flex items-start gap-3"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#01A32E]" /><div><p className="font-black text-[#002757]">Anonymous preview</p><p className="mt-1 text-sm leading-6 text-slate-600">Your identity and direct contact information remain hidden from this public listing.</p></div></div></div>{publishError'''
new_preview = '''<div className="mt-5 rounded-2xl border border-[#01A32E]/25 bg-[#f3fbf5] p-4"><div className="flex items-start gap-3"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#01A32E]" /><div><p className="font-black text-[#002757]">{postingMode === "office" ? "Public listing review" : "Anonymous preview"}</p><p className="mt-1 text-sm leading-6 text-slate-600">{postingMode === "office" ? "DentalShift does not add your office account contact details automatically. Any clinic name, address, phone number, email or website you included in the ad text will be visible publicly." : "Your identity and direct contact information remain hidden from this public listing."}</p></div></div></div>{publishError'''
if old_preview not in s:
    raise SystemExit('Preview privacy block not found')
s = s.replace(old_preview, new_preview, 1)

# Avoid calling an office posting anonymous in the post-success copy.
old_success = '''`Your anonymous DentalJobs posting has been published and is now visible in the active job listings. It will remain active for ${postingMode === "office" ? 30 : 14} days unless you close it earlier.`'''
new_success = '''`Your DentalJobs posting has been published and is now visible in the active job listings. It will remain active for ${postingMode === "office" ? 30 : 14} days unless you close it earlier.`'''
if old_success in s:
    s = s.replace(old_success, new_success, 1)

p.write_text(s)
