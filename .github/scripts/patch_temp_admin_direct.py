from pathlib import Path

p = Path("app/page.tsx")
s = p.read_text()
start = s.find('        onAdmin={() => { void (async () => {')
if start == -1:
    if '        onAdmin={() => router.push("/admin/overview")}' in s:
        raise SystemExit(0)
    raise SystemExit("temporary admin handler start not found")
end_marker = '        onGetStarted={(nextRole) =>'
end = s.find(end_marker, start)
if end == -1:
    raise SystemExit("temporary admin handler end not found")
replacement = '        onAdmin={() => router.push("/admin/overview")}\n'
s = s[:start] + replacement + s[end:]
p.write_text(s)
