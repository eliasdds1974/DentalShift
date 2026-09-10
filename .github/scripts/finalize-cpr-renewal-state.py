from pathlib import Path

path = Path('app/page.tsx')
text = path.read_text()

old = '    [role, session, profile, office, refreshKey, view, navigate],\n'
new = '    [role, session, profile, professionalDetails, office, refreshKey, view, navigate],\n'
if old in text:
    text = text.replace(old, new, 1)

# Keep the CPR state synchronized whenever the Account modal reloads professional details.
old_saved = '          setProfile(details.profile); setOfficeId(details.office?.id ?? null); setOffice(details.office);\n'
new_saved = '          setProfile(details.profile); setProfessionalDetails(details.professional); setOfficeId(details.office?.id ?? null); setOffice(details.office);\n'
text = text.replace(old_saved, new_saved)

path.write_text(text)
print('CPR renewal state synchronization finalized')
