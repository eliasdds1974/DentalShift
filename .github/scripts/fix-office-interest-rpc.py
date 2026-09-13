from pathlib import Path
p=Path('app/classifieds/page.tsx')
s=p.read_text()
start='''    if (effectiveRole === "office") {\n      try {'''
end='''    const { data, error } = await supabase\n      .from("job_applications")'''
si=s.find(start)
ei=s.find(end, si)
if si<0 or ei<0:
    raise SystemExit('office loadConnections branch markers not found')
new='''    if (effectiveRole === "office") {\n      const { data, error } = await supabase.rpc("get_office_dentaljobs_connections");\n      if (error) {\n        setConnectionError(error.message || "Could not load interested professionals.");\n        return;\n      }\n      const rows = (data || []) as any[];\n      setConnections(rows.map((row) => {\n        const snapshot = row.professional_interest_snapshot || null;\n        return {\n          id: row.id,\n          listingId: row.listing_id,\n          professionalId: row.professional_id,\n          officeId: row.office_id,\n          initiatorRole: row.initiator_role,\n          status: row.status,\n          message: row.message || "",\n          resumePath: row.resume_path_snapshot || null,\n          createdAt: row.created_at,\n          profession: snapshot?.profession || "Dental Professional",\n          employment: "",\n          city: snapshot?.city || "",\n          province: snapshot?.province || "",\n          listingType: "office_hiring",\n          sourceOfficeListingId: row.source_office_listing_id || null,\n          candidatePreview: snapshot ? {\n            profession: snapshot.profession || null,\n            safeCity: snapshot.city || null,\n            safeProvince: snapshot.province || null,\n            yearsExperience: snapshot.years_experience == null ? null : Number(snapshot.years_experience),\n            summary: snapshot.bio || "",\n            experienceSummary: null,\n            educationSummary: null,\n            workHistorySummary: null,\n            skills: Array.isArray(snapshot.skills) ? snapshot.skills : [],\n            software: [],\n            certifications: [],\n          } : null,\n          officeInterestSnapshot: row.office_interest_snapshot || null,\n        } as JobConnection;\n      }));\n      setConnectionError("");\n      return;\n    }\n\n'''
s=s[:si]+new+s[ei:]
p.write_text(s)
print('office DentalJobs connections now load directly from authenticated RPC')
