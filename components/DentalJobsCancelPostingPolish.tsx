"use client";

import { useEffect } from "react";

export function DentalJobsCancelPostingPolish() {
  useEffect(() => {
    let disposed = false;

    const apply = () => {
      if (disposed) return;

      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
      for (const button of buttons) {
        if (button.textContent?.trim() !== "Close Posting") continue;

        button.innerHTML = button.innerHTML.replace("Close Posting", "Cancel Posting");
        button.className = "mx-3 my-1 inline-flex w-auto items-center gap-2 rounded-lg border border-[#002757] bg-[#002757] px-3 py-1.5 text-left text-xs font-black text-white shadow-sm transition hover:border-[#01A32E] hover:bg-[#01A32E]";
      }
    };

    const applyAfterInteraction = () => {
      window.setTimeout(apply, 0);
      window.setTimeout(apply, 75);
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
