"use client";

import Link from "next/link";
import {
  ArrowRight,
  Ban,
  BriefcaseBusiness,
  ChevronDown,
  Clock3,
  CreditCard,
  Download,
  FileText,
  Handshake,
  MapPin,
  MessageCircle,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
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

function skillsFor(preview?: CandidatePreview | null) {
  return Array.from(
    new Set([
      ...(preview?.skills || []),
      ...(preview?.software || []),
      ...(preview?.certifications || []),
    ].filter(Boolean)),
  ).slice(0, 5);
}

function candidateStatus(item: JobConnection, unlocked: boolean) {
  if (unlocked) return "Connected";
  if (item.initiatorRole === "office" && item.status === "interested") return "Mutual Interest";
  if (item.initiatorRole === "professional" && item.status === "pending") return "New";
  if (item.initiatorRole === "office" && item.status === "pending") return "Awaiting Professional";
  return "Interested";
}

const smallButton: React.CSSProperties = {
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
    <div id="my-dentaljobs" style={{ width: "100%", display: "block", marginTop: 14 }}>
      <div
        style={{
          width: "100%",
          display: "block",
          border: "2px solid #01A32E",
          borderRadius: 18,
          background: "#fff",
          padding: 14,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#009b2f", fontWeight: 900, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase" }}>Office Postings</div>
            <div style={{ color: "#002757", fontWeight: 900, fontSize: 26, lineHeight: 1.05, marginTop: 2 }}>My DentalJobs</div>
            <div style={{ color: "#455f89", fontWeight: 600, fontSize: 13, marginTop: 3 }}>Manage your postings and review each professional who responds.</div>
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
              <div style={{ background: "#fff1f2", color: "#be123c", padding: 8, borderRadius: 8, fontSize: 13, fontWeight: 700, display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                <span>{unlockError}</span>
                {unlockError.toLowerCase().includes("credit card") && (
                  <button type="button" onClick={onSetupBillingCard} style={{ ...smallButton, border: 0, background: "#002757", color: "#fff" }}>
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
          ) : jobs.map((job) => {
            const daysLeft = Math.max(0, Math.ceil((new Date(job.expires_at).getTime() - Date.now()) / 86400000));
            const active = job.status === "active" && daysLeft > 0;
            const displayStatus = job.status === "active" && daysLeft === 0 ? "expired" : job.status;
            const jobConnections = connections
              .filter((item) => (item.listingId === job.id || item.sourceOfficeListingId === job.id) && item.status !== "declined" && item.status !== "withdrawn")
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const newCount = jobConnections.filter((item) => item.initiatorRole === "professional" && item.status === "pending" && !isCandidateUnlocked(item)).length;

            return (
              <div key={job.id} style={{ width: "100%", display: "block", border: "1px solid #b9dfc3", borderRadius: 14, overflow: "hidden", background: "#fff", boxSizing: "border-box" }}>
                <div style={{ display: "flex", alignItems: "stretch", justifyContent: "space-between", gap: 0, flexWrap: "wrap", background: "#f7fff9" }}>
                  <div style={{ flex: "1 1 650px", padding: "12px 14px", minWidth: 0, boxSizing: "border-box" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      <span style={{ background: active ? "#01A32E" : "#eef2f7", color: active ? "#fff" : "#475569", borderRadius: 999, padding: "4px 9px", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{displayStatus}</span>
                      {active && <span style={{ color: "#455f89", fontSize: 12, fontWeight: 700 }}>{daysLeft} day{daysLeft === 1 ? "" : "s"} remaining</span>}
                      {newCount > 0 && <span style={{ background: "#ffe9ef", color: "#c81d4f", borderRadius: 999, padding: "4px 9px", fontSize: 10, fontWeight: 900 }}>{newCount} New</span>}
                    </div>
                    <div style={{ color: "#002757", fontSize: 20, fontWeight: 900, lineHeight: 1.15, marginTop: 7 }}>{job.profession} — {job.employment_type}</div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", color: "#526a90", fontSize: 12, fontWeight: 700, marginTop: 7 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><MapPin size={14} />{job.city}, {job.province}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><BriefcaseBusiness size={14} />{job.employment_type}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Clock3 size={14} />Posted {new Date(job.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>
                  <div style={{ flex: "0 0 150px", minHeight: 82, display: "flex", alignItems: "center", justifyContent: "center", borderLeft: "1px solid #e2e8f0", background: "#fff", boxSizing: "border-box" }}>
                    <div style={{ textAlign: "center" }}><div style={{ color: "#01A32E", fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{jobConnections.length}</div><div style={{ color: "#009b2f", fontSize: 13, fontWeight: 800, marginTop: 3 }}>Interested</div></div>
                  </div>
                </div>

                <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", padding: "7px 10px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", background: "#f8fbff", boxSizing: "border-box" }}>
                  <button type="button" onClick={() => onManage(job)} style={{ ...smallButton, border: 0, background: "#06499d", color: "white" }}><MoreVertical size={13} /> Manage <ChevronDown size={12} /></button>
                  <Link href={`/jobs/${job.id}?returnTo=${encodeURIComponent("/dental-jobs")}`} style={{ ...smallButton, border: "1px solid #7793b9", background: "white", color: "#06499d", textDecoration: "none" }}><FileText size={13} /> View Ad</Link>
                  <ShareListingButton listingId={job.id} compact />
                  <button type="button" onClick={() => onEdit(job)} style={{ ...smallButton, border: "1px solid #7793b9", background: "white", color: "#06499d" }}><Pencil size={13} /> Edit Posting</button>
                </div>

                <div style={{ display: "block", width: "100%", padding: 12, boxSizing: "border-box", background: "#fff" }}>
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
                        const status = candidateStatus(item, unlocked);

                        return (
                          <div key={item.id} style={{ width: "100%", display: "flex", alignItems: "stretch", flexWrap: "wrap", border: "1px solid #dbe4ef", borderRadius: 12, overflow: "hidden", boxSizing: "border-box", background: "#fff" }}>
                            <div style={{ flex: "1 1 620px", minWidth: 0, padding: 12, boxSizing: "border-box" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                                <div style={{ color: "#002757", fontSize: 17, fontWeight: 900 }}>{profession}</div>
                                <span style={{ borderRadius: 999, padding: "3px 8px", fontSize: 9, fontWeight: 900, textTransform: "uppercase", background: status === "New" ? "#dcecff" : status === "Connected" || status === "Mutual Interest" ? "#eaf8ee" : "#fff7ed", color: status === "New" ? "#0869d7" : status === "Connected" || status === "Mutual Interest" ? "#017f27" : "#b45309" }}>{status}</span>
                              </div>
                              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 6, color: "#526a90", fontSize: 12, fontWeight: 700 }}>
                                <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><MapPin size={14} />{location}</span>
                                {preview?.yearsExperience != null && <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><BriefcaseBusiness size={14} />{preview.yearsExperience} year{preview.yearsExperience === 1 ? "" : "s"} experience</span>}
                              </div>
                              {skills.length > 0 && <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>{skills.map((skill) => <span key={skill} style={{ border: "1px solid #d9e2ec", background: "#f7f9fc", color: "#455f89", borderRadius: 999, padding: "4px 8px", fontSize: 11, fontWeight: 700 }}>{skill}</span>)}</div>}
                              {preview?.summary && <div style={{ color: "#455f89", fontSize: 12, lineHeight: 1.4, marginTop: 8 }}>{preview.summary}</div>}
                              <button type="button" onClick={() => onViewCandidate(item)} style={{ marginTop: 8, border: 0, background: "transparent", color: "#0869d7", fontSize: 12, fontWeight: 900, padding: 0, display: "inline-flex", alignItems: "center", gap: 5 }}>
                                View full profile <ArrowRight size={14} />
                              </button>
                            </div>

                            <div style={{ flex: "0 1 270px", minWidth: 240, borderLeft: "1px solid #e2e8f0", padding: 10, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6, background: "#fbfdff" }}>
                              {unlocked ? (
                                <>
                                  <button type="button" disabled={unlockBusyId === item.id} onClick={() => onDownloadResume(item)} style={{ minHeight: 34, border: 0, borderRadius: 7, background: "#EA4335", color: "white", fontSize: 12, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Download size={14} /> Résumé / CV</button>
                                  <button type="button" onClick={() => onViewCandidate(item)} style={{ minHeight: 34, border: "1px solid #bfe9ca", borderRadius: 7, background: "#eaf8ee", color: "#017f27", fontSize: 12, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}><FileText size={14} /> View Candidate</button>
                                  <button type="button" onClick={() => onOpenChat(item)} style={{ minHeight: 34, border: 0, borderRadius: 7, background: "#002757", color: "white", fontSize: 12, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}><MessageCircle size={14} /> Message</button>
                                  <button type="button" disabled={connectionDeletingId === item.id} onClick={() => onDeleteConnection(item)} style={{ minHeight: 34, border: "1px solid #fecdd3", borderRadius: 7, background: "white", color: "#e11d48", fontSize: 12, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Trash2 size={14} /> Delete</button>
                                </>
                              ) : item.initiatorRole === "professional" && item.status === "pending" ? (
                                <>
                                  <button type="button" disabled={connectionBusy || unlockBusyId === item.id} onClick={() => onUpdateConnection(item, "declined")} style={{ minHeight: 36, border: "2px solid #ef4444", borderRadius: 7, background: "white", color: "#dc2626", fontSize: 12, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Ban size={14} /> Not Interested</button>
                                  <button type="button" disabled={unlockBusyId === item.id} onClick={() => onStartMatch(item)} style={{ minHeight: 36, border: 0, borderRadius: 7, background: "#01A32E", color: "white", fontSize: 12, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Handshake size={14} />{unlockBusyId === item.id ? "Matching…" : "LET’S MATCH"}</button>
                                  <div style={{ textAlign: "center", color: "#526a90", fontSize: 10, lineHeight: 1.35 }}>Your contact details remain private until a match is made.</div>
                                </>
                              ) : item.initiatorRole === "office" && item.status === "interested" ? (
                                <>
                                  <button type="button" disabled={unlockBusyId === item.id} onClick={() => onStartMatch(item)} style={{ minHeight: 36, border: 0, borderRadius: 7, background: "#01A32E", color: "white", fontSize: 12, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Handshake size={14} />{unlockBusyId === item.id ? "Matching…" : "LET’S MATCH"}</button>
                                  <div style={{ textAlign: "center", color: "#526a90", fontSize: 10, lineHeight: 1.35 }}>Mutual interest confirmed. LET’S MATCH completes the paid connection.</div>
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
          })}
        </div>
      </div>
    </div>
  );
}
