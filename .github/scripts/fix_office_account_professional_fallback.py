from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()

old_sig = 'function AccountModal({ close, session, profile, onSaved, activeRole = "professional", initialMode = "signin", initialRole = "office", passwordRecovery = false, onPasswordRecoveryComplete }: { close: () => void; session: Session | null; profile: AccountProfile | null; onSaved: () => void; activeRole?: Role; initialMode?: "signin" | "signup"; initialRole?: Role; passwordRecovery?: boolean; onPasswordRecoveryComplete?: () => void })'
new_sig = 'function AccountModal({ close, session, profile, officeFallback = null, onSaved, activeRole = "professional", initialMode = "signin", initialRole = "office", passwordRecovery = false, onPasswordRecoveryComplete }: { close: () => void; session: Session | null; profile: AccountProfile | null; officeFallback?: OfficeDetails | null; onSaved: () => void; activeRole?: Role; initialMode?: "signin" | "signup"; initialRole?: Role; passwordRecovery?: boolean; onPasswordRecoveryComplete?: () => void })'
if old_sig not in s:
    raise SystemExit('AccountModal signature not found')
s = s.replace(old_sig, new_sig, 1)

old_branch = '        ) : session && activeRole === "office" && details?.office ? (\n          <div className="bg-[#f8fafc]">\n            <OfficeWorkspace\n              userId={session.user.id}\n              office={details.office}\n              onPost={() => {}}\n              refreshKey={0}\n              view="profile"\n            />\n          </div>\n        ) : session ? ('
new_branch = '        ) : session && activeRole === "office" && (details?.office || officeFallback) ? (\n          <div className="bg-[#f8fafc]">\n            <OfficeWorkspace\n              userId={session.user.id}\n              office={(details?.office || officeFallback)!}\n              onPost={() => {}}\n              refreshKey={0}\n              view="profile"\n            />\n          </div>\n        ) : session && activeRole === "office" ? (\n          <div className="p-8 text-center">\n            <p className="font-extrabold text-[#002757]">Loading dental office account…</p>\n            <p className="mt-2 text-sm text-slate-500">DentalShift is loading your current office information.</p>\n          </div>\n        ) : session ? ('
if old_branch not in s:
    raise SystemExit('Office AccountModal branch not found')
s = s.replace(old_branch, new_branch, 1)

needle = '<AccountModal close={() => setAccountOpen(false)} session={session ?? null} profile={profile} activeRole={role}'
replacement = '<AccountModal close={() => setAccountOpen(false)} session={session ?? null} profile={profile} officeFallback={office} activeRole={role}'
if needle not in s:
    raise SystemExit('Marketing AccountModal call not found')
s = s.replace(needle, replacement, 1)

needle2 = '<AccountModal close={() => { setAccountOpen(false); if (role === "office" && view === "profile") navigate("office", "overview"); }} session={session} profile={profile} activeRole={role}'
replacement2 = '<AccountModal close={() => { setAccountOpen(false); if (role === "office" && view === "profile") navigate("office", "overview"); }} session={session} profile={profile} officeFallback={office} activeRole={role}'
if needle2 not in s:
    raise SystemExit('Portal AccountModal call not found')
s = s.replace(needle2, replacement2, 1)

p.write_text(s)
