from pathlib import Path

page = Path('app/classifieds/page.tsx')
text = page.read_text()
needle = '''  const loadConnections = async (roleOverride?: "office" | "professional" | null) => {'''
if needle not in text:
    raise SystemExit('loadConnections marker not found')
insert_after = '''    setConnections(rows.map((row) => {'''
# Add a realtime/focus refresh effect immediately before softDeleteConnection, after loadConnections definition.
marker = '''  const softDeleteConnection = async (connection: JobConnection) => {'''
if marker not in text:
    raise SystemExit('softDeleteConnection marker not found')
effect = '''  useEffect(() => {\n    if (!portalRole) return;\n\n    const refreshConnections = () => { void loadConnections(portalRole); };\n    window.addEventListener("focus", refreshConnections);\n\n    const channel = supabase\n      .channel(`dentaljobs-connection-refresh-${portalRole}`)\n      .on("postgres_changes", { event: "*", schema: "public", table: "job_applications" }, refreshConnections)\n      .subscribe();\n\n    return () => {\n      window.removeEventListener("focus", refreshConnections);\n      void supabase.removeChannel(channel);\n    };\n  }, [portalRole]);\n\n'''
if effect not in text:
    text = text.replace(marker, effect + marker, 1)
page.write_text(text)

component = Path('components/DentalJobsDetailInterestAction.tsx')
ctext = component.read_text()
old = '''      if (details.profile.role === "professional" && listingType === "office_hiring") {\n        const { data: listing, error: listingError } = await supabase\n'''
new = '''      if (details.profile.role === "professional" && listingType === "office_hiring") {\n        const { data: resumeRow, error: resumeError } = await supabase\n          .from("professional_profiles")\n          .select("resume_path")\n          .eq("user_id", user.id)\n          .maybeSingle();\n        if (resumeError) throw resumeError;\n        if (!resumeRow?.resume_path) {\n          const message = "Résumé/CV Required\\n\\nYou need to upload a résumé or CV to your Professional Account before you can apply for DentalJobs positions.";\n          window.alert(message);\n          throw new Error("A résumé/CV is required before you can apply to this position.");\n        }\n\n        const { data: listing, error: listingError } = await supabase\n'''
if old not in ctext:
    raise SystemExit('detail professional branch marker not found')
ctext = ctext.replace(old, new, 1)
ctext = ctext.replace('resume_path_snapshot: details.professional?.resume_path || null,', 'resume_path_snapshot: resumeRow.resume_path,', 1)
component.write_text(ctext)
print('patched interest refresh and resume guard')
