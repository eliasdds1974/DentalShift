from pathlib import Path
p=Path('app/classifieds/page.tsx')
s=p.read_text()
s=s.replace('''    const refreshConnections = () => { void loadConnections(portalRole); };\n    window.addEventListener("focus", refreshConnections);\n\n    const channel = supabase\n''','''    const refreshConnections = () => { void loadConnections(portalRole); };\n    window.addEventListener("focus", refreshConnections);\n    const intervalId = window.setInterval(refreshConnections, 5000);\n\n    const channel = supabase\n''',1)
s=s.replace('''      window.removeEventListener("focus", refreshConnections);\n      void supabase.removeChannel(channel);\n''','''      window.removeEventListener("focus", refreshConnections);\n      window.clearInterval(intervalId);\n      void supabase.removeChannel(channel);\n''',1)
p.write_text(s)
print('office connection polling added')
