"use client";

import { useEffect, useRef, useState } from "react";
import { Check, MapPin, Search } from "lucide-react";

type Suggestion = { placeId: string; label: string; mainText: string; secondaryText: string };
type SelectedPlace = {
  placeId: string;
  name: string;
  formattedAddress: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  website?: string;
};

export type GoogleOfficeSelection = Pick<SelectedPlace, "placeId" | "name" | "formattedAddress" | "city" | "province" | "website">;

export function GoogleOfficeFavouriteSearch({ onAdd, disabled }: { onAdd: (office: GoogleOfficeSelection) => Promise<void>; disabled?: boolean }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sessionToken = useRef(typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()));

  useEffect(() => {
    if (query.trim().length < 3) { setSuggestions([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const response = await fetch("/api/google/places/autocomplete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: query, kind: "favourite-office", sessionToken: sessionToken.current }), signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Office suggestions could not be loaded.");
        setSuggestions(data.suggestions || []);
      } catch (value) { if ((value as Error).name !== "AbortError") setError(value instanceof Error ? value.message : "Office suggestions could not be loaded."); }
      finally { setLoading(false); }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  const choose = async (suggestion: Suggestion) => {
    setLoading(true); setError(""); setSuggestions([]);
    try {
      const response = await fetch("/api/google/places/details", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ placeId: suggestion.placeId, sessionToken: sessionToken.current }) });
      const office = await response.json() as GoogleOfficeSelection & { error?: string };
      if (!response.ok) throw new Error(office.error || "The selected office could not be verified.");
      await onAdd(office);
      setQuery("");
      sessionToken.current = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
    } catch (value) { setError(value instanceof Error ? value.message : "The office could not be added."); }
    finally { setLoading(false); }
  };

  return <div className="relative">
    <label className="field"><span>Search for a dental office by name</span><div className="relative"><Search size={18} className="pointer-events-none absolute left-3 top-3.5 text-slate-400" /><input value={query} disabled={disabled} onChange={(event) => { setQuery(event.target.value); setError(""); }} className="pl-10!" autoComplete="off" placeholder="Start typing an office name" />{loading && <span className="absolute right-3 top-3.5 text-xs font-bold text-slate-400">Searching…</span>}</div></label>
    {suggestions.length > 0 && <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[#0078FE]/25 bg-white shadow-xl">{suggestions.map((suggestion) => <button type="button" key={suggestion.placeId} onClick={() => void choose(suggestion)} className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-[#edf3fa]"><MapPin size={18} className="mt-0.5 shrink-0 text-[#0078FE]" /><span><strong className="block text-sm text-[#002757]">{suggestion.mainText}</strong><span className="mt-0.5 block text-xs text-slate-500">{suggestion.secondaryText}</span></span></button>)}<p className="bg-slate-50 px-4 py-2 text-right text-[10px] font-bold text-slate-400">Powered by Google</p></div>}
    {error && <p className="mt-2 rounded-xl bg-red-50 p-3 text-sm font-bold text-[#F21C13]">{error}</p>}
  </div>;
}

export function GoogleAddressAutocomplete({ kind, initialAddress }: { kind: "office" | "professional"; initialAddress?: { address?: string | null; city?: string | null; province?: string | null; postalCode?: string | null; googlePlaceId?: string | null; latitude?: number | null; longitude?: number | null } }) {
  const initialPlace: SelectedPlace | null = initialAddress?.address ? {
    placeId: initialAddress.googlePlaceId || "",
    name: "",
    formattedAddress: [initialAddress.address, initialAddress.city, initialAddress.province, initialAddress.postalCode].filter(Boolean).join(", "),
    address: initialAddress.address || "",
    city: initialAddress.city || "",
    province: initialAddress.province || "",
    postalCode: initialAddress.postalCode || "",
    country: "CA",
    latitude: initialAddress.latitude ?? null,
    longitude: initialAddress.longitude ?? null,
  } : null;
  const [query, setQuery] = useState(initialPlace?.formattedAddress || "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<SelectedPlace | null>(initialPlace);
  const [manual, setManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sessionToken = useRef(typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()));

  useEffect(() => {
    if (manual || selected || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/google/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: query, kind, sessionToken: sessionToken.current }),
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Address suggestions could not be loaded.");
        setSuggestions(data.suggestions || []);
      } catch (value) {
        if ((value as Error).name !== "AbortError") {
          setError(value instanceof Error ? value.message : "Address suggestions could not be loaded.");
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [kind, manual, query, selected]);

  const choose = async (suggestion: Suggestion) => {
    setLoading(true);
    setError("");
    setSuggestions([]);
    try {
      const response = await fetch("/api/google/places/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: suggestion.placeId, sessionToken: sessionToken.current }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The selected address could not be verified.");
      setSelected(data);
      setQuery(data.formattedAddress || suggestion.label);
    } catch (value) {
      setError(value instanceof Error ? value.message : "The selected address could not be verified.");
    } finally {
      setLoading(false);
    }
  };

  if (manual) {
    return <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
      {kind === "office" && <label className="field sm:col-span-2"><span>Office name</span><input name="office_name" required /></label>}
      <label className="field sm:col-span-2"><span>Street address</span><input name="address" required /></label>
      <label className="field"><span>City</span><input name="city" required /></label>
      <label className="field"><span>Province</span><select name="province" required defaultValue="BC"><option>BC</option><option>AB</option><option>SK</option><option>MB</option><option>ON</option><option>QC</option><option>NB</option><option>NS</option><option>PE</option><option>NL</option><option>NT</option><option>NU</option><option>YT</option></select></label>
      <label className="field sm:col-span-2"><span>Postal code</span><input name="postal_code" required /></label>
      <input type="hidden" name="google_place_id" value="" />
      <input type="hidden" name="latitude" value="" />
      <input type="hidden" name="longitude" value="" />
      <button type="button" onClick={() => { setManual(false); setError(""); }} className="secondary-btn justify-self-start sm:col-span-2">Use Google search instead</button>
    </div>;
  }

  return <div className="sm:col-span-2">
    <label className="field">
      <span>{kind === "office" ? "Find your dental office" : "Complete address"}</span>
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3 top-3.5 text-slate-400" />
        <input
          value={query}
          onChange={(event) => { setQuery(event.target.value); setSelected(null); setError(""); }}
          className="pl-10!"
          autoComplete="off"
          placeholder={kind === "office" ? "Start typing the office name or address" : "Start typing your Canadian address"}
          required
        />
        {loading && <span className="absolute right-3 top-3.5 text-xs font-bold text-slate-400">Searching…</span>}
      </div>
    </label>

    {suggestions.length > 0 && <div className="mt-2 overflow-hidden rounded-2xl border border-[#0078FE]/25 bg-white shadow-lg">
      {suggestions.map((suggestion) => <button type="button" key={suggestion.placeId} onClick={() => void choose(suggestion)} className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-[#edf3fa]">
        <MapPin size={18} className="mt-0.5 shrink-0 text-[#0078FE]" />
        <span><strong className="block text-sm text-[#002757]">{suggestion.mainText}</strong><span className="mt-0.5 block text-xs text-slate-500">{suggestion.secondaryText}</span></span>
      </button>)}
      <p className="bg-slate-50 px-4 py-2 text-right text-[10px] font-bold text-slate-400">Powered by Google</p>
    </div>}

    {selected && <div className="mt-3 rounded-2xl border border-[#01A32E]/25 bg-[#eaf8ee] p-4">
      <p className="flex items-center gap-2 text-sm font-black text-[#017f27]"><Check size={17} />{kind === "office" ? "Dental office selected" : "Address selected"}</p>
      {kind === "office" && <p className="mt-2 font-black text-[#002757]">{selected.name}</p>}
      <p className="mt-1 text-sm font-bold text-slate-700">{selected.formattedAddress}</p>
      <button type="button" onClick={() => { setSelected(null); setQuery(""); sessionToken.current = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()); }} className="mt-2 text-xs font-extrabold text-[#002757] underline">Choose a different address</button>
    </div>}

    {error && <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-[#F21C13]">{error}<button type="button" onClick={() => setManual(true)} className="ml-2 underline">Enter manually</button></div>}
    {!selected && !error && <button type="button" onClick={() => setManual(true)} className="mt-2 text-xs font-extrabold text-slate-500 underline">Address not listed? Enter it manually</button>}

    {selected && <>
      {kind === "office" && <input type="hidden" name="office_name" value={selected.name} />}
      <input type="hidden" name="address" value={selected.address} />
      <input type="hidden" name="city" value={selected.city} />
      <input type="hidden" name="province" value={selected.province} />
      <input type="hidden" name="postal_code" value={selected.postalCode} />
      <input type="hidden" name="google_place_id" value={selected.placeId} />
      <input type="hidden" name="latitude" value={selected.latitude ?? ""} />
      <input type="hidden" name="longitude" value={selected.longitude ?? ""} />
    </>}
    {kind === "professional" && <p className="mt-2 text-xs text-slate-500">Your street address remains private and is used only for accurate distance matching.</p>}
  </div>;
}
