from pathlib import Path

path = Path("components/WorkflowWorkspaceV2.tsx")
text = path.read_text()
old = '<button type="submit" disabled={busy === "availability-add"} className="primary-btn mt-4 w-full justify-center">{busy === "availability-add" ? "Saving…" : "Add availability"}</button>'
new = '<div className="mt-4 grid grid-cols-2 gap-3"><button type="button" onClick={() => setAvailabilityModalOpen(false)} className="secondary-btn justify-center">Cancel</button><button type="submit" disabled={busy === "availability-add"} className="primary-btn justify-center">{busy === "availability-add" ? "Saving…" : "Add availability"}</button></div>'
if old not in text:
    raise SystemExit("availability submit button not found")
path.write_text(text.replace(old, new, 1))

# trigger one-time build
