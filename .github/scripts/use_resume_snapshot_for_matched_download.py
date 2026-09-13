from pathlib import Path

p = Path('app/api/dentaljobs/unlock/details/route.ts')
s = p.read_text()
old = '.select("id,office_id,professional_id")'
new = '.select("id,office_id,professional_id,resume_path_snapshot")'
if old not in s:
    raise SystemExit('application select not found')
s = s.replace(old, new, 1)
old2 = '  if (professional?.resume_path) {\n    const { data: signed } = await admin.storage.from("professional-resumes").createSignedUrl(professional.resume_path, 900);'
new2 = '  const resumePath = application.resume_path_snapshot || professional?.resume_path || null;\n  if (resumePath) {\n    const { data: signed } = await admin.storage.from("professional-resumes").createSignedUrl(resumePath, 900);'
if old2 not in s:
    raise SystemExit('resume signing block not found')
s = s.replace(old2, new2, 1)
p.write_text(s)
print('matched resume now uses application snapshot')
