"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, BriefcaseBusiness, Building2, Check, ChevronLeft, Clock3, CreditCard, Download, FileText, Filter, LockKeyhole, Mail, MapPin, MessageCircle, MoreVertical, Pencil, Pause, Phone, Play, RefreshCw, Search, Send, ShieldCheck, Star, Trash2, UserRound, X } from "lucide-react";
import { ShareListingButton } from "@/components/ShareListingButton";
import { loadAccountDetails } from "@/lib/dentalshift";
import { supabase } from "@/lib/supabase";

type JobCard = {
  id: string | number;
  kind: "office" | "professional";
  title: string;
  name: string;
  city: string;
  distance: number;
  profession: string;
  employment: string;
  pay: string;
  posted: string;
  featured: boolean;
  description: string;
  ownerOfficeId?: string | null;
  ownerProfessionalId?: string | null;
};

const ads: JobCard[] = [
  { id: 1, kind: "office", title: "Registered Dental Hygienist — Permanent Full-Time", name: "Verified Dental Office", city: "Kelowna, BC", distance: 4.8, profession: "Registered Dental Hygienist", employment: "Full-Time", pay: "$55–$62/hr", posted: "Today", featured: true, description: "Modern, established family practice seeking an RDH to join a supportive team four days per week. Strong recall program, modern operatories and an experienced hygiene team." },
  { id: 2, kind: "professional", title: "Certified Dental Assistant Seeking Permanent Position", name: "Verified DentalShift Professional", city: "West Kelowna, BC", distance: 11.2, profession: "Certified Dental Assistant", employment: "Full-Time", pay: "$32–$37/hr", posted: "Today", featured: false, description: "Experienced CDA seeking a long-term position with a patient-focused office. Comfortable with digital scanning, chairside assisting and busy restorative schedules." },
  { id: 3, kind: "office", title: "Dental Administrator — 4 Days / Week", name: "Verified Dental Office", city: "Kelowna, BC", distance: 7.5, profession: "Dental Administrator", employment: "Part-Time", pay: "$29–$34/hr", posted: "1 day ago", featured: false, description: "Looking for a friendly, organized administrator for four weekdays. Dental software experience preferred. Competitive compensation and a welcoming team." },
  { id: 4, kind: "office", title: "Associate Dentist — 3 to 4 Days / Week", name: "Verified Dental Office", city: "Kelowna, BC", distance: 8.9, profession: "Associate Dentist", employment: "Part-Time", pay: "Compensation discussed privately", posted: "1 day ago", featured: false, description: "Established general practice seeking an Associate Dentist for a long-term opportunity. Strong patient base, modern operatories and experienced clinical support." },
  { id: 5, kind: "professional", title: "Registered Dental Hygienist Looking for an Office", name: "Verified DentalShift Professional", city: "Vernon, BC", distance: 47.9, profession: "Registered Dental Hygienist", employment: "Flexible", pay: "$58+/hr", posted: "3 days ago", featured: false, description: "Registered Dental Hygienist with several years of clinical experience looking for a permanent position 2–4 days per week within the Okanagan." },
  { id: 6, kind: "office", title: "Sterilization Technician", name: "Verified Dental Office", city: "Penticton, BC", distance: 63.1, profession: "Sterilization Technician", employment: "Part-Time", pay: "$24–$28/hr", posted: "4 days ago", featured: false, description: "Part-time sterilization technician needed for a busy multi-provider office. Training available for a dependable candidate with strong attention to detail." },
];

const distances = [25, 50, 100, 200, 500];
const professions = ["All professions", "Registered Dental Hygienist", "Certified Dental Assistant", "Dental Administrator", "Sterilization Technician", "Associate Dentist"];
const jobProfessions = professions.slice(1);
const employmentOptions = ["Full-Time", "Part-Time", "Flexible", "Temporary / Contract"];

const professionalCardThemes: Record<string, { accent: string; border: string; pale: string; text: string }> = {
  "Registered Dental Hygienist": { accent: "#4285F4", border: "#4285F455", pale: "#EEF4FF", text: "#245FB8" },
  "Certified Dental Assistant": { accent: "#EA4335", border: "#EA433555", pale: "#FFF0EE", text: "#B52C22" },
  "Dental Administrator": { accent: "#FBBC05", border: "#FBBC0566", pale: "#FFF8DF", text: "#805F00" },
  "Sterilization Technician": { accent: "#34A853", border: "#34A85355", pale: "#ECF8EF", text: "#247A3B" },
  "Associate Dentist": { accent: "#7C3AED", border: "#7C3AED55", pale: "#F4EEFF", text: "#5B21B6" },
};

function getProfessionalCardTheme(profession: string) {
  return professionalCardThemes[profession] || { accent: "#01A32E", border: "#01A32E55", pale: "#EAF8EE", text: "#017F27" };
}

function parseImportedOfficeAd(rawText: string, fallbackCity: string, fallbackProvince: string): PostingPreview {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  let position = "";
  if (/\b(rdh|registered dental hygienist|dental hygienist|hygienist)\b/i.test(text)) position = "Registered Dental Hygienist";
  else if (/\b(cda|certified dental assistant|dental assistant)\b/i.test(text)) position = "Certified Dental Assistant";
  else if (/\b(sterilization|sterilisation|steri tech|sterilization technician)\b/i.test(text)) position = "Sterilization Technician";
  else if (/\b(associate dentist|general dentist|dentist associate|dentist)\b/i.test(text)) position = "Associate Dentist";
  else if (/\b(dental administrator|administrator|receptionist|front desk|treatment coordinator)\b/i.test(text)) position = "Dental Administrator";

  let employment = "Full-Time";
  if (/\b(part[- ]?time|part time)\b/i.test(text)) employment = "Part-Time";
  else if (/\b(temporary|contract|locum)\b/i.test(text)) employment = "Temporary / Contract";
  else if (/\b(flexible|casual)\b/i.test(text)) employment = "Flexible";
  else if (/\b(full[- ]?time|full time)\b/i.test(text)) employment = "Full-Time";

  const payRange = text.match(/\$\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:[-–—]|to)\s*\$?\s*(\d{2,3}(?:\.\d{1,2})?)/i);
  const singlePay = text.match(/\$\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:\/\s*(?:hr|hour)|per\s+hour|hourly)/i);
  const payFrom = payRange?.[1] || singlePay?.[1] || "";
  const payTo = payRange?.[2] || "";

  const daysMatch = text.match(/\b([1-5])\s*(?:days?|d)\s*(?:\/|per)\s*week\b/i) || text.match(/\b([1-5])\s+days?\s+(?:a|each)\s+week\b/i);
  const days = daysMatch?.[1] || (/\bflexible\b/i.test(text) ? "Flexible" : "4");

  const provinceNames: Record<string, string> = {
    alberta: "AB", "british columbia": "BC", manitoba: "MB", "new brunswick": "NB", "newfoundland and labrador": "NL",
    "nova scotia": "NS", "northwest territories": "NT", nunavut: "NU", ontario: "ON", "prince edward island": "PE",
    quebec: "QC", saskatchewan: "SK", yukon: "YT"
  };
  let province = fallbackProvince || "AB";
  for (const [name, abbreviation] of Object.entries(provinceNames)) {
    if (lower.includes(name)) {
      province = abbreviation;
      break;
    }
  }
  const provinceCodeMatch = text.match(/(?:,|\s)\b(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)\b/i);
  if (provinceCodeMatch) province = provinceCodeMatch[1].toUpperCase();

  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const scheduleLine = lines.find((line) => /\b(schedule|hours?|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(line) && line.length <= 180) || "";

  return {
    position,
    employment,
    city: fallbackCity,
    province,
    days,
    payFrom,
    payTo,
    schedule: scheduleLine,
    description: text.slice(0, 1500),
  };
}

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

type PostingMode = "office" | "professional" | null;
type PostingPreview = {
  position: string;
  employment: string;
  city: string;
  province: string;
  days: string;
  payFrom: string;
  payTo: string;
  schedule: string;
  description: string;
};

type CandidatePreview = {
  profession: string | null;
  safeCity: string | null;
  safeProvince: string | null;
  yearsExperience: number | null;
  summary: string;
  experienceSummary: string | null;
  educationSummary: string | null;
  workHistorySummary: string | null;
  skills: string[];
  software: string[];
  certifications: string[];
};

type JobConnection = {
  id: string;
  listingId: string;
  professionalId: string;
  officeId: string;
  initiatorRole: "professional" | "office";
  status: "pending" | "interested" | "declined" | "withdrawn";
  message: string;
  resumePath: string | null;
  createdAt: string;
  profession: string;
  employment: string;
  city: string;
  province: string;
  listingType: "office_hiring" | "professional_available";
  candidatePreview?: CandidatePreview | null;
};

type JobMessage = {
  id: string;
  applicationId: string;
  senderRole: "professional" | "office";
  senderUserId: string;
  body: string;
  createdAt: string;
};

