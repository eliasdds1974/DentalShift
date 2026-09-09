from pathlib import Path

# Fix magic-link routing so a signed-in user stays in the portal selected by the link.
path = Path('app/page.tsx')
s = path.read_text()
old = '''        if (requestedRole && canUseRole(requestedRole) && window.location.pathname === "/") {
          router.replace(portalRoutes[nextRole].overview);
        }
'''
new = '''        const currentRoute = portalState(window.location.pathname);
        if (requestedRole && canUseRole(requestedRole)) {
          if (!currentRoute || currentRoute.role !== requestedRole) {
            router.replace(portalRoutes[requestedRole].overview);
          }
        } else if (!currentRoute && canUseRole(nextRole)) {
          router.replace(portalRoutes[nextRole].overview);
        }
'''
assert old in s, 'magic-link redirect anchor not found'
s = s.replace(old, new, 1)
path.write_text(s)
