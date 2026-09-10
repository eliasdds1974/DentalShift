from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

anchor = 'const employmentOptions = ["Full-Time", "Part-Time", "Flexible", "Temporary / Contract"];\n'
insert = '''const employmentOptions = ["Full-Time", "Part-Time", "Flexible", "Temporary / Contract"];

const professionalCardThemes: Record<string, { accent: string; border: string; pale: string; text: string }> = {
  "Registered Dental Hygienist": { accent: "#4285F4", border: "#4285F455", pale: "#EEF4FF", text: "#245FB8" },
  "Certified Dental Assistant": { accent: "#EA4335", border: "#EA433555", pale: "#FFF0EE", text: "#B52C22" },
  "Dental Administrator": { accent: "#FBBC05", border: "#FBBC0566", pale: "#FFF8DF", text: "#805F00" },
  "Sterilization Technician": { accent: "#34A853", border: "#34A85355", pale: "#ECF8EF", text: "#247A3B" },
  "Associate Dentist": { accent: "#7C3AED", border: "#7C3AED55", pale: "#F4EEFF", text: "#5B21B6" },
};

function getProfessionalCardTheme(profession: string) {
  return professionalCardThemes[profession] || { accent: "#01A32E", border: "#01A32E55", pale: "#EAF8EE", text: "#017F27" };
}
'''
if anchor not in text:
    raise RuntimeError('employmentOptions anchor not found')
text = text.replace(anchor, insert, 1)

replacements = {
'''className={`group relative overflow-hidden rounded-3xl border-2 bg-white shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl ${ad.kind === "office" ? "border-[#002757]/18" : "border-[#01A32E]/30"} ${ad.featured ? "ring-2 ring-[#FDB605]/30" : ""}`}''': '''className={`group relative overflow-hidden rounded-3xl border-2 bg-white shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl ${ad.featured ? "ring-2 ring-[#FDB605]/30" : ""}`} style={{ borderColor: ad.kind === "office" ? "rgba(0,39,87,0.18)" : getProfessionalCardTheme(ad.profession).border }}''',
'''<div className={`absolute inset-x-0 top-0 h-1.5 ${ad.kind === "office" ? "bg-[#002757]" : "bg-[#01A32E]"}`} />''': '''<div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: ad.kind === "office" ? "#002757" : getProfessionalCardTheme(ad.profession).accent }} />''',
'''<div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl shadow-sm ${ad.kind === "office" ? "bg-[#002757] text-white" : "bg-[#01A32E] text-white"}`}>{ad.kind === "office" ? <Building2 size={26} /> : <UserRound size={26} />}</div>''': '''<div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: ad.kind === "office" ? "#002757" : getProfessionalCardTheme(ad.profession).accent }}>{ad.kind === "office" ? <Building2 size={26} /> : <UserRound size={26} />}</div>''',
'''<span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black tracking-wide ${ad.kind === "office" ? "bg-[#edf3fa] text-[#002757]" : "bg-[#eaf8ee] text-[#017f27]"}`}>{ad.kind === "office" ? "OFFICE HIRING" : "PROFESSIONAL SEEKING OFFICE"}</span>''': '''<span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black tracking-wide ${ad.kind === "office" ? "bg-[#edf3fa] text-[#002757]" : ""}`} style={ad.kind === "professional" ? { backgroundColor: getProfessionalCardTheme(ad.profession).pale, color: getProfessionalCardTheme(ad.profession).text } : undefined}>{ad.kind === "office" ? "OFFICE HIRING" : "PROFESSIONAL SEEKING OFFICE"}</span>''',
'''<h3 className={`mt-2 text-xl font-black leading-6 ${ad.kind === "office" ? "text-[#002757]" : "text-[#017f27]"}`}>{ad.title}</h3>''': '''<h3 className={`mt-2 text-xl font-black leading-6 ${ad.kind === "office" ? "text-[#002757]" : ""}`} style={ad.kind === "professional" ? { color: getProfessionalCardTheme(ad.profession).text } : undefined}>{ad.title}</h3>''',
'''<span className={`rounded-lg px-3 py-2 text-xs font-black ${ad.kind === "office" ? "bg-[#edf3fa] text-[#002757]" : "bg-[#eaf8ee] text-[#017f27]"}`}>{ad.employment}</span>''': '''<span className={`rounded-lg px-3 py-2 text-xs font-black ${ad.kind === "office" ? "bg-[#edf3fa] text-[#002757]" : ""}`} style={ad.kind === "professional" ? { backgroundColor: getProfessionalCardTheme(ad.profession).pale, color: getProfessionalCardTheme(ad.profession).text } : undefined}>{ad.employment}</span>''',
'''<div className={`flex items-center justify-between gap-3 border-t px-5 py-4 sm:px-6 ${ad.kind === "office" ? "border-[#002757]/10 bg-[#f7f9fc]" : "border-[#01A32E]/15 bg-[#f5fbf6]"}`}>''': '''<div className={`flex items-center justify-between gap-3 border-t px-5 py-4 sm:px-6 ${ad.kind === "office" ? "border-[#002757]/10 bg-[#f7f9fc]" : ""}`} style={ad.kind === "professional" ? { borderColor: getProfessionalCardTheme(ad.profession).border, backgroundColor: getProfessionalCardTheme(ad.profession).pale } : undefined}>''',
'''<span className={`text-xs font-black ${ad.kind === "office" ? "text-[#002757]" : "text-[#017f27]"}`}>{ad.kind === "office" ? "Anonymous office opportunity" : "Anonymous professional profile"}</span>''': '''<span className={`text-xs font-black ${ad.kind === "office" ? "text-[#002757]" : ""}`} style={ad.kind === "professional" ? { color: getProfessionalCardTheme(ad.profession).text } : undefined}>{ad.kind === "office" ? "Anonymous office opportunity" : "Anonymous professional profile"}</span>''',
'''<button type="button" className={`rounded-xl px-4 py-2.5 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg ${ad.kind === "office" ? "bg-[#002757] hover:bg-[#01A32E]" : "bg-[#01A32E] hover:bg-[#002757]"}`}>View Opportunity</button>''': '''<button type="button" className={`rounded-xl px-4 py-2.5 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:brightness-95 hover:shadow-lg ${ad.kind === "office" ? "bg-[#002757]" : ""}`} style={ad.kind === "professional" ? { backgroundColor: getProfessionalCardTheme(ad.profession).accent } : undefined}>View Opportunity</button>'''
}

for old, new in replacements.items():
    if old not in text:
        raise RuntimeError(f'Expected card fragment not found: {old[:80]}')
    text = text.replace(old, new, 1)

path.write_text(text)
print('Applied profession-specific colors to professional DentalJobs cards; office cards remain navy.')
