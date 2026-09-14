"use client";

import Link from "next/link";
import { Ban, BriefcaseBusiness, ChevronDown, Clock3, CreditCard, Download, FileText, Handshake, Languages, MapPin, MessageCircle, MoreVertical, Navigation, Pencil, Trash2 } from "lucide-react";
import { ShareListingButton } from "@/components/ShareListingButton";

type OfficeJobListing = {
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

type CandidatePreview = {
  profession?: string | null;
  safeCity?: string | null;
  safeProvince?: string | null;
  yearsExperience?: number | null;
  summary?: string | null;
  skills?: string[];
  software?: string[];
  certifications?: string[];
  languages?: string[];
  distanceKm?: number | null;
};

type JobConnection = any;

type Props = {
  jobs: OfficeJobListing[];
  connections: JobConnection[];
  manageError: string;
  connectionError: string;
  unlockError: string;
  unlockBusyId: string | null;
  connectionDeletingId: string | null;
  connectionBusy: boolean;
  isCandidateUnlocked: (connection: JobConnection) => boolean;
  onManage: (job: OfficeJobListing) => void;
  onEdit: (job: OfficeJobListing) => void;
  onSetupBillingCard: () => void;
  onUpdateConnection: (connection: JobConnection, action: "interested" | "declined" | "withdrawn") => void;
  onStartMatch: (connection: JobConnection) => void;
  onDownloadResume: (connection: JobConnection) => void;
  onViewCandidate: (connection: JobConnection) => void;
  onOpenChat: (connection: JobConnection) => void;
  onDeleteConnection: (connection: JobConnection) => void;
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

const candidateActionBase: React.CSSProperties = {
  minHeight: 40,
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  padding: "0 14px",
  boxSizing: "border-box",
};

const skillsFor = (p?: CandidatePreview | null) =>
  Array.from(new Set([...(p?.skills || []), ...(p?.software || []), ...(p?.certifications || [])].filter(Boolean))).slice(0, 5);

const statusFor = (i: JobConnection, unlocked: boolean) =>
  unlocked
    ? "Connected"
    : i.initiatorRole === "office" && i.status === "interested"
      ? "Mutual Interest"
      : i.initiatorRole === "professional" && i.status === "pending"
        ? "New"
        : i.initiatorRole === "office" && i.status === "pending"
          ? "Awaiting Professional"
          : "Interested";

export function OfficePostingsCard({
  jobs,
  connections,
  manageError,
  connectionError,
  unlockError,
  unlockBusyId,
  connectionDeletingId,
  connectionBusy,
  isCandidateUnlocked,
  onManage,
  onEdit,
  onSetupBillingCard,
  onUpdateConnection,
  onStartMatch,
  onDownloadResume,
  onViewCandidate,
  onOpenChat,
  onDeleteConnection,
}: Props) {
  return (
    <div id="my-dentaljobs" style={{ width: "100%", marginTop: 14 }}>
      <div style={{ border: "2px solid #01A32E", borderRadius: 18, background: "#fff", padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#009b2f", fontWeight: 900, fontSize: 11, textTransform: "uppercase" }}>Office Postings</div>
            <div style={{ color: "#002757", fontWeight: 900, fontSize: 26 }}>My DentalJobs</div>
            <div style={{ color: "#455f89", fontWeight: 600, fontSize: 13 }}>Manage your postings and review each professional who responds.</div>
          </div>
          <div style={{ border: "1px solid #bfe9ca", background: "#f2fff6", color: "#009b2f", fontWeight: 900, borderRadius: 999, padding: "6px 12px", fontSize: 13 }}>
            {jobs.length} posting{jobs.length === 1 ? "" : "s"}
          </div>
        </div>

        {(manageError || connectionError || unlockError) && (
          <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
            {manageError && <div style={{ background: "#fff1f2", color: "#be123c", padding: 8, borderRadius: 8, fontSize: 13, fontWeight: 700 }}>{manageError}</div>}
            {connectionError && <div style={{ background: "#fff1f2", color: "#be123c", padding: 8, borderRadius: 8, fontSize: 13, fontWeight: 700 }}>{connectionError}</div>}
            {unlockError && (
              <div style={{ background: "#fff1f2", color: "#be123c", padding: 8, borderRadius: 8, fontSize: 13, fontWeight: 700, display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
                <span>{unlockError}</span>
                {unlockError.toLowerCase().includes("credit card") && (
                  <button onClick={onSetupBillingCard} style={{ ...btn, border: 0, background: "#002757", color: "#fff" }}>
                    <CreditCard size={13} /> Add Card
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
          {jobs.length === 0 ? (
            <div style={{ border: "1px dashed #cbd5e1", background: "#f8fafc", borderRadius: 12, padding: 18, textAlign: "center", color: "#64748b", fontSize: 13, fontWeight: 700 }}>
              You have no DentalJobs postings yet.
            </div>
          ) : (
            jobs.map((job) => {
              const daysLeft = Math.max(0, Math.ceil((new Date(job.expires_at).getTime() - Date.now()) / 86400000));
              const active = job.status === "active" && daysLeft > 0;
              const displayStatus = job.status === "active" && daysLeft === 0 ? "expired" : job.status;
              const jobConnections = connections
                .filter((item) => (item.listingId === job.id || item.sourceOfficeListingId === job.id) && item.status !== "declined" && item.status !== "withdrawn")
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              const newCount = jobConnections.filter((item) => item.initiatorRole === "professional" && item.status === "pending" && !isCandidateUnlocked(item)).length;

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
                    <button onClick={() => onManage(job)} style={{ ...btn, border: 0, background: "#06499d", color: "white" }}><MoreVertical size={13} />Manage<ChevronDown size={12} /></button>
                    <Link href={`/jobs/${job.id}?returnTo=${encodeURIComponent("/dental-jobs")}`} style={{ ...btn, border: "1px solid #7793b9", background: "white", color: "#06499d", textDecoration: "none" }}><FileText size={13} />View Ad</Link>
                    <ShareListingButton listingId={job.id} compact />
                    <button onClick={() => onEdit(job)} style={{ ...btn, border: "1px solid #7793b9", background: "white", color: "#06499d" }}><Pencil size={13} />Edit Posting</button>
                  </div>

                  <div style={{ padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", paddingBottom: 8, borderBottom: "1px solid #e2e8f0" }}>
                      <div style={{ color: "#002757", fontSize: 17, fontWeight: 900 }}>Interested Dental Professionals ({jobConnections.length})</div>
                      <div style={{ color: "#002757", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>Sort by: Newest First <ChevronDown size={14} /></div>
                    </div>

                    {jobConnections.length === 0 ? (
                      <div style={{ marginTop: 9, border: "1px dashed #cbd5e1", background: "#f8fafc", borderRadius: 10, padding: 14, textAlign: "center", color: "#64748b", fontSize: 12, fontWeight: 700 }}>
                        When a professional selects I’m Interested or Apply to this Position, their card will appear here.
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: 8, marginTop: 9 }}>
                        {jobConnections.map((item) => {
                          const preview = item.candidatePreview as CandidatePreview | null | undefined;
                          const unlocked = isCandidateUnlocked(item);
                          const profession = preview?.profession || item.profession || "Dental Professional";
                          const location = [preview?.safeCity || item.city, preview?.safeProvince || item.province].filter(Boolean).join(", ") || "Location not specified";
                          const skills = skillsFor(preview);
                          const languages = (preview?.languages || []).filter(Boolean);
                          const distance = preview?.distanceKm;
                          const status = statusFor(item, unlocked);
                          const resolvedApplicationId = String(item.applicationId || item.id || "");
                          const matchItem = resolvedApplicationId && resolvedApplicationId !== String(item.id)
                            ? { ...item, id: resolvedApplicationId }
                            : item;

                          return (
                            <div key={item.id} style={{ display: "flex", flexWrap: "wrap", border: "1px solid #dbe4ef", borderRadius: 12, overflow: "hidden" }}>
                              <div style={{ flex: "1 1 620px", padding: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                                  <div style={{ color: "#002757", fontSize: 17, fontWeight: 900 }}>{profession}</div>
                                  <span style={{ borderRadius: 999, padding: "3px 8px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", background: status === "New" ? "#dcecff" : status === "Connected" || status === "Mutual Interest" ? "#eaf8ee" : "#fff7ed", color: status === "New" ? "#0869d7" : status === "Connected" || status === "Mutual Interest" ? "#017f27" : "#b45309" }}>{status}</span>
                                </div>

                                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 6, color: "#526a90", fontSize: 12, fontWeight: 700 }}>
                                  <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><MapPin size={14} />{location}</span>
                                  {distance != null && <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><Navigation size={14} />{distance < 10 ? distance.toFixed(1) : Math.round(distance)} km away</span>}
                                  {preview?.yearsExperience != null && <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><BriefcaseBusiness size={14} />{preview.yearsExperience} year{preview.yearsExperience === 1 ? "" : "s"} experience</span>}
                                  {languages.length > 0 && <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><Languages size={14} />{languages.join(", ")}</span>}
                                </div>

                                {skills.length > 0 && (
                                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
                                    {skills.map((skill) => <span key={skill} style={{ border: "1px solid #d9e2ec", background: "#f7f9fc", color: "#455f89", borderRadius: 999, padding: "4px 8px", fontSize: 11, fontWeight: 700 }}>{skill}</span>)}
                                  </div>
                                )}
                                {preview?.summary && <div style={{ color: "#455f89", fontSize: 12, lineHeight: 1.4, marginTop: 8 }}>{preview.summary}</div>}
                              </div>

                              <div style={{ flex: "0 1 290px", minWidth: 250, borderLeft: "1px solid #e2e8f0", padding: 10, display: "flex", flexDirection: "column", justifyContent: "center", gap: 7, background: "#fbfdff" }}>
                                {unlocked ? (
                                  <>
                                    <button disabled={unlockBusyId === item.id} onClick={() => onDownloadResume(item)} style={{ ...candidateActionBase, border: 0, background: "#EA4335", color: "white" }}><Download size={15} /> Résumé / CV</button>
                                    <button onClick={() => onViewCandidate(item)} style={{ ...candidateActionBase, border: "1px solid #bfe9ca", background: "#eaf8ee", color: "#017f27" }}><FileText size={15} /> View Candidate</button>
                                    <button onClick={() => onOpenChat(item)} style={{ ...candidateActionBase, border: 0, background: "#002757", color: "white" }}><MessageCircle size={15} /> Message</button>
                                    <button disabled={connectionDeletingId === item.id} onClick={() => onDeleteConnection(item)} style={{ ...candidateActionBase, border: "1px solid #fecdd3", background: "white", color: "#e11d48" }}><Trash2 size={15} /> Delete</button>
                                  </>
                                ) : item.initiatorRole === "professional" && item.status === "pending" ? (
                                  <>
                                    <button disabled={connectionBusy || unlockBusyId === item.id} onClick={() => onUpdateConnection(item, "declined")} style={{ ...candidateActionBase, border: "1.5px solid #f3a6ad", background: "#fff7f8", color: "#c6283d", boxShadow: "0 1px 2px rgba(190,24,60,.08)" }}><Ban size={15} /> Not Interested</button>
                                    <button disabled={unlockBusyId === resolvedApplicationId} onClick={() => onStartMatch(matchItem)} style={{ ...candidateActionBase, minHeight: 44, border: "1px solid #018d29", background: "linear-gradient(180deg,#10b63b 0%,#019c2f 100%)", color: "white", boxShadow: "0 5px 12px rgba(1,163,46,.22)", letterSpacing: ".02em" }}><Handshake size={16} />{unlockBusyId === resolvedApplicationId ? "Matching…" : "LET’S MATCH"}</button>
                                    <div style={{ textAlign: "center", color: "#65758f", fontSize: 10, lineHeight: 1.35, padding: "0 8px" }}>Contact details remain private until a match is made.</div>
                                  </>
                                ) : item.initiatorRole === "office" && item.status === "interested" ? (
                                  <>
                                    <button disabled={unlockBusyId === resolvedApplicationId} onClick={() => onStartMatch(matchItem)} style={{ ...candidateActionBase, minHeight: 44, border: "1px solid #018d29", background: "linear-gradient(180deg,#10b63b 0%,#019c2f 100%)", color: "white", boxShadow: "0 5px 12px rgba(1,163,46,.22)", letterSpacing: ".02em" }}><Handshake size={16} />{unlockBusyId === resolvedApplicationId ? "Matching…" : "LET’S MATCH"}</button>
                                    <div style={{ textAlign: "center", color: "#65758f", fontSize: 10, lineHeight: 1.35 }}>Mutual interest confirmed. LET’S MATCH completes the paid connection.</div>
                                  </>
                                ) : (
                                  <div style={{ background: "#fff7ed", color: "#b45309", borderRadius: 7, padding: 8, textAlign: "center", fontSize: 11, fontWeight: 800 }}>Awaiting professional response.</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}