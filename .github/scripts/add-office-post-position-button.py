from pathlib import Path

# Office portal button
path = Path('components/OfficeWorkspaceV2.tsx')
text = path.read_text()
old_import = 'import { CalendarDays, Check, ChevronLeft, ChevronRight, FileCheck2, Plus, Star, UsersRound, X } from "lucide-react";'
new_import = 'import { BriefcaseBusiness, CalendarDays, Check, ChevronLeft, ChevronRight, FileCheck2, Plus, Star, UsersRound, X } from "lucide-react";'
if old_import not in text:
    raise RuntimeError('OfficeWorkspaceV2 lucide import not found')
text = text.replace(old_import, new_import, 1)
old_button = '<button type="button" onClick={() => setPostShiftOpen(true)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#04A62F] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#038c28] focus:outline-none focus:ring-2 focus:ring-[#04A62F]/30"><Plus size={18} />Post a Shift</button>'
new_button = old_button + '\n          <button type="button" onClick={() => { window.localStorage.setItem("dentalshift_portal_role", "office"); window.location.href = "/classifieds?post=office"; }} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#002757] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#001f46] focus:outline-none focus:ring-2 focus:ring-[#002757]/25"><BriefcaseBusiness size={18} />Post a Position</button>'
if old_button not in text:
    raise RuntimeError('Post a Shift button not found')
text = text.replace(old_button, new_button, 1)
path.write_text(text)

# DentalJobs deep link: ?post=office opens office form automatically
path = Path('app/classifieds/page.tsx')
text = path.read_text()
old_import = 'import { usePathname, useRouter } from "next/navigation";'
if old_import in text:
    pass
else:
    # Current file does not import navigation helpers; use browser URL to avoid extra dependency.
    pass
old_effect = '''  useEffect(() => {\n    const portalRole = window.localStorage.getItem("dentalshift_portal_role");\n    setBackHref(portalRole === "office" ? "/office/overview" : "/professionals/find-shifts");\n  }, []);'''
new_effect = '''  useEffect(() => {\n    const portalRole = window.localStorage.getItem("dentalshift_portal_role");\n    setBackHref(portalRole === "office" ? "/office/overview" : "/professionals/find-shifts");\n    const params = new URLSearchParams(window.location.search);\n    if (portalRole === "office" && params.get("post") === "office") {\n      setPostingMode("office");\n      setSubmitted(false);\n    }\n  }, []);'''
if old_effect not in text:
    raise RuntimeError('DentalJobs startup effect not found')
text = text.replace(old_effect, new_effect, 1)
path.write_text(text)
print('Added office-only Post a Position shortcut and DentalJobs office-form deep link.')
