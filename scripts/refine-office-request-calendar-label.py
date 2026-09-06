from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()

old = '''{matchingOfficeRequests.length > 0 && <button type="button" onClick={() => chooseDate(day)} title={`${matchingOfficeRequests.length} office request${matchingOfficeRequests.length === 1 ? "" : "s"} for ${signedRoleStyle.label}`} className="pointer-events-auto absolute left-0 right-0 top-7 flex min-w-0 items-center justify-between gap-1.5 rounded-lg bg-[#F21C13] px-2 py-1 text-[7px] font-black leading-none tracking-tight text-white shadow-sm sm:text-[8px]"><span className="min-w-0 whitespace-nowrap">Office Request</span><span className="inline-grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-white px-1 text-[8px] font-black text-[#F21C13] sm:h-5 sm:min-w-5 sm:text-[9px]">{matchingOfficeRequests.length}</span></button>}'''

new = '''{matchingOfficeRequests.length > 0 && <button type="button" onClick={() => chooseDate(day)} title={`${matchingOfficeRequests.length} office request${matchingOfficeRequests.length === 1 ? "" : "s"} for ${signedRoleStyle.label}`} className="pointer-events-auto absolute left-0 right-0 top-7 block min-w-0 rounded-lg bg-[#F21C13] px-1.5 py-1 pr-7 text-center text-[7px] font-black leading-none tracking-tight text-white shadow-sm sm:text-[8px]"><span className="block whitespace-nowrap">Office Request</span><span className="absolute right-1 top-1/2 inline-grid h-4 min-w-4 -translate-y-1/2 place-items-center rounded-full bg-white px-1 text-[8px] font-black text-[#F21C13] sm:h-5 sm:min-w-5 sm:text-[9px]">{matchingOfficeRequests.length}</span></button>}'''

if old not in text:
    raise SystemExit('current office request label not found')

path.write_text(text.replace(old, new, 1))
