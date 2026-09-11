"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DoNotMatchPanel } from "@/components/DoNotMatchPanel";

export function DentalJobsDoNotMatchPlacement() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let attempts = 0;
    let timer: number | undefined;

    const place = () => {
      if (disposed) return;
      attempts += 1;

      const heading = Array.from(document.querySelectorAll<HTMLHeadingElement>("h2"))
        .find((node) => node.textContent?.trim() === "My DentalJobs" && node.offsetParent !== null);
      const section = heading?.closest("section") as HTMLElement | null;

      if (section) {
        let slot = document.getElementById("dentaljobs-do-not-match-slot");
        if (!slot) {
          slot = document.createElement("div");
          slot.id = "dentaljobs-do-not-match-slot";
          slot.className = "dentaljobs-do-not-match-slot";
          section.parentElement?.insertBefore(slot, section);
        }
        setTarget(slot);
        return;
      }

      if (attempts < 30) timer = window.setTimeout(place, 100);
    };

    place();

    return () => {
      disposed = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!target) return null;

  return createPortal(
    <>
      <DoNotMatchPanel />
      <style jsx global>{`
        #dentaljobs-do-not-match-slot {
          width: 100%;
          margin-top: 18px;
        }
        #dentaljobs-do-not-match-slot .do-not-match-native,
        #dentaljobs-do-not-match-slot .do-not-match-native.is-closed {
          position: relative !important;
          right: auto !important;
          top: auto !important;
          z-index: 5 !important;
          width: 100% !important;
          max-width: none !important;
          max-height: none !important;
          margin: 0 !important;
        }
        #dentaljobs-do-not-match-slot .do-not-match-native.is-open {
          overflow: visible !important;
        }
      `}</style>
    </>,
    target
  );
}
