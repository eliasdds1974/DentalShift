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
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const refreshProfessionalWorkspace = () => {
      if (document.visibilityState !== "visible") return;
      window.dispatchEvent(new Event("focus"));
      window.setTimeout(syncSidebarPriority, 250);
    };

    const start = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user || cancelled) return;

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
          () => refreshProfessionalWorkspace(),
        )
        .subscribe();
    };

    syncSidebarPriority();
    const observer = new MutationObserver(syncSidebarPriority);
    observer.observe(document.body, { childList: true, subtree: true });
    void start();

    return () => {
      cancelled = true;
      observer.disconnect();
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
