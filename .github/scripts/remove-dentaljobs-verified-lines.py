from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

# Remove the top privacy marketplace badge while leaving the DentalJobs heading/subcopy intact.
badge = '<div className="inline-flex items-center gap-2 rounded-full bg-[#eaf8ee] px-3 py-1.5 text-xs font-black text-[#017f27]"><ShieldCheck size={14} /> Private DentalShift employment marketplace</div>'
if badge not in text:
    raise RuntimeError('Private marketplace badge not found')
text = text.replace(badge, '', 1)

# Remove identity/verification line from every public opportunity card.
public_name = '<p className="mt-1 text-sm font-bold text-slate-600">{ad.name}</p>'
if public_name not in text:
    raise RuntimeError('Public card identity line not found')
text = text.replace(public_name, '', 1)

# Remove identity/verification line from posting preview card as well.
preview_name = '<p className="mt-1 text-sm font-bold text-slate-600">{postingMode === "office" ? "Verified Dental Office" : "Verified DentalShift Professional"}</p>'
if preview_name not in text:
    raise RuntimeError('Preview identity line not found')
text = text.replace(preview_name, '', 1)

path.write_text(text)
print('Removed DentalJobs verification identity lines and private marketplace badge.')
