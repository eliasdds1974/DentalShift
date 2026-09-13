from pathlib import Path
p=Path('app/classifieds/page.tsx')
s=p.read_text()
old='''  const loadConnections = async (roleOverride?: "office" | "professional" | null) => {\n    const { data, error } = await supabase\n      .from("job_applications")\n'''
new='''  const loadConnections = async (roleOverride?: "office" | "professional" | null) => {\n    const effectiveRole = roleOverride || portalRole;\n    if (effectiveRole === "office") {\n      try {\n        const { data: { session } } = await supabase.auth.getSession();\n        if (!session?.access_token) return;\n        const response = await fetch("/api/dentaljobs/connections", {\n          headers: { Authorization: `Bearer ${session.access_token}` },\n          cache: "no-store",\n        });\n        const result = await response.json();\n        if (!response.ok) throw new Error(result.error || "Could not load interested professionals.");\n        setConnections((result.connections || []) as JobConnection[]);\n        return;\n      } catch (value) {\n        setConnectionError(value instanceof Error ? value.message : "Could not load interested professionals.");\n        return;\n      }\n    }\n\n    const { data, error } = await supabase\n      .from("job_applications")\n'''
if old not in s:
    raise SystemExit('loadConnections start not found')
s=s.replace(old,new,1)
s=s.replace('''    const effectiveRole = roleOverride || portalRole;\n    const rows = (data as any[]).filter((row) => effectiveRole === "professional" ? !row.professional_hidden_at : effectiveRole === "office" ? !row.office_hidden_at : true);\n''','''    const rows = (data as any[]).filter((row) => effectiveRole === "professional" ? !row.professional_hidden_at : true);\n''',1)
p.write_text(s)
print('office connection feed patched')
