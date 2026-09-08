from pathlib import Path

# One-time patch: align Admin with the same magic-link authentication used by Office and Professional accounts.
p = Path('app/admin/overview/page.tsx')
s = p.read_text()

s = s.replace('  const [code, setCode] = useState("");\n', '')
s = s.replace('  const [verifying, setVerifying] = useState(false);\n', '')
s = s.replace('  const [codeSent, setCodeSent] = useState(false);\n', '  const [linkSent, setLinkSent] = useState(false);\n')

start = s.index('  const sendAdminCode = async')
end = s.index('  const signOut = async', start)
replacement = '''  const sendAdminLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSending(true); setError(""); setLinkSent(false);
    const normalizedEmail = email.trim().toLowerCase();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/admin-callback`,
      },
    });
    if (signInError) setError(signInError.message);
    else { setEmail(normalizedEmail); setLinkSent(true); }
    setSending(false);
  };

'''
s = s[:start] + replacement + s[end:]

s = s.replace(
    '  const signOut = async () => { await supabase.auth.signOut(); setIsAdmin(false); setCodeSent(false); setCode(""); router.replace("/"); };',
    '  const signOut = async () => { await supabase.auth.signOut(); setIsAdmin(false); setLinkSent(false); router.replace("/"); };'
)

ui_start = s.index('  if (!isAdmin) return <main')
ui_end = s.index('\n\n  return <main className="min-h-screen', ui_start)
new_ui = '''  if (!isAdmin) return <main className="grid min-h-screen place-items-center bg-[#f5f8fb] p-4"><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-8">
    <Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="h-14 w-auto" priority />
    <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#edf3fa] px-3 py-1.5 text-xs font-black uppercase tracking-[.1em] text-[#002757]"><ShieldCheck size={14} /> Secure administration</div>
    <h1 className="mt-4 text-3xl font-black tracking-tight text-[#002757]">Admin sign in</h1>
    <p className="mt-2 text-sm leading-6 text-slate-500">Enter the DentalShift administrator email. We will send a secure one-time sign-in link.</p>
    <form onSubmit={sendAdminLink} className="mt-6 space-y-4">
      <label className="block"><span className="mb-1.5 block text-sm font-extrabold text-slate-700">Admin email</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Administrator email" autoComplete="email" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-[#04A62F] focus:ring-2 focus:ring-[#04A62F]/15" /></label>
      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
      {linkSent && <p className="rounded-xl bg-[#eaf8ee] p-3 text-sm font-bold leading-6 text-[#017f27]">Sign-in link sent to <strong>{email}</strong>. Open the newest DentalShift email and click “Sign in to DentalShift”.</p>}
      <button type="submit" disabled={sending} className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#04A62F] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#038827] disabled:opacity-60">{sending ? "Sending…" : linkSent ? "Send a new sign-in link" : "Email me a sign-in link"}</button>
    </form>
  </section></main>;'''
s = s[:ui_start] + new_ui + s[ui_end:]

p.write_text(s)
