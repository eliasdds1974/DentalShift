from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()

old = '''    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");'''
new = '''    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");'''
if old not in s:
    raise SystemExit('email normalization block not found')
s = s.replace(old, new, 1)

old = '''      if (signInError) {
        window.sessionStorage.removeItem("dentalshift_signin_role");
        setError(signInError.message);
      } else {'''
new = '''      if (signInError) {
        window.sessionStorage.removeItem("dentalshift_signin_role");
        setError(signInError.message.toLowerCase().includes("invalid login credentials")
          ? "Incorrect email or password. Use the same DentalShift password for either your Dental Office or Dental Professional workspace. Select Forgot password if you need to reset it."
          : signInError.message);
      } else {'''
if old not in s:
    raise SystemExit('sign-in error block not found')
s = s.replace(old, new, 1)

old = '''      if (signUpError) setError(signUpError.message);
      else if (!data.session) {
        setCreatedEmail(email);
        setAccountCreated(true);
      } else close();'''
new = '''      if (signUpError) {
        const message = signUpError.message.toLowerCase();
        if (message.includes("already registered") || message.includes("already exists")) {
          setMode("signin");
          setSignInRoleChosen(true);
          setEmailValue(email);
          setError("This email already has a DentalShift login. Sign in with the existing password; the same login can access both Dental Office and Dental Professional workspaces.");
        } else {
          setError(signUpError.message);
        }
      } else if (!data.session && data.user?.identities?.length === 0) {
        setMode("signin");
        setSignInRoleChosen(true);
        setEmailValue(email);
        setError("This email already has a DentalShift login. Sign in with the existing password; the same login can access both Dental Office and Dental Professional workspaces.");
      } else if (!data.session) {
        setCreatedEmail(email);
        setAccountCreated(true);
      } else close();'''
if old not in s:
    raise SystemExit('sign-up result block not found')
s = s.replace(old, new, 1)

p.write_text(s)
