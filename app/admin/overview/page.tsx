"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CalendarDays, LayoutDashboard, LogOut, MessageCircle, ShieldCheck } from "lucide-react";
import { AdminCommandCenter } from "@/components/AdminCommandCenter";
import { loadAccountDetails } from "@/lib/dentalshift";
import { supabase } from "@/lib/supabase";

export default function AdminOverviewPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const verify = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!active) return;

      if (!session) {
        setChecking(false);
        return;
      }

      try {
        const details = await loadAccountDetails(session.user.id);
        if (!active) return;
        if (details.profile.role === "admin") {
          setIsAdmin(true);
          setChecking(false);
          return;
        }
      } catch {
        // A non-admin or incomplete profile must never fall through to an office workspace here.
      }

      await supabase.auth.signOut();
      if (!active) return;
      setIsAdmin(false);
      setChecking(false);
    };

    void verify();
    const { data: listener } = supabase.auth.onAuthStateChange(() => { void verify(); });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const sendAdminLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSending(true);
    setError("");
    setSent(false);

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/admin/overview`,
      },
    });

    if (signInError) setError("We could not send the admin sign-in email. Check the address and try again.");
    else setSent(true);
    setSending(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
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
        <p className="mt-2 text-sm leading-6 text-slate-500">Use the DentalShift administrator email. Office and professional sessions are kept separate from the admin portal.</p>
        <form onSubmit={sendAdminLink} className="mt-6 space-y-4">
          <label className="block"><span className="mb-1.5 block text-sm font-extrabold text-slate-700">Admin email</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Administrator email" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-[#04A62F] focus:ring-2 focus:ring-[#04A62F]/15" /></label>
          {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
          {sent && <p className="rounded-xl bg-[#eaf8ee] p-3 text-sm font-bold text-[#017f27]">Admin sign-in email sent. Open the secure link in that email to continue.</p>}
          <button type="submit" disabled={sending} className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#04A62F] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#038827] disabled:opacity-60">{sending ? "Sending…" : "Send secure admin link"}</button>
        </form>
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
