"use client";

import { useEffect } from "react";
import { loadAccountDetails } from "@/lib/dentalshift";
import { supabase } from "@/lib/supabase";

export function DentalJobsRoleSync() {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      try {
        const details = await loadAccountDetails(user.id);
        if (cancelled) return;

        const accountRole = details.profile.role;
        const correctRole =
          accountRole === "office"
            ? "office"
            : accountRole === "professional"
              ? "professional"
              : null;

        if (!correctRole) return;

        const storedRole = window.localStorage.getItem("dentalshift_portal_role");
        if (storedRole !== correctRole) {
          window.localStorage.setItem("dentalshift_portal_role", correctRole);
          window.location.reload();
          return;
        }

        document.documentElement.dataset.dentaljobsPortalRole = correctRole;
      } catch {
        // Leave the existing portal role unchanged if account details cannot be loaded.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
