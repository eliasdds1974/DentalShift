"use client";

import { useEffect } from "react";

const PROFESSION_COLORS = [
  { match: /registered dental hygienist|\brdh\b/i, color: "#4285F4" },
  { match: /certified dental assistant|\bcda\b/i, color: "#EA4335" },
  { match: /dental administrator/i, color: "#FBBC05" },
  { match: /sterilization technician/i, color: "#34A853" },
  { match: /associate dentist/i, color: "#7C3AED" },
];

function professionColor(text: string) {
  return PROFESSION_COLORS.find((item) => item.match.test(text))?.color || null;
}

function applyDentalJobsProfessionColors() {
  if (window.location.pathname !== "/dental-jobs" && window.location.pathname !== "/classifieds") return;

  document.querySelectorAll<HTMLElement>("article").forEach((card) => {
    const text = card.textContent || "";
    if (!/OFFICE HIRING|PROFESSIONAL SEEKING OFFICE/i.test(text)) return;

    const color = professionColor(text);
    if (!color) return;

    const title = card.querySelector<HTMLElement>("h3");
    if (title) title.style.color = color;

    const topBorder = Array.from(card.children).find((child) => {
      if (!(child instanceof HTMLElement)) return false;
      const classes = child.className;
      return typeof classes === "string" && classes.includes("absolute") && classes.includes("inset-x-0") && classes.includes("top-0");
    });

    if (topBorder instanceof HTMLElement) topBorder.style.backgroundColor = color;
  });
}

export function DentalJobsProfessionColors() {
  useEffect(() => {
    applyDentalJobsProfessionColors();

    const observer = new MutationObserver(() => applyDentalJobsProfessionColors());
    observer.observe(document.body, { childList: true, subtree: true });

    const onPopState = () => window.setTimeout(applyDentalJobsProfessionColors, 0);
    window.addEventListener("popstate", onPopState);

    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  return null;
}
