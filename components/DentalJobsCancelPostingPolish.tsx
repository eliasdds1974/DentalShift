"use client";

import { useEffect } from "react";

export function DentalJobsCancelPostingPolish() {
  useEffect(() => {
    let disposed = false;
    let attempts = 0;

    const apply = () => {
      if (disposed) return;
      attempts += 1;

      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
      let found = 0;

      for (const button of buttons) {
        if (button.textContent?.trim() !== "Close Posting") continue;
        found += 1;
        button.innerHTML = button.innerHTML.replace("Close Posting", "Cancel Posting");
        button.className = "mx-3 my-1 inline-flex w-auto items-center gap-2 rounded-lg border border-[#002757] bg-[#002757] px-3 py-1.5 text-left text-xs font-black text-white shadow-sm transition hover:bg-[#01A32E] hover:border-[#01A32E]";
      }

      if (found === 0 && attempts < 20) {
        window.setTimeout(apply, 150);
      }
    };

    const timer = window.setTimeout(apply, 0);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
