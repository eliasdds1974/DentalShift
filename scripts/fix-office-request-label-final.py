from pathlib import Path

path = Path("components/WorkflowWorkspaceV2.tsx")
text = path.read_text()

old = '''{matchingOfficeRequests.length > 0 && <button type="button" onClick={() => chooseDate(day)} title={`${matchingOfficeRequests.length} office request${matchingOfficeRequests.length === 1 ? "" : "s"} for ${signedRoleStyle.label}`} className="pointer-events-auto absolute left-0 right-0 top-7 grid min-w-0 grid-cols-[minmax(0,1fr)_18px] items-center gap-1 rounded-lg bg-[#F21C13] px-1.5 py-1 text-white shadow-sm sm:grid-cols-[minmax(0,1fr)_20px]"><span className="min-w-0 whitespace-nowrap text-center text-[6px] font-black leading-none tracking-[-0.03em] sm:text-[7px]">Office Request</span><span className="inline-grid h-[18px] w-[18px] place-items-center rounded-full bg-white text-[8px] font-black leading-none text-[#F21C13] sm:h-5 sm:w-5 sm:text-[9px]">{matchingOfficeRequests.length}</span></button>}'''

new = '''{matchingOfficeRequests.length > 0 && <button type="button" onClick={() => chooseDate(day)} title={`${matchingOfficeRequests.length} office request${matchingOfficeRequests.length === 1 ? "" : "s"} for ${signedRoleStyle.label}`} className="pointer-events-auto absolute left-0 right-0 top-7 grid min-w-0 grid-cols-[minmax(0,1fr)_18px] items-center gap-1 rounded-lg bg-[#F21C13] px-1.5 py-1 text-white shadow-sm sm:grid-cols-[minmax(0,1fr)_20px]"><span className="min-w-0 whitespace-nowrap text-center text-[8px] font-black leading-none tracking-[-0.03em] sm:text-[9px]">Office Request</span><span className="inline-grid h-[18px] w-[18px] place-items-center rounded-full bg-white text-[8px] font-black leading-none text-[#F21C13] sm:h-5 sm:w-5 sm:text-[9px]">{matchingOfficeRequests.length}</span></button>}'''

if old not in text:
    raise SystemExit("current office request button markup not found")

path.write_text(text.replace(old, new, 1))
