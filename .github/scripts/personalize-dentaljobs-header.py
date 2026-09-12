from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

state_anchor = '  const [portalRole, setPortalRole] = useState<"office" | "professional" | null>(null);\n'
if state_anchor not in text:
    raise SystemExit('portalRole state anchor not found')
text = text.replace(state_anchor, state_anchor + '  const [accountDisplayName, setAccountDisplayName] = useState("");\n', 1)

office_anchor = '          setOfficeLocation({ city, province });\n          setOfficeId(details.office?.id || null);\n'
if office_anchor not in text:
    raise SystemExit('office account anchor not found')
text = text.replace(office_anchor, '          setOfficeLocation({ city, province });\n          setOfficeId(details.office?.id || null);\n          setAccountDisplayName(details.office?.name || details.profile.first_name || "");\n', 1)

pro_anchor = '          setProfessionalId(user.id);\n          setProfessionalLocation({ city: details.profile.city || "", province: details.profile.province || details.professional.licence_province || "AB" });\n'
if pro_anchor not in text:
    raise SystemExit('professional account anchor not found')
text = text.replace(pro_anchor, '          setProfessionalId(user.id);\n          setAccountDisplayName(details.profile.first_name || "");\n          setProfessionalLocation({ city: details.profile.city || "", province: details.profile.province || details.professional.licence_province || "AB" });\n', 1)

heading = '<h1 className="mt-3 text-3xl font-black tracking-tight text-[#002757] sm:text-4xl">DentalJobs</h1>'
if heading not in text:
    raise SystemExit('DentalJobs heading anchor not found')
text = text.replace(heading, '<h1 className="mt-3 text-3xl font-black tracking-tight text-[#002757] sm:text-4xl">DentalJobs{accountDisplayName ? ` - ${accountDisplayName}` : ""}</h1>', 1)

path.write_text(text)
print('Personalized DentalJobs header with account name')
