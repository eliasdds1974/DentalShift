"use client";

import { useEffect, useRef, useState } from "react";
import { Check, MapPin, Search } from "lucide-react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";

type Suggestion = { placeId: string; label: string; mainText: string; secondaryText: string };
type Place = {
  placeId: string;
  formattedAddress: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
};

export function ProfessionalLocationField() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [currentAddress, setCurrentAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const sessionToken = useRef(typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()));

  useEffect(() => {
    const attach = () => {
      const travelInput = document.querySelector<HTMLInputElement>('input[name="travel_radius_km"]');
      const form = travelInput?.closest("form");
      if (!travelInput || !form) {
        setHost(null);
        return;
      }
      let target = form.querySelector<HTMLElement>("[data-professional-location-host]");
      if (!target) {
        target = document.createElement("div");
        target.dataset.professionalLocationHost = "true";
        target.className = "sm:col-span-2";
        const rateInput = form.querySelector<HTMLInputElement>('input[name="hourly_rate"]');
        const rateField = rateInput?.closest("label");
        rateField?.parentElement?.insertBefore(target, rateField);
      }
      setHost(target);
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!host) return;
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return;
      const { data } = await supabase.from("profiles").select("address,city,province,postal_code").eq("id", userId).maybeSingle();
      if (!data) return;
      const location = [data.address, data.city, data.province, data.postal_code].filter(Boolean).join(", ");
      setCurrentAddress(location);
    })();
  }, [host]);

  useEffect(() => {
    if (!host || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/google/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: query, kind: "professional", sessionToken: sessionToken.current }),
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Address suggestions could not be loaded.");
        setSuggestions(data.suggestions || []);
      } catch (value) {
        if ((value as Error).name !== "AbortError") setError(value instanceof Error ? value.message : "Address suggestions could not be loaded.");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [host, query]);

  const choose = async (suggestion: Suggestion) => {
    setSaving(true);
    setError("");
    setSaved(false);
    setSuggestions([]);
    try {
      const response = await fetch("/api/google/places/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: suggestion.placeId, sessionToken: sessionToken.current }),
      });
      const place = await response.json() as Place & { error?: string };
      if (!response.ok) throw new Error(place.error || "The selected address could not be verified.");
      if (place.latitude == null || place.longitude == null) throw new Error("Google did not return coordinates for this address. Please choose another result.");

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Please sign in again before updating your location.");

      const { error: updateError } = await supabase.from("profiles").update({
        address: place.address,
        city: place.city,
        province: place.province,
        postal_code: place.postalCode,
        google_place_id: place.placeId,
        latitude: place.latitude,
        longitude: place.longitude,
        updated_at: new Date().toISOString(),
      }).eq("id", userId);
      if (updateError) throw updateError;

      const form = host?.closest("form");
      const cityInput = form?.querySelector<HTMLInputElement>('input[name="city"]');
      const provinceInput = form?.querySelector<HTMLInputElement>('input[name="province"]');
      const postalInput = form?.querySelector<HTMLInputElement>('input[name="postal_code"]');
      if (cityInput) cityInput.value = place.city;
      if (provinceInput) provinceInput.value = place.province;
      if (postalInput) postalInput.value = place.postalCode;

      setCurrentAddress(place.formattedAddress || [place.address, place.city, place.province, place.postalCode].filter(Boolean).join(", "));
      setQuery("");
      setSaved(true);
      sessionToken.current = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
    } catch (value) {
      setError(value instanceof Error ? value.message : "Your home location could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  if (!host) return null;

  return createPortal(
    <div className="rounded-2xl border border-[#0078FE]/15 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#edf3fa] text-[#0078FE]"><MapPin size={18} /></span>
        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold text-[#002757]">Home location for shift matching</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">Your exact address stays private. DentalShift uses it only to calculate which offices fall within your selected travel distance.</p>
          {currentAddress && <p className="mt-2 text-xs font-bold text-slate-700">Current: {currentAddress}</p>}
        </div>
      </div>
      <label className="field mt-4"><span>{currentAddress ? "Change home address" : "Home address"}</span><div className="relative"><Search size={17} className="pointer-events-none absolute left-3 top-3.5 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setSaved(false); setError(""); }} className="pl-10!" autoComplete="off" placeholder="Start typing your Canadian address" />{(loading || saving) && <span className="absolute right-3 top-3.5 text-xs font-bold text-slate-400">{saving ? "Saving…" : "Searching…"}</span>}</div></label>
      {suggestions.length > 0 && <div className="mt-2 overflow-hidden rounded-xl border border-[#0078FE]/20 bg-white shadow-lg">{suggestions.map((suggestion) => <button type="button" key={suggestion.placeId} onClick={() => void choose(suggestion)} className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-[#edf3fa]"><MapPin size={17} className="mt-0.5 shrink-0 text-[#0078FE]" /><span><strong className="block text-sm text-[#002757]">{suggestion.mainText}</strong><span className="mt-0.5 block text-xs text-slate-500">{suggestion.secondaryText}</span></span></button>)}</div>}
      {saved && <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#eaf8ee] p-3 text-sm font-bold text-[#017f27]"><Check size={16} />Home location saved. Shift distance matching is now active.</p>}
      {error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p>}
    </div>,
    host,
  );
}
