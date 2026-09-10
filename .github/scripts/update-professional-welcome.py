from pathlib import Path

path = Path('components/WorkflowWorkspaceV2.tsx')
text = path.read_text()
old = '<h1 className="page-title">{profile.first_name ? `${profile.first_name}, find your next shift` : "Find your next shift"}</h1>'
new = '<h1 className="page-title">{profile.first_name ? `${profile.first_name}, let\'s find your next shift` : "Let\'s find your next shift"}</h1>'
if old not in text:
    raise SystemExit('Expected professional welcome heading not found')
path.write_text(text.replace(old, new, 1))
print('Updated professional portal welcome heading')
