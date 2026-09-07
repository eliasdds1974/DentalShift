from pathlib import Path

lib_path = Path('lib/dentalshift.ts')
lib = lib_path.read_text()

needle = '''export async function createShiftSeries(input: {\n  officeId: string;'''
insert = '''export async function cancelOfficeShift(shiftId: string, officeId: string) {\n  const { error } = await supabase\n    .from("shifts")\n    .update({ status: "cancelled" })\n    .eq("id", shiftId)\n    .eq("office_id", officeId)\n    .eq("status", "open");\n  if (error) throw error;\n}\n\nexport async function createShiftSeries(input: {\n  officeId: string;'''
if needle not in lib:
    raise SystemExit('createShiftSeries anchor not found')
lib = lib.replace(needle, insert, 1)
lib_path.write_text(lib)

office_path = Path('components/OfficeWorkspaceV2.tsx')
office = office_path.read_text()

office = office.replace(
    '  acceptApplication,\n  createShiftSeries,',
    '  acceptApplication,\n  cancelOfficeShift,\n  createShiftSeries,',
    1,
)

office = office.replace(
    '''  const selectedShifts = data.shifts\n    .filter((shift) => localDateKey(shift.starts_at) === selectedDate)''',
    '''  const selectedShifts = data.shifts\n    .filter((shift) => shift.status !== "cancelled")\n    .filter((shift) => localDateKey(shift.starts_at) === selectedDate)''',
    1,
)

office = office.replace(
    'const dayShifts = data.shifts.filter((shift) => localDateKey(shift.starts_at) === key);',
    'const dayShifts = data.shifts.filter((shift) => shift.status !== "cancelled" && localDateKey(shift.starts_at) === key);',
    1,
)

old = '''<div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${role.solid}`} /><strong className="text-[#032757]">{shift.profession}</strong></div><p className="mt-1 text-xs font-bold text-slate-500">{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)} · ${Number(shift.hourly_rate)}/hr</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">{shift.status}</span></div>'''
new = '''<div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${role.solid}`} /><strong className="text-[#032757]">{shift.profession}</strong></div><p className="mt-1 text-xs font-bold text-slate-500">{shortTime(shift.starts_at)}–{shortTime(shift.ends_at)} · ${Number(shift.hourly_rate)}/hr</p></div><div className="flex flex-col items-end gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">{shift.status}</span>{shift.status === "open" && <button type="button" disabled={busy === `cancel-${shift.id}`} onClick={() => { if (!window.confirm(`Cancel this ${shift.profession} shift?`)) return; void act(`cancel-${shift.id}`, () => cancelOfficeShift(shift.id, office.id)); }} className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-50">{busy === `cancel-${shift.id}` ? "Cancelling…" : "Cancel shift"}</button>}</div></div>'''
if old not in office:
    raise SystemExit('shift card header anchor not found')
office = office.replace(old, new, 1)

office_path.write_text(office)
