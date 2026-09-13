"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

function syncSidebarPriority() {
  const asides = Array.from(document.querySelectorAll<HTMLElement>("aside"));

  for (const aside of asides) {
    const hasOfficeInterest = Array.from(aside.querySelectorAll<HTMLElement>("span, p, div"))
      .some((node) => node.textContent?.trim() === "✓ They are interested" || node.textContent?.trim() === "They are interested");

    const availabilitySections = Array.from(aside.querySelectorAll<HTMLElement>("section"))
      .filter((section) => {
        const text = section.textContent || "";
        return text.includes("I’m Available") && text.includes("Cancel / Repost");
      });

    for (const section of availabilitySections) {
      if (hasOfficeInterest) {
        section.dataset.hiddenForOfficeInterest = "true";
        section.style.display = "none";
      } else if (section.dataset.hiddenForOfficeInterest === "true") {
        delete section.dataset.hiddenForOfficeInterest;
        section.style.display = "";
      }
    }
  }
}

export function ProfessionalOfficeInterestSync() {
  useEffect(() => {
    if (!window.location.pathname.startsWith("/professionals")) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let pollTimer: number | null = null;
    let cancelled = false;
    let lastInterestSignature = "";

    const refreshProfessionalWorkspace = () => {
      if (document.visibilityState !== "visible") return;
      window.dispatchEvent(new Event("focus"));
      window.setTimeout(syncSidebarPriority, 250);
      window.setTimeout(syncSidebarPriority, 900);
    };

    const start = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user || cancelled) return;

      const pollOfficeInterest = async (forceRefresh = false) => {
        if (cancelled || document.visibilityState !== "visible") return;

        const { data: rows } = await supabase
          .from("applications")
          .select("id,status,office_interested_at,updated_at")
          .eq("professional_id", user.id)
          .not("office_interested_at", "is", null)
          .order("updated_at", { ascending: false })
          .limit(20);

        if (cancelled) return;
        const signature = (rows || [])
          .map((row) => `${row.id}:${row.status}:${row.office_interested_at}:${row.updated_at}`)
          .join("|");

        if (forceRefresh || (lastInterestSignature && signature !== lastInterestSignature)) {
          refreshProfessionalWorkspace();
        }
        lastInterestSignature = signature;
      };

      await pollOfficeInterest(true);

      channel = supabase
        .channel(`professional-office-interest-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "applications",
            filter: `professional_id=eq.${user.id}`,
          },
          () => {
            refreshProfessionalWorkspace();
            void pollOfficeInterest();
          },
        )
        .subscribe();

      // Realtime may not be enabled for every deployment/table. This lightweight
      // fallback detects office-interest changes and refreshes the existing
      // Professional workspace without requiring the user to reload the page.
      pollTimer = window.setInterval(() => {
        void pollOfficeInterest();
      }, 3000);
    };

    syncSidebarPriority();
    const observer = new MutationObserver(syncSidebarPriority);
    observer.observe(document.body, { childList: true, subtree: true });
    void start();

    return () => {
      cancelled = true;
      observer.disconnect();
      if (pollTimer != null) window.clearInterval(pollTimer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
