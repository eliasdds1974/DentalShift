"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  BriefcaseBusiness,
  Building2,
  Car,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  Languages,
  MapPin,
  Monitor,
  MoreVertical,
  Navigation,
  Pause,
  Pencil,
  Play,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { ShareListingButton } from "@/components/ShareListingButton";
import { supabase } from "@/lib/supabase";

type ProfessionalJobListing = {
  id: string;
  profession: string;
  employment_type: string;
  city: string;
  province: string;
  days_per_week: string | null;
  pay_min: number | null;
  pay_max: number | null;
  schedule: string | null;
  description: string;
  status: string;
  expires_at: string;
  created_at: string;
};

type OfficeInterestSnapshot = {
  label?: string | null;
  city?: string | null;
  province?: string | null;
};

type Connection = {
  id: string;
  listingId: string;
  initiatorRole: "professional" | "office";
  status: "pending" | "interested" | "declined" | "withdrawn";
  createdAt: string;
  officeId: string;
  officeInterestSnapshot?: OfficeInterestSnapshot | null;
};

type SafeOfficeProfile = {
  id: string;
  city: string | null;
  province: string | null;
  software: string[] | null;
  languages: string[] | null;
  parking_info: string | null;
  latitude: number | null;
  longitude: number | null;
};

type ProfessionalCoords = {
  latitude: number | null;
  longitude: number | null;
};

const btn: React.CSSProperties = {
  height: 32,
  borderRadius: 7,
  padding: "0 10px",
  fontSize: 13,
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  whiteSpace: "nowrap",
};

function connectionStatus(connection: Connection) {
  if (connection.status === "interested") return "Mutual Interest";
  if (connection.status === "declined") return "Not Interested";
  if (connection.status === "withdrawn") return "Withdrawn";
  return connection.initiatorRole === "office" ? "New" : "Pending";
}

