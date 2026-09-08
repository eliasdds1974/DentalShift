from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()
old = '''      setNotice(details?.professional ? "Office account information saved." : "Office account saved. Your Dental Professional workspace can use the same email with its own password.");
      onSaved();
      close();'''
new = '''      setNotice("Office account information saved.");
      onSaved();
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/office/")) {
        window.history.replaceState({}, "", "/office/overview?portal_role=office");
      }
      close();'''
if old not in s:
    raise SystemExit('Office save completion block not found')
s = s.replace(old, new, 1)
p.write_text(s)
