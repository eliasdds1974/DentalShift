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

function candidateSkills(preview?: CandidatePreview | null) {
  const values = [
    ...(preview?.skills || []),
    ...(preview?.software || []),
    ...(preview?.certifications || []),
  ];

  return Array.from(new Set(values.filter(Boolean))).slice(0, 5);
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
      className="w-full min-w-0 overflow-hidden rounded-[24px] border-2 border-[#01A32E] bg-white shadow-sm lg:col-span-2"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-6 sm:px-8 sm:py-7">
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

        <span className="rounded-full border border-[#01A32E]/25 bg-[#f2fff6] px-5 py-3 text-lg font-black text-[#009b2f]">
          {jobs.length} posting{jobs.length === 1 ? "" : "s"}
        </span>
      </div>

      {manageError && (
        <p className="mx-6 mb-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700 sm:mx-8">
          {manageError}
        </p>
      )}

      {connectionError && (
        <p className="mx-6 mb-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700 sm:mx-8">
          {connectionError}
        </p>
      )}

      {unlockError && (
        <div className="mx-6 mb-4 flex flex-col gap-2 rounded-xl bg-rose-50 p-3 sm:mx-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-rose-700">{unlockError}</p>
          {unlockError.toLowerCase().includes("credit card") && (
            <button
              type="button"
              onClick={onSetupBillingCard}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#002757] px-4 py-2.5 text-xs font-black text-white"
            >
              <CreditCard size={14} /> Add Card
            </button>
          )}
        </div>
      )}

      <div className="space-y-6 px-4 pb-5 sm:px-5 sm:pb-6">
        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center text-sm font-semibold text-slate-500">
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
                className="overflow-hidden rounded-[22px] border border-[#01A32E]/35 bg-white shadow-sm"
              >
                <div className="grid grid-cols-1 bg-gradient-to-r from-[#f4fff7] to-white lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="px-6 py-5 sm:px-8 sm:py-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-4 py-1.5 text-sm font-black uppercase ${
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
                        <span className="text-base font-semibold text-[#455f89]">
                          {daysLeft} day{daysLeft === 1 ? "" : "s"} remaining
                        </span>
                      )}

                      {newCount > 0 && (
                        <span className="rounded-full bg-[#ffe9ef] px-4 py-1.5 text-sm font-black text-[#c81d4f]">
                          {newCount} New
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 text-2xl font-black leading-tight text-[#002757] sm:text-3xl">
                      {job.profession} — {job.employment_type}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-x-7 gap-y-2 text-base font-semibold text-[#526a90]">
                      <span className="inline-flex items-center gap-2">
                        <MapPin size={20} />
                        {job.city}, {job.province}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <BriefcaseBusiness size={20} />
                        {job.employment_type}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Clock3 size={20} />
                        Posted{" "}
                        {new Date(job.created_at).toLocaleDateString("en-CA", {
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
                      <p className="mt-2 text-xl font-medium text-[#009b2f]">Interested</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-y border-slate-200 bg-white px-6 py-4 sm:px-8">
                  <button
                    type="button"
                    onClick={() => onManage(job)}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#06499d] px-5 py-3 text-base font-black text-white shadow-sm"
                  >
                    <MoreVertical size={20} />
                    Manage
                    <ChevronDown size={20} className="ml-1" />
                  </button>

                  <Link
                    href={`/jobs/${job.id}?returnTo=${encodeURIComponent("/dental-jobs")}`}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#7793b9] bg-white px-6 py-3 text-base font-black text-[#06499d]"
                  >
                    <FileText size={20} /> View Ad
                  </Link>

                  <ShareListingButton listingId={job.id} compact />

                  <button
                    type="button"
                    onClick={() => onEdit(job)}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#7793b9] bg-white px-6 py-3 text-base font-black text-[#06499d] sm:ml-auto"
                  >
                    <Pencil size={20} /> Edit Posting
                  </button>
                </div>

                <div className="bg-white px-5 py-5 sm:px-7 sm:py-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-xl font-black text-[#002757] sm:text-2xl">
                      Interested Dental Professionals ({jobConnections.length})
                    </h4>
                    <span className="inline-flex items-center gap-2 text-base font-semibold text-[#002757]">
                      Sort by: Newest First <ChevronDown size={20} />
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
                        const status = unlocked
                          ? "Connected"
                          : item.initiatorRole === "office" && item.status === "interested"
                            ? "Mutual Interest"
                            : item.initiatorRole === "professional" && item.status === "pending"
                              ? "New"
                              : item.initiatorRole === "office" && item.status === "pending"
                                ? "Awaiting Professional"
                                : "Interested";

                        return (
                          <div
                            key={item.id}
                            className="overflow-hidden rounded-[20px] border border-[#dbe4ef] bg-white shadow-sm"
                          >
                            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_390px]">
                              <div className="px-5 py-5 sm:px-6 sm:py-6">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <h5 className="text-xl font-black text-[#002757] sm:text-2xl">
                                      {profession}
                                    </h5>
                                    <span
                                      className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                                        status === "New"
                                          ? "bg-[#dcecff] text-[#0869d7]"
                                          : status === "Connected" || status === "Mutual Interest"
                                            ? "bg-[#eaf8ee] text-[#017f27]"
                                            : "bg-amber-50 text-amber-700"
                                      }`}
                                    >
                                      {status}
                                    </span>
                                  </div>

                                  <div className="mt-2 flex flex-wrap gap-x-7 gap-y-2 text-base font-semibold text-[#526a90]">
                                    <span className="inline-flex items-center gap-2">
                                      <MapPin size={18} />
                                      {location}
                                    </span>
                                    {preview?.yearsExperience != null && (
                                      <span className="inline-flex items-center gap-2">
                                        <BriefcaseBusiness size={18} />
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
                                          className="rounded-full border border-[#d9e2ec] bg-[#f7f9fc] px-4 py-2 text-sm font-medium text-[#455f89]"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {preview?.summary && (
                                    <p className="mt-4 max-w-3xl text-base leading-7 text-[#455f89]">
                                      {preview.summary}
                                    </p>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => onViewCandidate(item)}
                                    className="mt-4 inline-flex items-center gap-2 text-base font-black text-[#0869d7] hover:text-[#0056b8]"
                                  >
                                    View full profile <ArrowRight size={20} />
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-col justify-center gap-3 border-t border-slate-200 px-5 py-5 xl:border-l xl:border-t-0 xl:px-6">
                                {unlocked ? (
                                  <>
                                    <button
                                      type="button"
                                      disabled={unlockBusyId === item.id}
                                      onClick={() => onDownloadResume(item)}
                                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#EA4335] px-4 py-3 text-base font-black text-white"
                                    >
                                      <Download size={18} /> Résumé / CV
                                    </button>
                                    <button
                                      type="button"
                                      disabled={unlockBusyId === item.id}
                                      onClick={() => onViewCandidate(item)}
                                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#01A32E]/30 bg-[#eaf8ee] px-4 py-3 text-base font-black text-[#017f27]"
                                    >
                                      <FileText size={18} /> View Candidate
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onOpenChat(item)}
                                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#002757] px-4 py-3 text-base font-black text-white"
                                    >
                                      <MessageCircle size={18} /> Message
                                    </button>
                                    <button
                                      type="button"
                                      disabled={connectionDeletingId === item.id}
                                      onClick={() => onDeleteConnection(item)}
                                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-base font-black text-rose-600"
                                    >
                                      <Trash2 size={18} /> Delete
                                    </button>
                                  </>
                                ) : item.initiatorRole === "professional" &&
                                  item.status === "pending" ? (
                                  <>
                                    <button
                                      type="button"
                                      disabled={connectionBusy || unlockBusyId === item.id}
                                      onClick={() => onUpdateConnection(item, "declined")}
                                      className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-red-500 bg-white px-4 py-3 text-lg font-black text-red-600"
                                    >
                                      <Ban size={20} /> Not Interested
                                    </button>
                                    <button
                                      type="button"
                                      disabled={unlockBusyId === item.id}
                                      onClick={() => onStartMatch(item)}
                                      className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#01A32E] px-4 py-3 text-lg font-black text-white shadow-sm"
                                    >
                                      <Handshake size={21} />
                                      {unlockBusyId === item.id ? "Matching…" : "LET’S MATCH"}
                                    </button>
                                    <p className="text-center text-sm font-medium leading-5 text-[#526a90]">
                                      Your contact details remain private until a match is made.
                                    </p>
                                  </>
                                ) : item.initiatorRole === "office" &&
                                  item.status === "interested" ? (
                                  <>
                                    <button
                                      type="button"
                                      disabled={unlockBusyId === item.id}
                                      onClick={() => onStartMatch(item)}
                                      className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#01A32E] px-4 py-3 text-lg font-black text-white shadow-sm"
                                    >
                                      <Handshake size={21} />
                                      {unlockBusyId === item.id ? "Matching…" : "LET’S MATCH"}
                                    </button>
                                    <p className="text-center text-sm font-medium leading-5 text-[#526a90]">
                                      Mutual interest confirmed. LET’S MATCH completes the paid
                                      connection.
                                    </p>
                                  </>
                                ) : (
                                  <p className="rounded-xl bg-amber-50 px-4 py-4 text-center text-sm font-bold text-amber-700">
                                    Awaiting professional response.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
