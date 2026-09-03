import { supabase } from "./supabase";

export type AccountRole = "office" | "professional" | "admin";

export type AccountProfile = {
  id: string;
  role: AccountRole;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  province: string | null;
  phone: string | null;
  postal_code: string | null;
};

export type ProfessionalDetails = {
  user_id: string;
  profession: string;
  licence_number: string;
  licence_province: string;
  licence_status: string;
  hourly_rate: number | null;
  travel_radius_km: number;
  years_experience: number | null;
  bio: string | null;
  skills: string[] | null;
  available_for_work: boolean;
};

export type OfficeDetails = {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  phone: string | null;
  website: string | null;
  software: string[] | null;
  description: string | null;
  verification_status: string;
};

export type AccountDetails = {
  profile: AccountProfile;
  professional: ProfessionalDetails | null;
  office: OfficeDetails | null;
  verificationRequest: { notes: string; created_at: string } | null;
};

export type VerificationItem = {
  id: string;
  kind: "professional" | "office";
  name: string;
  type: string;
  province: string;
  reference: string;
  status: string;
  submittedAt: string;
};

export type LiveShift = {
  id: string;
  office_id: string;
  profession: string;
  starts_at: string;
  ends_at: string;
  hourly_rate: number;
  required_software: string | null;
  notes: string | null;
  status: string;
  offices: { name: string; city: string; province: string } | null;
};

export async function loadAccount(userId: string) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,role,first_name,last_name,city,province,phone,postal_code")
    .eq("id", userId)
    .single();
  if (profileError) throw profileError;

  let officeId: string | null = null;
  if (profile.role === "office") {
    const { data: office, error: officeError } = await supabase
      .from("offices")
      .select("id")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (officeError) throw officeError;
    officeId = office?.id ?? null;
  }

  return { profile: profile as AccountProfile, officeId };
}

export async function loadAccountDetails(userId: string): Promise<AccountDetails> {
  const { profile } = await loadAccount(userId);
  let professional: ProfessionalDetails | null = null;
  let office: OfficeDetails | null = null;
  let verificationRequest: { notes: string; created_at: string } | null = null;

  if (profile.role === "professional") {
    const { data, error } = await supabase
      .from("professional_profiles")
      .select("user_id,profession,licence_number,licence_province,licence_status,hourly_rate,travel_radius_km,years_experience,bio,skills,available_for_work")
      .eq("user_id", userId)
      .single();
    if (error) throw error;
    professional = data as ProfessionalDetails;
    if (professional.licence_status === "needs_review") {
      const { data: decision, error: decisionError } = await supabase
        .from("verification_decisions")
        .select("notes,created_at")
        .eq("target_kind", "professional")
        .eq("target_id", userId)
        .eq("new_status", "needs_review")
        .not("notes", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (decisionError) throw decisionError;
      verificationRequest = decision?.notes ? { notes: decision.notes, created_at: decision.created_at } : null;
    }
  } else if (profile.role === "office") {
    const { data, error } = await supabase
      .from("offices")
      .select("id,owner_id,name,address,city,province,postal_code,phone,website,software,description,verification_status")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    if (error) throw error;
    office = data as OfficeDetails;
  }

  return { profile, professional, office, verificationRequest };
}

export async function saveAccountDetails(input: AccountDetails) {
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      first_name: input.profile.first_name,
      last_name: input.profile.last_name,
      phone: input.profile.phone,
      city: input.profile.city,
      province: input.profile.province,
      postal_code: input.profile.postal_code,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.profile.id);
  if (profileError) throw profileError;

  if (input.professional) {
    const { error } = await supabase
      .from("professional_profiles")
      .update({
        profession: input.professional.profession,
        licence_number: input.professional.licence_number,
        licence_province: input.professional.licence_province,
        hourly_rate: input.professional.hourly_rate,
        travel_radius_km: input.professional.travel_radius_km,
        years_experience: input.professional.years_experience,
        bio: input.professional.bio,
        skills: input.professional.skills,
        available_for_work: input.professional.available_for_work,
      })
      .eq("user_id", input.professional.user_id);
    if (error) throw error;
  }

  if (input.office) {
    const { error } = await supabase
      .from("offices")
      .update({
        name: input.office.name,
        address: input.office.address,
        city: input.office.city,
        province: input.office.province,
        postal_code: input.office.postal_code,
        phone: input.office.phone,
        website: input.office.website,
        software: input.office.software,
        description: input.office.description,
      })
      .eq("id", input.office.id);
    if (error) throw error;
  }
}

