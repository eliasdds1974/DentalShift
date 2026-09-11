"use client";

import { useEffect } from "react";

export function DentalJobsCancelPostingPolish() {
  useEffect(() => {
    let disposed = false;

    const apply = () => {
      if (disposed) return;

      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));

      for (const button of buttons) {
        const label = button.textContent?.trim() || "";

        if (label === "Manage Posting") {
          const section = button.closest("section") as HTMLElement | null;
          if (section) section.style.overflow = "visible";

          const card = button.closest("article") as HTMLElement | null;
          if (card) card.style.overflow = "visible";
        }

        if (label === "Close Posting") {
          button.innerHTML = button.innerHTML.replace("Close Posting", "Cancel Posting");
          button.className = "mx-3 my-1 inline-flex w-auto items-center gap-2 rounded-lg border border-[#002757] bg-[#002757] px-3 py-1.5 text-left text-xs font-black text-white shadow-sm transition hover:border-[#01A32E] hover:bg-[#01A32E]";
        }

        if (label === "Delete Posting") {
          button.style.display = "none";
        }
      }
    };

    const applyAfterInteraction = () => {
      window.setTimeout(apply, 0);
      window.setTimeout(apply, 75);
      window.setTimeout(apply, 180);
    };

    const timers = [0, 150, 300, 600, 1200].map((delay) => window.setTimeout(apply, delay));
    document.addEventListener("click", applyAfterInteraction);

    return () => {
      disposed = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      document.removeEventListener("click", applyAfterInteraction);
    };
  }, []);

  return null;
}
