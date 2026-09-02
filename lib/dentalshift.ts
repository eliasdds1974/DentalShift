import { supabase } from "./supabase";

export type AccountRole = "office" | "professional" | "admin";

export type AccountProfile = {
  id: string;
  role: AccountRole;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  province: string | null;
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
    .select("id,role,first_name,last_name,city,province")
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
