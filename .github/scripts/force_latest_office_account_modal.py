from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()

anchor = '''  const content = useMemo(\n    () => role === "office"'''
insert = '''  useEffect(() => {\n    if (session && role === "office" && view === "profile" && office) {\n      setAccountOpen(true);\n    }\n  }, [session, role, view, office]);\n\n  const content = useMemo(\n    () => role === "office"'''

if anchor not in s:
    raise SystemExit('Could not find content useMemo anchor')
s = s.replace(anchor, insert, 1)

old_close = '''      {accountOpen && <AccountModal close={() => setAccountOpen(false)} session={session} profile={profile} activeRole={role} passwordRecovery={passwordRecovery} onPasswordRecoveryComplete={completePasswordRecovery} onSaved={() => {'''
new_close = '''      {accountOpen && <AccountModal close={() => { setAccountOpen(false); if (role === "office" && view === "profile") navigate("office", "overview"); }} session={session} profile={profile} activeRole={role} passwordRecovery={passwordRecovery} onPasswordRecoveryComplete={completePasswordRecovery} onSaved={() => {'''
if old_close not in s:
    raise SystemExit('Could not find signed-in AccountModal close handler')
s = s.replace(old_close, new_close, 1)

p.write_text(s)
