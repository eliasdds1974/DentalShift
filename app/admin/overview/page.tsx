"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { CalendarDays, LayoutDashboard, LogOut, MessageCircle, ShieldCheck } from "lucide-react";
import { AdminCommandCenter } from "@/components/AdminCommandCenter";
import { loadAccountDetails } from "@/lib/dentalshift";
import { supabase } from "@/lib/supabase";

export default function AdminOverviewPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let verificationVersion = 0;

    const verifySession = async (session: Session | null) => {
      const version = ++verificationVersion;
      if (!active) return;

      if (!session) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      setChecking(true);
      try {
        const details = await loadAccountDetails(session.user.id);
        if (!active || version !== verificationVersion) return;
        if (details.profile.role === "admin") {
          setIsAdmin(true);
          setChecking(false);
          if (window.location.hash || window.location.search) {
            window.history.replaceState(null, "", "/admin/overview");
          }
          return;
        }
      } catch {
        // Keep admin routing isolated from office/professional sessions.
      }

      if (!active || version !== verificationVersion) return;
      await supabase.auth.signOut();
      if (!active || version !== verificationVersion) return;
      setIsAdmin(false);
      setChecking(false);
      setError("This email is not authorized for DentalShift administration.");
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED" || event === "SIGNED_OUT") {
        void verifySession(session);
      }
    });

    void supabase.auth.getSession().then(({ data }) => verifySession(data.session));

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const sendAdminCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
      },
    });

    if (signInError) {
      setError("We could not send the admin verification code. Check the address and try again.");
    } else {
      setEmail(normalizedEmail);
      setCode("");
      setCodeSent(true);
    }
    setSending(false);
  };

  const verifyAdminCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setVerifying(true);
    setError("");

    const token = code.replace(/\D/g, "").slice(0, 6);
    if (token.length !== 6) {
      setError("Enter the 6-digit code from the email.");
      setVerifying(false);
      return;
    }

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: "email",
    });

    if (verifyError || !data.session) {
      setError("That code is invalid or expired. Request a new code and try again.");
      setVerifying(false);
      return;
    }

    try {
      const details = await loadAccountDetails(data.session.user.id);
      if (details.profile.role !== "admin") {
        await supabase.auth.signOut();
        setError("This email is not authorized for DentalShift administration.");
        setVerifying(false);
        return;
      }
      setIsAdmin(true);
      setChecking(false);
      setVerifying(false);
      window.history.replaceState(null, "", "/admin/overview");
    } catch {
      await supabase.auth.signOut();
      setError("We could not verify administrator access. Please try again.");
      setVerifying(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setCodeSent(false);
    setCode("");
    router.replace("/");
  };

  if (checking) {
    return <main className="grid min-h-screen place-items-center bg-white"><div className="text-center"><Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="mx-auto h-16 w-auto" priority /><p className="mt-4 text-sm font-extrabold text-[#002757]">Opening DentalShift Admin…</p></div></main>;
  }

  if (!isAdmin) {
    return <main className="grid min-h-screen place-items-center bg-[#f5f8fb] p-4">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-8">
        <Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="h-14 w-auto" priority />
        <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#edf3fa] px-3 py-1.5 text-xs font-black uppercase tracking-[.1em] text-[#002757]"><ShieldCheck size={14} /> Secure administration</div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-[#002757]">Admin sign in</h1>
        {!codeSent ? <>
          <p className="mt-2 text-sm leading-6 text-slate-500">Enter the DentalShift administrator email. We will send a one-time 6-digit code instead of a clickable magic link.</p>
          <form onSubmit={sendAdminCode} className="mt-6 space-y-4">
            <label className="block"><span className="mb-1.5 block text-sm font-extrabold text-slate-700">Admin email</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Administrator email" autoComplete="email" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-[#04A62F] focus:ring-2 focus:ring-[#04A62F]/15" /></label>
            {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
            <button type="submit" disabled={sending} className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#04A62F] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#038827] disabled:opacity-60">{sending ? "Sending…" : "Send 6-digit code"}</button>
          </form>
        </> : <>
          <p className="mt-2 text-sm leading-6 text-slate-500">Enter the 6-digit verification code sent to <strong className="text-slate-700">{email}</strong>. Do not click any sign-in link in the email.</p>
          <form onSubmit={verifyAdminCode} className="mt-6 space-y-4">
            <label className="block"><span className="mb-1.5 block text-sm font-extrabold text-slate-700">Verification code</span><input inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="h-14 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-2xl font-black tracking-[0.35em] text-slate-900 outline-none focus:border-[#04A62F] focus:ring-2 focus:ring-[#04A62F]/15" /></label>
            {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
            <button type="submit" disabled={verifying || code.length !== 6} className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#04A62F] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#038827] disabled:opacity-60">{verifying ? "Verifying…" : "Open admin dashboard"}</button>
            <div className="flex items-center justify-between gap-3 text-sm font-bold">
              <button type="button" onClick={() => { setCodeSent(false); setCode(""); setError(""); }} className="text-[#002757] hover:underline">Use another email</button>
              <button type="button" disabled={sending} onClick={() => void (async () => { setSending(true); setError(""); const { error: resendError } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } }); if (resendError) setError("We could not resend the code yet. Please wait a moment and try again."); setSending(false); })()} className="text-[#017f27] hover:underline disabled:opacity-50">Resend code</button>
            </div>
          </form>
        </>}
      </section>
    </main>;
  }

  return <main className="min-h-screen bg-[#f5f8fb] text-slate-900">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[270px] flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
      <div className="px-2"><Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="h-14 w-auto" priority /></div>
      <p className="mb-2 mt-7 px-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
      <nav className="space-y-1">
        <button onClick={() => router.push("/admin/overview")} className="flex w-full items-center gap-3 rounded-xl bg-[#eaf8ee] px-3 py-2.5 text-sm font-bold text-[#017f27]"><LayoutDashboard size={19} />Admin overview</button>
        <button onClick={() => router.push("/admin/verification")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"><ShieldCheck size={19} />Verification</button>
        <button onClick={() => router.push("/admin/shifts")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"><CalendarDays size={19} />All shifts</button>
        <button onClick={() => router.push("/admin/disputes")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"><MessageCircle size={19} />Disputes</button>
      </nav>
      <div className="mt-auto rounded-2xl border border-[#01A32E]/20 bg-[#eaf8ee] p-4"><div className="flex items-center gap-2 text-sm font-extrabold text-[#017f27]"><ShieldCheck size={18} /> Trust & safety</div><p className="mt-2 text-xs leading-5 text-[#017f27]">Administrator access is restricted to verified DentalShift admin accounts.</p></div>
    </aside>
    <div className="lg:pl-[270px]">
      <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7"><div className="text-sm font-bold text-slate-500">Administration</div><button onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-xl bg-[#032757] px-4 py-2.5 text-sm font-black text-white shadow-sm hover:bg-[#022047]"><LogOut size={17} />Sign out</button></header>
      <AdminCommandCenter onNavigate={(view) => router.push(view === "talent" ? "/admin/verification" : view === "shifts" ? "/admin/shifts" : "/admin/disputes")} />
    </div>
  </main>;
}
