"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

function roleCode(profession: string) {
  const value = profession.toLowerCase();
  if (value.includes("hygien")) return "RDH";
  if (value.includes("admin")) return "DA";
  if (value.includes("steril")) return "ST";
  if (value.includes("assistant")) return "CDA";
  return "";
}

export function ProfessionalWorkspacePolish() {
  useEffect(() => {
    let profession = "";
    let code = "";

    const apply = () => {
      const calendar = document.getElementById("available-shifts-calendar");
      if (!calendar) return;

      const logo = document.querySelector<HTMLImageElement>('header img[alt="DentalShift"]');
      if (logo) {
        logo.style.height = "58px";
        logo.style.width = "auto";
        const wrapper = logo.parentElement;
        if (wrapper) wrapper.style.width = "190px";
      }

      const metricStrip = calendar.querySelector<HTMLElement>("[data-calendar-metric-strip]");
      if (metricStrip) {
        const buttons = Array.from(metricStrip.querySelectorAll<HTMLButtonElement>(":scope > button"));
        const applications = buttons.find((button) => button.textContent?.includes("Applications"));
        const bookings = buttons.find((button) => button.textContent?.includes("Confirmed bookings"));
        if (applications) applications.style.display = "none";
        if (bookings) bookings.style.display = "";
        metricStrip.className = "grid w-full grid-cols-1 gap-2 xl:w-auto xl:min-w-[210px]";
      }

      if (code && profession) {
        const aside = calendar.querySelector<HTMLElement>("aside");
        if (aside) {
          const roleButtons = Array.from(aside.querySelectorAll<HTMLButtonElement>("button")).filter((button) => {
            const text = button.textContent?.trim() || "";
            return /^(\d+)(RDH|CDA|DA|ST)$/.test(text.replace(/\s+/g, ""));
          });
          if (roleButtons.length) {
            const roleGrid = roleButtons[0].parentElement as HTMLElement | null;
            if (roleGrid) roleGrid.className = "mt-4 grid grid-cols-1 gap-2";
            roleButtons.forEach((button) => {
              const buttonCode = Array.from(button.querySelectorAll("span")).map((span) => span.textContent?.trim()).find((value) => value && ["RDH", "CDA", "DA", "ST"].includes(value)) || "";
              const matches = buttonCode === code;
              button.style.display = matches ? "" : "none";
              if (matches) {
                button.className = "rounded-xl p-3 text-left transition bg-blue-50 text-[#002757]";
                const label = button.querySelector("span");
                if (label) {
                  label.textContent = profession;
                  label.className = "mt-1 block text-xs font-black";
                }
              }
            });
          }
        }
      }

      // Keep availability confined to the bottom half of each day cell so the
      // upper half stays open for office shifts, invitations, and other messages.
      const availabilityMarkers = Array.from(calendar.querySelectorAll<HTMLElement>("[data-available-marker]"));
      availabilityMarkers.forEach((marker) => {
        const dayButton = marker.closest("button") as HTMLButtonElement | null;
        if (!dayButton) return;

        dayButton.style.position = "relative";
        dayButton.style.paddingBottom = "6px";

        // Availability should not tint the whole day square. Other higher-priority
        // states such as invitations/bookings may still style the cell itself.
        if (!dayButton.dataset.invitedDate && !dayButton.dataset.bookedDate) {
          dayButton.style.backgroundColor = "";
          dayButton.style.boxShadow = "";
        }

        marker.style.position = "absolute";
        marker.style.left = "6px";
        marker.style.right = "6px";
        marker.style.bottom = "6px";
        marker.style.width = "auto";
        marker.style.height = "calc(50% - 9px)";
        marker.style.maxHeight = "calc(50% - 9px)";
        marker.style.marginTop = "0";
        marker.style.display = "flex";
        marker.style.alignItems = "center";
        marker.style.justifyContent = "flex-start";
        marker.style.padding = "5px 6px";
        marker.style.overflow = "hidden";
        marker.style.boxSizing = "border-box";
      });

      // One availability window per day. Once availability exists, remove the
      // duplicate-time form and leave only the current hours plus Remove/Close.
      const availabilityDialog = document.querySelector<HTMLElement>('[role="dialog"][aria-label="Availability"]');
      if (availabilityDialog) {
        const currentlyAvailable = Array.from(availabilityDialog.querySelectorAll<HTMLElement>("p")).find((node) => node.textContent?.trim() === "Currently available");
        if (currentlyAvailable) {
          const form = availabilityDialog.querySelector<HTMLFormElement>("form");
          if (form) {
            const fieldGrid = form.firstElementChild as HTMLElement | null;
            if (fieldGrid) fieldGrid.style.display = "none";
            const helper = Array.from(form.querySelectorAll<HTMLElement>("p")).find((node) => node.textContent?.includes("Your availability helps DentalShift"));
            if (helper) helper.style.display = "none";
            const submit = Array.from(form.querySelectorAll<HTMLButtonElement>('button[type="submit"]'))[0];
            if (submit) submit.style.display = "none";
          }
        }
      }
    };

    const loadProfession = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) return;
      const { data } = await supabase.from("professional_profiles").select("profession").eq("user_id", user.id).maybeSingle();
      profession = data?.profession || "";
      code = roleCode(profession);
      apply();
    };

    apply();
    void loadProfession();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
