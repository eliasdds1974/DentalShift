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
  onUpdateConnection: (
    connection: JobConnection,
    action: "interested" | "declined" | "withdrawn",
  ) => void;
  onStartMatch: (connection: JobConnection) => void;
  onDownloadResume: (connection: JobConnection) => void;
  onViewCandidate: (connection: JobConnection) => void;
  onOpenChat: (connection: JobConnection) => void;
  onDeleteConnection: (connection: JobConnection) => void;
};

function candidateSkills(preview?: CandidatePreview | null) {
  const values = [
    ...(preview?.skills || []),
    ...(preview?.software || []),
    ...(preview?.certifications || []),
  ];

  return Array.from(new Set(values.filter(Boolean))).slice(0, 5);
}

function statusLabel(item: JobConnection, unlocked: boolean) {
  if (unlocked) return "Connected";
  if (item.initiatorRole === "office" && item.status === "interested") return "Mutual Interest";
  if (item.initiatorRole === "professional" && item.status === "pending") return "New";
  if (item.initiatorRole === "office" && item.status === "pending") return "Awaiting Professional";
  return "Interested";
}

function statusPillClass(status: string) {
  if (status === "New") return "bg-[#dcecff] text-[#0869d7]";
  if (status === "Connected" || status === "Mutual Interest") {
    return "bg-[#eaf8ee] text-[#017f27]";
  }
  return "bg-amber-50 text-amber-700";
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
    <section
      id="my-dentaljobs"
      className="w-full min-w-0 rounded-[24px] border-2 border-[#01A32E] bg-white p-4 shadow-sm sm:p-6 lg:col-span-2"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.08em] text-[#009b2f]">
            Office Postings
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-tight text-[#002757] sm:text-4xl">
            My DentalJobs
          </h2>
          <p className="mt-1 text-base font-medium text-[#455f89]">
            Manage your postings and review each professional who responds.
          </p>
        </div>

        <span className="w-fit rounded-full border border-[#01A32E]/25 bg-[#f2fff6] px-5 py-3 text-lg font-black text-[#009b2f]">
          {jobs.length} posting{jobs.length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="mt-5 space-y-3">
        {manageError && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {manageError}
          </p>
        )}

        {connectionError && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {connectionError}
          </p>
        )}

        {unlockError && (
          <div className="flex flex-col gap-3 rounded-xl bg-rose-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-rose-700">{unlockError}</p>
            {unlockError.toLowerCase().includes("credit card") && (
              <button
                type="button"
                onClick={onSetupBillingCard}
                className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-[#002757] px-4 py-2 text-xs font-black text-white"
              >
                <CreditCard size={14} /> Add Card
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-6">
        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
            You have no DentalJobs postings yet.
          </div>
        ) : (
          jobs.map((job) => {
            const daysLeft = Math.max(
              0,
              Math.ceil((new Date(job.expires_at).getTime() - Date.now()) / 86400000),
            );
            const isActive = job.status === "active" && daysLeft > 0;
            const displayStatus =
              job.status === "active" && daysLeft === 0 ? "expired" : job.status;

            const jobConnections = connections
              .filter(
                (item) =>
                  (item.listingId === job.id || item.sourceOfficeListingId === job.id) &&
                  item.status !== "declined" &&
                  item.status !== "withdrawn",
              )
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
              );

            const newCount = jobConnections.filter(
              (item) =>
                item.initiatorRole === "professional" &&
                item.status === "pending" &&
                !isCandidateUnlocked(item),
            ).length;

            return (
              <article
                key={job.id}
                className="w-full overflow-hidden rounded-[22px] border border-[#b9dfc3] bg-white shadow-sm"
              >
                {/* 1. Job posting summary */}
                <div className="grid grid-cols-1 bg-gradient-to-r from-[#f5fff7] to-white lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="px-5 py-5 sm:px-7 sm:py-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-3.5 py-1.5 text-xs font-black uppercase ${
                          isActive
                            ? "bg-[#01A32E] text-white"
                            : displayStatus === "paused"
                              ? "bg-amber-50 text-amber-700"
                              : displayStatus === "filled"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {displayStatus}
                      </span>

                      {isActive && (
                        <span className="text-sm font-semibold text-[#455f89] sm:text-base">
                          {daysLeft} day{daysLeft === 1 ? "" : "s"} remaining
                        </span>
                      )}

                      {newCount > 0 && (
                        <span className="rounded-full bg-[#ffe9ef] px-3 py-1.5 text-xs font-black text-[#c81d4f]">
                          {newCount} New
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 text-2xl font-black leading-tight text-[#002757] sm:text-3xl">
                      {job.profession} — {job.employment_type}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-[#526a90] sm:text-base">
                      <span className="inline-flex items-center gap-2">
                        <MapPin size={18} />
                        {job.city}, {job.province}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <BriefcaseBusiness size={18} />
                        {job.employment_type}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Clock3 size={18} />
                        Posted {new Date(job.created_at).toLocaleDateString("en-CA", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center border-t border-slate-200 px-6 py-5 text-center lg:border-l lg:border-t-0">
                    <div>
                      <p className="text-5xl font-black leading-none text-[#01A32E]">
                        {jobConnections.length}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-[#009b2f]">Interested</p>
                    </div>
                  </div>
                </div>

                {/* 2. Action bar */}
                <div className="border-y border-slate-200 bg-[#f8fbff] px-4 py-3 sm:px-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onManage(job)}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#06499d] px-3.5 text-sm font-black text-white shadow-sm"
                    >
                      <MoreVertical size={16} /> Manage <ChevronDown size={15} />
                    </button>

                    <Link
                      href={`/jobs/${job.id}?returnTo=${encodeURIComponent("/dental-jobs")}`}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#7793b9] bg-white px-3.5 text-sm font-black text-[#06499d]"
                    >
                      <FileText size={16} /> View Ad
                    </Link>

                    <div>
                      <ShareListingButton listingId={job.id} compact />
                    </div>

                    <button
                      type="button"
                      onClick={() => onEdit(job)}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#7793b9] bg-white px-3.5 text-sm font-black text-[#06499d]"
                    >
                      <Pencil size={16} /> Edit Posting
                    </button>
                  </div>
                </div>

                {/* 3. Interested professionals */}
                <section className="px-4 py-5 sm:px-6 sm:py-6">
                  <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="text-xl font-black text-[#002757] sm:text-2xl">
                      Interested Dental Professionals ({jobConnections.length})
                    </h4>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#002757] sm:text-base">
                      Sort by: Newest First <ChevronDown size={18} />
                    </span>
                  </div>

                  {jobConnections.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm font-semibold text-slate-500">
                      When a professional selects I’m Interested or Apply to this Position, their
                      card will appear here.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {jobConnections.map((item) => {
                        const preview = item.candidatePreview;
                        const unlocked = isCandidateUnlocked(item);
                        const profession =
                          preview?.profession || item.profession || "Dental Professional";
                        const location =
                          [
                            preview?.safeCity || item.city,
                            preview?.safeProvince || item.province,
                          ]
                            .filter(Boolean)
                            .join(", ") || "Location not specified";
                        const skills = candidateSkills(preview);
                        const status = statusLabel(item, unlocked);

                        return (
                          <article
                            key={item.id}
                            className="w-full overflow-hidden rounded-[18px] border border-[#dbe4ef] bg-white"
                          >
                            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px]">
                              <div className="px-5 py-5 sm:px-6">
                                <div className="flex flex-wrap items-center gap-3">
                                  <h5 className="text-xl font-black text-[#002757] sm:text-2xl">
                                    {profession}
                                  </h5>
                                  <span
                                    className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusPillClass(status)}`}
                                  >
                                    {status}
                                  </span>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-[#526a90] sm:text-base">
                                  <span className="inline-flex items-center gap-2">
                                    <MapPin size={17} />
                                    {location}
                                  </span>
                                  {preview?.yearsExperience != null && (
                                    <span className="inline-flex items-center gap-2">
                                      <BriefcaseBusiness size={17} />
                                      {preview.yearsExperience} year
                                      {preview.yearsExperience === 1 ? "" : "s"} experience
                                    </span>
                                  )}
                                </div>

                                {skills.length > 0 && (
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {skills.map((skill) => (
                                      <span
                                        key={skill}
                                        className="rounded-full border border-[#d9e2ec] bg-[#f7f9fc] px-3.5 py-1.5 text-sm font-medium text-[#455f89]"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {preview?.summary && (
                                  <p className="mt-4 max-w-3xl text-sm leading-6 text-[#455f89] sm:text-base sm:leading-7">
                                    {preview.summary}
                                  </p>
                                )}

                                <button
                                  type="button"
                                  onClick={() => onViewCandidate(item)}
                                  className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#0869d7] hover:text-[#0056b8] sm:text-base"
                                >
                                  View full profile <ArrowRight size={18} />
                                </button>
                              </div>

                              <div className="border-t border-slate-200 bg-[#fbfcfe] px-5 py-5 xl:border-l xl:border-t-0">
                                {unlocked ? (
                                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                                    <button
                                      type="button"
                                      disabled={unlockBusyId === item.id}
                                      onClick={() => onDownloadResume(item)}
                                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#EA4335] px-4 py-2.5 text-sm font-black text-white"
                                    >
                                      <Download size={17} /> Résumé / CV
                                    </button>
                                    <button
                                      type="button"
                                      disabled={unlockBusyId === item.id}
                                      onClick={() => onViewCandidate(item)}
                                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#01A32E]/30 bg-[#eaf8ee] px-4 py-2.5 text-sm font-black text-[#017f27]"
                                    >
                                      <FileText size={17} /> View Candidate
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onOpenChat(item)}
                                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#002757] px-4 py-2.5 text-sm font-black text-white"
                                    >
                                      <MessageCircle size={17} /> Message
                                    </button>
                                    <button
                                      type="button"
                                      disabled={connectionDeletingId === item.id}
                                      onClick={() => onDeleteConnection(item)}
                                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-black text-rose-600"
                                    >
                                      <Trash2 size={17} /> Delete
                                    </button>
                                  </div>
                                ) : item.initiatorRole === "professional" && item.status === "pending" ? (
                                  <div className="space-y-2">
                                    <button
                                      type="button"
                                      disabled={connectionBusy || unlockBusyId === item.id}
                                      onClick={() => onUpdateConnection(item, "declined")}
                                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-red-500 bg-white px-4 py-2.5 text-base font-black text-red-600"
                                    >
                                      <Ban size={18} /> Not Interested
                                    </button>
                                    <button
                                      type="button"
                                      disabled={unlockBusyId === item.id}
                                      onClick={() => onStartMatch(item)}
                                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#01A32E] px-4 py-2.5 text-base font-black text-white shadow-sm"
                                    >
                                      <Handshake size={19} />
                                      {unlockBusyId === item.id ? "Matching…" : "LET’S MATCH"}
                                    </button>
                                    <p className="pt-1 text-center text-xs font-medium leading-5 text-[#526a90] sm:text-sm">
                                      Your contact details remain private until a match is made.
                                    </p>
                                  </div>
                                ) : item.initiatorRole === "office" && item.status === "interested" ? (
                                  <div className="space-y-2">
                                    <button
                                      type="button"
                                      disabled={unlockBusyId === item.id}
                                      onClick={() => onStartMatch(item)}
                                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#01A32E] px-4 py-2.5 text-base font-black text-white shadow-sm"
                                    >
                                      <Handshake size={19} />
                                      {unlockBusyId === item.id ? "Matching…" : "LET’S MATCH"}
                                    </button>
                                    <p className="pt-1 text-center text-xs font-medium leading-5 text-[#526a90] sm:text-sm">
                                      Mutual interest confirmed. LET’S MATCH completes the paid connection.
                                    </p>
                                  </div>
                                ) : (
                                  <p className="rounded-lg bg-amber-50 px-4 py-4 text-center text-sm font-bold text-amber-700">
                                    Awaiting professional response.
                                  </p>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
