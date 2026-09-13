from pathlib import Path
p=Path('components/DentalJobsNativeMarketplace.tsx')
s=p.read_text()
s=s.replace('''      const details = await loadAccountDetails(user.id);\n      const officeId = listing.office_id;\n      const professionalId = user.id;\n''','''      const details = await loadAccountDetails(user.id);\n      const { data: resumeRow, error: resumeError } = await supabase.from("professional_profiles").select("resume_path").eq("user_id", user.id).maybeSingle();\n      if (resumeError) throw resumeError;\n      if (!resumeRow?.resume_path) {\n        window.alert("Résumé/CV Required\\n\\nPlease add a résumé or CV to your Professional Account before applying for this position.");\n        throw new Error("A résumé/CV is required before you can apply to this position.");\n      }\n      const officeId = listing.office_id;\n      const professionalId = user.id;\n''',1)
s=s.replace('resume_path_snapshot: details.professional?.resume_path || null,','resume_path_snapshot: resumeRow.resume_path,',1)
p.write_text(s)
print('native resume guard updated')
# trigger workflow
