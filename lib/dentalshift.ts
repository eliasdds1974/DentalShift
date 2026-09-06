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
  address: string | null;
  google_place_id: string | null;
  latitude: number | null;
  longitude: number | null;
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
  resume_path: string | null;
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
  contact_name: string | null;
  contact_title: string | null;
  contact_phone: string | null;
  office_hours: string | null;
  operatories: number | null;
  parking_info: string | null;
  languages: string[] | null;
  benefits: string | null;
  authorization_confirmed: boolean;
  submitted_for_verification_at: string | null;
  logo_url: string | null;
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

export type VerificationCase = {
  kind: "professional" | "office";
  profile: { id: string; name: string; email: string | null; phone: string | null; city: string | null; province: string | null; postalCode: string | null; createdAt: string };
  details: Record<string, unknown>;
  licenceChecks: { id: string; sourceName: string | null; registryName: string | null; status: string; restrictions: string | null; checkedAt: string; rawReference: string | null }[];
  decisions: { id: string; previousStatus: string | null; newStatus: string; notes: string | null; createdAt: string }[];
  internalNotes: { id: string; body: string; createdAt: string; author: string | null }[];
};

export type AdminDispute = {
  id: string;
  category: string;
  details: string;
  status: string;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
  openedBy: string;
  office: { name: string; city: string; province: string };
  professional: string | null;
  shift: { id: string; profession: string; startsAt: string; status: string };
  booking: { id: string; checkInAt: string | null; checkOutAt: string | null; cancelledAt: string | null };
};

export type AdminShift = {
  id: string;
  status: "draft" | "open" | "filled" | "completed" | "cancelled";
  profession: string;
  startsAt: string;
  endsAt: string;
  hourlyRate: number;
  requiredSoftware: string | null;
  notes: string | null;
  createdAt: string;
  office: { id: string; name: string; city: string; province: string };
  professional: { id: string; name: string } | null;
  applicationCount: number;
  booking: { id: string; confirmedAt: string | null; checkInAt: string | null; checkOutAt: string | null; cancelledAt: string | null; replacementStatus: string | null } | null;
  openDisputeCount: number;
};

export function normalizeWebsite(value?: string | null) {
  const candidate = value?.trim();
  if (!candidate) return null;
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  try {
    const parsed = new URL(withProtocol);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && parsed.hostname ? parsed.href : null;
  } catch {
    return null;
  }
}

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
  offices: { name: string; city: string; province: string; website: string | null; latitude: number | null; longitude: number | null } | null;
};

export async function loadAccount(userId: string) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,role,first_name,last_name,city,province,phone,postal_code,address,google_place_id,latitude,longitude")
    .eq("id", userId)
    .single();
  if (profileError) throw profileError;

  const { data: office, error: officeError } = await supabase
    .from("offices")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (officeError) throw officeError;
  const officeId = office?.id ?? null;

  return { profile: profile as AccountProfile, officeId };
}

