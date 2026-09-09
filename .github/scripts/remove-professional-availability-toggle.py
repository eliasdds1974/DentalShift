from pathlib import Path

# Remove the obsolete profile-level availability toggle. Calendar availability is the source of truth.
page = Path('app/page.tsx')
s = page.read_text()
old = '<label className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 sm:col-span-2 lg:col-span-4"><input name="available_for_work" type="checkbox" defaultChecked={details.professional.available_for_work} className="h-4 w-4 accent-[#01A32E]" /><span className="text-sm font-bold text-slate-700">Available for new shifts</span></label>\n'
assert old in s, 'availability toggle not found'
s = s.replace(old, '', 1)
s = s.replace('''        available_for_work: form.get("available_for_work") === "on",''', '''        available_for_work: details.professional.available_for_work,''', 1)
page.write_text(s)

lib = Path('lib/dentalshift.ts')
s = lib.read_text()
old = '''    supabase.from("professional_profiles").select("user_id,profession,licence_province,rating,completed_shifts,reliability_score").eq("licence_status", "verified").eq("available_for_work", true).order("rating", { ascending: false }).limit(12),'''
new = '''    supabase.from("professional_profiles").select("user_id,profession,licence_province,rating,completed_shifts,reliability_score").eq("licence_status", "verified").order("rating", { ascending: false }).limit(12),'''
assert old in s, 'directory availability filter not found'
s = s.replace(old, new, 1)
lib.write_text(s)
