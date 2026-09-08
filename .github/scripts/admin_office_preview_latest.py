from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()

old = '''        const details = await loadAccountDetails(nextSession.user.id);
        const account = { profile: details.profile, officeId: details.office?.id ?? null };
        if (!active) return;
        setProfile(account.profile);
        setOfficeId(account.officeId);
        setOffice(details.office);'''
new = '''        const details = await loadAccountDetails(nextSession.user.id);
        let activeOffice = details.office;
        if (!activeOffice && details.profile.role === "admin") {
          const { data: previewOffice } = await supabase
            .from("offices")
            .select("*")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();
          if (previewOffice) activeOffice = previewOffice as OfficeDetails;
        }
        const account = { profile: details.profile, officeId: activeOffice?.id ?? null };
        if (!active) return;
        setProfile(account.profile);
        setOfficeId(account.officeId);
        setOffice(activeOffice);'''

if old not in s:
    raise SystemExit('syncAccount target block not found')
s = s.replace(old, new, 1)

old_role = '(candidate === "office" && Boolean(details.office)) ||'
new_role = '(candidate === "office" && Boolean(activeOffice)) ||'
if old_role not in s:
    raise SystemExit('office role eligibility target not found')
s = s.replace(old_role, new_role, 1)

p.write_text(s)
