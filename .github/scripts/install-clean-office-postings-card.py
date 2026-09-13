from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

import_line = 'import { ShareListingButton } from "@/components/ShareListingButton";\n'
new_import = import_line + 'import { OfficePostingsCard } from "@/components/OfficePostingsCard";\n'
if 'OfficePostingsCard' not in text:
    if import_line not in text:
        raise SystemExit('ShareListingButton import not found')
    text = text.replace(import_line, new_import, 1)

start = text.find('{portalRole === "office" && <section id="my-dentaljobs"')
end = text.find('\n\n        {portalRole === "professional" && <section', start)
if start == -1 or end == -1:
    raise SystemExit('Existing Office Postings section boundaries not found')

replacement = '''{portalRole === "office" && <OfficePostingsCard
          jobs={myOfficeJobs}
          connections={connections}
          manageError={manageError}
          connectionError={connectionError}
          unlockError={unlockError}
          unlockBusyId={unlockBusyId}
          connectionDeletingId={connectionDeletingId}
          connectionBusy={connectionBusy}
          isCandidateUnlocked={isCandidateUnlocked}
          onManage={setOfficeManageListing}
          onEdit={openEditListing}
          onSetupBillingCard={() => void setupBillingCard()}
          onUpdateConnection={(connection, action) => void updateConnection(connection, action)}
          onStartMatch={(connection) => void startCandidateUnlock(connection)}
          onDownloadResume={(connection) => void downloadMatchedResume(connection)}
          onViewCandidate={(connection) => void viewUnlockedCandidate(connection)}
          onOpenChat={(connection) => void openChat(connection)}
          onDeleteConnection={(connection) => void softDeleteConnection(connection)}
        />}'''

text = text[:start] + replacement + text[end:]
path.write_text(text)
print('Replaced legacy Office Postings JSX with clean standalone component')
