from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()

marker = '''  const content = useMemo(\n'''
insert = '''  // The office Account route should always use the newest Dental Office Account\n  // modal rather than the older legacy office-profile workspace form.\n  useEffect(() => {\n    if (session && role === "office" && view === "profile") {\n      setAccountOpen(true);\n    }\n  }, [session, role, view]);\n\n  const content = useMemo(\n'''
if marker not in s:
    raise SystemExit('content marker not found')
s = s.replace(marker, insert, 1)

old = '''        ? <OfficeWorkspace userId={session.user.id} office={office} onPost={() => setPost(true)} refreshKey={refreshKey} view={view} />'''
new = '''        ? <OfficeWorkspace userId={session.user.id} office={office} onPost={() => setPost(true)} refreshKey={refreshKey} view={view === "profile" ? "overview" : view} />'''
if old not in s:
    raise SystemExit('OfficeWorkspace render line not found')
s = s.replace(old, new, 1)

p.write_text(s)
