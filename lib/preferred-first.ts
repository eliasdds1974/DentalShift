import { supabase } from "./supabase";

export type PreferredFirstDayEntry = {
  date: string;
  startTime: string;
  endTime: string;
};

export type PreferredFirstBatchResult = {
  batch_id: string;
  shift_ids?: string[];
  availability_ids?: string[];
  recipient_count: number;
  item_count: number;
};

export function preferredFirstIsActive(item: {
  preferred_first?: boolean | null;
  preferred_until?: string | null;
  preferred_released_at?: string | null;
}) {
  return Boolean(
    item.preferred_first &&
    !item.preferred_released_at &&
    item.preferred_until &&
    new Date(item.preferred_until).getTime() > Date.now(),
  );
}

export function preferredFirstTimeRemaining(until?: string | null) {
  if (!until) return "";
  const totalMinutes = Math.max(0, Math.ceil((new Date(until).getTime() - Date.now()) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

function toIso(entry: PreferredFirstDayEntry) {
  return {
    starts_at: new Date(`${entry.date}T${entry.startTime}:00`).toISOString(),
    ends_at: new Date(`${entry.date}T${entry.endTime}:00`).toISOString(),
  };
}

async function screenPreferredFirstNotes(notes?: string) {
  const content = notes?.trim();
  if (!content) return;
  const { data, error } = await supabase.rpc("screen_shift_communication", {
    p_content: content,
    p_communication_type: "office_shift_notes",
    p_shift_id: null,
    p_booking_id: null,
    p_availability_id: null,
  });
  if (error) throw error;
  const result = data as { allowed?: boolean; reason?: string | null } | null;
  if (!result?.allowed) {
    throw new Error(`Please remove contact information from Shift Notes${result?.reason ? ` (${result.reason})` : ""}. Contact details are shared after scheduling.`);
  }
}

export async function createPreferredFirstShiftBatch(input: {
  officeId: string;
  profession: string;
  days: PreferredFirstDayEntry[];
  hourlyRate: number;
  software?: string;
  notes?: string;
  preferredFirst: boolean;
  preferredUntil?: string | null;
  recipientIds?: string[];
}) {
  await screenPreferredFirstNotes(input.notes);
  const { data, error } = await supabase.rpc("create_preferred_shift_batch", {
    p_office_id: input.officeId,
    p_profession: input.profession,
    p_entries: input.days.map(toIso),
    p_hourly_rate: input.hourlyRate,
    p_software: input.software || null,
    p_notes: input.notes || null,
    p_preferred_first: input.preferredFirst,
    p_preferred_until: input.preferredFirst ? input.preferredUntil : null,
    p_recipient_ids: input.preferredFirst && input.recipientIds?.length ? input.recipientIds : null,
  });
  if (error) throw error;
  return data as PreferredFirstBatchResult;
}

export async function createPreferredFirstAvailabilityBatch(input: {
  professionalId: string;
  days: PreferredFirstDayEntry[];
  hourlyRate: number;
  notes?: string;
  preferredFirst: boolean;
  preferredUntil?: string | null;
  officeIds?: string[];
}) {
  const { data, error } = await supabase.rpc("create_preferred_availability_batch", {
    p_professional_id: input.professionalId,
    p_entries: input.days.map(toIso),
    p_hourly_rate: input.hourlyRate,
    p_notes: input.notes || null,
    p_preferred_first: input.preferredFirst,
    p_preferred_until: input.preferredFirst ? input.preferredUntil : null,
    p_office_ids: input.preferredFirst && input.officeIds?.length ? input.officeIds : null,
  });
  if (error) throw error;
  return data as PreferredFirstBatchResult;
}

export async function releasePreferredFirstShiftBatch(batchId: string) {
  const { error } = await supabase.rpc("release_preferred_shift_batch", { p_batch_id: batchId });
  if (error) throw error;
}

export async function releasePreferredFirstAvailabilityBatch(batchId: string) {
  const { error } = await supabase.rpc("release_preferred_availability_batch", { p_batch_id: batchId });
  if (error) throw error;
}

export async function emailPreferredFirstBatch(kind: "shift" | "availability", batchId: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return { sent: 0 };
  const response = await fetch("/api/preferred-first-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ kind, batchId }),
  });
  if (!response.ok) return { sent: 0 };
  return response.json() as Promise<{ sent: number }>;
}
