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

  if (profile.role === "professional") {
    const { data, error } = await supabase
      .from("professional_profiles")
      .select("user_id,profession,licence_number,licence_province,licence_status,hourly_rate,travel_radius_km,years_experience,bio,skills,available_for_work")
      .eq("user_id", userId)
      .single();
    if (error) throw error;
    professional = data as ProfessionalDetails;
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

  return { profile, professional, office };
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
  const { data, error } = await supabase
    .from("applications")
    .upsert({
      shift_id: input.shiftId,
      professional_id: input.professionalId,
      proposed_rate: input.proposedRate ?? null,
      application_kind: "application",
      status: "applied",
    }, { onConflict: "shift_id,professional_id" })
    .select("id,status,proposed_rate")
    .single();
  if (error) throw error;
  return data;
}

export async function updateAttendance(bookingId: string, action: "check_in" | "check_out", userId: string) {
  const timestamp = new Date().toISOString();
  const changes = action === "check_in" ? { check_in_at: timestamp } : { check_out_at: timestamp, professional_confirmed_completion: true };
  const { error } = await supabase.from("bookings").update(changes).eq("id", bookingId);
  if (error) throw error;
  const { error: eventError } = await supabase.from("booking_events").insert({
    booking_id: bookingId,
    actor_id: userId,
    event_type: action === "check_in" ? "checked_in" : "checked_out",
  });
  if (eventError) throw eventError;
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
