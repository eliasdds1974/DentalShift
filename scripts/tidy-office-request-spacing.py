from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()
old = '''<div className="flex max-w-[78%] flex-wrap justify-end gap-1 pointer-events-auto">
                  {matchingOfficeRequests.length > 0 && <button type="button" onClick={() => chooseDate(day)} title={`${matchingOfficeRequests.length} office request${matchingOfficeRequests.length === 1 ? "" : "s"} for ${signedRoleStyle.label}`} className="rounded-lg bg-[#F21C13] px-2 py-1 text-[10px] font-black text-white shadow-sm">Office Request · {matchingOfficeRequests.length}</button>}'''
new = '''<div className="flex max-w-[78%] flex-wrap justify-end gap-1 pointer-events-auto">
                  {matchingOfficeRequests.length > 0 && <button type="button" onClick={() => chooseDate(day)} title={`${matchingOfficeRequests.length} office request${matchingOfficeRequests.length === 1 ? "" : "s"} for ${signedRoleStyle.label}`} className="inline-flex max-w-full items-center gap-1 rounded-lg bg-[#F21C13] px-2 py-1.5 text-[9px] font-black leading-none text-white shadow-sm"><span className="whitespace-nowrap">Office Request</span><span className="inline-grid h-4 min-w-4 place-items-center rounded-full bg-white/20 px-1 text-[9px]">{matchingOfficeRequests.length}</span></button>}'''
if old not in text:
    raise SystemExit('Expected office request block not found')
path.write_text(text.replace(old, new, 1))