export async function loadVerificationQueue() {
  const [{ data: professionals, error: professionalError }, { data: offices, error: officeError }] = await Promise.all([
    supabase
      .from("professional_profiles")
      .select("user_id,profession,licence_number,licence_province,licence_status,created_at,profiles!professional_profiles_user_id_fkey(first_name,last_name)")
      .in("licence_status", ["pending", "needs_review"])
      .order("created_at", { ascending: true }),
    supabase
      .from("offices")
      .select("id,name,province,verification_status,created_at")
      .in("verification_status", ["pending", "needs_review"])
      .order("created_at", { ascending: true }),
  ]);
  if (professionalError) throw professionalError;
  if (officeError) throw officeError;

  const professionalItems = (professionals ?? []).map((row) => {
    const linked = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const fullName = [linked?.first_name, linked?.last_name].filter(Boolean).join(" ");
    return {
      id: row.user_id,
      kind: "professional" as const,
      name: fullName || "Unnamed professional",
      type: row.profession,
      province: row.licence_province,
      reference: row.licence_number,
      status: row.licence_status,
      submittedAt: row.created_at,
    };
  });
  const officeItems = (offices ?? []).map((row) => ({
    id: row.id,
    kind: "office" as const,
    name: row.name,
    type: "Dental office",
    province: row.province,
    reference: "Business profile",
    status: row.verification_status,
    submittedAt: row.created_at,
  }));
  return [...professionalItems, ...officeItems].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)) as VerificationItem[];
}

export async function setVerificationStatus(item: VerificationItem, status: "verified" | "needs_review", notes = "") {
  const { error } = await supabase.rpc("admin_set_verification_status", {
    target_kind: item.kind,
    target_id: item.id,
    new_status: status,
    decision_notes: notes,
  });
  if (error) throw error;
}

