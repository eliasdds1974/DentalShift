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

      const heading = Array.from(document.querySelectorAll<HTMLHeadingElement>("h1"))
        .find((node) => node.textContent?.trim() === "DentalJobs" && node.offsetParent !== null);
      const headingBlock = heading?.parentElement as HTMLElement | null;

      if (headingBlock) {
        headingBlock.classList.add("dentaljobs-heading-with-dnm");

        let slot = document.getElementById("dentaljobs-do-not-match-slot");
        if (!slot) {
          slot = document.createElement("div");
          slot.id = "dentaljobs-do-not-match-slot";
          slot.className = "dentaljobs-do-not-match-slot";
          headingBlock.appendChild(slot);
        }

        const storedRole = window.localStorage.getItem("dentalshift_portal_role");
        slot.dataset.dnmRole = storedRole === "office" ? "office" : "professional";

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
        .dentaljobs-heading-with-dnm {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(310px, 390px);
          column-gap: 28px;
          align-items: start;
          width: 100%;
        }
        .dentaljobs-heading-with-dnm > h1,
        .dentaljobs-heading-with-dnm > p {
          grid-column: 1;
        }
        #dentaljobs-do-not-match-slot {
          grid-column: 2;
          grid-row: 1 / span 2;
          align-self: start;
          width: 100%;
          margin: 0;
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
        #dentaljobs-do-not-match-slot .do-not-match-native-heading-wrap {
          display: flex !important;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px 9px;
          min-width: 0;
          flex: 1;
        }
        #dentaljobs-do-not-match-slot .do-not-match-view {
          order: 1;
          flex: 0 0 auto;
          margin-bottom: 0 !important;
        }
        #dentaljobs-do-not-match-slot .do-not-match-native-heading-wrap::after {
          order: 2;
          flex: 1 1 190px;
          min-width: 0;
          color: #64748b;
          font-size: 11px;
          line-height: 1.35;
          font-weight: 700;
        }
        #dentaljobs-do-not-match-slot[data-dnm-role="office"] .do-not-match-native-heading-wrap::after {
          content: "Keep professionals you do not want matched with this office on a private list.";
        }
        #dentaljobs-do-not-match-slot[data-dnm-role="professional"] .do-not-match-native-heading-wrap::after {
          content: "Keep dental offices you do not want matched with you on a private list.";
        }
        #dentaljobs-do-not-match-slot .do-not-match-native-heading-wrap > h2 {
          order: 3;
          flex-basis: 100%;
        }
        #dentaljobs-do-not-match-slot .do-not-match-native-heading-wrap > p {
          display: none !important;
        }
        @media (max-width: 900px) {
          .dentaljobs-heading-with-dnm {
            grid-template-columns: 1fr;
            row-gap: 14px;
          }
          .dentaljobs-heading-with-dnm > h1,
          .dentaljobs-heading-with-dnm > p,
          #dentaljobs-do-not-match-slot {
            grid-column: 1;
          }
          #dentaljobs-do-not-match-slot {
            grid-row: auto;
            max-width: none;
          }
        }
      `}</style>
    </>,
    target
  );
}
