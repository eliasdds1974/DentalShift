from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

replacements = {
    'Private DentalShift conversation': 'Private DentalShift Messaging',
    'Identities and direct contact details remain hidden.': 'Direct contact details are not automatically shared by DentalShift.',
    'Both sides have expressed interest. Use DentalShift messaging to discuss the opportunity without sharing direct contact details yet.': 'Both sides have expressed interest. Continue the conversation inside DentalShift. A résumé may already identify the professional; DentalShift does not automatically reveal additional account contact details.',
    'Your direct contact information remains private at this stage.': '{portalRole === "professional" ? "DentalShift does not automatically reveal your account contact details. Your résumé/CV may contain identifying or contact information." : "DentalShift does not automatically reveal your office account contact details at this stage."}',
}

for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f'Missing expected text: {old}')
    text = text.replace(old, new)

path.write_text(text)
print('Updated DentalJobs privacy and messaging copy')
