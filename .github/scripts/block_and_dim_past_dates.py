from pathlib import Path

for path in ['components/WorkflowWorkspaceV2.tsx','components/OfficeWorkspaceV2.tsx']:
    s=Path(path).read_text()
    print('\nFILE',path)
    for needle in ['localDateKey(', 'key={', 'calendarDays', 'chooseDate', 'onClick={() =>']:
        print('\nNEEDLE',needle)
        start=0
        shown=0
        while shown<12:
            i=s.find(needle,start)
            if i<0: break
            print(s[max(0,i-180):min(len(s),i+420)].replace('\n','\\n'))
            start=i+len(needle)
            shown+=1
raise SystemExit('calendar diagnostics complete')