async function loadAccountDetailsOnce(userId: string): Promise<AccountDetails> {
  const { profile } = await loadAccount(userId);
  let professional: ProfessionalDetails | null = null;
  let office: OfficeDetails | null = null;
  let verificationRequest: { notes: string; created_at: string } | null = null;

  const [{ data: professionalData, error: professionalError }, { data: officeData, error: officeError }] = await Promise.all([
    supabase
      .from("professional_profiles")
      .select("user_id,profession,licence_number,licence_province,licence_status,hourly_rate,travel_radius_km,years_experience,bio,skills,resume_path,available_for_work")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("offices")
      .select("id,owner_id,name,address,city,province,postal_code,phone,website,software,description,verification_status,contact_name,contact_title,contact_phone,office_hours,operatories,parking_info,languages,benefits,authorization_confirmed,submitted_for_verification_at,logo_url")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);
  if (professionalError) throw professionalError;
  if (officeError) throw officeError;
  professional = professionalData as ProfessionalDetails | null;
  office = officeData as OfficeDetails | null;

  if (professional?.licence_status === "needs_review") {
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

  return { profile, professional, office, verificationRequest };
}

export async function loadAccountDetails(userId: string): Promise<AccountDetails> {
  let lastError: unknown;
  const delays = [0, 250, 500, 1000];

  for (const delay of delays) {
    if (delay) await new Promise<void>((resolve) => setTimeout(resolve, delay));
    try {
      return await loadAccountDetailsOnce(userId);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("DentalShift could not load your account after several attempts.");
}

export async function createOfficeWorkspace(input: Pick<OfficeDetails, "owner_id" | "name" | "address" | "city" | "province" | "postal_code" | "phone" | "website" | "software" | "description">) {
  const { data, error } = await supabase
    .from("offices")
    .insert({
      owner_id: input.owner_id,
      name: input.name,
      address: input.address,
      city: input.city,
      province: input.province,
      postal_code: input.postal_code,
      phone: input.phone,
      website: normalizeWebsite(input.website),
      software: input.software,
      description: input.description,
      verification_status: "pending",
    })
    .select("id,owner_id,name,address,city,province,postal_code,phone,website,software,description,verification_status,contact_name,contact_title,contact_phone,office_hours,operatories,parking_info,languages,benefits,authorization_confirmed,submitted_for_verification_at,logo_url")
    .single();
  if (error) throw error;
  return data as OfficeDetails;
}

export async function createProfessionalWorkspace(input: Pick<ProfessionalDetails, "user_id" | "profession" | "licence_number" | "licence_province">) {
  const { data, error } = await supabase
    .from("professional_profiles")
    .insert({
      user_id: input.user_id,
      profession: input.profession,
      licence_number: input.licence_number,
      licence_province: input.licence_province,
      licence_status: "pending",
      travel_radius_km: 25,
      available_for_work: false,
    })
    .select("user_id,profession,licence_number,licence_province,licence_status,hourly_rate,travel_radius_km,years_experience,bio,skills,resume_path,available_for_work")
    .single();
  if (error) throw error;
  return data as ProfessionalDetails;
}

export async function updateOfficeProfile(office: OfficeDetails) {
  const { data, error } = await supabase
    .from("offices")
    .update({
      name: office.name,
      address: office.address,
      city: office.city,
      province: office.province,
      postal_code: office.postal_code,
      phone: office.phone,
      website: normalizeWebsite(office.website),
      software: office.software,
      description: office.description,
      contact_name: office.contact_name,
      contact_title: office.contact_title,
      contact_phone: office.contact_phone,
      office_hours: office.office_hours,
      operatories: office.operatories,
      parking_info: office.parking_info,
      languages: office.languages,
      benefits: office.benefits,
      authorization_confirmed: office.authorization_confirmed,
      logo_url: office.logo_url,
    })
    .eq("id", office.id)
    .eq("owner_id", office.owner_id)
    .select("id,owner_id,name,address,city,province,postal_code,phone,website,software,description,verification_status,contact_name,contact_title,contact_phone,office_hours,operatories,parking_info,languages,benefits,authorization_confirmed,submitted_for_verification_at,logo_url")
    .single();
  if (error) throw error;
  return data as OfficeDetails;
}

export const OFFICE_LOGO_GUIDANCE = "Best result: a square PNG with a transparent background at 600 × 600 px. JPG or WebP are also accepted. Maximum file size: 5 MB.";

export async function uploadOfficeLogo(userId: string, officeId: string, file: File) {
  const extensions: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
  if (!file || file.size === 0) throw new Error("Choose an image file to upload.");
  const extension = extensions[file.type];
  if (!extension) throw new Error("Choose a PNG, JPG or WebP logo.");
  if (file.size > 5 * 1024 * 1024) throw new Error("The logo must be smaller than 5 MB.");

  const path = `${userId}/${officeId}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("office-logos")
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
  if (uploadError) throw new Error(`The logo file could not be uploaded: ${uploadError.message}`);

  const { data } = supabase.storage.from("office-logos").getPublicUrl(path);
  const logoUrl = `${data.publicUrl}?v=${Date.now()}`;
  const { data: updatedOffice, error: officeError } = await supabase
    .from("offices")
    .update({ logo_url: logoUrl })
    .eq("id", officeId)
    .eq("owner_id", userId)
    .select("logo_url")
    .single();

  if (officeError) throw new Error(`The logo uploaded, but it could not be saved to the clinic profile: ${officeError.message}`);
  if (!updatedOffice?.logo_url) throw new Error("The logo uploaded, but the clinic profile did not return a saved logo.");
  return updatedOffice.logo_url;
}

export async function uploadProfessionalResume(userId: string, file: File) {
  const extensions: Record<string, string> = { "application/pdf": "pdf", "application/msword": "doc", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx" };
  if (!file || file.size === 0) throw new Error("Choose a résumé or CV to upload.");
  const extension = extensions[file.type];
  if (!extension) throw new Error("Choose a PDF, DOC or DOCX file.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Your résumé or CV must be smaller than 5 MB.");
  const path = `${userId}/resume.${extension}`;
  const { error: uploadError } = await supabase.storage.from("professional-resumes").upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
  if (uploadError) throw new Error(`Your résumé could not be uploaded: ${uploadError.message}`);
  const { data, error } = await supabase.from("professional_profiles").update({ resume_path: path }).eq("user_id", userId).select("resume_path").single();
  if (error || !data?.resume_path) throw new Error(`The file uploaded, but it could not be saved to your profile: ${error?.message || "No path returned"}`);
  return data.resume_path as string;
}

export async function openProfessionalResume(path: string) {
  const { data, error } = await supabase.storage.from("professional-resumes").createSignedUrl(path, 60);
  if (error || !data?.signedUrl) throw new Error(error?.message || "Your résumé could not be opened.");
  return data.signedUrl;
}

export async function submitOfficeForVerification(officeId: string, ownerId: string) {
  const { data, error } = await supabase
    .from("offices")
    .update({
      verification_status: "pending",
      submitted_for_verification_at: new Date().toISOString(),
    })
    .eq("id", officeId)
    .eq("owner_id", ownerId)
    .select("id,verification_status,submitted_for_verification_at")
    .single();
  if (error) throw error;
  return data;
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
      address: input.profile.address,
      google_place_id: input.profile.google_place_id,
      latitude: input.profile.latitude,
      longitude: input.profile.longitude,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.profile.id)
    .select("id")
    .single();
  if (profileError) throw new Error(`Your contact information could not be saved: ${profileError.message}`);

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
        resume_path: input.professional.resume_path,
        available_for_work: input.professional.available_for_work,
      })
      .eq("user_id", input.professional.user_id)
      .select("user_id")
      .single();
    if (error) throw new Error(`Your professional information could not be saved: ${error.message}`);
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
        contact_name: input.office.contact_name,
        contact_title: input.office.contact_title,
        contact_phone: input.office.contact_phone,
        office_hours: input.office.office_hours,
        operatories: input.office.operatories,
        parking_info: input.office.parking_info,
        languages: input.office.languages,
        benefits: input.office.benefits,
        authorization_confirmed: input.office.authorization_confirmed,
        logo_url: input.office.logo_url,
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

export async function setVerificationStatus(item: VerificationItem, status: "verified" | "needs_review" | "suspended", notes = "") {
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

export async function loadVerificationCase(item: VerificationItem): Promise<VerificationCase> {
  const { data, error } = await supabase.rpc("admin_get_verification_case", {
    p_target_kind: item.kind,
    p_target_id: item.id,
  });
  if (error) throw error;
  return data as VerificationCase;
}

export async function addVerificationInternalNote(item: VerificationItem, body: string) {
  const { error } = await supabase.rpc("admin_add_verification_internal_note", {
    p_target_kind: item.kind,
    p_target_id: item.id,
    p_body: body.trim(),
  });
  if (error) throw error;
}

export async function loadAdminDisputes(): Promise<AdminDispute[]> {
  const { data, error } = await supabase.rpc("admin_list_disputes");
  if (error) throw error;
  return ((data as { disputes?: AdminDispute[] } | null)?.disputes ?? []) as AdminDispute[];
}

export async function resolveAdminDispute(disputeId: string, resolution: string) {
  const { error } = await supabase.rpc("admin_resolve_dispute", { p_dispute_id: disputeId, p_resolution: resolution.trim() });
  if (error) throw error;
}

export async function loadAdminShifts(): Promise<AdminShift[]> {
  const { data, error } = await supabase.rpc("admin_list_shift_operations");
  if (error) throw error;
  return ((data as { shifts?: AdminShift[] } | null)?.shifts ?? []) as AdminShift[];
}

export async function cancelAdminShift(shiftId: string, reason: string) {
  const { error } = await supabase.rpc("admin_cancel_shift", { p_shift_id: shiftId, p_reason: reason.trim() });
  if (error) throw error;
}

export async function loadOpenShifts() {
  const { data, error } = await supabase
    .from("shifts")
    .select("id,office_id,profession,starts_at,ends_at,hourly_rate,required_software,notes,status,offices(name,city,province,website,latitude,longitude)")
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

export type ProfessionalAvailability = { id: string; starts_at: string; ends_at: string; available: boolean };
export type FavouriteOffice = { id: string; office_id: string | null; google_place_id: string | null; name: string | null; formatted_address: string | null; city: string | null; province: string | null; website: string | null; offices: { id: string; name: string; city: string; province: string; website: string | null } | null };
export type OfficePreferredProfessional = {
  id: string;
  office_id: string;
  first_name: string;
  last_name: string;
  profession: string;
  licence_province: string;
  licence_number: string;
  matched_professional_id: string | null;
  created_at: string;
};

export async function loadOfficePreferredProfessionals(officeId: string) {
  const { data, error } = await supabase.from("office_preferred_professionals")
    .select("id,office_id,first_name,last_name,profession,licence_province,licence_number,matched_professional_id,created_at")
    .eq("office_id", officeId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OfficePreferredProfessional[];
}

export async function addOfficePreferredProfessional(input: { officeId: string; firstName: string; lastName: string; profession: string; licenceProvince: string; licenceNumber: string }) {
  const { data, error } = await supabase.rpc("office_add_preferred_professional", {
    p_office_id: input.officeId, p_first_name: input.firstName.trim(), p_last_name: input.lastName.trim(),
    p_profession: input.profession, p_licence_province: input.licenceProvince, p_licence_number: input.licenceNumber.trim(),
  });
  if (error) throw error;
  return data as OfficePreferredProfessional;
}

export async function removeOfficePreferredProfessional(officeId: string, id: string) {
  const { error } = await supabase.from("office_preferred_professionals").delete().eq("id", id).eq("office_id", officeId);
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
    const result = await Promise.race([
      supabase.rpc("get_confirmed_booking_contact", { p_booking_id: booking.id }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);
    return { ...booking, contact: !result || result.error ? null : result.data as BookingContact | null };
  }));
}

export type AvailableProfessionalSlot = {
  id: string;
  professional_id: string;
  starts_at: string;
  ends_at: string;
  professional_profiles: { profession: string; licence_province: string; rating: number; completed_shifts: number; reliability_score: number; hourly_rate: number | null; years_experience: number | null } | null;
};

export type OfficeShift = LiveShift & { applications: WorkflowApplication[] };

export async function addProfessionalAvailability(userId: string, startsAt: string, endsAt: string) {
  const { error } = await supabase.from("availability").insert({ professional_id: userId, starts_at: startsAt, ends_at: endsAt, available: true });
  if (error) throw error;
}

export async function removeProfessionalAvailability(id: string) {
  const { error } = await supabase.from("availability").delete().eq("id", id);
  if (error) throw error;
}

export async function setFavouriteOffice(userId: string, officeId: string, favourite: boolean) {
  const request = favourite
    ? supabase.from("favourites").insert({ professional_id: userId, office_id: officeId })
    : supabase.from("favourites").delete().eq("professional_id", userId).eq("office_id", officeId);
  const { error } = await request;
  if (error) throw error;
}

export async function addGoogleFavouriteOffice(userId: string, office: { placeId: string; name: string; formattedAddress: string; city: string; province: string; website?: string }) {
  const { error } = await supabase.from("favourites").insert({ professional_id: userId, google_place_id: office.placeId, name: office.name, formatted_address: office.formattedAddress, city: office.city, province: office.province, website: normalizeWebsite(office.website) });
  if (error?.code === "23505") throw new Error("This office is already in your favourites.");
  if (error) throw error;
}

export async function removeFavouriteOffice(userId: string, favouriteId: string) {
  const { error } = await supabase.from("favourites").delete().eq("id", favouriteId).eq("professional_id", userId);
  if (error) throw error;
}

export async function loadProfessionalWorkflow(userId: string) {
  const workflowPromise = Promise.all([
    loadOpenShifts(),
    supabase.from("applications").select("id,status,proposed_rate,application_kind,created_at,professional_id,shifts!applications_shift_id_fkey(id,office_id,profession,starts_at,ends_at,hourly_rate,required_software,notes,status,offices(name,city,province,website,latitude,longitude))").eq("professional_id", userId).order("created_at", { ascending: false }),
    supabase.from("bookings").select("id,professional_id,check_in_at,check_out_at,office_confirmed_completion,professional_confirmed_completion,cancelled_at,shifts!bookings_shift_id_fkey(id,office_id,profession,starts_at,ends_at,hourly_rate,required_software,notes,status,offices(name,city,province,website,latitude,longitude)),reviews(id,reviewer_id,rating,comment)").eq("professional_id", userId).order("confirmed_at", { ascending: false }),
    supabase.from("availability").select("id,starts_at,ends_at,available").eq("professional_id", userId).order("starts_at", { ascending: true }),
    supabase.from("favourites").select("id,office_id,google_place_id,name,formatted_address,city,province,website,offices!favourites_office_id_fkey(id,name,city,province,website)").eq("professional_id", userId).order("created_at", { ascending: false }),
  ]);

  const [open, applicationsResult, bookingsResult, availabilityResult, favouritesResult] = await Promise.race([
    workflowPromise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("DentalShift could not finish loading your workflow. Please refresh and try again.")), 10000)),
  ]);
  if (applicationsResult.error) throw applicationsResult.error;
  if (bookingsResult.error) throw bookingsResult.error;
  if (availabilityResult.error) throw availabilityResult.error;
  if (favouritesResult.error) throw favouritesResult.error;
  const bookings = await addBookingContacts((bookingsResult.data ?? []) as unknown as WorkflowBooking[]);
  return { open, applications: (applicationsResult.data ?? []) as unknown as WorkflowApplication[], bookings, availability: (availabilityResult.data ?? []) as ProfessionalAvailability[], favourites: (favouritesResult.data ?? []) as unknown as FavouriteOffice[] };
}

export async function loadOfficeWorkflow(officeId: string) {
  const [shiftsResult, bookingsResult, directoryResult, availabilityResult] = await Promise.all([
    supabase.from("shifts").select("id,office_id,profession,starts_at,ends_at,hourly_rate,required_software,notes,status,offices(name,city,province,website,latitude,longitude),applications(id,status,proposed_rate,application_kind,created_at,professional_id,professional_profiles!applications_professional_id_fkey(profession,licence_province,rating,completed_shifts,reliability_score))").eq("office_id", officeId).order("starts_at", { ascending: false }),
    supabase.from("bookings").select("id,professional_id,check_in_at,check_out_at,office_confirmed_completion,professional_confirmed_completion,cancelled_at,shifts!bookings_shift_id_fkey(id,office_id,profession,starts_at,ends_at,hourly_rate,required_software,notes,status,offices(name,city,province,website,latitude,longitude)),reviews(id,reviewer_id,rating,comment)").eq("office_id", officeId).order("confirmed_at", { ascending: false }),
    supabase.from("professional_profiles").select("user_id,profession,licence_province,rating,completed_shifts,reliability_score").eq("licence_status", "verified").eq("available_for_work", true).order("rating", { ascending: false }).limit(12),
    supabase.from("availability").select("id,professional_id,starts_at,ends_at,professional_profiles!availability_professional_id_fkey(profession,licence_province,rating,completed_shifts,reliability_score,hourly_rate,years_experience)").eq("available", true).gte("ends_at", new Date().toISOString()),
  ]);
  if (shiftsResult.error) throw shiftsResult.error;
  if (bookingsResult.error) throw bookingsResult.error;
  if (directoryResult.error) throw directoryResult.error;
  if (availabilityResult.error) throw availabilityResult.error;
  const bookings = await addBookingContacts((bookingsResult.data ?? []) as unknown as WorkflowBooking[]);
  return { shifts: (shiftsResult.data ?? []) as unknown as OfficeShift[], bookings, directory: directoryResult.data ?? [], availability: (availabilityResult.data ?? []) as unknown as AvailableProfessionalSlot[] };
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