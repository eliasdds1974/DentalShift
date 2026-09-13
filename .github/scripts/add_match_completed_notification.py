from pathlib import Path

p = Path('app/api/dentaljobs/notify/route.ts')
s = p.read_text()
s = s.replace('const allowedEvents = new Set(["application_created", "response_interested", "response_declined", "chat_message"]);', 'const allowedEvents = new Set(["application_created", "response_interested", "response_declined", "chat_message", "match_completed"]);', 1)
anchor = '  const { data: context, error: contextError } = await requestClient.rpc("create_dentaljobs_notification", {'
block = '''  if (eventType === "match_completed") {
    const { data: contacts, error: contactsError } = await requestClient.rpc("get_dentaljobs_match_contacts", { p_application_id: applicationId });
    if (contactsError || !contacts) return NextResponse.json({ error: contactsError?.message || "Match contacts are unavailable." }, { status: 400 });
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) return NextResponse.json({ notified: true, emailSent: false });
    const officeEmail = String(contacts.office_email || "").trim();
    const professionalEmail = String(contacts.professional_email || "").trim();
    const professionalName = String(contacts.professional_name || "Dental Professional");
    const officeName = String(contacts.office_name || "Dental Office");
    const send = async (to: string, subject: string, text: string) => fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "DentalShift <support@dentalshift.ca>", to: [to], subject, text }),
    });
    const sent = [] as boolean[];
    if (officeEmail) sent.push((await send(officeEmail, `DentalJobs Match — ${professionalName}`, `Your LET’S MATCH connection is complete.\\n\\nProfessional: ${professionalName}\\nEmail: ${professionalEmail || "Not provided"}\\nPhone: ${contacts.professional_phone || "Not provided"}\\nAddress: ${contacts.professional_address || "Not provided"}\\n\\nThe résumé/CV is available from the matched professional card in your DentalJobs portal.`)).ok);
    if (professionalEmail) sent.push((await send(professionalEmail, `DentalJobs Match — ${officeName}`, `The dental office selected LET’S MATCH.\\n\\nOffice: ${officeName}\\nEmail: ${officeEmail || "Not provided"}\\nPhone: ${contacts.office_phone || "Not provided"}\\nAddress: ${contacts.office_address || "Not provided"}`)).ok);
    return NextResponse.json({ notified: true, emailSent: sent.length > 0 && sent.every(Boolean) });
  }

'''
if anchor not in s:
    raise SystemExit('notification RPC anchor not found')
s = s.replace(anchor, block + anchor, 1)
p.write_text(s)
print('added match_completed mutual contact emails')
