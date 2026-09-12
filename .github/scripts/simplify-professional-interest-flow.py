from pathlib import Path

market = Path('components/DentalJobsNativeMarketplace.tsx')
text = market.read_text()

anchor = '  const submitOfficeInterest = async (listing: Listing) => {'
if anchor not in text:
    raise SystemExit('submitOfficeInterest anchor not found')

professional_fn = '''  const submitProfessionalInterest = async (listing: Listing) => {\n    if (sending) return;\n    setSending(true);\n    setError(\"\");\n\n    try {\n      const { data: { user } } = await supabase.auth.getUser();\n      if (!user) throw new Error(\"Please sign in again.\");\n\n      const details = await loadAccountDetails(user.id);\n      const officeId = listing.office_id;\n      const professionalId = user.id;\n      if (!officeId || !professionalId) throw new Error(\"This listing is missing account information needed to continue.\");\n\n      const { data, error: insertError } = await supabase\n        .from(\"job_applications\")\n        .insert({\n          listing_id: listing.id,\n          professional_id: professionalId,\n          office_id: officeId,\n          initiator_role: \"professional\",\n          status: \"pending\",\n          message: \"\",\n          resume_path_snapshot: details.professional?.resume_path || null,\n        })\n        .select(\"id,listing_id,status\")\n        .single();\n\n      if (insertError) throw insertError;\n\n      setApplications((current) => [\n        ...current.filter((item) => item.listing_id !== listing.id),\n        data as ApplicationState,\n      ]);\n    } catch (caught) {\n      setError(caught instanceof Error ? caught.message : \"Unable to send your interest right now.\");\n    } finally {\n      setSending(false);\n    }\n  };\n\n'''

if 'const submitProfessionalInterest = async' not in text:
    text = text.replace(anchor, professional_fn + anchor, 1)

old_label = '''    const actionLabel = existing\n      ? existing.status === \"pending\" && role === \"office\"\n        ? \"Awaiting Response\"\n        : applicationLabel(existing.status)\n      : role === \"professional\"\n        ? \"I'm Interested\"\n        : \"I'm Interested\";'''
new_label = '''    const actionLabel = existing\n      ? existing.status === \"pending\"\n        ? \"Awaiting Response\"\n        : applicationLabel(existing.status)\n      : \"I'm Interested\";'''
if old_label not in text:
    raise SystemExit('actionLabel block not found')
text = text.replace(old_label, new_label, 1)

old_click = '''                onClick={() => {\n                  if (role === \"office\") {\n                    void submitOfficeInterest(listing);\n                    return;\n                  }\n                  setSelected(listing);\n                  setMessage(\"\");\n                  setActionError(\"\");\n                }}'''
new_click = '''                onClick={() => {\n                  if (role === \"office\") {\n                    void submitOfficeInterest(listing);\n                    return;\n                  }\n                  void submitProfessionalInterest(listing);\n                }}'''
if old_click not in text:
    raise SystemExit('interest onClick block not found')
text = text.replace(old_click, new_click, 1)

old_style = '                style={{ backgroundColor: accent }}'
new_style = '                style={{ backgroundColor: existing?.status === \"pending\" && role === \"professional\" ? \"#EA4335\" : accent }}'
if old_style not in text:
    raise SystemExit('button style anchor not found')
text = text.replace(old_style, new_style, 1)
market.write_text(text)

page = Path('app/classifieds/page.tsx')
text = page.read_text()
old_grid = '<div className={portalRole ? "mt-6 grid items-stretch gap-4 lg:grid-cols-3" : ""}>'
new_grid = '<div className={portalRole ? `mt-6 grid items-stretch gap-4 ${portalRole === "professional" ? "lg:grid-cols-2" : "lg:grid-cols-3"}` : ""}>'
if old_grid not in text:
    raise SystemExit('top grid anchor not found')
text = text.replace(old_grid, new_grid, 1)

old_section = '{portalRole && <section className="h-full min-h-[250px] min-w-0 rounded-2xl border border-[#002757]/15 bg-white p-4 shadow-sm sm:p-5">'
new_section = '{portalRole === "office" && <section className="h-full min-h-[250px] min-w-0 rounded-2xl border border-[#002757]/15 bg-white p-4 shadow-sm sm:p-5">'
if old_section not in text:
    raise SystemExit('connections section anchor not found')
text = text.replace(old_section, new_section, 1)

# This section is now rendered only for office accounts. Preserve its existing shared
# markup without triggering TypeScript's impossible-literal comparison error for
# professional-only branches that are unreachable inside the office-only section.
section_start = text.index(new_section)
section_end = text.find('</section>}', section_start)
if section_end == -1:
    raise SystemExit('connections section end not found')
section_end += len('</section>}')
segment = text[section_start:section_end]
segment = segment.replace('portalRole === "professional"', 'String(portalRole) === "professional"')
text = text[:section_start] + segment + text[section_end:]

page.write_text(text)
