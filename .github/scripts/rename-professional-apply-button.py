from pathlib import Path

path = Path('components/DentalJobsNativeMarketplace.tsx')
text = path.read_text()
old = '''      : role === "professional"\n        ? "Apply"\n        : "I'm Interested";'''
new = '''      : role === "professional"\n        ? "I'm Interested"\n        : "I'm Interested";'''
if old not in text:
    raise SystemExit('professional Apply label anchor not found')
text = text.replace(old, new, 1)
path.write_text(text)
print("Renamed professional office-ad action from Apply to I'm Interested")
