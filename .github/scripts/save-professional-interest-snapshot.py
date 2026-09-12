from pathlib import Path

market = Path('components/DentalJobsNativeMarketplace.tsx')
text = market.read_text()
old = '''          message: "",
          resume_path_snapshot: details.professional?.resume_path || null,
        })'''
new = '''          message: "",
          resume_path_snapshot: details.professional?.resume_path || null,
          professional_interest_snapshot: {
            label: "Dental Professional",
            city: details.profile.city || null,
            province: details.profile.province || null,
            profession: details.professional?.profession || listing.profession || null,
            years_experience: details.professional?.years_experience ?? null,
            bio: details.professional?.bio || null,
            skills: details.professional?.skills || [],
            languages: details.professional?.languages || [],
          },
        })'''
# only patch submitProfessionalInterest occurrence; the first identical block may be submitInterest.
pos = text.find('  const submitProfessionalInterest = async')
if pos == -1:
    raise SystemExit('submitProfessionalInterest not found')
head, tail = text[:pos], text[pos:]
if old not in tail:
    raise SystemExit('professional interest insert anchor not found')
tail = tail.replace(old, new, 1)
market.write_text(head + tail)

page = Path('app/classifieds/page.tsx')
text = page.read_text()
old_select = '''.select("id,listing_id,professional_id,office_id,initiator_role,status,message,resume_path_snapshot,created_at,professional_hidden_at,deleted_at,source_office_listing_id,office_interest_snapshot,job_listings(profession,employment_type,city,province,listing_type)")'''
new_select = '''.select("id,listing_id,professional_id,office_id,initiator_role,status,message,resume_path_snapshot,created_at,professional_hidden_at,deleted_at,source_office_listing_id,office_interest_snapshot,professional_interest_snapshot,job_listings(profession,employment_type,city,province,listing_type)")'''
if old_select not in text:
    raise SystemExit('loadConnections select anchor not found')
text = text.replace(old_select, new_select, 1)

old_map = '''        candidatePreview: previewMap.get(String(row.professional_id)) || null,
        officeInterestSnapshot: row.office_interest_snapshot || null,'''
new_map = '''        candidatePreview: previewMap.get(String(row.professional_id)) || (row.professional_interest_snapshot ? {
          profession: row.professional_interest_snapshot.profession || listing?.profession || null,
          safeCity: row.professional_interest_snapshot.city || null,
          safeProvince: row.professional_interest_snapshot.province || null,
          yearsExperience: row.professional_interest_snapshot.years_experience == null ? null : Number(row.professional_interest_snapshot.years_experience),
          summary: row.professional_interest_snapshot.bio || "",
          experienceSummary: null,
          educationSummary: null,
          workHistorySummary: null,
          skills: Array.isArray(row.professional_interest_snapshot.skills) ? row.professional_interest_snapshot.skills : [],
          software: [],
          certifications: [],
        } : null),
        officeInterestSnapshot: row.office_interest_snapshot || null,'''
if old_map not in text:
    raise SystemExit('candidatePreview mapping anchor not found')
text = text.replace(old_map, new_map, 1)
page.write_text(text)
