from pathlib import Path

pro = Path('components/WorkflowWorkspaceV2.tsx')
s = pro.read_text()
old = '''  const run = async (key: string, action: () => Promise<unknown>) => {
    setBusy(key);
    setError("");
    try {
      await action();
      await refresh();
    } catch (value) {
      setError(value instanceof Error ? value.message : "The action could not be completed.");
    } finally {
      setBusy("");
    }
  };'''
new = '''  const run = async (key: string, action: () => Promise<unknown>) => {
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
  };'''
if old not in s:
    raise SystemExit('run helper target missing')
s = s.replace(old, new, 1)
old = '''<button type="button" disabled={busy === selectedAvailability[0].id} onClick={() => void run(selectedAvailability[0].id, () => removeProfessionalAvailability(selectedAvailability[0].id))} className="secondary-btn">Cancel / Repost</button>'''
new = '''<button type="button" disabled={busy === selectedAvailability[0].id} onClick={() => void run(selectedAvailability[0].id, () => removeProfessionalAvailability(selectedAvailability[0].id)).then((removed) => { if (removed) setAvailabilityOpen(true); })} className="secondary-btn">Cancel / Repost</button>'''
if old not in s:
    raise SystemExit('Cancel / Repost target missing')
s = s.replace(old, new, 1)
pro.write_text(s)

office = Path('components/OfficeWorkspaceV2.tsx')
s = office.read_text()
old = '      minimumHourlyRate: profile?.hourly_rate != null ? Number(profile.hourly_rate) : null,'
new = '      minimumHourlyRate: Number(slot.hourly_rate),'
if old not in s:
    raise SystemExit('office posted availability wage target missing')
s = s.replace(old, new, 1)
office.write_text(s)
