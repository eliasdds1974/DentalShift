from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()

start_marker = '        ) : session && activeRole === "office" && details?.office ? (\n'
end_marker = '        ) : session ? (\n'

start = s.find(start_marker)
if start == -1:
    raise SystemExit('Office account modal branch start not found')
end = s.find(end_marker, start + len(start_marker))
if end == -1:
    raise SystemExit('Office account modal branch end not found')

replacement = '''        ) : session && activeRole === "office" && details?.office ? (\n          <div className="bg-[#f8fafc]">\n            <OfficeWorkspace\n              userId={session.user.id}\n              office={details.office}\n              onPost={() => {}}\n              refreshKey={0}\n              view="profile"\n            />\n          </div>\n'''

s = s[:start] + replacement + s[end:]
p.write_text(s)
