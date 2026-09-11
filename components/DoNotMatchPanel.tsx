"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { loadAccountDetails } from "@/lib/dentalshift";
import { supabase } from "@/lib/supabase";

type DoNotMatchRow = {
  id: string;
  first_name: string;
  last_name: string;
  city: string;
  province: string | null;
};

type CityOption = { city: string; province: string };

export function DoNotMatchPanel() {
  const [isOffice, setIsOffice] = useState(false);
  const [officeId, setOfficeId] = useState<string | null>(null);
  const [rows, setRows] = useState<DoNotMatchRow[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cityValue, setCityValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const loadRows = async (id: string) => {
    const { data, error: loadError } = await supabase
      .from("office_do_not_match")
      .select("id,first_name,last_name,city,province")
      .eq("office_id", id)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true });
    if (loadError) throw loadError;
    setRows((data || []) as DoNotMatchRow[]);
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const role = window.localStorage.getItem("dentalshift_portal_role");
        if (role !== "office") return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const details = await loadAccountDetails(user.id);
        const id = details.office?.id;
        if (!id || !active) return;

        setIsOffice(true);
        setOfficeId(id);
        await loadRows(id);

        const { data: cityData } = await supabase.rpc("dentaljobs_member_cities");
        if (!active) return;
        const normalized = (cityData || [])
          .map((row: any) => ({ city: String(row.city || "").trim(), province: String(row.province || "").trim() }))
          .filter((row: CityOption) => row.city)
          .sort((a: CityOption, b: CityOption) => a.city.localeCompare(b.city) || a.province.localeCompare(b.province));
        setCities(normalized);
      } catch {
        if (active) setError("Do Not Match could not be loaded.");
      }
    })();
    return () => { active = false; };
  }, []);

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name)),
    [rows]
  );

  const addPerson = async (event: FormEvent) => {
    event.preventDefault();
    if (!officeId) return;
    const first = firstName.trim();
    const last = lastName.trim();
    const [city, province = ""] = cityValue.split("|||");
    if (!first || !last || !city) return;

    setBusy(true);
    setError("");
    const { error: insertError } = await supabase.from("office_do_not_match").insert({
      office_id: officeId,
      first_name: first,
      last_name: last,
      city,
      province: province || null,
      source: "manual",
    });

    if (insertError) {
      setError(insertError.code === "23505" ? "That professional is already on your Do Not Match list." : "Could not add this professional.");
      setBusy(false);
      return;
    }

    setFirstName("");
    setLastName("");
    setCityValue("");
    await loadRows(officeId);
    setBusy(false);
  };

  const removePerson = async (id: string) => {
    if (!officeId) return;
    setError("");
    const { error: deleteError } = await supabase.from("office_do_not_match").delete().eq("id", id);
    if (deleteError) {
      setError("Could not remove this professional.");
      return;
    }
    await loadRows(officeId);
  };

  if (!isOffice) return null;

  return (
    <aside className={`do-not-match-native ${open ? "is-open" : "is-closed"}`} aria-label="Do Not Match list">
      <div className="do-not-match-native-header">
        <div className="do-not-match-native-heading-wrap">
          <button type="button" className="do-not-match-view" onClick={() => setOpen((value) => !value)}>
            {open ? "Hide" : "View"}
          </button>
          <div className="do-not-match-native-kicker">Office exclusions</div>
          <h2>Do Not Match</h2>
          {open && <p>Keep professionals you do not want matched with this office on a private list.</p>}
        </div>
        <span>{sortedRows.length}</span>
      </div>

      {open && (
        <>
          <form onSubmit={addPerson} className="do-not-match-native-form">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" required />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" required />
            <select value={cityValue} onChange={(e) => setCityValue(e.target.value)} required>
              <option value="">Select city</option>
              {cities.map((item) => (
                <option key={`${item.city}-${item.province}`} value={`${item.city}|||${item.province}`}>
                  {item.province ? `${item.city}, ${item.province}` : item.city}
                </option>
              ))}
            </select>
            <button type="submit" disabled={busy}>{busy ? "Adding…" : "Add"}</button>
          </form>

          {error && <div className="do-not-match-native-error">{error}</div>}

          <div className="do-not-match-native-list">
            {!sortedRows.length ? (
              <div className="do-not-match-native-empty">No professionals have been added yet.</div>
            ) : (
              sortedRows.map((row) => (
                <div key={row.id} className="do-not-match-native-row">
                  <div>
                    <strong>{row.last_name}, {row.first_name}</strong>
                    <span>{row.city}{row.province ? `, ${row.province}` : ""}</span>
                  </div>
                  <button type="button" onClick={() => void removePerson(row.id)} aria-label={`Remove ${row.first_name} ${row.last_name}`}>×</button>
                </div>
              ))
            )}
          </div>

          <div className="do-not-match-native-footer">
            <button type="button" onClick={() => setOpen(false)}>Close</button>
          </div>
        </>
      )}

      <style jsx>{`
        .do-not-match-native {
          position: fixed;
          right: 18px;
          top: 112px;
          z-index: 25;
          width: min(390px, calc(100vw - 36px));
          border: 2px solid #F21C13;
          border-radius: 18px;
          background: #fff;
          padding: 14px 16px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, .16);
          transition: box-shadow .18s ease;
        }
        .do-not-match-native.is-open {
          max-height: calc(100vh - 138px);
          overflow: auto;
        }
        .do-not-match-native.is-closed {
          width: min(330px, calc(100vw - 36px));
        }
        .do-not-match-native-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
        .do-not-match-native-heading-wrap { min-width:0; }
        .do-not-match-view {
          display:inline-flex;
          align-items:center;
          justify-content:center;
          min-width:52px;
          height:26px;
          margin-bottom:6px;
          border:1px solid #F21C13;
          border-radius:8px;
          background:#fff;
          color:#F21C13;
          font-size:10px;
          font-weight:900;
          cursor:pointer;
        }
        .do-not-match-view:hover { background:#fff3f2; }
        .do-not-match-native-kicker { color:#F21C13; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.12em; }
        h2 { margin:3px 0 0; color:#F21C13; font-size:22px; font-weight:950; }
        p { margin:5px 0 0; color:#64748b; font-size:12px; line-height:1.45; }
        .do-not-match-native-header > span { display:grid; place-items:center; min-width:30px; height:30px; border-radius:999px; background:#F21C13; color:#fff; font-size:12px; font-weight:900; }
        .do-not-match-native-form { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:14px; }
        input, select { height:40px; min-width:0; border:1px solid #d8dee8; border-radius:10px; background:#fff; padding:0 10px; color:#0f172a; font-size:12px; outline:none; }
        select { grid-column:1 / -1; }
        .do-not-match-native-form > button { grid-column:1 / -1; height:40px; border:0; border-radius:10px; background:#F21C13; color:#fff; font-size:12px; font-weight:900; cursor:pointer; }
        .do-not-match-native-form > button:disabled { opacity:.6; cursor:default; }
        .do-not-match-native-error { margin-top:9px; border-radius:9px; background:#fff0ef; padding:8px 10px; color:#b42318; font-size:11px; font-weight:800; }
        .do-not-match-native-list { margin-top:12px; display:grid; gap:7px; }
        .do-not-match-native-row { display:flex; align-items:center; justify-content:space-between; gap:10px; border:1px solid #f1d2cf; border-radius:11px; background:#fffafa; padding:9px 10px; }
        .do-not-match-native-row strong { display:block; color:#002757; font-size:12px; }
        .do-not-match-native-row span { display:block; margin-top:2px; color:#64748b; font-size:10px; }
        .do-not-match-native-row button { width:28px; height:28px; border:0; border-radius:8px; background:#F21C13; color:#fff; font-size:18px; line-height:1; cursor:pointer; }
        .do-not-match-native-empty { border:1px dashed #efb6b2; border-radius:11px; padding:12px; color:#8b5e5a; font-size:11px; text-align:center; }
        .do-not-match-native-footer { display:flex; justify-content:flex-end; margin-top:12px; padding-top:10px; border-top:1px solid #f4d4d1; }
        .do-not-match-native-footer button { min-width:62px; height:32px; border:0; border-radius:9px; background:#002757; color:#fff; font-size:11px; font-weight:900; cursor:pointer; }
        .do-not-match-native-footer button:hover { background:#01A32E; }
        @media (max-width: 1100px) {
          .do-not-match-native,
          .do-not-match-native.is-closed { position:relative; right:auto; top:auto; z-index:auto; width:auto; max-height:none; margin:10px 14px 0; }
        }
      `}</style>
    </aside>
  );
}
