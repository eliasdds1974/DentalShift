from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()

old_title = 'session && activeRole === "office" ? "Dental office account" : session ? "Professional account" : accountCreated ? "Account created" : mode === "signin" && !signInRoleChosen ? "Choose your sign-in" : mode === "signin" ? `Sign in as a ${role === "office" ? "Dental Office" : "Dental Professional"}` : "Create your account"'
new_title = 'session && activeRole === "office" ? "Dental office account" : session && activeRole === "admin" ? "Admin account" : session ? "Professional account" : accountCreated ? "Account created" : mode === "signin" && !signInRoleChosen ? "Choose your sign-in" : mode === "signin" ? (role === "admin" ? "Admin email sign in" : `Sign in as a ${role === "office" ? "Dental Office" : "Dental Professional"}`) : "Create your account"'
if old_title not in s:
    raise SystemExit('title target not found')
s = s.replace(old_title, new_title)

replacements = [
    ('initialRole?: "office" | "professional";', 'initialRole?: Role;'),
    ('const [role, setRole] = useState<"office" | "professional">(initialRole);', 'const [role, setRole] = useState<Role>(initialRole);'),
    ('const [signInRoleChosen, setSignInRoleChosen] = useState(initialMode !== "signin");', 'const [signInRoleChosen, setSignInRoleChosen] = useState(initialMode !== "signin" || initialRole === "admin");'),
    ('const [accountIntent, setAccountIntent] = useState<{ mode: "signin" | "signup"; role: "office" | "professional" }>({ mode: "signin", role: "office" });', 'const [accountIntent, setAccountIntent] = useState<{ mode: "signin" | "signup"; role: Role }>({ mode: "signin", role: "office" });'),
    ('if (emailPortalRole === "office" || emailPortalRole === "professional") {', 'if (emailPortalRole === "office" || emailPortalRole === "professional" || emailPortalRole === "admin") {'),
    ('<GoogleAddressAutocomplete key={role} kind={role} />', '<GoogleAddressAutocomplete key={role} kind={role === "office" ? "office" : "professional"} />'),
    ('<span className="grid h-9 w-9 place-items-center rounded-xl bg-[#002757] text-white">{role === "office" ? <Building2 size={18} /> : <UserRound size={18} />}</span>', '<span className="grid h-9 w-9 place-items-center rounded-xl bg-[#002757] text-white">{role === "admin" ? <ShieldCheck size={18} /> : role === "office" ? <Building2 size={18} /> : <UserRound size={18} />}</span>'),
]
for old, new in replacements:
    s = s.replace(old, new)

# Update the selected sign-in role label after the title has been patched.
s = s.replace(
    '{role === "office" ? "Dental Office" : "Dental Professional"}',
    '{role === "admin" ? "DentalShift Admin" : role === "office" ? "Dental Office" : "Dental Professional"}'
)

toggle = '''<div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 sm:col-span-2">
              <button type="button" onClick={() => { setMode("signin"); setSignInRoleChosen(false); }} className={"rounded-xl px-3 py-2.5 text-sm font-extrabold " + (mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>Sign in</button>
              <button type="button" onClick={() => setMode("signup")} className={"rounded-xl px-3 py-2.5 text-sm font-extrabold " + (mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>Create account</button>
            </div>'''
if toggle not in s:
    raise SystemExit('toggle target not found')
s = s.replace(toggle, '''{role !== "admin" && <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 sm:col-span-2">
              <button type="button" onClick={() => { setMode("signin"); setSignInRoleChosen(false); }} className={"rounded-xl px-3 py-2.5 text-sm font-extrabold " + (mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>Sign in</button>
              <button type="button" onClick={() => setMode("signup")} className={"rounded-xl px-3 py-2.5 text-sm font-extrabold " + (mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>Create account</button>
            </div>}''')

marker = '        onGetStarted={(nextRole) => { setAccountIntent({ mode: "signup", role: nextRole }); setAccountOpen(true); }}'
if marker not in s:
    raise SystemExit('MarketingHome marker not found')
admin_handler = '''        onAdmin={() => { void (async () => {
          if (session) {
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) { window.alert(signOutError.message); return; }
            setSession(null); setProfile(null); setOfficeId(null); setOffice(null);
          }
          window.sessionStorage.setItem("dentalshift_signin_role", "admin");
          window.localStorage.setItem("dentalshift_portal_role", "admin");
          setRole("admin");
          setAccountIntent({ mode: "signin", role: "admin" });
          setAccountOpen(true);
        })(); }}
'''
s = s.replace(marker, admin_handler + marker)

p.write_text(s)
