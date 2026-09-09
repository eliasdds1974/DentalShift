from pathlib import Path

# lib helper
p = Path('lib/dentalshift.ts')
text = p.read_text()
anchor = '''export async function acceptApplication(applicationId: string) {\n  const { data, error } = await supabase.rpc("office_accept_application", { p_application_id: applicationId });\n  if (error) throw error;\n  return data;\n}\n'''
insert = anchor + '''\nexport async function confirmInterestBooking(applicationId: string) {\n  const { data, error } = await supabase.rpc("confirm_interest_booking", { p_application_id: applicationId });\n  if (error) throw error;\n  if (!data) throw new Error("DentalShift could not confirm the booking. Please try again.");\n  return data;\n}\n'''
if 'export async function confirmInterestBooking' not in text:
    if anchor not in text:
        raise SystemExit('acceptApplication anchor not found')
    text = text.replace(anchor, insert)
p.write_text(text)

# professional portal
p = Path('components/WorkflowWorkspaceV2.tsx')
text = p.read_text()
text = text.replace('  cancelShiftInterest,\n', '  cancelShiftInterest,\n  confirmInterestBooking,\n')
text = text.replace('''  const refresh = async () => {\n    setLoading(true);\n''', '''  const refresh = async (showLoading = true) => {\n    if (showLoading) setLoading(true);\n''')
text = text.replace('''    } finally {\n      setLoading(false);\n    }\n  };\n\n  useEffect(() => { void refresh(); }, [userId, refreshKey]);\n''', '''    } finally {\n      if (showLoading) setLoading(false);\n    }\n  };\n\n  useEffect(() => { void refresh(); }, [userId, refreshKey]);\n''')
marker = '''  useEffect(() => {\n    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);\n    return () => window.clearInterval(timer);\n  }, []);\n'''
addition = marker + '''  useEffect(() => {\n    const refreshSilently = () => { void refresh(false); };\n    const interval = window.setInterval(refreshSilently, 30000);\n    window.addEventListener("focus", refreshSilently);\n    return () => {\n      window.clearInterval(interval);\n      window.removeEventListener("focus", refreshSilently);\n    };\n  }, [userId]);\n'''
if 'window.setInterval(refreshSilently, 30000)' not in text:
    if marker not in text:
        raise SystemExit('professional timer marker not found')
    text = text.replace(marker, addition)
text = text.replace('() => respondToInvitation(officeInterest.id, true)', '() => confirmInterestBooking(officeInterest.id)')
p.write_text(text)

# office portal
p = Path('components/OfficeWorkspaceV2.tsx')
text = p.read_text()
text = text.replace('  cancelOfficeShift,\n', '  cancelOfficeShift,\n  confirmInterestBooking,\n')
text = text.replace('onBookInterest={(applicationId) => void act(applicationId, () => acceptApplication(applicationId))}', 'onBookInterest={(applicationId) => void act(applicationId, () => confirmInterestBooking(applicationId))}')
p.write_text(text)
