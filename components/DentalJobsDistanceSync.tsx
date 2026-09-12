"use client";

import { useEffect } from "react";
import { loadAccountDetails } from "@/lib/dentalshift";
import { supabase } from "@/lib/supabase";

type Coordinate = { latitude: number; longitude: number };
type ListingDistance = {
  key: string;
  distance: number | null;
};

function validCoordinate(latitude: unknown, longitude: unknown): Coordinate | null {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { latitude: lat, longitude: lng };
}

function distanceKm(a: Coordinate, b: Coordinate) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371.0088;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function normalize(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function listingKey(kind: "office" | "professional", title: string, city: string) {
  return `${kind}|${normalize(title)}|${normalize(city)}`;
}

export function DentalJobsDistanceSync() {
  useEffect(() => {
    let disposed = false;
    let listings: ListingDistance[] = [];

    const loadDistances = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || disposed) return;

      const storedRole = window.localStorage.getItem("dentalshift_portal_role");
      const role = storedRole === "office" ? "office" : storedRole === "professional" ? "professional" : null;
      if (!role) return;

      let viewer: Coordinate | null = null;
      try {
        const details = await loadAccountDetails(user.id);
        viewer = role === "office"
          ? validCoordinate(details.office?.latitude, details.office?.longitude) || validCoordinate(details.profile.latitude, details.profile.longitude)
          : validCoordinate(details.profile.latitude, details.profile.longitude);
      } catch {
        return;
      }

      const { data: rows, error } = await supabase
        .from("job_listings")
        .select("id,listing_type,profession,employment_type,city,province,office_id,professional_id,created_at")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (error || !rows || disposed) return;

      const officeIds = Array.from(new Set(rows.map((row) => row.office_id).filter(Boolean))) as string[];
      const professionalIds = Array.from(new Set(rows.map((row) => row.professional_id).filter(Boolean))) as string[];

      const [officeResult, profileResult] = await Promise.all([
        officeIds.length
          ? supabase.from("offices").select("id,latitude,longitude").in("id", officeIds)
          : Promise.resolve({ data: [], error: null }),
        professionalIds.length
          ? supabase.from("profiles").select("id,latitude,longitude").in("id", professionalIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const officeCoordinates = new Map<string, Coordinate>();
      for (const row of officeResult.data || []) {
        const coordinate = validCoordinate(row.latitude, row.longitude);
        if (coordinate) officeCoordinates.set(row.id, coordinate);
      }

      const professionalCoordinates = new Map<string, Coordinate>();
      for (const row of profileResult.data || []) {
        const coordinate = validCoordinate(row.latitude, row.longitude);
        if (coordinate) professionalCoordinates.set(row.id, coordinate);
      }

      listings = rows.map((row) => {
        const kind = row.listing_type === "office_hiring" ? "office" as const : "professional" as const;
        const title = kind === "office"
          ? `${row.profession} — ${row.employment_type}`
          : `${row.profession} Looking for an Office`;
        const city = `${row.city}, ${row.province}`;
        const target = kind === "office"
          ? (row.office_id ? officeCoordinates.get(row.office_id) || null : null)
          : (row.professional_id ? professionalCoordinates.get(row.professional_id) || null : null);
        return {
          key: listingKey(kind, title, city),
          distance: viewer && target ? distanceKm(viewer, target) : null,
        };
      });

      applyDistances();
    };

    const applyDistances = () => {
      if (disposed || listings.length === 0) return;
      const headings = Array.from(document.querySelectorAll<HTMLHeadingElement>("h2"));
      const heading = headings.find((item) => item.textContent?.includes("Dental job opportunities within"));
      if (!heading) return;

      const section = heading.closest("section") as HTMLElement | null;
      if (!section) return;

      const grid = Array.from(section.querySelectorAll<HTMLElement>("div")).find((element) => {
        const directArticles = Array.from(element.children).filter((child) => child.tagName === "ARTICLE");
        return directArticles.length > 0;
      });
      if (!grid) return;

      const cards = Array.from(grid.children).filter((child): child is HTMLElement => child instanceof HTMLElement && child.tagName === "ARTICLE");
      const byKey = new Map(listings.map((item) => [item.key, item.distance]));

      for (const card of cards) {
        const title = card.querySelector("h3")?.textContent?.trim() || "";
        const kind = card.textContent?.includes("OFFICE HIRING") ? "office" as const : "professional" as const;
        const city = Array.from(card.querySelectorAll("p")).map((item) => item.textContent?.trim() || "").find((text) => /,\s*[A-Z]{2}$/.test(text)) || "";
        const key = listingKey(kind, title, city);
        if (!byKey.has(key)) continue;

        const distance = byKey.get(key) ?? null;
        const distanceText = Array.from(card.querySelectorAll<HTMLParagraphElement>("p")).find((item) => /km away|distance unavailable/i.test(item.textContent || ""));
        if (distanceText) {
          distanceText.textContent = distance == null ? "Distance unavailable" : `${distance.toFixed(1)} km away`;
        }

        if (distance == null) {
          card.dataset.dentaljobsDistance = "999999";
          card.style.display = "";
        } else {
          card.dataset.dentaljobsDistance = String(distance);
          card.style.display = distance <= 100 ? "" : "none";
        }
      }

      const orderedCards = [...cards].sort((a, b) => {
        const aDistance = Number(a.dataset.dentaljobsDistance ?? a.querySelector("p")?.textContent?.match(/([\d.]+)\s*km away/i)?.[1] ?? 999999);
        const bDistance = Number(b.dataset.dentaljobsDistance ?? b.querySelector("p")?.textContent?.match(/([\d.]+)\s*km away/i)?.[1] ?? 999999);
        return aDistance - bDistance;
      });
      orderedCards.forEach((card) => grid.appendChild(card));

      const visibleCount = orderedCards.filter((card) => card.style.display !== "none").length;
      const countText = heading.parentElement?.querySelector("p");
      if (countText) countText.textContent = `${visibleCount} active listing${visibleCount === 1 ? "" : "s"} shown`;
    };

    void loadDistances();
    const timers = [300, 700, 1400, 2500].map((delay) => window.setTimeout(applyDistances, delay));
    const handleClick = () => window.setTimeout(applyDistances, 120);
    document.addEventListener("click", handleClick);

    return () => {
      disposed = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return null;
}
