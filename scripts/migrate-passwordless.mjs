import fs from 'node:fs';

const path = 'app/page.tsx';
let s = fs.readFileSync(path, 'utf8');

const start = s.indexOf('  const submit = async (event: React.FormEvent<HTMLFormElement>) => {');
const end = s.indexOf('  const sendPasswordReset = async () => {', start);
if (start < 0 || end < 0) throw new Error('Could not find account submit handler');

const replacement = `  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const metadata = mode === "signup" ? {
      role,
      first_name: String(form.get("first_name") || ""),
      last_name: String(form.get("last_name") || ""),
      office_name: String(form.get("office_name") || ""),
      profession: String(form.get("profession") || ""),
      licence_number: String(form.get("licence_number") || ""),
      address: String(form.get("address") || ""),
      city: String(form.get("city") || ""),
      province: String(form.get("province") || "BC"),
      postal_code: String(form.get("postal_code") || ""),
      google_place_id: String(form.get("google_place_id") || ""),
      latitude: String(form.get("latitude") || ""),
      longitude: String(form.get("longitude") || ""),
    } : undefined;

    if (mode === "signup" && metadata && (!metadata.address || !metadata.city || !metadata.province || !metadata.postal_code || (role === "office" && !metadata.office_name))) {
      setError("Select an address from Google or enter the complete address manually.");
      setBusy(false);
      return;
    }

    window.sessionStorage.setItem("dentalshift_signin_role", role);
    window.localStorage.setItem("dentalshift_portal_role", role);
    const redirectTo = \`${'${window.location.origin}'}/?portal_role=${'${role}'}\`;
    const { error: emailError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: mode === "signup",
        emailRedirectTo: redirectTo,
        ...(metadata ? { data: metadata } : {}),
      },
    });

    if (emailError) {
      setError(mode === "signin" ? "We could not send your secure sign-in email. Check the email address and try again." : emailError.message);
    } else {
      setResetEmailAddress(email);
      setResetEmailSent(true);
    }
    setBusy(false);
  };

`;

s = s.slice(0, start) + replacement + s.slice(end);

s = s.replace('            <label className="field sm:col-span-2"><span>Password</span><input name="password" type="password" minLength={8} required /></label>\n', '');
s = s.replace('            {mode === "signin" && <button type="button" onClick={() => void sendPasswordReset()} disabled={busy} className="justify-self-start text-sm font-extrabold text-[#002757] underline underline-offset-4 sm:col-span-2">Forgot password?</button>}\n', '');
s = s.replace('            <button disabled={busy} className="primary-btn sm:col-span-2">{busy ? "Please wait…" : mode === "signin" ? "Sign in securely" : "Create account"}</button>', '            <p className="text-xs leading-5 text-slate-500 sm:col-span-2">DentalShift will email you a secure one-time sign-in link. No password is required.</p>\n            <button disabled={busy} className="primary-btn sm:col-span-2">{busy ? "Sending secure email…" : mode === "signin" ? "Email me a sign-in link" : "Create account & verify email"}</button>');

s = s.replace('Password setup email sent', 'Secure sign-in email sent');
s = s.replace('Select the secure link and create a new password for the account type you chose.', 'Select the secure link to enter the account type you chose.');
s = s.replace('For security, the message is the same whether or not the address is registered.', 'For security, DentalShift does not reveal whether an email address is registered.');
s = s.replace('Use the same email address for both sides of DentalShift. Your Dental Office and Dental Professional accounts can have different passwords. Professional verification is handled separately.', 'Use the same email address for both sides of DentalShift. Each time you sign in, choose the workspace you want and verify through your email. Professional verification is handled separately.');
s = s.replace('Keep the same email address, then complete a separate professional verification profile. Your Professional account can use its own password.', 'Keep the same email address, then complete a separate professional verification profile. Choose the Professional workspace when signing in by email.');

const anchor = '    supabase.auth.getSession().then(({ data }) => syncAccount(data.session));\n';
const inject = `    const emailPortalRole = new URLSearchParams(window.location.search).get("portal_role");
    if (emailPortalRole === "office" || emailPortalRole === "professional") {
      window.sessionStorage.setItem("dentalshift_signin_role", emailPortalRole);
      window.localStorage.setItem("dentalshift_portal_role", emailPortalRole);
    }
`;
if (!s.includes(inject)) {
  if (!s.includes(anchor)) throw new Error('Could not find auth session anchor');
  s = s.replace(anchor, inject + anchor);
}

fs.writeFileSync(path, s);
