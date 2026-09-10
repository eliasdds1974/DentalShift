from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

old_state = '  const [posted, setPosted] = useState(false);'
new_state = old_state + '\n  const [portalRole, setPortalRole] = useState<"office" | "professional" | null>(null);'
if old_state not in text:
    raise RuntimeError('posted state not found')
text = text.replace(old_state, new_state, 1)

old_effect_start = '    const portalRole = window.localStorage.getItem("dentalshift_portal_role");\n    setBackHref(portalRole === "office" ? "/office/overview" : "/professionals/find-shifts");'
new_effect_start = '    const storedPortalRole = window.localStorage.getItem("dentalshift_portal_role");\n    const resolvedPortalRole = storedPortalRole === "office" ? "office" : storedPortalRole === "professional" ? "professional" : null;\n    setPortalRole(resolvedPortalRole);\n    setBackHref(resolvedPortalRole === "office" ? "/office/overview" : "/professionals/find-shifts");'
if old_effect_start not in text:
    raise RuntimeError('portalRole effect start not found')
text = text.replace(old_effect_start, new_effect_start, 1)
text = text.replace('if (portalRole === "office" && params.get("post") === "office")', 'if (resolvedPortalRole === "office" && params.get("post") === "office")', 1)
text = text.replace('if (portalRole === "office") {', 'if (resolvedPortalRole === "office") {', 1)

old_cards = '''        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <button type="button" onClick={() => { setPostingMode("office"); setSubmitted(false); setPosted(false); setPublishError(""); }} className="group rounded-2xl border-2 border-[#002757]/15 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#002757] hover:shadow-md"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#002757] text-white"><Building2 size={24} /></span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#002757]">Dental Office</p><h2 className="mt-1 text-xl font-black text-slate-900">Post a Position</h2><p className="mt-2 text-sm leading-6 text-slate-600">Advertise an opening anonymously. Your office name, exact address and contact information stay private.</p><span className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#01A32E]">Create office posting <BriefcaseBusiness size={16} /></span></div></div></button>
          <button type="button" onClick={() => { setPostingMode("professional"); setSubmitted(false); }} className="group rounded-2xl border-2 border-[#01A32E]/20 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#01A32E] hover:shadow-md"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#01A32E] text-white"><UserRound size={24} /></span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#017f27]">Dental Professional</p><h2 className="mt-1 text-xl font-black text-slate-900">Looking for an Office</h2><p className="mt-2 text-sm leading-6 text-slate-600">Advertise what you are looking for without displaying your identity. Your résumé/CV already on file can be used when you apply.</p><span className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#01A32E]">Create professional posting <FileText size={16} /></span></div></div></button>
        </div>'''
new_cards = '''        <div className={`mt-6 grid gap-4 ${portalRole ? "max-w-2xl" : "lg:grid-cols-2"}`}>
          {portalRole !== "professional" && <button type="button" onClick={() => { setPostingMode("office"); setSubmitted(false); setPosted(false); setPublishError(""); }} className="group rounded-2xl border-2 border-[#002757]/15 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#002757] hover:shadow-md"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#002757] text-white"><Building2 size={24} /></span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#002757]">Dental Office</p><h2 className="mt-1 text-xl font-black text-slate-900">Post a Position</h2><p className="mt-2 text-sm leading-6 text-slate-600">Advertise an opening anonymously. Your office name, exact address and contact information stay private.</p><span className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#01A32E]">Create office posting <BriefcaseBusiness size={16} /></span></div></div></button>}
          {portalRole !== "office" && <button type="button" onClick={() => { setPostingMode("professional"); setSubmitted(false); }} className="group rounded-2xl border-2 border-[#01A32E]/20 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#01A32E] hover:shadow-md"><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#01A32E] text-white"><UserRound size={24} /></span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#017f27]">Dental Professional</p><h2 className="mt-1 text-xl font-black text-slate-900">Looking for an Office</h2><p className="mt-2 text-sm leading-6 text-slate-600">Advertise what you are looking for without displaying your identity. Your résumé/CV already on file can be used when you apply.</p><span className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#01A32E]">Create professional posting <FileText size={16} /></span></div></div></button>}
        </div>'''
if old_cards not in text:
    raise RuntimeError('DentalJobs action cards block not found')
text = text.replace(old_cards, new_cards, 1)

path.write_text(text)
print('DentalJobs posting action cards now match the originating portal role.')
