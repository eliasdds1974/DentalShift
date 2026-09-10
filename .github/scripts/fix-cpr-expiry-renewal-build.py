from pathlib import Path
import runpy

runpy.run_path('.github/scripts/add-cpr-expiry-renewal-flow.py', run_name='__main__')

app_path = Path('app/page.tsx')
app = app_path.read_text()
app = app.replace('{detail("cprGraceUntil") && <p className="mt-1 font-bold text-amber-700">', '{Boolean(detail("cprGraceUntil")) && <p className="mt-1 font-bold text-amber-700">')
app_path.write_text(app)
print('Fixed CPR renewal ReactNode condition')
