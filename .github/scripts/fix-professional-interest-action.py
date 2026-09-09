from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()

anchor = '''  const run = async (key: string, action: () => Promise<unknown>) => {
    setBusy(key);
    setError("");
    try {
      await action();
      await refresh();
      return true;
    } catch (value) {
      setError(value instanceof Error ? value.message : "The action could not be completed.");
      return false;
    } finally {
      setBusy("");
    }
  };
'''

replacement = anchor + '''
  const expressProfessionalInterest = async (shift: LiveShift) => {
    const key = `apply-${shift.id}`;
    setBusy(key);
    setError("");
    try {
      const applicationId = await applyForShift({ shiftId: shift.id, professionalId: userId });
      if (!applicationId) throw new Error("DentalShift could not confirm your interest. Please try again.");

      // Reflect the successful interest immediately so the availability card disappears
      // without waiting for the follow-up reload.
      setWorkflow((current) => ({
        ...current,
        applications: [
          {
            id: String(applicationId),
            status: "applied",
            proposed_rate: null,
            application_kind: "application",
            created_at: new Date().toISOString(),
            office_interested_at: null,
            professional_id: userId,
            shifts: shift,
          },
          ...current.applications.filter((item) => !(item.professional_id === userId && item.shifts?.id === shift.id)),
        ],
      }));

      await refresh();
    } catch (value) {
      setError(value instanceof Error ? value.message : "DentalShift could not save your interest.");
    } finally {
      setBusy("");
    }
  };
'''

if anchor not in text:
    raise SystemExit('run helper anchor not found')
text = text.replace(anchor, replacement, 1)

old = '''<button type="button" disabled={busy === `apply-${shift.id}`} onClick={() => void run(`apply-${shift.id}`, () => applyForShift({ shiftId: shift.id, professionalId: userId }))} className="primary-btn w-full justify-center disabled:cursor-not-allowed disabled:opacity-45">{busy === `apply-${shift.id}` ? "Saving…" : "I’m Interested"}</button>'''
new = '''<button type="button" disabled={busy === `apply-${shift.id}`} onClick={() => void expressProfessionalInterest(shift)} className="w-full rounded-xl bg-[#002757] px-3 py-2.5 text-sm font-black text-white transition hover:bg-[#0a3568] disabled:cursor-not-allowed disabled:opacity-45">{busy === `apply-${shift.id}` ? "Saving…" : "I’m Interested"}</button>'''
if old not in text:
    raise SystemExit('professional interest button anchor not found')
text = text.replace(old, new, 1)
path.write_text(text)

lib = Path('lib/dentalshift.ts')
lib_text = lib.read_text()
old_lib = '''export async function applyForShift(input: { shiftId: string; professionalId: string; proposedRate?: number }) {
  void input.professionalId;
  void input.proposedRate;
  const { data, error } = await supabase.rpc("professional_express_interest", { p_shift_id: input.shiftId });
  if (error) throw error;
  return data;
}
'''
new_lib = '''export async function applyForShift(input: { shiftId: string; professionalId: string; proposedRate?: number }) {
  void input.proposedRate;
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session?.user?.id || sessionData.session.user.id !== input.professionalId) {
    throw new Error("Your DentalShift session does not match this professional account. Please sign in again.");
  }
  const { data, error } = await supabase.rpc("professional_express_interest", { p_shift_id: input.shiftId });
  if (error) throw error;
  if (!data) throw new Error("DentalShift could not confirm your interest. Please try again.");
  return data;
}
'''
if old_lib not in lib_text:
    raise SystemExit('applyForShift anchor not found')
lib.write_text(lib_text.replace(old_lib, new_lib, 1))
