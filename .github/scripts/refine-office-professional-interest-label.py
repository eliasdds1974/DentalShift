from pathlib import Path

path = Path('components/AnonymousAvailableStaffPanel.tsx')
text = path.read_text()
old = '''              {item.interested && <div className="mt-3 border-t border-[#34A853]/25 pt-3">\n                <div className="flex items-center justify-between gap-2">\n                  <span className="text-xs font-black text-[#017f27]">✓ I’m Interested</span>\n                  {item.interestElapsed && <span className="inline-flex items-center gap-1.5 font-mono text-xs font-black tabular-nums text-[#017f27]"><Clock3 size={13} />{item.interestElapsed}</span>}\n                </div>'''
new = '''              {item.interested && <div className="mt-3 border-t border-[#EA4335]/25 pt-3">\n                <div className="flex items-center justify-between gap-2">\n                  <span className="text-xs font-black text-[#EA4335]">✓ They are interested</span>\n                  {item.interestElapsed && <span className="inline-flex items-center gap-1.5 font-mono text-xs font-black tabular-nums text-[#EA4335]"><Clock3 size={13} />{item.interestElapsed}</span>}\n                </div>'''
assert old in text, 'professional interest label block not found'
text = text.replace(old, new, 1)
path.write_text(text)
