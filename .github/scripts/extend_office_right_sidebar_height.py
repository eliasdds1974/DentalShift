from pathlib import Path

path = Path('components/OfficeWorkspaceV2.tsx')
text = path.read_text()
old = '''<aside ref={resultsRef} className="scroll-mt-[92px] border-t border-slate-200 bg-white p-4 sm:p-5 lg:border-l lg:border-t-0 lg:p-0"><div className="lg:sticky lg:top-[84px] lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto lg:p-5">'''
new = '''<aside ref={resultsRef} className="scroll-mt-[92px] self-stretch border-t border-slate-200 bg-white p-4 sm:p-5 lg:border-l lg:border-t-0 lg:p-0"><div className="h-full lg:p-5">'''
if old not in text:
    raise SystemExit('target sidebar layout not found')
text = text.replace(old, new, 1)
path.write_text(text)
