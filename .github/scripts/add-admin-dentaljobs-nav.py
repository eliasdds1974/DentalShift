from pathlib import Path
p=Path('app/admin/overview/page.tsx')
s=p.read_text()
s=s.replace('Archive, BookOpen, Building2, CalendarDays, CreditCard, LayoutDashboard', 'Archive, BookOpen, BriefcaseBusiness, Building2, CalendarDays, CreditCard, LayoutDashboard')
needle='<button onClick={() => router.push("/admin/billing")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"><CreditCard size={19} />Billing & invoices</button>'
insert=needle+'<button onClick={() => router.push("/admin/dentaljobs")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"><BriefcaseBusiness size={19} />DentalJobs Administration</button>'
assert needle in s
s=s.replace(needle,insert,1)
mobile='<button onClick={() => router.push("/admin/billing")} className="inline-flex items-center gap-2 text-sm font-bold text-[#002757]"><CreditCard size={17} />Billing & invoices</button>'
mobile_insert=mobile+'<button onClick={() => router.push("/admin/dentaljobs")} className="inline-flex items-center gap-2 text-sm font-bold text-[#245FB8]"><BriefcaseBusiness size={17} />DentalJobs Admin</button>'
assert mobile in s
s=s.replace(mobile,mobile_insert,1)
p.write_text(s)