type DentalJobsNotification = {
  id: string;
  applicationId: string;
  eventType: "application_created" | "response_interested" | "response_declined" | "chat_message";
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

type UnlockedCandidate = {
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  address: string | null;
  postalCode: string | null;
  profession: string | null;
  licenceNumber: string | null;
  licenceProvince: string | null;
  resumeUrl: string | null;
};

export default function DentalJobsPage() {
  const [radius, setRadius] = useState(100);
  const [kind, setKind] = useState<"all" | "office" | "professional">("all");
  const [profession, setProfession] = useState("All professions");
  const [query, setQuery] = useState("");
  const [backHref, setBackHref] = useState("/professionals/find-shifts");
  const [postingMode, setPostingMode] = useState<PostingMode>(null);
  const [submitted, setSubmitted] = useState(false);
  const [preview, setPreview] = useState<PostingPreview | null>(null);
  const [officeLocation, setOfficeLocation] = useState({ city: "", province: "AB" });
  const [officeId, setOfficeId] = useState<string | null>(null);
  const [liveAds, setLiveAds] = useState<JobCard[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [posted, setPosted] = useState(false);
  const [portalRole, setPortalRole] = useState<"office" | "professional" | null>(null);
  const [accountDisplayName, setAccountDisplayName] = useState("");
  const [myOfficeJobs, setMyOfficeJobs] = useState<OfficeJobListing[]>([]);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [professionalLocation, setProfessionalLocation] = useState({ city: "", province: "AB" });
  const [professionalProfession, setProfessionalProfession] = useState("");
  const [myProfessionalJobs, setMyProfessionalJobs] = useState<OfficeJobListing[]>([]);
  const [managingId, setManagingId] = useState<string | null>(null);
  const [editingListing, setEditingListing] = useState<OfficeJobListing | null>(null);
  const [manageError, setManageError] = useState("");
  const [resumePath, setResumePath] = useState<string | null>(null);
  const [connections, setConnections] = useState<JobConnection[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<JobCard | null>(null);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [connectionBusy, setConnectionBusy] = useState(false);
  const [connectionDeletingId, setConnectionDeletingId] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState("");
  const [activeChat, setActiveChat] = useState<JobConnection | null>(null);
  const [chatMessages, setChatMessages] = useState<JobMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState("");
  const [notifications, setNotifications] = useState<DentalJobsNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [paidUnlockPairs, setPaidUnlockPairs] = useState<string[]>([]);
  const [unlockBusyId, setUnlockBusyId] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState("");
  const [unlockedCandidate, setUnlockedCandidate] = useState<UnlockedCandidate | null>(null);
  const [importingOfficeAd, setImportingOfficeAd] = useState(false);
  const [importAdText, setImportAdText] = useState("");
  const [importError, setImportError] = useState("");
  const [importPrefill, setImportPrefill] = useState<PostingPreview | null>(null);

  useEffect(() => {
    const storedPortalRole = window.localStorage.getItem("dentalshift_portal_role");
    const resolvedPortalRole = storedPortalRole === "office" ? "office" : storedPortalRole === "professional" ? "professional" : null;
    setPortalRole(resolvedPortalRole);
    setBackHref(resolvedPortalRole === "office" ? "/office/overview" : "/professionals/find-shifts");
    const params = new URLSearchParams(window.location.search);
    if (resolvedPortalRole === "office" && params.get("post") === "office") {
      setPostingMode("office");
      setSubmitted(false);
    }

    if (resolvedPortalRole === "office") {
      void (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        try {
          const details = await loadAccountDetails(user.id);
          const city = details.office?.city || details.profile.city || "";
          const province = details.office?.province || details.profile.province || "AB";
          setOfficeLocation({ city, province });
          setOfficeId(details.office?.id || null);
          setAccountDisplayName(details.office?.name || details.profile.first_name || "");
          if (details.office?.id) await loadMyOfficeJobs(details.office.id);
          await loadConnections("office");
          await loadNotifications();
          await loadUnlocks();
        } catch {
          // Leave the fields editable if account details cannot be loaded.
        }
      })();
    }

    if (resolvedPortalRole === "professional") {
      void (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        try {
          const details = await loadAccountDetails(user.id);
          if (!details.professional) return;
          setProfessionalId(user.id);
          setAccountDisplayName(details.profile.first_name || "");
          setProfessionalLocation({ city: details.profile.city || "", province: details.profile.province || details.professional.licence_province || "AB" });
          setProfessionalProfession(details.professional.profession || "");
          const { data: professionalRow } = await supabase.from("professional_profiles").select("resume_path").eq("user_id", user.id).maybeSingle();
          setResumePath(professionalRow?.resume_path || null);
          await loadMyProfessionalJobs(user.id);
          await loadConnections("professional");
          await loadNotifications();
          await loadUnlocks();
        } catch {
          // Leave the fields editable if account details cannot be loaded.
        }
      })();
    }

    void (async () => {
      const { data, error } = await supabase
        .from("job_listings")
        .select("id,listing_type,profession,office_id,professional_id,employment_type,city,province,days_per_week,pay_min,pay_max,schedule,description,created_at")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (error || !data) return;
      setLiveAds(data.map((row) => {
        const min = row.pay_min == null ? null : Number(row.pay_min);
        const max = row.pay_max == null ? null : Number(row.pay_max);
        const pay = min != null || max != null
          ? `${min != null ? `$${min}` : ""}${min != null && max != null ? "–" : ""}${max != null ? `$${max}` : ""}/hr`
          : "Compensation discussed privately";
        return {
          id: row.id,
          kind: row.listing_type === "office_hiring" ? "office" as const : "professional" as const,
          title: row.listing_type === "office_hiring" ? `${row.profession} — ${row.employment_type}` : `${row.profession} Looking for an Office`,
          name: row.listing_type === "office_hiring" ? "Verified Dental Office" : "Verified DentalShift Professional",
          city: `${row.city}, ${row.province}`,
          distance: 0,
          profession: row.profession,
          employment: row.employment_type,
          pay,
          posted: "Recently",
          featured: false,
          description: row.description,
          ownerOfficeId: row.office_id || null,
          ownerProfessionalId: row.professional_id || null,
        };
      }));
    })();
  }, []);

  const allAds = useMemo(() => [...liveAds, ...ads], [liveAds]);

  const visibleAds = useMemo(() => allAds.filter((ad) => {
    if (ad.distance > radius) return false;
    if (kind !== "all" && ad.kind !== kind) return false;
    if (profession !== "All professions" && ad.profession !== profession) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return `${ad.title} ${ad.name} ${ad.city} ${ad.profession}`.toLowerCase().includes(q);
    }
    return true;
  }), [allAds, radius, kind, profession, query]);

  const importExistingOfficeAd = () => {
    const value = importAdText.trim();
    if (value.length < 40) {
      setImportError("Paste the text from your existing job ad so DentalShift has enough information to fill the posting form.");
      return;
    }
    const parsed = parseImportedOfficeAd(value, officeLocation.city, officeLocation.province);
    setImportPrefill(parsed);
    setImportError("");
    setImportingOfficeAd(false);
    setEditingListing(null);
    setPostingMode("office");
    setSubmitted(false);
    setPosted(false);
    setPreview(null);
    setPublishError("");
  };

  const submitPreview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPreview({
      position: String(form.get("position") || ""),
      employment: String(form.get("employment") || ""),
      city: String(form.get("city") || ""),
      province: String(form.get("province") || ""),
      days: String(form.get("days") || ""),
      payFrom: String(form.get("pay_from") || ""),
      payTo: String(form.get("pay_to") || ""),
      schedule: String(form.get("schedule") || ""),
      description: String(form.get("description") || ""),
    });
    setSubmitted(true);
  };

  const loadUnlocks = async () => {
    const { data, error } = await supabase.from("candidate_unlocks").select("office_id,professional_id,status").in("status", ["accrued","billed","paid"]);
    if (error || !data) return;
    setPaidUnlockPairs(data.map((row: any) => `${row.office_id}:${row.professional_id}`));
  };

  const isCandidateUnlocked = (connection: JobConnection) => paidUnlockPairs.includes(`${connection.officeId}:${connection.professionalId}`);

  const startCandidateUnlock = async (connection: JobConnection) => {
    setUnlockBusyId(connection.id);
    setUnlockError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in again.");
      const response = await fetch("/api/dentaljobs/unlock/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: connection.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not start candidate unlock.");
      if (result.unlocked) {
        await loadUnlocks();
        await loadConnections();
        await viewUnlockedCandidate(connection);
        return;
      }
      throw new Error(result.error || "Candidate unlock could not be completed.");
    } catch (value) {
      setUnlockError(value instanceof Error ? value.message : "Could not unlock this candidate.");
    } finally { setUnlockBusyId(null); }
  };

  const setupBillingCard = async () => {
    setUnlockError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in again.");
      const response = await fetch("/api/dentaljobs/billing/setup", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
      const result = await response.json();
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error || "Could not open secure card setup.");
      window.location.assign(result.checkoutUrl);
    } catch (value) {
      setUnlockError(value instanceof Error ? value.message : "Could not open secure card setup.");
    }
  };

  const viewUnlockedCandidate = async (connection: JobConnection) => {
    setUnlockBusyId(connection.id);
    setUnlockError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in again.");
      const response = await fetch("/api/dentaljobs/unlock/details", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: connection.id }),
      });
      const result = await response.json();
      if (!response.ok || !result.unlocked) throw new Error(result.error || "Candidate details are still locked.");
      setUnlockedCandidate(result.candidate as UnlockedCandidate);
    } catch (value) {
      setUnlockError(value instanceof Error ? value.message : "Could not load unlocked candidate details.");
    } finally { setUnlockBusyId(null); }
  };

  const loadNotifications = async () => {
    const { data, error } = await supabase
      .from("dentaljobs_notifications")
      .select("id,application_id,event_type,title,body,href,read_at,created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error || !data) return;
    setNotifications(data.map((row: any) => ({
      id: row.id,
      applicationId: row.application_id,
      eventType: row.event_type,
      title: row.title,
      body: row.body,
      href: row.href,
      readAt: row.read_at,
      createdAt: row.created_at,
    })));
  };

  const notifyDentalJobs = async (applicationId: string, eventType: "application_created" | "response_interested" | "response_declined" | "chat_message", messageId?: string | null) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      await fetch("/api/dentaljobs/notify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ applicationId, eventType, messageId: messageId || null }),
      });
    } catch {
      // Core DentalJobs action should still succeed if an email notification cannot be sent.
    }
  };

  const markNotificationRead = async (notification: DentalJobsNotification) => {
    if (notification.readAt) return;
    const readAt = new Date().toISOString();
    const { error } = await supabase.from("dentaljobs_notifications").update({ read_at: readAt }).eq("id", notification.id);
    if (!error) setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt } : item));
  };

  const markAllNotificationsRead = async () => {
    const unread = notifications.filter((item) => !item.readAt);
    if (!unread.length) return;
    const readAt = new Date().toISOString();
    const { error } = await supabase.from("dentaljobs_notifications").update({ read_at: readAt }).is("read_at", null);
    if (!error) setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || readAt })));
  };

  const loadConnections = async (roleOverride?: "office" | "professional" | null) => {
    const { data, error } = await supabase
      .from("job_applications")
      .select("id,listing_id,professional_id,office_id,initiator_role,status,message,resume_path_snapshot,created_at,professional_hidden_at,deleted_at,job_listings(profession,employment_type,city,province,listing_type)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error || !data) return;
    const effectiveRole = roleOverride || portalRole;
    const rows = (data as any[]).filter((row) => effectiveRole !== "professional" || !row.professional_hidden_at);
    const professionalIds = [...new Set(rows.map((row) => String(row.professional_id)).filter(Boolean))];
    const previewMap = new Map<string, CandidatePreview>();
    if (professionalIds.length) {
      const { data: previewRows } = await supabase
        .from("candidate_previews")
        .select("professional_id,profession,safe_city,safe_province,years_experience,summary,experience_summary,education_summary,work_history_summary,skills,software,certifications")
        .in("professional_id", professionalIds);
      for (const preview of previewRows || []) {
        previewMap.set(String(preview.professional_id), {
          profession: preview.profession || null,
          safeCity: preview.safe_city || null,
          safeProvince: preview.safe_province || null,
          yearsExperience: preview.years_experience == null ? null : Number(preview.years_experience),
          summary: preview.summary || "",
          experienceSummary: preview.experience_summary || null,
          educationSummary: preview.education_summary || null,
          workHistorySummary: preview.work_history_summary || null,
          skills: preview.skills || [],
          software: preview.software || [],
          certifications: preview.certifications || [],
        });
      }
    }
    setConnections(rows.map((row) => {
      const listing = Array.isArray(row.job_listings) ? row.job_listings[0] : row.job_listings;
      return {
        id: row.id, listingId: row.listing_id, professionalId: row.professional_id, officeId: row.office_id,
        initiatorRole: row.initiator_role, status: row.status, message: row.message || "", resumePath: row.resume_path_snapshot || null,
        createdAt: row.created_at, profession: listing?.profession || "Dental position", employment: listing?.employment_type || "",
        city: listing?.city || "", province: listing?.province || "", listingType: listing?.listing_type || "office_hiring",
        candidatePreview: previewMap.get(String(row.professional_id)) || null,
      } as JobConnection;
    }));
  };

  const softDeleteConnection = async (connection: JobConnection) => {
    if (!portalRole || connectionDeletingId) return;
    if (!window.confirm("Delete this connection? It will be removed from both the office and professional DentalJobs connection lists. Either side can start the interaction again later.")) return;
    setConnectionDeletingId(connection.id);
    setConnectionError("");
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", connection.id);
      if (error) throw error;
      setConnections((current) => current.filter((item) => item.id !== connection.id));
      if (activeChat?.id === connection.id) setActiveChat(null);
    } catch (value) {
      setConnectionError(value instanceof Error ? value.message : "Could not delete this connection.");
    } finally {
      setConnectionDeletingId(null);
    }
  };

  const existingConnectionFor = (ad: JobCard) => connections.find((item) => item.listingId === String(ad.id));

  const openConnection = (ad: JobCard) => {
    setConnectionError("");
    setConnectionMessage("");
    setSelectedOpportunity(ad);
  };

  const sendConnection = async () => {
    if (!selectedOpportunity || !portalRole) return;
    setConnectionError("");
    setConnectionBusy(true);
    try {
      if (portalRole === "professional" && selectedOpportunity.kind === "office") {
        if (!professionalId || !selectedOpportunity.ownerOfficeId) throw new Error("This opportunity is not available for applications yet.");
        const { data: created, error } = await supabase.from("job_applications").insert({
          listing_id: selectedOpportunity.id, professional_id: professionalId, office_id: selectedOpportunity.ownerOfficeId,
          initiator_role: "professional", status: "pending", message: connectionMessage.trim() || null, resume_path_snapshot: resumePath,
        }).select("id").single();
        if (error) { if (error.code === "23505") throw new Error("You have already applied to this opportunity."); throw error; }
        if (created?.id) void notifyDentalJobs(created.id, "application_created");
      } else if (portalRole === "office" && selectedOpportunity.kind === "professional") {
        if (!officeId || !selectedOpportunity.ownerProfessionalId) throw new Error("This professional opportunity is not available for interest yet.");
        const { data: created, error } = await supabase.from("job_applications").insert({
          listing_id: selectedOpportunity.id, professional_id: selectedOpportunity.ownerProfessionalId, office_id: officeId,
          initiator_role: "office", status: "pending", message: connectionMessage.trim() || null, resume_path_snapshot: null,
        }).select("id").single();
        if (error) { if (error.code === "23505") throw new Error("Your office has already expressed interest in this professional."); throw error; }
        if (created?.id) void notifyDentalJobs(created.id, "application_created");
      } else {
        throw new Error("This action is not available from your current portal.");
      }
      await loadConnections();
      setSelectedOpportunity(null);
      setConnectionMessage("");
    } catch (value) {
      setConnectionError(value instanceof Error ? value.message : "Could not send your interest.");
    } finally { setConnectionBusy(false); }
  };

  const updateConnection = async (connection: JobConnection, action: "interested" | "declined" | "withdrawn") => {
    setConnectionError("");
    setConnectionBusy(true);
    try {
      const values: Record<string, unknown> = { status: action, updated_at: new Date().toISOString() };
      if (action !== "withdrawn") values.responded_at = new Date().toISOString();
      const { error } = await supabase.from("job_applications").update(values).eq("id", connection.id);
      if (error) throw error;
      if (action === "interested") void notifyDentalJobs(connection.id, "response_interested");
      if (action === "declined") void notifyDentalJobs(connection.id, "response_declined");
      await loadConnections();
    } catch (value) {
      setConnectionError(value instanceof Error ? value.message : "Could not update this connection.");
    } finally { setConnectionBusy(false); }
  };


  const loadChatMessages = async (applicationId: string) => {
    const { data, error } = await supabase
      .from("job_messages")
      .select("id,application_id,sender_role,sender_user_id,body,created_at")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    setChatMessages((data || []).map((row: any) => ({
      id: row.id,
      applicationId: row.application_id,
      senderRole: row.sender_role,
      senderUserId: row.sender_user_id,
      body: row.body,
      createdAt: row.created_at,
    })));
  };

  const openChat = async (connection: JobConnection) => {
    if (connection.status !== "interested" || !isCandidateUnlocked(connection)) return;
    setChatError("");
    setChatDraft("");
    setActiveChat(connection);
    try {
      await loadChatMessages(connection.id);
    } catch (value) {
      setChatError(value instanceof Error ? value.message : "Could not load this conversation.");
    }
  };

  const sendChatMessage = async () => {
    if (!activeChat || !portalRole || !chatDraft.trim()) return;
    setChatBusy(true);
    setChatError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again to send a message.");
      const { data: createdMessage, error } = await supabase.from("job_messages").insert({
        application_id: activeChat.id,
        sender_role: portalRole,
        sender_user_id: user.id,
        body: chatDraft.trim(),
      }).select("id").single();
      if (error) throw error;
      if (createdMessage?.id) void notifyDentalJobs(activeChat.id, "chat_message", createdMessage.id);
      setChatDraft("");
      await loadChatMessages(activeChat.id);
    } catch (value) {
      setChatError(value instanceof Error ? value.message : "Could not send your message.");
    } finally {
      setChatBusy(false);
    }
  };

  useEffect(() => {
    if (!activeChat) return;
    const channel = supabase
      .channel(`dentaljobs-chat-${activeChat.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "job_messages", filter: `application_id=eq.${activeChat.id}` }, () => {
        void loadChatMessages(activeChat.id);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [activeChat?.id]);

  const loadMyOfficeJobs = async (targetOfficeId: string) => {
    const { data, error } = await supabase
      .from("job_listings")
      .select("id,profession,employment_type,city,province,days_per_week,pay_min,pay_max,schedule,description,status,expires_at,created_at")
      .eq("office_id", targetOfficeId)
      .eq("listing_type", "office_hiring")
      .order("created_at", { ascending: false });
    if (!error && data) setMyOfficeJobs(data as OfficeJobListing[]);
  };

  const loadMyProfessionalJobs = async (targetProfessionalId: string) => {
    const { data, error } = await supabase
      .from("job_listings")
      .select("id,profession,employment_type,city,province,days_per_week,pay_min,pay_max,schedule,description,status,expires_at,created_at")
      .eq("professional_id", targetProfessionalId)
      .eq("listing_type", "professional_available")
      .order("created_at", { ascending: false });
    if (!error && data) setMyProfessionalJobs(data as OfficeJobListing[]);
  };

  const manageOfficeJob = async (listing: OfficeJobListing, action: "pause" | "resume" | "filled" | "renew" | "close" | "delete") => {
    setManageError("");
    setManagingId(listing.id);
    try {
      if (action === "delete") {
        if (!window.confirm("Permanently delete this posting? This cannot be undone.")) return;
        const { error } = await supabase.from("job_listings").delete().eq("id", listing.id);
        if (error) throw error;
      } else {
        const now = new Date().toISOString();
        const values: Record<string, unknown> = { updated_at: now };
        if (action === "pause") values.status = "paused";
        if (action === "resume") { values.status = "active"; values.closed_at = null; values.close_reason = null; }
        if (action === "filled") { values.status = "filled"; values.closed_at = now; values.close_reason = "position_filled"; }
        if (action === "close") { values.status = "closed"; values.closed_at = now; values.close_reason = "closed_by_office"; }
        if (action === "renew") { values.status = "active"; values.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); values.closed_at = null; values.close_reason = null; }
        const { error } = await supabase.from("job_listings").update(values).eq("id", listing.id);
        if (error) throw error;
      }
      if (officeId) await loadMyOfficeJobs(officeId);
      setLiveAds((current) => current.filter((ad) => ad.id !== listing.id));
      if (["resume","renew"].includes(action)) window.location.reload();
    } catch (value) {
      setManageError(value instanceof Error ? value.message : "Could not update this posting.");
    } finally {
      setManagingId(null);
    }
  };

  const openEditListing = (listing: OfficeJobListing) => {
    setEditingListing(listing);
    setPostingMode("office");
    setSubmitted(false);
    setPosted(false);
    setPublishError("");
    setPreview(null);
  };

  const saveEditedOfficeAd = async () => {
    if (!editingListing || !preview) return;
    setPublishing(true);
    setPublishError("");
    try {
      const { error } = await supabase.from("job_listings").update({
        profession: preview.position, employment_type: preview.employment, city: preview.city.trim(), province: preview.province,
        days_per_week: preview.days || null, pay_min: preview.payFrom ? Number(preview.payFrom) : null, pay_max: preview.payTo ? Number(preview.payTo) : null,
        schedule: preview.schedule.trim() || null, description: preview.description.trim(), updated_at: new Date().toISOString()
      }).eq("id", editingListing.id);
      if (error) throw error;
      if (officeId) await loadMyOfficeJobs(officeId);
      setPosted(true);
      setEditingListing(null);
    } catch (value) {
      setPublishError(value instanceof Error ? value.message : "The changes could not be saved.");
    } finally { setPublishing(false); }
  };

  const manageProfessionalJob = async (listing: OfficeJobListing, action: "pause" | "resume" | "found" | "renew" | "close" | "delete") => {
    setManageError("");
    setManagingId(listing.id);
    try {
      if (action === "delete") {
        if (!window.confirm("Permanently delete this posting? This cannot be undone.")) return;
        const { error } = await supabase.from("job_listings").delete().eq("id", listing.id);
        if (error) throw error;
      } else {
        const now = new Date().toISOString();
        const values: Record<string, unknown> = { updated_at: now };
        if (action === "pause") values.status = "paused";
        if (action === "resume") { values.status = "active"; values.closed_at = null; values.close_reason = null; }
        if (action === "found") { values.status = "filled"; values.closed_at = now; values.close_reason = "found_office"; }
        if (action === "close") { values.status = "closed"; values.closed_at = now; values.close_reason = "closed_by_professional"; }
        if (action === "renew") { values.status = "active"; values.expires_at = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(); values.closed_at = null; values.close_reason = null; }
        const { error } = await supabase.from("job_listings").update(values).eq("id", listing.id);
        if (error) throw error;
      }
      if (professionalId) await loadMyProfessionalJobs(professionalId);
      setLiveAds((current) => current.filter((ad) => ad.id !== listing.id));
      if (["resume", "renew"].includes(action)) window.location.reload();
    } catch (value) {
      setManageError(value instanceof Error ? value.message : "Could not update this posting.");
    } finally {
      setManagingId(null);
    }
  };

  const openEditProfessionalListing = (listing: OfficeJobListing) => {
    setEditingListing(listing);
    setPostingMode("professional");
    setSubmitted(false);
    setPosted(false);
    setPublishError("");
    setPreview(null);
  };

  const saveEditedProfessionalAd = async () => {
    if (!editingListing || !preview) return;
    setPublishing(true);
    setPublishError("");
    try {
      const { error } = await supabase.from("job_listings").update({
        profession: preview.position, employment_type: preview.employment, city: preview.city.trim(), province: preview.province,
        days_per_week: preview.days || null, pay_min: preview.payFrom ? Number(preview.payFrom) : null, pay_max: preview.payTo ? Number(preview.payTo) : null,
        schedule: preview.schedule.trim() || null, description: preview.description.trim(), updated_at: new Date().toISOString()
      }).eq("id", editingListing.id);
      if (error) throw error;
      if (professionalId) await loadMyProfessionalJobs(professionalId);
      setPosted(true);
      setEditingListing(null);
    } catch (value) {
      setPublishError(value instanceof Error ? value.message : "The changes could not be saved.");
    } finally { setPublishing(false); }
  };

  const publishProfessionalAd = async () => {
    if (!preview || postingMode !== "professional") return;
    setPublishError("");
    if (!professionalId) {
      setPublishError("DentalShift could not identify the signed-in professional. Return to the professional portal and try again.");
      return;
    }
    setPublishing(true);
    try {
      const { data, error } = await supabase
        .from("job_listings")
        .insert({
          listing_type: "professional_available", professional_id: professionalId, profession: preview.position,
          employment_type: preview.employment, city: preview.city.trim(), province: preview.province, days_per_week: preview.days || null,
          pay_min: preview.payFrom ? Number(preview.payFrom) : null, pay_max: preview.payTo ? Number(preview.payTo) : null,
          schedule: preview.schedule.trim() || null, description: preview.description.trim(), status: "active",
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select("id")
        .single();
      if (error) throw error;
      const pay = preview.payFrom || preview.payTo
        ? `${preview.payFrom ? `$${preview.payFrom}` : ""}${preview.payFrom && preview.payTo ? "–" : ""}${preview.payTo ? `$${preview.payTo}` : ""}/hr`
        : "Compensation discussed privately";
      setLiveAds((current) => [{ id: data.id, kind: "professional", title: `${preview.position} Looking for an Office`, name: "", city: `${preview.city}, ${preview.province}`, distance: 0, profession: preview.position, employment: preview.employment, pay, posted: "Just now", featured: false, description: preview.description, ownerProfessionalId: professionalId }, ...current]);
      setPosted(true);
      setKind("professional");
      await loadMyProfessionalJobs(professionalId);
    } catch (value) {
      setPublishError(value instanceof Error ? value.message : "The ad could not be published. Please try again.");
    } finally { setPublishing(false); }
  };

  const publishOfficeAd = async () => {
    if (!preview || postingMode !== "office") return;
    setPublishError("");
    if (!officeId) {
      setPublishError("DentalShift could not identify the signed-in office. Return to the office portal and try again.");
      return;
    }
    setPublishing(true);
    try {
      const { data, error } = await supabase
        .from("job_listings")
        .insert({
          listing_type: "office_hiring",
          profession: preview.position,
          office_id: officeId,
          employment_type: preview.employment,
          city: preview.city.trim(),
          province: preview.province,
          days_per_week: preview.days || null,
          pay_min: preview.payFrom ? Number(preview.payFrom) : null,
          pay_max: preview.payTo ? Number(preview.payTo) : null,
          schedule: preview.schedule.trim() || null,
          description: preview.description.trim(),
          status: "active",
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select("id")
        .single();
      if (error) throw error;

      const pay = preview.payFrom || preview.payTo
        ? `${preview.payFrom ? `$${preview.payFrom}` : ""}${preview.payFrom && preview.payTo ? "–" : ""}${preview.payTo ? `$${preview.payTo}` : ""}/hr`
        : "Compensation discussed privately";
      setLiveAds((current) => [{
        id: data.id,
        kind: "office",
        title: `${preview.position} — ${preview.employment}`,
        name: "Verified Dental Office",
        city: `${preview.city}, ${preview.province}`,
        distance: 0,
        profession: preview.position,
        employment: preview.employment,
        pay,
        posted: "Just now",
        featured: false,
        description: preview.description,
        ownerOfficeId: officeId,
      }, ...current]);
      setPosted(true);
      setKind("office");
      if (officeId) await loadMyOfficeJobs(officeId);
    } catch (value) {
      setPublishError(value instanceof Error ? value.message : "The ad could not be published. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  return <main className="min-h-screen bg-[#f5f8fb] text-slate-900">
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Image src="/dentalshift-logo.svg" alt="DentalShift" width={2171} height={724} className="h-12 w-auto" priority />
          <div className="hidden border-l border-slate-200 pl-4 sm:block"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#01A32E]">DentalJobs</p><p className="text-sm font-bold text-slate-500">Permanent & long-term dental opportunities</p></div>
        </div>
        <div className="flex items-center gap-2">
          {portalRole && <div className="relative"><button type="button" onClick={() => setNotificationsOpen((value) => !value)} aria-label="DentalJobs notifications" className="relative grid h-11 w-11 place-items-center rounded-xl border border-[#002757]/15 bg-white text-[#002757] shadow-sm transition hover:bg-[#edf3fa]"><Bell size={19}/>{notifications.some((item) => !item.readAt) && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-[#EA4335] px-1 text-[10px] font-black text-white ring-2 ring-white">{Math.min(99, notifications.filter((item) => !item.readAt).length)}</span>}</button>{notificationsOpen && <div className="absolute right-0 z-50 mt-2 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#4285F4]">DentalJobs</p><h3 className="font-black text-[#002757]">Notifications</h3></div>{notifications.some((item) => !item.readAt) && <button type="button" onClick={() => void markAllNotificationsRead()} className="text-xs font-black text-[#01A32E] hover:underline">Mark all read</button>}</div><div className="max-h-[420px] overflow-y-auto">{notifications.length === 0 ? <div className="p-6 text-center text-sm font-semibold text-slate-500">No DentalJobs notifications yet.</div> : notifications.map((notification) => <button type="button" key={notification.id} onClick={() => void markNotificationRead(notification)} className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${notification.readAt ? "bg-white" : "bg-[#eef4ff]"}`}><div className="flex items-start gap-3">{!notification.readAt && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#4285F4]"/>}<div className="min-w-0"><p className="text-sm font-black text-[#002757]">{notification.title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{notification.body}</p><p className="mt-1.5 text-[10px] font-bold text-slate-400">{new Date(notification.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p></div></div></button>)}</div></div>}</div>}
          <Link href={backHref} className="inline-flex items-center gap-2 rounded-xl border border-[#002757]/15 bg-white px-4 py-2.5 text-sm font-black text-[#002757] shadow-sm hover:bg-[#edf3fa]"><ChevronLeft size={17} /> <span className="hidden sm:inline">Back to Calendar</span><span className="sm:hidden">Back</span></Link>
        </div>
      </div>
    </header>

    <section className="border-b border-[#002757]/10 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div><h1 className="mt-3 text-3xl font-black tracking-tight text-[#002757] sm:text-4xl">DentalJobs{accountDisplayName ? ` - ${accountDisplayName}` : ""}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Dental offices and dental professionals can find each other while remaining anonymous until there is a genuine application or expression of interest.</p></div>

        <div className={portalRole === "office" ? "mt-6 grid items-stretch gap-4 lg:grid-cols-3" : ""}>
        {portalRole === "office" ? <div className="h-full min-w-0">
          <div className="group relative flex h-full min-h-[250px] flex-col overflow-hidden rounded-2xl border-2 border-[#002757] bg-[#002757] p-5 text-left shadow-xl transition hover:border-[#01A32E] hover:shadow-2xl sm:p-6">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-[#01A32E]" />
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#01A32E] text-white shadow-md ring-4 ring-white/10"><Building2 size={24} /></span>
            <div className="mt-4 flex flex-1 flex-col">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#9be3ad]">Dental Office</p>
              <h2 className="mt-1 text-xl font-black text-white">Post a Position</h2>
              <p className="mt-2 text-sm leading-6 text-slate-200">Create a new anonymous DentalJobs posting from scratch, or import an existing ad and have DentalShift fill the posting form for you.</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button type="button" onClick={() => { setImportPrefill(null); setEditingListing(null); setPostingMode("office"); setSubmitted(false); setPosted(false); setPublishError(""); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#01A32E] px-4 py-2.5 text-sm font-black text-white shadow-md transition hover:bg-white hover:text-[#002757]">Create Posting <BriefcaseBusiness size={16} /></button>
                <button type="button" onClick={() => { setImportAdText(""); setImportError(""); setImportingOfficeAd(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-black text-white transition hover:border-white hover:bg-white hover:text-[#002757]">Import Existing Job Ad <FileText size={16} /></button>
              </div>
            </div>
          </div>
        </div> : <div className={`mt-6 grid gap-4 ${portalRole ? "max-w-2xl" : "lg:grid-cols-2"}`}>
          {portalRole !== "professional" && <button type="button" onClick={() => { setImportPrefill(null); setEditingListing(null); setPostingMode("office"); setSubmitted(false); setPosted(false); setPublishError(""); }} className="group relative overflow-hidden rounded-2xl border-2 border-[#002757] bg-[#002757] p-5 text-left shadow-xl transition hover:-translate-y-1 hover:border-[#01A32E] hover:shadow-2xl"><div className="absolute inset-x-0 top-0 h-1.5 bg-[#01A32E]" /><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#01A32E] text-white shadow-md ring-4 ring-white/10"><Building2 size={24} /></span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#9be3ad]">Dental Office</p><h2 className="mt-1 text-xl font-black text-white">Post a Position</h2><p className="mt-2 text-sm leading-6 text-slate-200">Advertise an opening anonymously. Your office name, exact address and contact information stay private.</p><span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#01A32E] px-4 py-2.5 text-sm font-black text-white shadow-md transition group-hover:bg-white group-hover:text-[#002757]">Create office posting <BriefcaseBusiness size={16} /></span></div></div></button>}
          <button type="button" onClick={() => { setEditingListing(null); setPostingMode("professional"); setSubmitted(false); setPosted(false); setPublishError(""); }} className="group rounded-2xl border-2 border-[#01A32E]/20 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#01A32E] hover:shadow-md"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#01A32E] text-white"><UserRound size={24} /></span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#017f27]">Dental Professional</p><h2 className="mt-1 text-xl font-black text-slate-900">Looking for an Office</h2><p className="mt-2 text-sm leading-6 text-slate-600">Advertise what you are looking for without displaying your identity. Your résumé/CV already on file can be used when you apply.</p><span className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#01A32E]">Create professional posting <FileText size={16} /></span></div></div></button>
        </div>}

        {portalRole === "office" && <section id="my-dentaljobs" className="relative h-full min-h-[250px] min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border-2 border-[#01A32E]/55 bg-[#effaf2] p-4 shadow-md sm:p-5"><div className="absolute inset-y-0 left-0 w-1.5 bg-[#01A32E]" /><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#017f27]">Office postings</p><h2 className="mt-1 text-xl font-black text-[#002757]">My DentalJobs</h2><p className="mt-1 text-sm text-slate-500">Manage your active and previous job ads.</p></div><span className="rounded-full border border-[#01A32E]/30 bg-white px-3 py-1.5 text-xs font-black text-[#017f27] shadow-sm">{myOfficeJobs.length} posting{myOfficeJobs.length === 1 ? "" : "s"}</span></div>{manageError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{manageError}</p>}<div className="mt-4 grid gap-3">{myOfficeJobs.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm font-semibold text-slate-500">You have no DentalJobs postings yet.</div> : myOfficeJobs.map((job) => { const daysLeft = Math.max(0, Math.ceil((new Date(job.expires_at).getTime() - Date.now()) / 86400000)); const isActive = job.status === "active" && daysLeft > 0; const displayStatus = job.status === "active" && daysLeft === 0 ? "expired" : job.status; return <article key={job.id} className="rounded-2xl border border-[#002757]/12 bg-white p-4 shadow-sm ring-1 ring-[#01A32E]/5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${isActive ? "bg-[#eaf8ee] text-[#017f27]" : displayStatus === "paused" ? "bg-amber-50 text-amber-700" : displayStatus === "filled" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{displayStatus}</span>{isActive && <span className="text-xs font-bold text-slate-400">{daysLeft} day{daysLeft === 1 ? "" : "s"} remaining</span>}</div><h3 className="mt-2 font-black text-slate-900">{job.profession} — {job.employment_type}</h3><p className="mt-1 text-sm text-slate-500">{job.city}, {job.province}</p><div className="mt-3"><ShareListingButton listingId={job.id} compact /></div></div><div className="relative"><button type="button" onClick={() => setManagingId(managingId === job.id ? null : job.id)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#002757] bg-[#002757] px-4 py-2.5 text-sm font-black text-white shadow-lg ring-2 ring-[#01A32E]/15 transition hover:-translate-y-0.5 hover:border-[#01A32E] hover:bg-[#01A32E] hover:shadow-xl sm:w-auto"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#01A32E] text-white shadow-sm group-hover:bg-white group-hover:text-[#002757]"><MoreVertical size={15} /></span> Manage Posting</button>{managingId === job.id && <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"><button type="button" onClick={() => openEditListing(job)} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><Pencil size={15}/> Edit Posting</button>{displayStatus === "paused" ? <button type="button" onClick={() => void manageOfficeJob(job,"resume")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><Play size={15}/> Resume Posting</button> : isActive && <button type="button" onClick={() => void manageOfficeJob(job,"pause")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><Pause size={15}/> Pause Posting</button>}<button type="button" onClick={() => void manageOfficeJob(job,"filled")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><Check size={15}/> Mark Position Filled</button><button type="button" onClick={() => void manageOfficeJob(job,"renew")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><RefreshCw size={15}/> Renew for 30 Days</button><button type="button" onClick={() => void manageOfficeJob(job,"close")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><X size={15}/> Close Posting</button><button type="button" onClick={() => void manageOfficeJob(job,"delete")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50"><Trash2 size={15}/> Delete Posting</button></div>}</div></div></article>})}</div></section>}

        {portalRole === "professional" && <section className="relative mt-6 overflow-hidden rounded-2xl border-2 border-[#4285F4]/55 bg-[#eef4ff] p-4 shadow-md sm:p-5"><div className="absolute inset-y-0 left-0 w-1.5 bg-[#4285F4]" /><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#245FB8]">My availability ads</p><h2 className="mt-1 text-xl font-black text-[#002757]">My DentalJobs</h2><p className="mt-1 text-sm text-slate-500">Manage your active and previous Looking for an Office ads.</p></div><span className="rounded-full border border-[#4285F4]/30 bg-white px-3 py-1.5 text-xs font-black text-[#245FB8] shadow-sm">{myProfessionalJobs.length} posting{myProfessionalJobs.length === 1 ? "" : "s"}</span></div>{manageError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{manageError}</p>}<div className="mt-4 grid gap-3">{myProfessionalJobs.length === 0 ? <div className="rounded-xl border border-dashed border-[#4285F4]/40 bg-white p-5 text-sm font-semibold text-slate-500">You have no Looking for an Office postings yet.</div> : myProfessionalJobs.map((job) => { const daysLeft = Math.max(0, Math.ceil((new Date(job.expires_at).getTime() - Date.now()) / 86400000)); const isActive = job.status === "active" && daysLeft > 0; const displayStatus = job.status === "active" && daysLeft === 0 ? "expired" : job.status; const theme = getProfessionalCardTheme(job.profession); return <article key={job.id} className="rounded-2xl border-2 bg-white p-4 shadow-sm" style={{ borderColor: theme.border }}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${isActive ? "bg-[#eaf8ee] text-[#017f27]" : displayStatus === "paused" ? "bg-amber-50 text-amber-700" : displayStatus === "filled" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{displayStatus === "filled" ? "found office" : displayStatus}</span>{isActive && <span className="text-xs font-bold text-slate-400">{daysLeft} day{daysLeft === 1 ? "" : "s"} remaining</span>}</div><h3 className="mt-2 font-black" style={{ color: theme.text }}>{job.profession} — {job.employment_type}</h3><p className="mt-1 text-sm text-slate-500">{job.city}, {job.province}</p><div className="mt-3"><ShareListingButton listingId={job.id} compact /></div></div><div className="relative"><button type="button" onClick={() => setManagingId(managingId === job.id ? null : job.id)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-95 hover:shadow-xl sm:w-auto" style={{ borderColor: theme.accent, backgroundColor: theme.accent }}><MoreVertical size={16} /> Manage Posting</button>{managingId === job.id && <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl"><button type="button" onClick={() => openEditProfessionalListing(job)} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><Pencil size={15}/> Edit Posting</button>{displayStatus === "paused" ? <button type="button" onClick={() => void manageProfessionalJob(job,"resume")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><Play size={15}/> Resume Posting</button> : isActive && <button type="button" onClick={() => void manageProfessionalJob(job,"pause")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><Pause size={15}/> Pause Posting</button>}<button type="button" onClick={() => void manageProfessionalJob(job,"found")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><Check size={15}/> I Found an Office</button><button type="button" onClick={() => void manageProfessionalJob(job,"renew")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><RefreshCw size={15}/> Renew for 14 Days</button><button type="button" onClick={() => void manageProfessionalJob(job,"close")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold hover:bg-slate-50"><X size={15}/> Close Posting</button><button type="button" onClick={() => void manageProfessionalJob(job,"delete")} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50"><Trash2 size={15}/> Delete Posting</button></div>}</div></div></article>})}</div></section>}

        {portalRole && <section className={`${portalRole === "office" ? "h-full min-h-[250px] min-w-0" : "mt-6"} rounded-2xl border border-[#002757]/15 bg-white p-4 shadow-sm sm:p-5`}><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#4285F4]">DentalJobs connections</p><h2 className="mt-1 text-xl font-black text-[#002757]">{portalRole === "office" ? "Applications & Interest" : "My Applications & Office Interest"}</h2><p className="mt-1 text-sm text-slate-500">{portalRole === "office" ? "Review professionals who applied and track professionals your office contacted." : "Track your applications and offices that expressed interest in you."}</p></div><span className="rounded-full bg-[#edf3fa] px-3 py-1.5 text-xs font-black text-[#002757]">{connections.length} connection{connections.length === 1 ? "" : "s"}</span></div>{connectionError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{connectionError}</p>}{unlockError && <div className="mt-3 flex flex-col gap-2 rounded-xl bg-rose-50 p-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-bold text-rose-700">{unlockError}</p>{unlockError.toLowerCase().includes("credit card") && <button type="button" onClick={() => void setupBillingCard()} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#002757] px-3.5 py-2 text-xs font-black text-white"><CreditCard size={14}/> Add Card</button>}</div>}<div className="mt-4 grid gap-3">{connections.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">No DentalJobs applications or expressions of interest yet.</div> : connections.map((item) => { const initiatedByMe = item.initiatorRole === portalRole; const statusLabel = item.status === "interested" ? "Interested" : item.status === "declined" ? "Not Interested" : item.status === "withdrawn" ? "Withdrawn" : "Pending"; return <article key={item.id} className={`relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${portalRole === "professional" ? "pt-12" : ""}`}><button type="button" disabled={connectionDeletingId === item.id} onClick={() => void softDeleteConnection(item)} className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[11px] font-black text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"><Trash2 size={12}/>{connectionDeletingId === item.id ? "Deleting…" : "Delete"}</button><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${item.status === "interested" ? "bg-[#eaf8ee] text-[#017f27]" : item.status === "declined" ? "bg-rose-50 text-rose-700" : item.status === "withdrawn" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700"}`}>{statusLabel}</span><span className="rounded-full bg-[#edf3fa] px-2.5 py-1 text-[11px] font-black text-[#002757]">{initiatedByMe ? "Sent by you" : "Received"}</span></div><h3 className="mt-2 font-black text-[#002757]">{item.profession}{item.employment ? ` — ${item.employment}` : ""}</h3><p className="mt-1 text-sm text-slate-500">{item.city}{item.city && item.province ? ", " : ""}{item.province}</p>{item.message && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">“{item.message}”</p>}{portalRole === "office" && item.candidatePreview && <div className="mt-3 max-w-2xl rounded-2xl border border-[#4285F4]/20 bg-[#f7faff] p-4"><div className="flex items-center gap-2"><FileText size={16} className="text-[#4285F4]"/><p className="text-xs font-black uppercase tracking-[0.12em] text-[#4285F4]">Candidate Preview</p></div><p className="mt-2 text-sm font-bold leading-6 text-[#002757]">{item.candidatePreview.summary}</p><div className="mt-3 flex flex-wrap gap-2">{item.candidatePreview.yearsExperience != null && <span className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-200">{item.candidatePreview.yearsExperience} yrs experience</span>}{item.candidatePreview.skills.slice(0,4).map((skill) => <span key={skill} className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-200">{skill}</span>)}{item.candidatePreview.software.slice(0,3).map((software) => <span key={software} className="rounded-lg bg-[#eef4ff] px-2.5 py-1.5 text-xs font-black text-[#245FB8]">{software}</span>)}</div>{item.candidatePreview.certifications.length > 0 && <p className="mt-3 text-xs font-bold text-[#017f27]">Qualifications: {item.candidatePreview.certifications.join(" · ")}</p>}<p className="mt-3 text-[11px] font-semibold leading-5 text-slate-400">Name, direct contact details, exact address, employer names and the original résumé are withheld before candidate unlock.</p></div>}</div>{item.status === "pending" && <div className="flex flex-wrap gap-2 sm:justify-end">{portalRole === "professional" ? (initiatedByMe ? <button type="button" disabled={connectionBusy} onClick={() => void updateConnection(item,"withdrawn")} className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50">Withdraw</button> : <><button type="button" disabled={connectionBusy} onClick={() => void updateConnection(item,"declined")} className="rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 disabled:opacity-50">Not Interested</button><button type="button" disabled={connectionBusy} onClick={() => void updateConnection(item,"interested")} className="rounded-xl bg-[#01A32E] px-3.5 py-2 text-xs font-black text-white shadow-sm hover:bg-[#018a28] disabled:opacity-50">Interested</button></>) : initiatedByMe ? <span className="rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-black text-amber-700">Awaiting Response</span> : <><button type="button" disabled={connectionBusy || unlockBusyId === item.id} onClick={() => void updateConnection(item,"declined")} className="rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-black text-rose-600 hover:bg-rose-50 disabled:opacity-50">Not Interested</button><button type="button" disabled={unlockBusyId === item.id} onClick={() => void startCandidateUnlock(item)} className="inline-flex items-center gap-2 rounded-xl bg-[#01A32E] px-4 py-2.5 text-xs font-black text-white shadow-md hover:bg-[#018a28] disabled:opacity-50"><CreditCard size={15}/>{unlockBusyId === item.id ? "Unlocking…" : "Unlock Candidate — $29 CAD · billed monthly"}</button></>}</div>}{item.status === "interested" && <div className="flex flex-wrap gap-2 sm:justify-end">{isCandidateUnlocked(item) ? <>{portalRole === "office" && <button type="button" disabled={unlockBusyId === item.id} onClick={() => void viewUnlockedCandidate(item)} className="inline-flex items-center gap-2 rounded-xl border border-[#01A32E]/30 bg-[#eaf8ee] px-4 py-2.5 text-xs font-black text-[#017f27] hover:bg-[#dff5e5]"><FileText size={15}/> View Candidate</button>}<button type="button" onClick={() => void openChat(item)} className="inline-flex items-center gap-2 rounded-xl bg-[#002757] px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#01A32E] hover:shadow-lg"><MessageCircle size={15}/> Message</button></> : portalRole === "office" ? <button type="button" disabled={unlockBusyId === item.id} onClick={() => void startCandidateUnlock(item)} className="inline-flex items-center gap-2 rounded-xl bg-[#01A32E] px-4 py-2.5 text-xs font-black text-white shadow-md hover:bg-[#018a28] disabled:opacity-50"><CreditCard size={15}/>{unlockBusyId === item.id ? "Unlocking…" : "Unlock Candidate — $29 CAD · billed monthly"}</button> : <span className="rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-black text-amber-700">Waiting for office to unlock connection</span>}</div>}</div></article>})}</div></section>}

        </div>

        <div className="dentaljobs-legacy-filterbar mt-6 grid gap-3 rounded-2xl border-2 border-[#4285F4] bg-[#4285F4] p-3 shadow-md md:grid-cols-[1.4fr_.8fr_.9fr] lg:grid-cols-[1.5fr_.7fr_.9fr_auto]">
          <label className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search position or city" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm font-semibold outline-none focus:border-[#01A32E]" /></label>
          <label className="relative"><MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-8 text-sm font-black text-[#002757] outline-none focus:border-[#01A32E]">{distances.map((value) => <option key={value} value={value}>{value} km</option>)}</select></label>
          <label className="relative"><Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><select value={profession} onChange={(e) => setProfession(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-8 text-sm font-semibold outline-none focus:border-[#01A32E]">{professions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 md:col-span-3 lg:col-span-1">{([['all','All'],['office','Hiring'],['professional','Seeking']] as const).map(([value,label]) => <button type="button" key={value} onClick={() => setKind(value)} className={`flex-1 rounded-lg px-3 py-2 text-xs font-black transition ${kind === value ? "bg-[#002757] text-white" : "text-slate-500 hover:bg-slate-50"}`}>{label}</button>)}</div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-black text-[#002757]">Dental job opportunities within {radius} km</h2><p className="mt-1 text-sm text-slate-500">{visibleAds.length} active listing{visibleAds.length === 1 ? "" : "s"} shown</p></div><p className="hidden text-sm font-semibold text-slate-400 sm:block">Closest opportunities first</p></div>
      <div className="grid gap-5 lg:grid-cols-2">{visibleAds.map((ad) => <article key={ad.id} className={`group relative overflow-hidden rounded-3xl border-2 bg-white shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl ${ad.featured ? "ring-2 ring-[#FDB605]/30" : ""}`} style={{ borderColor: ad.kind === "office" ? "rgba(0,39,87,0.18)" : getProfessionalCardTheme(ad.profession).border }}><div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: ad.kind === "office" ? "#002757" : getProfessionalCardTheme(ad.profession).accent }} />{ad.featured && <div className="absolute right-4 top-4 rounded-full bg-[#FDB605] px-3 py-1.5 text-[11px] font-black text-white shadow-sm"><Star size={12} className="mr-1 inline fill-white" />Featured</div>}<div className="p-5 sm:p-6"><div className="flex items-start gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: ad.kind === "office" ? "#002757" : getProfessionalCardTheme(ad.profession).accent }}>{ad.kind === "office" ? <Building2 size={26} /> : <UserRound size={26} />}</div><div className="min-w-0 flex-1 pr-16"><span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black tracking-wide ${ad.kind === "office" ? "bg-[#edf3fa] text-[#002757]" : ""}`} style={ad.kind === "professional" ? { backgroundColor: getProfessionalCardTheme(ad.profession).pale, color: getProfessionalCardTheme(ad.profession).text } : undefined}>{ad.kind === "office" ? "OFFICE HIRING" : "PROFESSIONAL SEEKING OFFICE"}</span><h3 className={`mt-2 text-xl font-black leading-6 ${ad.kind === "office" ? "text-[#002757]" : ""}`} style={ad.kind === "professional" ? { color: getProfessionalCardTheme(ad.profession).text } : undefined}>{ad.title}</h3></div></div><div className="mt-5 grid gap-2.5 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 px-3.5 py-3"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Location</p><p className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-slate-700"><MapPin size={15} />{ad.city}</p></div><div className="rounded-xl bg-slate-50 px-3.5 py-3"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Distance</p><p className="mt-1 text-sm font-bold text-slate-700">{ad.distance} km away</p></div></div><p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{ad.description}</p><div className="mt-5 flex flex-wrap gap-2"><span className={`rounded-lg px-3 py-2 text-xs font-black ${ad.kind === "office" ? "bg-[#edf3fa] text-[#002757]" : ""}`} style={ad.kind === "professional" ? { backgroundColor: getProfessionalCardTheme(ad.profession).pale, color: getProfessionalCardTheme(ad.profession).text } : undefined}>{ad.employment}</span><span className="rounded-lg bg-[#fff7df] px-3 py-2 text-xs font-black text-[#8a6200]">{ad.pay}</span><span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500"><Clock3 size={13} className="mr-1 inline" />{ad.posted}</span></div></div><div className={`flex items-center justify-between gap-3 border-t px-5 py-4 sm:px-6 ${ad.kind === "office" ? "border-[#002757]/10 bg-[#f7f9fc]" : ""}`} style={ad.kind === "professional" ? { borderColor: getProfessionalCardTheme(ad.profession).border, backgroundColor: getProfessionalCardTheme(ad.profession).pale } : undefined}><span className={`text-xs font-black ${ad.kind === "office" ? "text-[#002757]" : ""}`} style={ad.kind === "professional" ? { color: getProfessionalCardTheme(ad.profession).text } : undefined}>{ad.kind === "office" ? "Anonymous office opportunity" : "Anonymous professional profile"}</span><div className="flex flex-wrap items-center justify-end gap-2">{typeof ad.id === "string" && <ShareListingButton listingId={ad.id} compact />}{(() => { const existing = existingConnectionFor(ad); const actionable = (portalRole === "professional" && ad.kind === "office") || (portalRole === "office" && ad.kind === "professional"); const label = existing ? (existing.status === "pending" ? "Pending" : existing.status === "interested" ? "Interested" : existing.status === "declined" ? "Not Interested" : "Withdrawn") : portalRole === "professional" && ad.kind === "office" ? "Apply" : portalRole === "office" && ad.kind === "professional" ? "I'm Interested" : "View Opportunity"; return <button type="button" disabled={Boolean(existing) || !actionable} onClick={() => actionable && !existing && openConnection(ad)} className={`rounded-xl px-4 py-2.5 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:brightness-95 hover:shadow-lg disabled:cursor-default disabled:opacity-70 ${ad.kind === "office" ? "bg-[#002757]" : ""}`} style={ad.kind === "professional" ? { backgroundColor: getProfessionalCardTheme(ad.profession).accent } : undefined}>{label}</button>; })()}</div></div></article>)}</div>
    </section>

    {unlockedCandidate && <div className="fixed inset-0 z-[110] overflow-y-auto bg-[#002757]/70 p-4 sm:p-6"><button type="button" aria-label="Close candidate details" onClick={() => setUnlockedCandidate(null)} className="fixed inset-0"/><section role="dialog" aria-modal="true" className="relative mx-auto my-6 w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-start justify-between gap-4 bg-[#002757] p-5 text-white"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#9be3ad]">Candidate Unlocked</p><h2 className="mt-1 text-2xl font-black">{unlockedCandidate.name}</h2><p className="mt-1 text-sm text-slate-300">{unlockedCandidate.profession || "Dental Professional"}</p></div><button type="button" onClick={() => setUnlockedCandidate(null)} className="rounded-xl bg-white/10 p-2 hover:bg-white/20"><X size={21}/></button></div><div className="p-5 sm:p-6"><div className="rounded-2xl border border-[#01A32E]/25 bg-[#f3fbf5] p-4"><p className="text-sm font-black text-[#017f27]">This candidate has been unlocked for your office.</p><p className="mt-1 text-xs leading-5 text-slate-600">This $29 Candidate Unlock is added to your office’s monthly DentalShift invoice. Your office will not be charged again for this same professional.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{unlockedCandidate.email && <a href={`mailto:${unlockedCandidate.email}`} className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50"><Mail size={17} className="text-[#4285F4]"/><p className="mt-2 text-xs font-black uppercase text-slate-400">Email</p><p className="mt-1 break-all text-sm font-bold text-[#002757]">{unlockedCandidate.email}</p></a>}{unlockedCandidate.phone && <a href={`tel:${unlockedCandidate.phone}`} className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50"><Phone size={17} className="text-[#01A32E]"/><p className="mt-2 text-xs font-black uppercase text-slate-400">Phone</p><p className="mt-1 text-sm font-bold text-[#002757]">{unlockedCandidate.phone}</p></a>}<div className="rounded-2xl border border-slate-200 p-4"><MapPin size={17} className="text-[#EA4335]"/><p className="mt-2 text-xs font-black uppercase text-slate-400">Location</p><p className="mt-1 text-sm font-bold text-[#002757]">{[unlockedCandidate.address, unlockedCandidate.city, unlockedCandidate.province, unlockedCandidate.postalCode].filter(Boolean).join(", ") || "Not listed"}</p></div><div className="rounded-2xl border border-slate-200 p-4"><ShieldCheck size={17} className="text-[#7C3AED]"/><p className="mt-2 text-xs font-black uppercase text-slate-400">Licence / Registration</p><p className="mt-1 text-sm font-bold text-[#002757]">{[unlockedCandidate.licenceProvince, unlockedCandidate.licenceNumber].filter(Boolean).join(" ") || "Not listed"}</p></div></div>{unlockedCandidate.resumeUrl ? <a href={unlockedCandidate.resumeUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#01A32E] px-5 py-3.5 text-sm font-black text-white shadow-md hover:bg-[#018a28]"><Download size={18}/> Open Original Résumé / CV</a> : <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">No original résumé is currently available.</p>}</div></section></div>}

    {activeChat && <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#002757]/70 p-3 sm:p-6"><button type="button" aria-label="Close conversation" onClick={() => setActiveChat(null)} className="fixed inset-0" /><section role="dialog" aria-modal="true" className="relative mx-auto my-3 flex h-[min(760px,calc(100vh-24px))] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:my-6 sm:h-[min(760px,calc(100vh-48px))]"><div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#002757] p-4 text-white sm:p-5"><div className="min-w-0"><div className="flex items-center gap-2"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#01A32E]"><MessageCircle size={18}/></span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#9be3ad]">Private DentalShift Messaging</p><h2 className="truncate text-lg font-black">{activeChat.profession}{activeChat.employment ? ` — ${activeChat.employment}` : ""}</h2></div></div><p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-300"><LockKeyhole size={13}/> Direct contact details are not automatically shared by DentalShift.</p></div><button type="button" onClick={() => setActiveChat(null)} className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20"><X size={21}/></button></div><div className="flex-1 overflow-y-auto bg-[#f5f8fb] p-4 sm:p-5"><div className="mb-4 rounded-2xl border border-[#4285F4]/20 bg-white p-3 text-sm text-slate-600"><span className="font-black text-[#002757]">Opportunity:</span> {activeChat.city}{activeChat.city && activeChat.province ? ", " : ""}{activeChat.province}. You are chatting as <span className="font-black text-[#002757]">{portalRole === "office" ? "Dental Office" : "Dental Professional"}</span>.</div>{chatMessages.length === 0 ? <div className="grid min-h-[220px] place-items-center text-center"><div><MessageCircle size={34} className="mx-auto text-slate-300"/><p className="mt-3 font-black text-[#002757]">Start the conversation</p><p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">Both sides have expressed interest. Continue the conversation inside DentalShift. Candidate Unlock is complete for this connection. Continue the conversation inside DentalShift or use the unlocked contact details.</p></div></div> : <div className="space-y-3">{chatMessages.map((message) => { const mine = message.senderRole === portalRole; return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${mine ? "bg-[#002757] text-white" : "border border-slate-200 bg-white text-slate-700"}`}><p className={`mb-1 text-[10px] font-black uppercase tracking-wide ${mine ? "text-[#9be3ad]" : "text-[#4285F4]"}`}>{mine ? "You" : portalRole === "office" ? "Dental Professional" : "Dental Office"}</p><p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p><p className={`mt-1.5 text-[10px] font-bold ${mine ? "text-slate-300" : "text-slate-400"}`}>{new Date(message.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p></div></div>})}</div>}{chatError && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{chatError}</p>}</div><div className="border-t border-slate-200 bg-white p-3 sm:p-4"><div className="flex items-end gap-2"><textarea value={chatDraft} onChange={(e) => setChatDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendChatMessage(); } }} rows={2} maxLength={2000} placeholder="Write a private message…" className="min-h-[52px] flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#4285F4]"/><button type="button" disabled={chatBusy || !chatDraft.trim()} onClick={() => void sendChatMessage()} className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl bg-[#01A32E] text-white shadow-md transition hover:bg-[#018a28] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message"><Send size={20}/></button></div><p className="mt-2 text-center text-[11px] font-semibold text-slate-400">Press Enter to send · Shift+Enter for a new line</p></div></section></div>}

    {selectedOpportunity && <div className="fixed inset-0 z-[95] overflow-y-auto bg-[#002757]/65 p-4 sm:p-6"><button type="button" aria-label="Close connection form" onClick={() => setSelectedOpportunity(null)} className="fixed inset-0" /><section role="dialog" aria-modal="true" className="relative mx-auto my-8 w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="border-b border-slate-200 p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#4285F4]">DentalJobs</p><h2 className="mt-1 text-2xl font-black text-[#002757]">{portalRole === "professional" ? "Apply to this position" : "Express Interest"}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{portalRole === "professional" ? "DentalShift does not automatically reveal your account contact details. Your résumé/CV may contain identifying or contact information." : "DentalShift does not automatically reveal your office account contact details at this stage."}</p></div><button type="button" onClick={() => setSelectedOpportunity(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={22}/></button></div></div><div className="p-5 sm:p-6"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-wide text-slate-400">Opportunity</p><h3 className="mt-1 font-black text-[#002757]">{selectedOpportunity.title}</h3><p className="mt-1 text-sm text-slate-500">{selectedOpportunity.city}</p></div>{portalRole === "professional" && <div className={`mt-4 rounded-2xl border p-4 ${resumePath ? "border-[#01A32E]/25 bg-[#f3fbf5]" : "border-amber-200 bg-amber-50"}`}><div className="flex items-start gap-3"><FileText size={20} className={resumePath ? "text-[#01A32E]" : "text-amber-600"}/><div><p className="font-black text-[#002757]">{resumePath ? "Candidate Preview will be shared" : "No résumé/CV currently on file"}</p><p className="mt-1 text-sm leading-6 text-slate-600">{resumePath ? "DentalShift shares the sanitized Candidate Preview generated from your résumé. Your original résumé, name and direct contact details stay private until a dental office purchases Candidate Unlock." : "Upload a PDF or DOCX résumé in your professional profile so DentalShift can generate a privacy-safe Candidate Preview before you apply."}</p></div></div></div>}<label className="mt-4 block"><span className="text-sm font-black text-[#002757]">Optional message</span><textarea value={connectionMessage} onChange={(e) => setConnectionMessage(e.target.value)} rows={4} maxLength={600} placeholder={portalRole === "professional" ? "Add a short note to the dental office…" : "Add a short note to the professional…"} className="mt-2 w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:border-[#4285F4]" /></label>{connectionError && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{connectionError}</p>}<div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" disabled={connectionBusy} onClick={() => setSelectedOpportunity(null)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-[#002757] disabled:opacity-50">Cancel</button><button type="button" disabled={connectionBusy} onClick={() => void sendConnection()} className="rounded-xl bg-[#01A32E] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#018a28] disabled:opacity-50">{connectionBusy ? "Sending…" : portalRole === "professional" ? "Send Application" : "Send Interest"}</button></div></div></section></div>}

    {importingOfficeAd && <div className="fixed inset-0 z-[92] overflow-y-auto bg-[#002757]/70 p-4 sm:p-6"><button type="button" aria-label="Close import job ad" onClick={() => setImportingOfficeAd(false)} className="fixed inset-0" /><section role="dialog" aria-modal="true" className="relative mx-auto my-8 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#002757] p-5 text-white sm:p-6"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#9be3ad]">Quick Import</p><h2 className="mt-1 text-2xl font-black">Import Existing Job Ad</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">Paste an ad your office already posted on Indeed or another job site. DentalShift will use it to fill in the posting form for you.</p></div><button type="button" onClick={() => setImportingOfficeAd(false)} className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20"><X size={22} /></button></div><div className="p-5 sm:p-6"><label className="block"><span className="text-sm font-black text-[#002757]">Paste your existing job ad</span><textarea autoFocus value={importAdText} onChange={(e) => { setImportAdText(e.target.value); if (importError) setImportError(""); }} rows={12} placeholder="Copy the text from your existing Indeed or other job posting and paste it here…" className="mt-2 w-full resize-y rounded-2xl border border-slate-300 p-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-[#01A32E] focus:ring-2 focus:ring-[#01A32E]/15" /></label><div className="mt-4 rounded-2xl border border-[#01A32E]/25 bg-[#f3fbf5] p-4"><div className="flex items-start gap-3"><FileText size={20} className="mt-0.5 shrink-0 text-[#01A32E]" /><div><p className="font-black text-[#002757]">We’ll organize it for you</p><p className="mt-1 text-sm leading-6 text-slate-600">DentalShift will identify the likely position, employment type, pay range, days per week and province when they appear in the ad. You can review and change every field before posting.</p></div></div></div><div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4"><div className="flex items-start gap-3"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-amber-600" /><div><p className="font-black text-[#7a4b00]">Review identifying details before posting</p><p className="mt-1 text-sm leading-6 text-amber-900">Your imported ad may contain your clinic name, address, phone number, email address or website. DentalShift will not remove those details automatically. If you leave them in the ad, they will be visible publicly. Remove or edit anything you prefer to keep private before you post.</p></div></div></div>{importError && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{importError}</p>}<div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => setImportingOfficeAd(false)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-[#002757]">Cancel</button><button type="button" onClick={importExistingOfficeAd} className="rounded-xl bg-[#01A32E] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#018a28]">Fill Posting Form</button></div></div></section></div>}

    {postingMode && <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#002757]/65 p-4 sm:p-6"><button type="button" aria-label="Close posting form" onClick={() => setPostingMode(null)} className="fixed inset-0" /><section role="dialog" aria-modal="true" className="relative mx-auto my-4 w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6"><div><p className={`text-xs font-black uppercase tracking-[0.12em] ${postingMode === "office" ? "text-[#002757]" : "text-[#017f27]"}`}>{postingMode === "office" ? "Dental Office" : "Dental Professional"}</p><h2 className="mt-1 text-2xl font-black text-slate-900">{editingListing ? "Edit Posting" : postingMode === "office" ? "Post a Position" : "Looking for an Office"}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{postingMode === "office" ? "DentalShift does not automatically add your office account identity or contact details. Any clinic name, address, phone number, email or website you include in the ad itself will appear publicly." : "Your name and direct contact information will not appear publicly. DentalShift can use the résumé/CV already stored in your account when you apply."}</p></div><button type="button" onClick={() => setPostingMode(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={22} /></button></div>
      {posted ? <div className="p-8 text-center sm:p-10"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#eaf8ee] text-[#01A32E]"><Check size={32} strokeWidth={3} /></div><h3 className="mt-5 text-2xl font-black text-[#002757]">{editingListing ? "Changes saved" : "Your ad is now live"}</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{editingListing ? "Your DentalJobs posting has been updated." : `Your DentalJobs posting has been published and is now visible in the active job listings. It will remain active for ${postingMode === "office" ? 30 : 14} days unless you close it earlier.`}</p><button type="button" onClick={() => { setPostingMode(null); setSubmitted(false); setPosted(false); setPreview(null); }} className="mt-6 rounded-xl bg-[#002757] px-5 py-3 text-sm font-black text-white">View DentalJobs</button></div> : submitted && preview ? <div className="p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#01A32E]">Posting Preview</p><h3 className="mt-1 text-2xl font-black text-[#002757]">Review your listing</h3><p className="mt-1 text-sm text-slate-500">This is how your anonymous DentalJobs posting will be presented.</p></div><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eaf8ee] text-[#01A32E]"><Check size={24} strokeWidth={3} /></div></div><article className="mt-5 overflow-hidden rounded-2xl border-2 border-[#002757]/15 bg-white shadow-sm"><div className="border-b border-slate-100 bg-[#f8fafc] p-5"><span className="rounded-full bg-[#edf3fa] px-2.5 py-1 text-[11px] font-black text-[#002757]">{postingMode === "office" ? "OFFICE HIRING" : "PROFESSIONAL LOOKING FOR AN OFFICE"}</span><h4 className="mt-3 text-xl font-black text-slate-900">{preview.position}</h4></div><div className="grid gap-4 p-5 sm:grid-cols-2"><div><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Employment</p><p className="mt-1 font-bold text-[#002757]">{preview.employment}</p></div><div><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Location</p><p className="mt-1 font-bold text-[#002757]">{preview.city}, {preview.province}</p></div><div><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Days / week</p><p className="mt-1 font-bold text-[#002757]">{preview.days || "Not specified"}</p></div><div><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Compensation</p><p className="mt-1 font-bold text-[#002757]">{preview.payFrom || preview.payTo ? `${preview.payFrom ? `$${preview.payFrom}` : ""}${preview.payFrom && preview.payTo ? " – " : ""}${preview.payTo ? `$${preview.payTo}` : ""}/hr` : "Not specified"}</p></div>{preview.schedule && <div className="sm:col-span-2"><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Schedule / hours</p><p className="mt-1 font-bold text-[#002757]">{preview.schedule}</p></div>}<div className="sm:col-span-2"><p className="text-[11px] font-black uppercase tracking-wide text-slate-400">About the opportunity</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{preview.description}</p></div></div></article><div className="mt-5 rounded-2xl border border-[#01A32E]/25 bg-[#f3fbf5] p-4"><div className="flex items-start gap-3"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#01A32E]" /><div><p className="font-black text-[#002757]">{postingMode === "office" ? "Public listing review" : "Anonymous preview"}</p><p className="mt-1 text-sm leading-6 text-slate-600">{postingMode === "office" ? "DentalShift does not add your office account contact details automatically. Any clinic name, address, phone number, email or website you included in the ad text will be visible publicly." : "Your identity and direct contact information remain hidden from this public listing."}</p></div></div></div>{publishError && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{publishError}</p>}<div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" disabled={publishing} onClick={() => { setSubmitted(false); setPublishError(""); }} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-[#002757] disabled:opacity-50">Back to Edit</button>{postingMode === "office" ? <button type="button" disabled={publishing} onClick={() => void (editingListing ? saveEditedOfficeAd() : publishOfficeAd())} className="rounded-xl bg-[#01A32E] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#018a28] disabled:opacity-50">{publishing ? (editingListing ? "Saving…" : "Posting…") : (editingListing ? "Save Changes" : "Post Ad")}</button> : <button type="button" disabled={publishing} onClick={() => void (editingListing ? saveEditedProfessionalAd() : publishProfessionalAd())} className="rounded-xl bg-[#4285F4] px-5 py-3 text-sm font-black text-white shadow-sm hover:brightness-95 disabled:opacity-50">{publishing ? (editingListing ? "Saving…" : "Posting…") : (editingListing ? "Save Changes" : "Post Ad")}</button>}</div></div> : <form onSubmit={submitPreview} className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <label className="field sm:col-span-2"><span>Position</span><select name="position" required defaultValue={editingListing?.profession || (postingMode === "office" ? importPrefill?.position || "" : professionalProfession)}><option value="" disabled>Select a position</option>{jobProfessions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field"><span>{postingMode === "office" ? "Employment type" : "Position wanted"}</span><select name="employment" required defaultValue={editingListing?.employment_type || (postingMode === "office" ? importPrefill?.employment || "Full-Time" : "Full-Time")}>{employmentOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field"><span>City / Area</span><input key={`${postingMode}-${officeLocation.city}-${professionalLocation.city}`} name="city" required defaultValue={editingListing?.city || (postingMode === "office" ? importPrefill?.city || officeLocation.city : professionalLocation.city)} placeholder="e.g. Calgary NW" /></label>
        <label className="field"><span>Province</span><select key={`${postingMode}-${officeLocation.province}-${professionalLocation.province}`} name="province" required defaultValue={editingListing?.province || (postingMode === "office" ? importPrefill?.province || officeLocation.province : professionalLocation.province)}>{["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="field"><span>{postingMode === "office" ? "Approximate days / week" : "Days / week wanted"}</span><select name="days" defaultValue={editingListing?.days_per_week || (postingMode === "office" ? importPrefill?.days || "4" : "4")}><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>Flexible</option></select></label>
        <label className="field"><span>{postingMode === "office" ? "Pay from" : "Desired pay from"}</span><input name="pay_from" defaultValue={editingListing?.pay_min ?? (postingMode === "office" ? importPrefill?.payFrom || "" : "")} type="number" min="0" step="1" placeholder="$ / hour" /></label>
        <label className="field"><span>{postingMode === "office" ? "Pay to" : "Desired pay / target"}</span><input name="pay_to" defaultValue={editingListing?.pay_max ?? (postingMode === "office" ? importPrefill?.payTo || "" : "")} type="number" min="0" step="1" placeholder="$ / hour" /></label>
        <label className="field sm:col-span-2"><span>{postingMode === "office" ? "Schedule / hours" : "Preferred schedule"}</span><input name="schedule" defaultValue={editingListing?.schedule || (postingMode === "office" ? importPrefill?.schedule || "" : "")} placeholder={postingMode === "office" ? "e.g. Monday–Thursday, 8:00 AM–4:30 PM" : "e.g. Monday, Tuesday & Thursday"} /></label>
        <label className="field sm:col-span-2"><span>{postingMode === "office" ? "About the opportunity" : "What are you looking for?"}</span><textarea name="description" defaultValue={editingListing?.description || (postingMode === "office" ? importPrefill?.description || "" : "")} required rows={5} maxLength={1500} placeholder={postingMode === "office" ? "Describe the position, practice environment, responsibilities and what would make someone a good fit." : "Describe the type of office, schedule, role and work environment you are looking for."} /></label>
        <div className="rounded-2xl border border-[#01A32E]/25 bg-[#f3fbf5] p-4 sm:col-span-2"><div className="flex items-start gap-3"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#01A32E]" /><div><p className="font-black text-[#002757]">Anonymous by default</p><p className="mt-1 text-sm leading-6 text-slate-600">{postingMode === "office" ? "Public listings will show only general location and job details. Office name, exact address, phone, email, website and logo stay hidden." : "Public listings will show only profession, general location and the information you choose above. Your name, phone, email and exact address stay hidden."}</p></div></div></div>
        {postingMode === "professional" && <div className="rounded-2xl border border-[#002757]/15 bg-[#edf3fa] p-4 sm:col-span-2"><div className="flex items-start gap-3"><FileText size={20} className="mt-0.5 shrink-0 text-[#002757]" /><div><p className="font-black text-[#002757]">Résumé/CV on file</p><p className="mt-1 text-sm leading-6 text-slate-600">When you apply to an office position, DentalShift can use the private résumé/CV stored in your professional profile instead of asking you to upload it again.</p></div></div></div>}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:col-span-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setPostingMode(null)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-[#002757]">Cancel</button><button type="submit" className="rounded-xl bg-[#01A32E] px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-[#018a28]">Review Posting</button></div>
      </form>}
    </section></div>}
  </main>;
}