export async function requestVerificationReview(item: VerificationItem, notes: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error("Please sign in again before sending a review request.");

  const response = await fetch("/api/admin/verification-review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ targetKind: item.kind, targetId: item.id, notes: notes.trim() }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? "The review request could not be sent.");
  return payload as { emailSent: boolean };
}

export async function loadOpenShifts() {
  const { data, error } = await supabase
    .from("shifts")
    .select("id,office_id,profession,starts_at,ends_at,hourly_rate,required_software,notes,status,offices(name,city,province)")
    .eq("status", "open")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as LiveShift[];
}

export async function createShiftSeries(input: {
  officeId: string;
  profession: string;
  dates: string[];
  startTime: string;
  endTime: string;
  hourlyRate: number;
  software: string;
  notes: string;
  autoInvite: boolean;
}) {
  const seriesId = input.dates.length > 1 ? crypto.randomUUID() : null;
  const rows = input.dates.map((date) => ({
    office_id: input.officeId,
    profession: input.profession,
    starts_at: new Date(`${date}T${input.startTime}:00`).toISOString(),
    ends_at: new Date(`${date}T${input.endTime}:00`).toISOString(),
    hourly_rate: input.hourlyRate,
    required_software: input.software === "Any software" ? null : input.software,
    notes: input.notes || null,
    auto_invite_matches: input.autoInvite,
    series_id: seriesId,
    status: "open",
  }));
  const { data, error } = await supabase.from("shifts").insert(rows).select("id");
  if (error) throw error;
  return data;
}

export async function applyForShift(input: { shiftId: string; professionalId: string; proposedRate?: number }) {
  const { data, error } = await supabase.rpc("apply_to_shift", {
    p_shift_id: input.shiftId,
    p_proposed_rate: input.proposedRate ?? null,
    p_message: null,
  });
  if (error) throw error;
  return data;
}

export async function updateAttendance(bookingId: string, action: "check_in" | "check_out", userId: string) {
  void userId;
  const { error } = await supabase.rpc("booking_action", { p_booking_id: bookingId, p_action: action });
  if (error) throw error;
}

export type WorkflowApplication = {
  id: string; status: string; proposed_rate: number | null; application_kind: string; created_at: string;
  professional_id: string;
  professional_profiles?: { profession: string; licence_province: string; rating: number; completed_shifts: number; reliability_score: number } | null;
  shifts?: LiveShift | null;
};

export type WorkflowBooking = {
  id: string; professional_id: string; check_in_at: string | null; check_out_at: string | null;
  office_confirmed_completion: boolean; professional_confirmed_completion: boolean; cancelled_at: string | null;
  shifts: LiveShift | null;
  reviews: { id: string; reviewer_id: string; rating: number; comment: string | null }[];
  contact?: BookingContact | null;
};

export type BookingContact = {
  name: string; contact_name?: string; phone: string | null; email: string | null; role: "office" | "professional";
  address?: string; city?: string; province?: string; postal_code?: string; website?: string | null;
};

async function addBookingContacts(bookings: WorkflowBooking[]) {
  return Promise.all(bookings.map(async (booking) => {
    const { data, error } = await supabase.rpc("get_confirmed_booking_contact", { p_booking_id: booking.id });
    return { ...booking, contact: error ? null : data as BookingContact };
  }));
}

export type OfficeShift = LiveShift & { applications: WorkflowApplication[] };

export async function loadProfessionalWorkflow(userId: string) {
  const [open, applicationsResult, bookingsResult] = await Promise.all([
    loadOpenShifts(),
    supabase.from("applications").select("id,status,proposed_rate,application_kind,created_at,professional_id,shifts!applications_shift_id_fkey(id,office_id,profession,starts_at,ends_at,hourly_rate,required_software,notes,status,offices(name,city,province))").eq("professional_id", userId).order("created_at", { ascending: false }),
    supabase.from("bookings").select("id,professional_id,check_in_at,check_out_at,office_confirmed_completion,professional_confirmed_completion,cancelled_at,shifts!bookings_shift_id_fkey(id,office_id,profession,starts_at,ends_at,hourly_rate,required_software,notes,status,offices(name,city,province)),reviews(id,reviewer_id,rating,comment)").eq("professional_id", userId).order("confirmed_at", { ascending: false }),
  ]);
  if (applicationsResult.error) throw applicationsResult.error;
  if (bookingsResult.error) throw bookingsResult.error;
  const bookings = await addBookingContacts((bookingsResult.data ?? []) as unknown as WorkflowBooking[]);
  return { open, applications: (applicationsResult.data ?? []) as unknown as WorkflowApplication[], bookings };
}

export async function loadOfficeWorkflow(officeId: string) {
  const [shiftsResult, bookingsResult, directoryResult] = await Promise.all([
    supabase.from("shifts").select("id,office_id,profession,starts_at,ends_at,hourly_rate,required_software,notes,status,offices(name,city,province),applications(id,status,proposed_rate,application_kind,created_at,professional_id,professional_profiles!applications_professional_id_fkey(profession,licence_province,rating,completed_shifts,reliability_score))").eq("office_id", officeId).order("starts_at", { ascending: false }),
    supabase.from("bookings").select("id,professional_id,check_in_at,check_out_at,office_confirmed_completion,professional_confirmed_completion,cancelled_at,shifts!bookings_shift_id_fkey(id,office_id,profession,starts_at,ends_at,hourly_rate,required_software,notes,status,offices(name,city,province)),reviews(id,reviewer_id,rating,comment)").eq("office_id", officeId).order("confirmed_at", { ascending: false }),
    supabase.from("professional_profiles").select("user_id,profession,licence_province,rating,completed_shifts,reliability_score").eq("licence_status", "verified").eq("available_for_work", true).order("rating", { ascending: false }).limit(12),
  ]);
  if (shiftsResult.error) throw shiftsResult.error;
  if (bookingsResult.error) throw bookingsResult.error;
  if (directoryResult.error) throw directoryResult.error;
  const bookings = await addBookingContacts((bookingsResult.data ?? []) as unknown as WorkflowBooking[]);
  return { shifts: (shiftsResult.data ?? []) as unknown as OfficeShift[], bookings, directory: directoryResult.data ?? [] };
}

export async function withdrawApplication(applicationId: string) {
  const { error } = await supabase.rpc("withdraw_application", { p_application_id: applicationId });
  if (error) throw error;
}

export async function respondToInvitation(applicationId: string, accept: boolean) {
  const { data, error } = await supabase.rpc("respond_to_invitation", { p_application_id: applicationId, p_accept: accept });
  if (error) throw error;
  return data;
}

export async function acceptApplication(applicationId: string) {
  const { data, error } = await supabase.rpc("office_accept_application", { p_application_id: applicationId });
  if (error) throw error;
  return data;
}

export async function inviteProfessional(shiftId: string, professionalId: string, rate?: number) {
  const { data, error } = await supabase.rpc("office_invite_professional", { p_shift_id: shiftId, p_professional_id: professionalId, p_proposed_rate: rate ?? null });
  if (error) throw error;
  return data;
}

export async function bookingAction(bookingId: string, action: "check_in" | "check_out" | "confirm_completion") {
  const { error } = await supabase.rpc("booking_action", { p_booking_id: bookingId, p_action: action });
  if (error) throw error;
}

export async function submitReview(bookingId: string, rating: number, comment = "") {
  const { data, error } = await supabase.rpc("submit_booking_review", { p_booking_id: bookingId, p_rating: rating, p_comment: comment });
  if (error) throw error;
  return data;
}

export async function sendProtectedMessage(input: {
  shiftId?: string;
  bookingId?: string;
  senderId: string;
  recipientId: string;
  body: string;
}) {
  const { data, error } = await supabase.from("messages").insert({
    shift_id: input.shiftId ?? null,
    booking_id: input.bookingId ?? null,
    sender_id: input.senderId,
    recipient_id: input.recipientId,
    body: input.body,
  }).select("id,body,created_at").single();
  if (error) throw error;
  return data;
}
