from pathlib import Path

p = Path('components/WorkflowWorkspace.tsx')
s = p.read_text()

old = '''    .sort((first, second) => {\n      if (sortShifts === "highest") return Number(second.hourly_rate) - Number(first.hourly_rate);\n      if (sortShifts === "soonest") return new Date(first.starts_at).getTime() - new Date(second.starts_at).getTime();\n      const firstScore = (matchesAvailability(first) ? 2 : 0) + (favouriteOfficeIds.has(first.office_id) ? 1 : 0);\n      const secondScore = (matchesAvailability(second) ? 2 : 0) + (favouriteOfficeIds.has(second.office_id) ? 1 : 0);\n      return secondScore - firstScore || new Date(first.starts_at).getTime() - new Date(second.starts_at).getTime();\n    });'''

new = '''    .sort((first, second) => {\n      if (sortShifts === "highest") return Number(second.hourly_rate) - Number(first.hourly_rate);\n      if (sortShifts === "soonest") return new Date(first.starts_at).getTime() - new Date(second.starts_at).getTime();\n\n      // Default card priority in the professional portal:\n      // 1) shifts that match "I'm Available"\n      // 2) RDH, 3) CDA, 4) DT/DA, 5) ST\n      const firstAvailable = matchesAvailability(first);\n      const secondAvailable = matchesAvailability(second);\n      if (firstAvailable !== secondAvailable) return firstAvailable ? -1 : 1;\n\n      const rolePriority = (shift: LiveShift) => {\n        const code = shiftRoleCode(shift.profession);\n        if (code === "RDH") return 0;\n        if (code === "CDA") return 1;\n        if (code === "DA") return 2;\n        if (code === "ST") return 3;\n        const value = shift.profession.toLowerCase();\n        if (value.includes("dentist") || value.includes("dental therapist")) return 2;\n        return 4;\n      };\n\n      const roleDifference = rolePriority(first) - rolePriority(second);\n      if (roleDifference) return roleDifference;\n\n      const favouriteDifference = Number(favouriteOfficeIds.has(second.office_id)) - Number(favouriteOfficeIds.has(first.office_id));\n      if (favouriteDifference) return favouriteDifference;\n\n      return new Date(first.starts_at).getTime() - new Date(second.starts_at).getTime();\n    });'''

if old not in s:
    raise SystemExit('Professional shift sort block not found')

p.write_text(s.replace(old, new, 1))
