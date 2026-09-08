from pathlib import Path
p=Path('components/WorkflowWorkspaceV2.tsx')
s=p.read_text()
old='''            <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
              {selectedInvitations.length > 0 && <span className="rounded-full bg-[#EA4335] px-2.5 py-1 text-white">{selectedInvitations.length} Invitations</span>}
              {selectedApplied.length > 0 && <span className="rounded-full bg-[#34A853] px-2.5 py-1 text-white">{selectedApplied.length} Applied</span>}
              {selectedBooked.length > 0 && <span className="rounded-full bg-[#002757] px-2.5 py-1 text-white">✓ Booked</span>}
            </div>
'''
if old not in s: raise SystemExit('selected-date badge row not found')
s=s.replace(old,'',1)
old_btn='''            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="secondary-btn w-full justify-center lg:hidden">↑ Back to calendar</button>'''
new_btn='''            <div className="mt-6 border-t border-slate-200 pt-4 lg:hidden"><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="secondary-btn w-full justify-center">↑ Back to calendar</button></div>'''
if old_btn not in s: raise SystemExit('back to calendar button not found')
s=s.replace(old_btn,new_btn,1)
p.write_text(s)
print('Removed selected-date status badges and anchored Back to calendar at the end of the sidebar.')