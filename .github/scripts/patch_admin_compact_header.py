from pathlib import Path
p = Path('components/AdminCommandCenter.tsx')
s = p.read_text()
start = s.index('    <div className="rounded-3xl bg-[#002757]')
end = s.index('\n    <div className="mt-5 flex gap-2 overflow-x-auto', start)
new = '''    <div className="rounded-2xl bg-[#002757] p-4 text-white shadow-sm sm:p-5">
      <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Admin Command Center</h1>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1"><Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, office, licence, phone, city, status, booking or review…" className="h-11 w-full rounded-xl border border-white/15 bg-white pl-12 pr-4 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400" /></div>
        <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#FDB605] px-4 text-sm font-black text-[#002757] transition hover:bg-[#e5a700] disabled:opacity-60"><RefreshCw size={17} />{loading ? "Refreshing…" : "Refresh live data"}</button>
      </div>
    </div>
'''
s = s[:start] + new + s[end:]
p.write_text(s)
