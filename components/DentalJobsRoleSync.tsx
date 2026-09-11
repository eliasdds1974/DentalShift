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

        const hasOffice = Boolean(details.office?.id);
        const hasProfessional = Boolean(details.professional);
        const storedRole = window.localStorage.getItem("dentalshift_portal_role");

        let correctRole: "office" | "professional" | null = null;
        if (hasProfessional && !hasOffice) correctRole = "professional";
        if (hasOffice && !hasProfessional) correctRole = "office";

        if (correctRole && storedRole !== correctRole) {
          window.localStorage.setItem("dentalshift_portal_role", correctRole);
          window.location.reload();
        }
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
