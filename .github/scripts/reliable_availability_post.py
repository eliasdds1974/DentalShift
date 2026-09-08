from pathlib import Path

p = Path('lib/dentalshift.ts')
s = p.read_text()

old = '''export async function addProfessionalAvailability(userId: string, startsAt: string, endsAt: string, hourlyRate: number) {
  if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) throw new Error("Enter a valid hourly rate.");
  const { error } = await supabase.from("availability").insert({ professional_id: userId, starts_at: startsAt, ends_at: endsAt, hourly_rate: hourlyRate, available: true });
  if (error) throw error;
}'''

new = '''export async function addProfessionalAvailability(userId: string, startsAt: string, endsAt: string, hourlyRate: number) {
  if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) throw new Error("Enter a valid hourly rate.");

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session?.user?.id || sessionData.session.user.id !== userId) {
    throw new Error("Your DentalShift session does not match this professional account. Please sign in again.");
  }

  const { data, error } = await supabase.rpc("post_professional_availability", {
    p_starts_at: startsAt,
    p_ends_at: endsAt,
    p_hourly_rate: hourlyRate,
  });
  if (error) throw error;
  if (!data || typeof data !== "object" || !("id" in data)) {
    throw new Error("DentalShift could not confirm that your availability was saved. Please try again.");
  }
  return data;
}'''

if old not in s:
    raise SystemExit('availability function target not found')

s = s.replace(old, new, 1)
p.write_text(s)
