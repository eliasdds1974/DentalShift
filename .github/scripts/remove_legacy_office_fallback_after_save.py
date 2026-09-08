from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()
old = '''    () => role === "office"
      ? session && profile && office
        ? <OfficeWorkspace userId={session.user.id} office={office} onPost={() => setPost(true)} refreshKey={refreshKey} view={view === "profile" ? "overview" : view} />
        : <OfficeDashboard onPost={() => setPost(true)} onRebook={() => setRebook(true)} />
      : role === "professional"'''
new = '''    () => role === "office"
      ? session
        ? profile && office
          ? <OfficeWorkspace userId={session.user.id} office={office} onPost={() => setPost(true)} refreshKey={refreshKey} view={view === "profile" ? "overview" : view} />
          : <div className="page-wrap"><div className="panel mx-auto max-w-xl p-8 text-center"><h1 className="text-xl font-black text-[#002757]">Loading your office workspace</h1><p className="mt-2 text-sm leading-6 text-slate-500">DentalShift is refreshing your office account. Your current office portal will appear as soon as the saved office information is available.</p></div></div>
        : <OfficeDashboard onPost={() => setPost(true)} onRebook={() => setRebook(true)} />
      : role === "professional"'''
if old not in s:
    raise SystemExit('Active office content block not found')
s = s.replace(old, new, 1)
p.write_text(s)
