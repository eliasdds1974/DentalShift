from pathlib import Path

# 1) Add explicit add buttons to the shared office search component.
p = Path('components/GoogleAddressAutocomplete.tsx')
s = p.read_text()

old_import = 'import { Check, MapPin, Search } from "lucide-react";'
new_import = 'import { Check, MapPin, Plus, Search } from "lucide-react";'
if old_import in s:
    s = s.replace(old_import, new_import, 1)

start = s.index('export function GoogleOfficeFavouriteSearch(')
end = s.index('\nexport function GoogleAddressAutocomplete', start)
new_component = '''export function GoogleOfficeFavouriteSearch({ onAdd, disabled, actionLabel = "Add office", tone = "preferred" }: { onAdd: (office: GoogleOfficeSelection) => Promise<void>; disabled?: boolean; actionLabel?: string; tone?: "preferred" | "excluded" }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<GoogleOfficeSelection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sessionToken = useRef(typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()));

  useEffect(() => {
    if (selectedOffice || query.trim().length < 3) { setSuggestions([]); return; }
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
  }, [query, selectedOffice]);

  const choose = async (suggestion: Suggestion) => {
    setLoading(true); setError(""); setSuggestions([]);
    try {
      const response = await fetch("/api/google/places/details", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ placeId: suggestion.placeId, sessionToken: sessionToken.current }) });
      const office = await response.json() as GoogleOfficeSelection & { error?: string };
      if (!response.ok) throw new Error(office.error || "The selected office could not be verified.");
      setSelectedOffice(office);
      setQuery(office.name || suggestion.mainText);
    } catch (value) { setError(value instanceof Error ? value.message : "The office could not be selected."); }
    finally { setLoading(false); }
  };

  const addSelected = async () => {
    if (!selectedOffice || disabled || loading) return;
    setLoading(true); setError("");
    try {
      await onAdd(selectedOffice);
      setSelectedOffice(null);
      setQuery("");
      setSuggestions([]);
      sessionToken.current = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
    } catch (value) { setError(value instanceof Error ? value.message : "The office could not be added."); }
    finally { setLoading(false); }
  };

  const actionClass = tone === "excluded"
    ? "inline-flex items-center justify-center gap-2 rounded-xl bg-[#E81E12] px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#C81910] disabled:cursor-not-allowed disabled:opacity-50"
    : "inline-flex items-center justify-center gap-2 rounded-xl bg-[#FDB605] px-3 py-2 text-xs font-black text-[#9A6D00] shadow-sm transition hover:bg-[#F2AC00] disabled:cursor-not-allowed disabled:opacity-50";

  return <div className="relative">
    <label className="field"><span>Search for a dental office by name</span><div className="relative"><Search size={18} className="pointer-events-none absolute left-3 top-3.5 text-slate-400" /><input value={query} disabled={disabled || loading} onChange={(event) => { setQuery(event.target.value); setSelectedOffice(null); setError(""); }} className="pl-10!" autoComplete="off" placeholder="Start typing an office name" />{loading && <span className="absolute right-3 top-3.5 text-xs font-bold text-slate-400">Working…</span>}</div></label>
    {suggestions.length > 0 && <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[#0078FE]/25 bg-white shadow-xl">{suggestions.map((suggestion) => <button type="button" key={suggestion.placeId} onClick={() => void choose(suggestion)} className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-[#edf3fa]"><MapPin size={18} className="mt-0.5 shrink-0 text-[#0078FE]" /><span><strong className="block text-sm text-[#002757]">{suggestion.mainText}</strong><span className="mt-0.5 block text-xs text-slate-500">{suggestion.secondaryText}</span></span></button>)}<p className="bg-slate-50 px-4 py-2 text-right text-[10px] font-bold text-slate-400">Powered by Google</p></div>}
    {selectedOffice && <div className="mt-2 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-xs font-extrabold text-[#002757]">{selectedOffice.name}</p><p className="truncate text-[11px] text-slate-500">{selectedOffice.formattedAddress}</p></div><button type="button" disabled={disabled || loading} onClick={() => void addSelected()} className={actionClass}><Plus size={14} strokeWidth={3} />{actionLabel}</button></div>}
    {error && <p className="mt-2 rounded-xl bg-red-50 p-3 text-sm font-bold text-[#F21C13]">{error}</p>}
  </div>;
}
'''
s = s[:start] + new_component + s[end:]
p.write_text(s)

# 2) Update account panels and requested button colors.
p = Path('app/page.tsx')
s = p.read_text()

s = s.replace('className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#FDB605] px-3 py-2 text-xs font-black text-white shadow-sm"', 'className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#FDB605] px-3 py-2 text-xs font-black text-[#9A6D00] shadow-sm"', 1)
s = s.replace('className="mt-2 inline-flex items-center gap-2 rounded-xl border border-[#E81E12] bg-white px-3 py-2 text-xs font-black text-[#E81E12] shadow-sm hover:bg-[#FCE8E7]"', 'className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#E81E12] px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-[#C81910]"', 1)

old_pref = '<div className="rounded-xl border border-[#01A32E]/20 bg-white p-3 sm:col-span-2 lg:col-span-2"><div className="flex items-center gap-2"><Heart size={18} className="fill-[#01A32E] text-[#01A32E]" /><h3 className="font-extrabold text-[#002757]">Preferred offices</h3></div><p className="mt-1 text-xs text-slate-500">Search Google by office name, then select an office to mark it as preferred.</p><div className="mt-2"><GoogleOfficeFavouriteSearch onAdd={addFavouriteFromGoogle} disabled={busy} /></div>'
new_pref = '<div className="rounded-xl border border-[#FDB605]/55 bg-white p-3 sm:col-span-2 lg:col-span-2"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Star size={18} className="fill-[#FDB605] text-[#FDB605]" /><h3 className="font-extrabold text-[#002757]">Preferred offices</h3></div><span className="rounded-full bg-[#FFF7D6] px-2.5 py-1 text-[11px] font-black text-[#9A6D00] ring-1 ring-inset ring-[#FDB605]/45">Preferred</span></div><p className="mt-1 text-xs text-slate-500">Search Google by office name, select the office, then add it to your preferred list. You can add as many offices as you like.</p><div className="mt-2"><GoogleOfficeFavouriteSearch onAdd={addFavouriteFromGoogle} disabled={busy} actionLabel="Add preferred office" tone="preferred" /></div>'
if old_pref not in s:
    raise SystemExit('Preferred office panel pattern not found')
s = s.replace(old_pref, new_pref, 1)

old_exc_call = '<div className="mt-2"><GoogleOfficeFavouriteSearch onAdd={addExcludedOfficeFromGoogle} disabled={busy} /></div>'
new_exc_call = '<div className="mt-2"><GoogleOfficeFavouriteSearch onAdd={addExcludedOfficeFromGoogle} disabled={busy} actionLabel="Add excluded office" tone="excluded" /></div>'
if old_exc_call not in s:
    raise SystemExit('Excluded office search call pattern not found')
s = s.replace(old_exc_call, new_exc_call, 1)

s = s.replace('Shifts from offices added here will not appear in your available shift results. This list is private and is not visible to offices.', 'Shifts from offices added here will not appear in your available shift results. This list is private and is not visible to offices. You can add as many offices as you like.', 1)

p.write_text(s)
print('Updated professional office add controls and office-side button colors.')