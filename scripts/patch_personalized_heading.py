from pathlib import Path
p = Path('components/WorkflowWorkspaceV2.tsx')
s = p.read_text()
old = '<h1 className="page-title">Find shifts</h1>'
new = '<h1 className="page-title">{[details?.profile.first_name ?? profile.first_name, details?.profile.last_name ?? profile.last_name].filter(Boolean).join(" ").trim() ? `${[details?.profile.first_name ?? profile.first_name, details?.profile.last_name ?? profile.last_name].filter(Boolean).join(" ").trim()}, let’s find some shifts` : "Let’s find some shifts"}</h1>'
assert s.count(old) == 1
p.write_text(s.replace(old, new, 1))
print('Personalized professional heading updated.')
