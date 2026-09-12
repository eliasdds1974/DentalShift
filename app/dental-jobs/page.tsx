"use client";

import { useEffect, useState } from "react";
import ClassifiedsPage from "../classifieds/page";
import { DentalJobsNativeMarketplace } from "@/components/DentalJobsNativeMarketplace";
import { loadAccountDetails } from "@/lib/dentalshift";
import { supabase } from "@/lib/supabase";

type DentalJobsRole = "office" | "professional";

export default function DentalJobsPage() {
  const [role, setRole] = useState<DentalJobsRole | null>(null);
  const [ready, setReady] = useState(false);
  const [roleError, setRoleError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Please sign in to open DentalJobs.");

        const details = await loadAccountDetails(user.id);
        if (cancelled) return;

        const profileRole = details.profile.role;
        const resolvedRole: DentalJobsRole | null =
          profileRole === "office"
            ? "office"
            : profileRole === "professional"
              ? "professional"
              : null;

        if (!resolvedRole) {
          throw new Error("DentalJobs is available from an Office or Professional account.");
        }

        // Set the legacy workspace role before the retained management tools mount.
        window.localStorage.setItem("dentalshift_portal_role", resolvedRole);
        setRole(resolvedRole);
      } catch (caught) {
        if (!cancelled) {
          setRoleError(caught instanceof Error ? caught.message : "Unable to determine your DentalShift account role.");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <main className="min-h-[70vh] bg-[#f5f8fb] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-24 animate-pulse rounded-3xl bg-white shadow-sm" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-56 animate-pulse rounded-3xl bg-white shadow-sm" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!role || roleError) {
    return (
      <main className="min-h-[70vh] bg-[#f5f8fb] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl rounded-3xl border border-rose-200 bg-white p-7 text-center shadow-sm">
          <h1 className="text-2xl font-black text-[#002757]">DentalJobs</h1>
          <p className="mt-3 text-sm font-semibold text-rose-700">{roleError || "Unable to open DentalJobs."}</p>
        </div>
      </main>
    );
  }

  return (
    <div className="dentaljobs-native-shell">
      <style>{`
        /* The legacy classifieds marketplace remains mounted only so its posting,
           application, messaging and management tools are preserved. Its old
           marketplace is never painted; the native marketplace below owns listings. */
        .dentaljobs-native-shell .dentaljobs-legacy-tools main > section:nth-of-type(2) {
          display: none !important;
        }

        .dentaljobs-native-shell .dentaljobs-legacy-tools main > section:first-of-type {
          padding-bottom: 1.25rem !important;
        }
      `}</style>

      <div className="dentaljobs-legacy-tools">
        <ClassifiedsPage />
      </div>

      <DentalJobsNativeMarketplace role={role} />
    </div>
  );
}
