"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { loadAccountDetails } from "@/lib/dentalshift";
import { supabase } from "@/lib/supabase";

export default function AdminAuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const finishAdminSignIn = async () => {
      try {
        const url = new URL(window.location.href);
        const queryError = url.searchParams.get("error_description") || url.searchParams.get("error");
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const hashError = hash.get("error_description") || hash.get("error");
        if (queryError || hashError) throw new Error(queryError || hashError || "The secure sign-in link could not be verified.");

        const code = url.searchParams.get("code");
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
        }

        const { data, error: sessionLookupError } = await supabase.auth.getSession();
        if (sessionLookupError) throw sessionLookupError;
        if (!data.session) throw new Error("This admin sign-in link is invalid or has expired. Please request a new link.");

        const details = await loadAccountDetails(data.session.user.id);
        if (details.profile.role !== "admin") {
          await supabase.auth.signOut();
          throw new Error("This account does not have DentalShift administrator access.");
        }

        if (!active) return;
        window.history.replaceState(null, "", "/auth/admin-callback");
        router.replace("/admin/overview");
      } catch (value) {
        if (!active) return;
        setError(value instanceof Error ? value.message : "The secure admin sign-in link could not be completed.");
      }
    };

    void finishAdminSignIn();
    return () => { active = false; };
  }, [router]);

  if (error) {
    return <main className="grid min-h-screen place-items-center bg-[#f5f8fb] p-4">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-8">
        <Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="h-14 w-auto" priority />
        <h1 className="mt-6 text-2xl font-black text-[#002757]">Admin sign-in link could not be completed</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
        <button type="button" onClick={() => router.replace("/admin/overview")} className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#04A62F] px-4 text-sm font-black text-white shadow-sm hover:bg-[#038827]">Return to admin sign in</button>
      </section>
    </main>;
  }

  return <main className="grid min-h-screen place-items-center bg-white"><div className="text-center"><Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="mx-auto h-16 w-auto" priority /><p className="mt-4 text-sm font-extrabold text-[#002757]">Completing secure admin sign in…</p></div></main>;
}
