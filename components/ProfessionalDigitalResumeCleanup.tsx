"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ProfessionalDigitalResumeCleanup() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/professionals/profile") return;

    const hideLegacyResumeCard = () => {
      const headings = Array.from(document.querySelectorAll("h3"));
      const heading = headings.find((node) => node.textContent?.trim() === "Professional résumé/CV");
      if (!heading) return;
      const card = heading.closest("div.rounded-xl.border.border-dashed");
      if (card instanceof HTMLElement) card.style.display = "none";
    };

    hideLegacyResumeCard();
    const observer = new MutationObserver(hideLegacyResumeCard);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