function kmBetween(lat1?: number | null, lon1?: number | null, lat2?: number | null, lon2?: number | null) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const rad = (value: number) => (value * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function displayList(values?: string[] | null) {
  const clean = (values || []).map((value) => String(value).trim()).filter(Boolean);
  return clean.length ? clean.join(" · ") : "Not provided";
}

export function ProfessionalPostingsCard() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<ProfessionalJobListing[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [officeProfiles, setOfficeProfiles] = useState<Record<string, SafeOfficeProfile>>({});
  const [professionalCoords, setProfessionalCoords] = useState<ProfessionalCoords>({ latitude: null, longitude: null });
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [manageJob, setManageJob] = useState<ProfessionalJobListing | null>(null);
  const [editJob, setEditJob] = useState<ProfessionalJobListing | null>(null);

  useEffect(() => {
    const findAndMount = () => {
      const sections = Array.from(document.querySelectorAll("section"));
      const legacy = sections.find((section) =>
        Array.from(section.querySelectorAll("p")).some((p) => p.textContent?.trim().toLowerCase() === "my availability ads"),
      ) as HTMLElement | undefined;
      if (!legacy || !legacy.parentElement) return false;

      legacy.style.display = "none";
      let mount = legacy.parentElement.querySelector<HTMLElement>("[data-professional-postings-host='true']");
      if (!mount) {
        mount = document.createElement("div");
        mount.dataset.professionalPostingsHost = "true";
        mount.className = "h-full min-w-0";
        legacy.insertAdjacentElement("afterend", mount);
      }
      setHost(mount);
      return true;
    };

    if (findAndMount()) return;
    const observer = new MutationObserver(() => {
      if (findAndMount()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const notify = useCallback(async (applicationId: string, eventType: "response_interested" | "response_declined") => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      await fetch("/api/dentaljobs/notify", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, eventType }),
      });
    } catch {
      // The DentalJobs action should still succeed if notification delivery fails.
    }
  }, []);

  const load = useCallback(async (targetUserId?: string | null) => {
    const professionalId = targetUserId || userId;
    if (!professionalId) return;
    setError("");

    try {
      const [listingResult, connectionResult, profileResult] = await Promise.all([
        supabase
          .from("job_listings")
          .select("id,profession,employment_type,city,province,days_per_week,pay_min,pay_max,schedule,description,status,expires_at,created_at")
          .eq("professional_id", professionalId)
          .eq("listing_type", "professional_available")
          .order("created_at", { ascending: false }),
        supabase
          .from("job_applications")
          .select("id,listing_id,office_id,initiator_role,status,created_at,office_interest_snapshot,professional_hidden_at,deleted_at")
          .eq("professional_id", professionalId)
          .is("deleted_at", null)
          .is("professional_hidden_at", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("latitude,longitude")
          .eq("id", professionalId)
          .maybeSingle(),
      ]);

      if (listingResult.error) throw listingResult.error;
      if (connectionResult.error) throw connectionResult.error;

      const mappedConnections = (connectionResult.data || []).map((row: any) => ({
        id: row.id,
        listingId: row.listing_id,
        officeId: row.office_id,
        initiatorRole: row.initiator_role,
        status: row.status,
        createdAt: row.created_at,
        officeInterestSnapshot: row.office_interest_snapshot || null,
      })) as Connection[];

      setJobs((listingResult.data || []) as ProfessionalJobListing[]);
      setConnections(mappedConnections);
      if (!profileResult.error && profileResult.data) {
        setProfessionalCoords({
          latitude: profileResult.data.latitude == null ? null : Number(profileResult.data.latitude),
          longitude: profileResult.data.longitude == null ? null : Number(profileResult.data.longitude),
        });
      }

      const officeIds = Array.from(new Set(mappedConnections.map((item) => item.officeId).filter(Boolean)));
      if (!officeIds.length) {
        setOfficeProfiles({});
        return;
      }

      const { data: offices, error: officesError } = await supabase
        .from("offices")
        .select("id,city,province,software,languages,parking_info,latitude,longitude")
        .in("id", officeIds);

      if (!officesError && offices) {
        const next: Record<string, SafeOfficeProfile> = {};
        for (const office of offices as any[]) {
          next[String(office.id)] = {
            id: String(office.id),
            city: office.city || null,
            province: office.province || null,
            software: Array.isArray(office.software) ? office.software : [],
            languages: Array.isArray(office.languages) ? office.languages : [],
            parking_info: office.parking_info || null,
            latitude: office.latitude == null ? null : Number(office.latitude),
            longitude: office.longitude == null ? null : Number(office.longitude),
          };
        }
        setOfficeProfiles(next);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load your DentalJobs postings.");
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setUserId(user.id);
      await load(user.id);
    })();
    return () => { cancelled = true; };
  }, [load]);

  useEffect(() => {
    if (!userId) return;
    const refresh = () => void load(userId);
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, 4000);
    const channel = supabase
      .channel(`professional-postings-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "job_listings" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "job_applications" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "offices" }, refresh)
      .subscribe();

    return () => {
      window.removeEventListener("focus", refresh);
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [userId, load]);

  const updateJob = async (job: ProfessionalJobListing, action: "pause" | "resume" | "renew" | "delete") => {
    setBusyId(job.id);
    setError("");
    try {
      if (action === "delete") {
        if (!window.confirm("Delete this DentalJobs posting? This cannot be undone.")) return;
        const { error: deleteError } = await supabase.from("job_listings").delete().eq("id", job.id);
        if (deleteError) throw deleteError;
      } else {
        const values: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (action === "pause") values.status = "paused";
        if (action === "resume") values.status = "active";
        if (action === "renew") {
          values.status = "active";
          values.expires_at = new Date(Date.now() + 14 * 86400000).toISOString();
        }
        const { error: updateError } = await supabase.from("job_listings").update(values).eq("id", job.id);
        if (updateError) throw updateError;
      }
      setManageJob(null);
      await load(userId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update this posting.");
    } finally {
      setBusyId(null);
    }
  };

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editJob) return;
    const form = new FormData(event.currentTarget);
    setBusyId(editJob.id);
    setError("");
    try {
      const { error: updateError } = await supabase.from("job_listings").update({
        profession: String(form.get("profession") || ""),
        employment_type: String(form.get("employment_type") || ""),
        city: String(form.get("city") || "").trim(),
        province: String(form.get("province") || "").trim(),
        days_per_week: String(form.get("days_per_week") || "").trim() || null,
        pay_min: form.get("pay_min") ? Number(form.get("pay_min")) : null,
        pay_max: form.get("pay_max") ? Number(form.get("pay_max")) : null,
        schedule: String(form.get("schedule") || "").trim() || null,
        description: String(form.get("description") || "").trim(),
        updated_at: new Date().toISOString(),
      }).eq("id", editJob.id);
      if (updateError) throw updateError;
      setEditJob(null);
      await load(userId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save this posting.");
    } finally {
      setBusyId(null);
    }
  };

  const respond = async (connection: Connection, action: "interested" | "declined") => {
    setBusyId(connection.id);
    setError("");
    try {
      const { error: responseError } = await supabase.from("job_applications").update({
        status: action,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", connection.id);
      if (responseError) throw responseError;
      void notify(connection.id, action === "interested" ? "response_interested" : "response_declined");
      await load(userId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update this response.");
    } finally {
      setBusyId(null);
    }
  };

  const removeConnection = async (connection: Connection) => {
    if (!window.confirm("Remove this office response from your view?")) return;
    setBusyId(connection.id);
    try {
      const { error: removeError } = await supabase.from("job_applications").update({
        professional_hidden_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", connection.id);
      if (removeError) throw removeError;
      await load(userId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove this response.");
    } finally {
      setBusyId(null);
    }
  };

  const content = useMemo(() => (
    <div id="my-professional-dentaljobs" style={{ width: "100%", height: "100%" }}>
      <div style={{ border: "2px solid #01A32E", borderRadius: 18, background: "#fff", padding: 14, height: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#009b2f", fontWeight: 900, fontSize: 11, textTransform: "uppercase" }}>Professional Postings</div>
            <div style={{ color: "#002757", fontWeight: 900, fontSize: 26 }}>My DentalJobs</div>
            <div style={{ color: "#455f89", fontWeight: 600, fontSize: 13 }}>Manage your postings and review each office who responds.</div>
          </div>
          <div style={{ border: "1px solid #bfe9ca", background: "#f2fff6", color: "#009b2f", fontWeight: 900, borderRadius: 999, padding: "6px 12px", fontSize: 13 }}>
            {jobs.length} posting{jobs.length === 1 ? "" : "s"}
          </div>
        </div>

        {error && <div style={{ marginTop: 10, background: "#fff1f2", color: "#be123c", padding: 8, borderRadius: 8, fontSize: 13, fontWeight: 700 }}>{error}</div>}

        <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
          {jobs.length === 0 ? (
            <div style={{ border: "1px dashed #cbd5e1", background: "#f8fafc", borderRadius: 12, padding: 18, textAlign: "center", color: "#64748b", fontSize: 13, fontWeight: 700 }}>
              You have no DentalJobs postings yet.
            </div>
          ) : jobs.map((job) => {
            const daysLeft = Math.max(0, Math.ceil((new Date(job.expires_at).getTime() - Date.now()) / 86400000));
            const active = job.status === "active" && daysLeft > 0;
            const displayStatus = job.status === "active" && daysLeft === 0 ? "expired" : job.status;
            const jobConnections = connections
              .filter((item) => item.listingId === job.id && item.status !== "declined" && item.status !== "withdrawn")
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const newCount = jobConnections.filter((item) => item.initiatorRole === "office" && item.status === "pending").length;

            return (
              <div key={job.id} style={{ border: "1px solid #b9dfc3", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
                <div style={{ background: "#f7fff9", padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    <span style={{ background: active ? "#01A32E" : "#eef2f7", color: active ? "#fff" : "#475569", borderRadius: 999, padding: "4px 9px", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{displayStatus}</span>
                    {active && <span style={{ color: "#455f89", fontSize: 12, fontWeight: 700 }}>{daysLeft} day{daysLeft === 1 ? "" : "s"} remaining</span>}
                    {newCount > 0 && <span style={{ background: "#ffe9ef", color: "#c81d4f", borderRadius: 999, padding: "4px 9px", fontSize: 10, fontWeight: 900 }}>{newCount} New</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 7 }}>
                    <div style={{ color: "#002757", fontSize: 20, fontWeight: 900 }}>{job.profession} — {job.employment_type}</div>
                    <span style={{ border: "1px solid #bfe9ca", background: "#f2fff6", color: "#009b2f", borderRadius: 999, padding: "4px 9px", fontSize: 11, fontWeight: 900 }}>{jobConnections.length} Interested</span>
                  </div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", color: "#526a90", fontSize: 12, fontWeight: 700, marginTop: 7 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><MapPin size={14} />{job.city}, {job.province}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><BriefcaseBusiness size={14} />{job.employment_type}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Clock3 size={14} />Posted {new Date(job.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", padding: "7px 10px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", background: "#f8fbff" }}>
                  <button onClick={() => setManageJob(job)} style={{ ...btn, border: 0, background: "#06499d", color: "white" }}><MoreVertical size={13} />Manage<ChevronDown size={12} /></button>
                  <Link href={`/jobs/${job.id}?returnTo=${encodeURIComponent("/dental-jobs")}`} style={{ ...btn, border: "1px solid #7793b9", background: "white", color: "#06499d", textDecoration: "none" }}><FileText size={13} />View Ad</Link>
                  <ShareListingButton listingId={job.id} compact />
                  <button onClick={() => setEditJob(job)} style={{ ...btn, border: "1px solid #7793b9", background: "white", color: "#06499d" }}><Pencil size={13} />Edit Posting</button>
                </div>

                <div style={{ padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", paddingBottom: 8, borderBottom: "1px solid #e2e8f0" }}>
                    <div style={{ color: "#002757", fontSize: 17, fontWeight: 900 }}>Interested Dental Offices ({jobConnections.length})</div>
                    <div style={{ color: "#002757", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>Sort by: Newest First <ChevronDown size={14} /></div>
                  </div>

                  {jobConnections.length === 0 ? (
                    <div style={{ marginTop: 9, border: "1px dashed #cbd5e1", background: "#f8fafc", borderRadius: 10, padding: 14, textAlign: "center", color: "#64748b", fontSize: 12, fontWeight: 700 }}>
                      When a dental office selects I’m Interested, its anonymous office card will appear here.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 8, marginTop: 9 }}>
                      {jobConnections.map((connection) => {
                        const profile = officeProfiles[connection.officeId];
                        const snapshot = connection.officeInterestSnapshot || {};
                        const status = connectionStatus(connection);
                        const city = profile?.city || snapshot.city || "Location not specified";
                        const province = profile?.province || snapshot.province || "";
                        const location = [city, province].filter(Boolean).join(", ");
                        const distance = kmBetween(professionalCoords.latitude, professionalCoords.longitude, profile?.latitude, profile?.longitude);

                        return (
                          <div key={connection.id} style={{ border: "1px solid #dbe4ef", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
                            <div style={{ padding: 12 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#002757", fontSize: 17, fontWeight: 900 }}><Building2 size={18} />Dental Office</div>
                                <span style={{ borderRadius: 999, padding: "3px 8px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", background: status === "New" ? "#dcecff" : status === "Mutual Interest" ? "#eaf8ee" : "#fff7ed", color: status === "New" ? "#0869d7" : status === "Mutual Interest" ? "#017f27" : "#b45309" }}>{status}</span>
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8, marginTop: 10 }}>
                                <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, background: "#f8fafc" }}>
                                  <div style={{ display: "flex", gap: 6, alignItems: "center", color: "#64748b", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}><MapPin size={13} />Location</div>
                                  <div style={{ marginTop: 4, color: "#002757", fontSize: 13, fontWeight: 800 }}>{location}</div>
                                </div>
                                <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, background: "#f8fafc" }}>
                                  <div style={{ display: "flex", gap: 6, alignItems: "center", color: "#64748b", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}><Navigation size={13} />Distance</div>
                                  <div style={{ marginTop: 4, color: "#002757", fontSize: 13, fontWeight: 800 }}>{distance == null ? "Not available" : `${distance < 10 ? distance.toFixed(1) : Math.round(distance)} km away`}</div>
                                </div>
                                <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, background: "#f8fafc" }}>
                                  <div style={{ display: "flex", gap: 6, alignItems: "center", color: "#64748b", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}><Monitor size={13} />Dental Software</div>
                                  <div style={{ marginTop: 4, color: "#002757", fontSize: 13, fontWeight: 800 }}>{displayList(profile?.software)}</div>
                                </div>
                                <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, background: "#f8fafc" }}>
                                  <div style={{ display: "flex", gap: 6, alignItems: "center", color: "#64748b", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}><Languages size={13} />Languages</div>
                                  <div style={{ marginTop: 4, color: "#002757", fontSize: 13, fontWeight: 800 }}>{displayList(profile?.languages)}</div>
                                </div>
                                <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, background: "#f8fafc", gridColumn: "1 / -1" }}>
                                  <div style={{ display: "flex", gap: 6, alignItems: "center", color: "#64748b", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}><Car size={13} />Parking</div>
                                  <div style={{ marginTop: 4, color: "#002757", fontSize: 13, fontWeight: 800 }}>{profile?.parking_info?.trim() || "Not provided"}</div>
                                </div>
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "8px 10px", borderTop: "1px solid #e2e8f0", background: "#f8fbff" }}>
                              {connection.initiatorRole === "office" && connection.status === "pending" && <>
                                <button disabled={busyId === connection.id} onClick={() => void respond(connection, "interested")} style={{ ...btn, border: 0, background: "#01A32E", color: "#fff", opacity: busyId === connection.id ? .6 : 1 }}><Check size={13} />I’m Interested</button>
                                <button disabled={busyId === connection.id} onClick={() => void respond(connection, "declined")} style={{ ...btn, border: "1px solid #cbd5e1", background: "#fff", color: "#475569", opacity: busyId === connection.id ? .6 : 1 }}><Ban size={13} />Not Interested</button>
                              </>}
                              <button disabled={busyId === connection.id} onClick={() => void removeConnection(connection)} style={{ ...btn, border: "1px solid #dbe4ef", background: "#fff", color: "#64748b", marginLeft: "auto", opacity: busyId === connection.id ? .6 : 1 }}><Trash2 size={13} />Remove</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {manageJob && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#00162f]/55 p-4" onClick={() => setManageJob(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#017f27]">Professional Posting</p><h3 className="mt-1 text-xl font-black text-[#002757]">{manageJob.profession}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{manageJob.city}, {manageJob.province}</p></div>
              <button onClick={() => setManageJob(null)} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500"><X size={16} /></button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={() => { setEditJob(manageJob); setManageJob(null); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#7793b9] px-4 py-3 text-sm font-black text-[#06499d]"><Pencil size={16} />Edit</button>
              {manageJob.status === "paused" ?
                <button disabled={busyId === manageJob.id} onClick={() => void updateJob(manageJob, "resume")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#bfe9ca] bg-[#f2fff6] px-4 py-3 text-sm font-black text-[#017f27]"><Play size={16} />Resume</button> :
                <button disabled={busyId === manageJob.id} onClick={() => void updateJob(manageJob, "pause")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700"><Pause size={16} />Pause</button>}
              <button disabled={busyId === manageJob.id} onClick={() => void updateJob(manageJob, "renew")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#bfe9ca] bg-[#f2fff6] px-4 py-3 text-sm font-black text-[#017f27]"><RefreshCw size={16} />Renew 14 Days</button>
              <button disabled={busyId === manageJob.id} onClick={() => void updateJob(manageJob, "delete")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700"><Trash2 size={16} />Delete</button>
            </div>
          </div>
        </div>
      )}

      {editJob && (
        <div className="fixed inset-0 z-[125] overflow-y-auto bg-[#00162f]/60 p-4" onClick={() => setEditJob(null)}>
          <form onSubmit={saveEdit} className="mx-auto my-6 w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#017f27]">Edit Posting</p><h3 className="mt-1 text-xl font-black text-[#002757]">Professional DentalJobs Posting</h3></div>
              <button type="button" onClick={() => setEditJob(null)} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500"><X size={16} /></button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-black text-slate-600">Profession<input name="profession" defaultValue={editJob.profession} required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
              <label className="text-xs font-black text-slate-600">Employment Type<input name="employment_type" defaultValue={editJob.employment_type} required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
              <label className="text-xs font-black text-slate-600">City<input name="city" defaultValue={editJob.city} required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
              <label className="text-xs font-black text-slate-600">Province<input name="province" defaultValue={editJob.province} required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
              <label className="text-xs font-black text-slate-600">Days / Week<input name="days_per_week" defaultValue={editJob.days_per_week || ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
              <label className="text-xs font-black text-slate-600">Schedule<input name="schedule" defaultValue={editJob.schedule || ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
              <label className="text-xs font-black text-slate-600">Pay From<input name="pay_min" type="number" defaultValue={editJob.pay_min ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
              <label className="text-xs font-black text-slate-600">Pay To<input name="pay_max" type="number" defaultValue={editJob.pay_max ?? ""} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
              <label className="text-xs font-black text-slate-600 sm:col-span-2">Description<textarea name="description" rows={5} defaultValue={editJob.description} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
            </div>
            <button disabled={busyId === editJob.id} className="mt-5 w-full rounded-xl bg-[#01A32E] px-4 py-3 text-sm font-black text-white disabled:opacity-60">Save Changes</button>
          </form>
        </div>
      )}
    </div>
  ), [jobs, connections, officeProfiles, professionalCoords, error, busyId, manageJob, editJob, userId]);

  if (!host) return null;
  return createPortal(content, host);
}
