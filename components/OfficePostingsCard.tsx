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
    <div id="my-dentaljobs" style={{ width: "100%", display: "block", marginTop: 24 }}>
      <div
        style={{
          width: "100%",
          display: "block",
          border: "2px solid #01A32E",
          borderRadius: 24,
          background: "#fff",
          padding: 24,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#009b2f", fontWeight: 900, fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase" }}>Office Postings</div>
            <div style={{ color: "#002757", fontWeight: 900, fontSize: 34, lineHeight: 1.1, marginTop: 4 }}>My DentalJobs</div>
            <div style={{ color: "#455f89", fontWeight: 600, marginTop: 6 }}>Manage your postings and review each professional who responds.</div>
          </div>
          <div style={{ border: "1px solid #bfe9ca", background: "#f2fff6", color: "#009b2f", fontWeight: 900, borderRadius: 999, padding: "10px 18px" }}>
            {jobs.length} posting{jobs.length === 1 ? "" : "s"}
          </div>
        </div>

        {(manageError || connectionError || unlockError) && (
          <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
            {manageError && <div style={{ background: "#fff1f2", color: "#be123c", padding: 12, borderRadius: 10, fontWeight: 700 }}>{manageError}</div>}
            {connectionError && <div style={{ background: "#fff1f2", color: "#be123c", padding: 12, borderRadius: 10, fontWeight: 700 }}>{connectionError}</div>}
            {unlockError && (
              <div style={{ background: "#fff1f2", color: "#be123c", padding: 12, borderRadius: 10, fontWeight: 700, display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                <span>{unlockError}</span>
                {unlockError.toLowerCase().includes("credit card") && (
                  <button type="button" onClick={onSetupBillingCard} style={{ border: 0, borderRadius: 8, background: "#002757", color: "#fff", padding: "8px 12px", fontWeight: 900, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <CreditCard size={14} /> Add Card
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "grid", gap: 24, marginTop: 24 }}>
          {jobs.length === 0 ? (
            <div style={{ border: "1px dashed #cbd5e1", background: "#f8fafc", borderRadius: 16, padding: 30, textAlign: "center", color: "#64748b", fontWeight: 700 }}>
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
              <div key={job.id} style={{ width: "100%", display: "block", border: "1px solid #b9dfc3", borderRadius: 18, overflow: "hidden", background: "#fff", boxSizing: "border-box" }}>
                <div style={{ display: "flex", alignItems: "stretch", justifyContent: "space-between", gap: 0, flexWrap: "wrap", background: "#f7fff9" }}>
                  <div style={{ flex: "1 1 650px", padding: 24, minWidth: 0, boxSizing: "border-box" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ background: active ? "#01A32E" : "#eef2f7", color: active ? "#fff" : "#475569", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>{displayStatus}</span>
                      {active && <span style={{ color: "#455f89", fontWeight: 700 }}>{daysLeft} day{daysLeft === 1 ? "" : "s"} remaining</span>}
                      {newCount > 0 && <span style={{ background: "#ffe9ef", color: "#c81d4f", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 900 }}>{newCount} New</span>}
                    </div>
                    <div style={{ color: "#002757", fontSize: 26, fontWeight: 900, marginTop: 12 }}>{job.profession} — {job.employment_type}</div>
                    <div style={{ display: "flex", gap: 22, flexWrap: "wrap", color: "#526a90", fontWeight: 700, marginTop: 12 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><MapPin size={18} />{job.city}, {job.province}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><BriefcaseBusiness size={18} />{job.employment_type}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Clock3 size={18} />Posted {new Date(job.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>
                  <div style={{ flex: "0 0 210px", minHeight: 130, display: "flex", alignItems: "center", justifyContent: "center", borderLeft: "1px solid #e2e8f0", background: "#fff", boxSizing: "border-box" }}>
                    <div style={{ textAlign: "center" }}><div style={{ color: "#01A32E", fontSize: 44, fontWeight: 900, lineHeight: 1 }}>{jobConnections.length}</div><div style={{ color: "#009b2f", fontSize: 18, fontWeight: 800, marginTop: 6 }}>Interested</div></div>
                  </div>
                </div>

                <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "12px 18px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", background: "#f8fbff", boxSizing: "border-box" }}>
                  <button type="button" onClick={() => onManage(job)} style={{ height: 38, border: 0, borderRadius: 8, background: "#06499d", color: "white", padding: "0 12px", fontWeight: 900, display: "inline-flex", alignItems: "center", gap: 6 }}><MoreVertical size={15} /> Manage <ChevronDown size={14} /></button>
                  <Link href={`/jobs/${job.id}?returnTo=${encodeURIComponent("/dental-jobs")}`} style={{ height: 38, border: "1px solid #7793b9", borderRadius: 8, background: "white", color: "#06499d", padding: "0 12px", fontWeight: 900, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}><FileText size={15} /> View Ad</Link>
                  <ShareListingButton listingId={job.id} compact />
                  <button type="button" onClick={() => onEdit(job)} style={{ height: 38, border: "1px solid #7793b9", borderRadius: 8, background: "white", color: "#06499d", padding: "0 12px", fontWeight: 900, display: "inline-flex", alignItems: "center", gap: 6 }}><Pencil size={15} /> Edit Posting</button>
                </div>

                <div style={{ display: "block", width: "100%", padding: 20, boxSizing: "border-box", background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", paddingBottom: 14, borderBottom: "1px solid #e2e8f0" }}>
                    <div style={{ color: "#002757", fontSize: 22, fontWeight: 900 }}>Interested Dental Professionals ({jobConnections.length})</div>
                    <div style={{ color: "#002757", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>Sort by: Newest First <ChevronDown size={17} /></div>
                  </div>

                  {jobConnections.length === 0 ? (
                    <div style={{ marginTop: 16, border: "1px dashed #cbd5e1", background: "#f8fafc", borderRadius: 14, padding: 26, textAlign: "center", color: "#64748b", fontWeight: 700 }}>
                      When a professional selects I’m Interested or Apply to this Position, their card will appear here.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
                      {jobConnections.map((item) => {
                        const preview = item.candidatePreview as CandidatePreview | null | undefined;
                        const unlocked = isCandidateUnlocked(item);
                        const profession = preview?.profession || item.profession || "Dental Professional";
                        const location = [preview?.safeCity || item.city, preview?.safeProvince || item.province].filter(Boolean).join(", ") || "Location not specified";
                        const skills = skillsFor(preview);
                        const status = candidateStatus(item, unlocked);

                        return (
                          <div key={item.id} style={{ width: "100%", display: "flex", alignItems: "stretch", flexWrap: "wrap", border: "1px solid #dbe4ef", borderRadius: 16, overflow: "hidden", boxSizing: "border-box", background: "#fff" }}>
                            <div style={{ flex: "1 1 620px", minWidth: 0, padding: 20, boxSizing: "border-box" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                <div style={{ color: "#002757", fontSize: 22, fontWeight: 900 }}>{profession}</div>
                                <span style={{ borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 900, textTransform: "uppercase", background: status === "New" ? "#dcecff" : status === "Connected" || status === "Mutual Interest" ? "#eaf8ee" : "#fff7ed", color: status === "New" ? "#0869d7" : status === "Connected" || status === "Mutual Interest" ? "#017f27" : "#b45309" }}>{status}</span>
                              </div>
                              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 10, color: "#526a90", fontWeight: 700 }}>
                                <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><MapPin size={17} />{location}</span>
                                {preview?.yearsExperience != null && <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><BriefcaseBusiness size={17} />{preview.yearsExperience} year{preview.yearsExperience === 1 ? "" : "s"} experience</span>}
                              </div>
                              {skills.length > 0 && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>{skills.map((skill) => <span key={skill} style={{ border: "1px solid #d9e2ec", background: "#f7f9fc", color: "#455f89", borderRadius: 999, padding: "6px 11px", fontSize: 13, fontWeight: 700 }}>{skill}</span>)}</div>}
                              {preview?.summary && <div style={{ color: "#455f89", lineHeight: 1.6, marginTop: 14 }}>{preview.summary}</div>}
                              <button type="button" onClick={() => onViewCandidate(item)} style={{ marginTop: 14, border: 0, background: "transparent", color: "#0869d7", fontWeight: 900, padding: 0, display: "inline-flex", alignItems: "center", gap: 6 }}>
                                View full profile <ArrowRight size={18} />
                              </button>
                            </div>

                            <div style={{ flex: "0 1 330px", minWidth: 280, borderLeft: "1px solid #e2e8f0", padding: 18, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", gap: 10, background: "#fbfdff" }}>
                              {unlocked ? (
                                <>
                                  <button type="button" disabled={unlockBusyId === item.id} onClick={() => onDownloadResume(item)} style={{ minHeight: 44, border: 0, borderRadius: 9, background: "#EA4335", color: "white", fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}><Download size={17} /> Résumé / CV</button>
                                  <button type="button" onClick={() => onViewCandidate(item)} style={{ minHeight: 44, border: "1px solid #bfe9ca", borderRadius: 9, background: "#eaf8ee", color: "#017f27", fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}><FileText size={17} /> View Candidate</button>
                                  <button type="button" onClick={() => onOpenChat(item)} style={{ minHeight: 44, border: 0, borderRadius: 9, background: "#002757", color: "white", fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}><MessageCircle size={17} /> Message</button>
                                  <button type="button" disabled={connectionDeletingId === item.id} onClick={() => onDeleteConnection(item)} style={{ minHeight: 44, border: "1px solid #fecdd3", borderRadius: 9, background: "white", color: "#e11d48", fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}><Trash2 size={17} /> Delete</button>
                                </>
                              ) : item.initiatorRole === "professional" && item.status === "pending" ? (
                                <>
                                  <button type="button" disabled={connectionBusy || unlockBusyId === item.id} onClick={() => onUpdateConnection(item, "declined")} style={{ minHeight: 46, border: "2px solid #ef4444", borderRadius: 9, background: "white", color: "#dc2626", fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}><Ban size={18} /> Not Interested</button>
                                  <button type="button" disabled={unlockBusyId === item.id} onClick={() => onStartMatch(item)} style={{ minHeight: 46, border: 0, borderRadius: 9, background: "#01A32E", color: "white", fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}><Handshake size={18} />{unlockBusyId === item.id ? "Matching…" : "LET’S MATCH"}</button>
                                  <div style={{ textAlign: "center", color: "#526a90", fontSize: 13, lineHeight: 1.5 }}>Your contact details remain private until a match is made.</div>
                                </>
                              ) : item.initiatorRole === "office" && item.status === "interested" ? (
                                <>
                                  <button type="button" disabled={unlockBusyId === item.id} onClick={() => onStartMatch(item)} style={{ minHeight: 46, border: 0, borderRadius: 9, background: "#01A32E", color: "white", fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}><Handshake size={18} />{unlockBusyId === item.id ? "Matching…" : "LET’S MATCH"}</button>
                                  <div style={{ textAlign: "center", color: "#526a90", fontSize: 13, lineHeight: 1.5 }}>Mutual interest confirmed. LET’S MATCH completes the paid connection.</div>
                                </>
                              ) : (
                                <div style={{ background: "#fff7ed", color: "#b45309", borderRadius: 9, padding: 12, textAlign: "center", fontWeight: 800 }}>Awaiting professional response.</div>
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
