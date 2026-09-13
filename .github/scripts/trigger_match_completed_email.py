from pathlib import Path

p = Path('app/classifieds/page.tsx')
s = p.read_text()
s = s.replace('eventType: "application_created" | "response_interested" | "response_declined" | "chat_message"', 'eventType: "application_created" | "response_interested" | "response_declined" | "chat_message" | "match_completed"', 1)
old = '''      if (result.unlocked) {
        await loadUnlocks();
        await loadConnections();
        await viewUnlockedCandidate(connection);
        return;
      }'''
new = '''      if (result.unlocked) {
        await loadUnlocks();
        await loadConnections();
        if (!result.alreadyUnlocked) void notifyDentalJobs(connection.id, "match_completed");
        await viewUnlockedCandidate(connection);
        return;
      }'''
if old not in s:
    raise SystemExit('unlock success block not found')
s = s.replace(old, new, 1)
p.write_text(s)
print('match_completed email trigger added')
