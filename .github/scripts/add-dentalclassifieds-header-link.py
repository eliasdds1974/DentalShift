from pathlib import Path

path = Path('app/page.tsx')
text = path.read_text()

old_button = '<button onClick={onMessages} className="inline-flex items-center gap-2 rounded-xl border border-[#04A62F] bg-[#04A62F] px-3 py-2 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#038827] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#04A62F]/30"><MessageCircle size={17} /><span className="hidden sm:inline">Messages</span></button>'
new_button = '<button onClick={onMessages} className="inline-flex items-center gap-2 rounded-xl border border-[#04A62F] bg-[#04A62F] px-3 py-2 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#038827] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#04A62F]/30"><BriefcaseBusiness size={17} /><span className="hidden sm:inline">DentalClassifieds</span><span className="sm:hidden">Classifieds</span></button>'

if old_button not in text and 'DentalClassifieds</span>' not in text:
    raise SystemExit('Could not find green Messages header button')
text = text.replace(old_button, new_button, 1)

old_header = '<Header role={role} onMenu={() => setMenu(true)} onPost={() => setPost(true)} onMessages={() => setMessages(true)} onAccount={() => setAccountOpen(true)} onSignOut={() => void supabase.auth.signOut()} signedIn={Boolean(session)} />'
new_header = '<Header role={role} onMenu={() => setMenu(true)} onPost={() => setPost(true)} onMessages={() => router.push("/classifieds")} onAccount={() => setAccountOpen(true)} onSignOut={() => void supabase.auth.signOut()} signedIn={Boolean(session)} />'

if old_header not in text and 'onMessages={() => router.push("/classifieds")}' not in text:
    raise SystemExit('Could not find portal Header invocation')
text = text.replace(old_header, new_header, 1)

path.write_text(text)
print('DentalClassifieds header link patched')
