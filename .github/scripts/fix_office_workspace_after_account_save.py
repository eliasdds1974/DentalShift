from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()
old = '''      {accountOpen && <AccountModal close={() => { setAccountOpen(false); if (role === "office" && view === "profile") navigate("office", "overview"); }} session={session} profile={profile} officeFallback={office} activeRole={role} passwordRecovery={passwordRecovery} onPasswordRecoveryComplete={completePasswordRecovery} onSaved={() => {
        setRefreshKey((value) => value + 1);
        if (session) void loadAccountDetails(session.user.id).then((details) => {
          setProfile(details.profile);
          setOfficeId(details.office?.id ?? null);
          setOffice(details.office);
        });
      }} />}'''
new = '''      {accountOpen && <AccountModal close={() => { setAccountOpen(false); if (role === "office" && view === "profile") navigate("office", "overview"); }} session={session} profile={profile} officeFallback={office} activeRole={role} passwordRecovery={passwordRecovery} onPasswordRecoveryComplete={completePasswordRecovery} onSaved={() => {
        setRefreshKey((value) => value + 1);
        if (session) void loadAccountDetails(session.user.id).then(async (details) => {
          let activeOffice = details.office;
          if (!activeOffice && details.profile.role === "admin" && office?.id) {
            const { data: refreshedPreviewOffice } = await supabase
              .from("offices")
              .select("*")
              .eq("id", office.id)
              .maybeSingle();
            if (refreshedPreviewOffice) activeOffice = refreshedPreviewOffice as OfficeDetails;
          }
          if (!activeOffice && details.profile.role === "admin") {
            const { data: previewOffice } = await supabase
              .from("offices")
              .select("*")
              .order("created_at", { ascending: true })
              .limit(1)
              .maybeSingle();
            if (previewOffice) activeOffice = previewOffice as OfficeDetails;
          }
          setProfile(details.profile);
          setOfficeId(activeOffice?.id ?? null);
          setOffice(activeOffice);
        });
      }} />}'''
if old not in s:
    raise SystemExit('Authenticated AccountModal onSaved block not found')
s = s.replace(old, new, 1)
p.write_text(s)
