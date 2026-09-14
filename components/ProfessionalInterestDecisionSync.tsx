"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function ProfessionalInterestDecisionSync() {
  useEffect(() => {
    let stopped = false;

    const syncDeclinedOffices = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || stopped) return;

      const { data: declinedRows, error: declinedError } = await supabase
        .from("job_applications")
        .select("office_id")
        .eq("professional_id", user.id)
        .eq("initiator_role", "office")
        .eq("status", "declined")
        .is("deleted_at", null);

      if (declinedError || stopped) return;

      const officeIds = Array.from(
        new Set((declinedRows || []).map((row: any) => row.office_id).filter(Boolean)),
      );
      if (!officeIds.length) return;

      const { data: existingRows } = await supabase
        .from("office_excluded_professionals")
        .select("office_id,matched_professional_id")
        .eq("matched_professional_id", user.id)
        .in("office_id", officeIds);

      if (stopped) return;

      const existing = new Set((existingRows || []).map((row: any) => String(row.office_id)));
      const missing = officeIds
        .filter((officeId) => !existing.has(String(officeId)))
        .map((officeId) => ({
          office_id: officeId,
          matched_professional_id: user.id,
        }));

      if (missing.length) {
        await supabase.from("office_excluded_professionals").insert(missing);
      }
    };

    const cleanDecisionButtons = () => {
      const root = document.getElementById("my-professional-dentaljobs");
      if (!root) return;

      for (const button of Array.from(root.querySelectorAll("button"))) {
        const text = button.textContent?.trim().toLowerCase() || "";
        if (text === "remove") {
          button.style.display = "none";
        } else if (text === "not interested") {
          const icon = button.querySelector("svg");
          button.textContent = "";
          if (icon) button.appendChild(icon);
          button.append("I’m Not Interested");
        }
      }
    };

    const run = () => {
      cleanDecisionButtons();
      void syncDeclinedOffices();
    };

    run();

    const observer = new MutationObserver(cleanDecisionButtons);
    observer.observe(document.body, { childList: true, subtree: true });

    const channel = supabase
      .channel("professional-interest-decision-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "job_applications" }, () => {
        window.setTimeout(run, 50);
      })
      .subscribe();

    return () => {
      stopped = true;
      observer.disconnect();
      void supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
