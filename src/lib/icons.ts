/**
 * Brand logos for tools and socials, looked up by name from Simple Icons
 * (https://simpleicons.org). Names that are not found fall back to a monogram,
 * so you can write any tool name in the YAML without breaking anything.
 */
import * as si from 'simple-icons';

type Icon = { path: string; hex: string; title: string };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#]/g, '');
const index = new Map<string, Icon>();
for (const icon of Object.values(si) as Icon[]) {
  if (icon && typeof icon === 'object' && 'path' in icon) index.set(norm(icon.title), icon);
}

// A few aliases and brands Simple Icons does not ship.
const extra: Record<string, Icon> = {
  linkedin: {
    title: 'LinkedIn',
    hex: '0A66C2',
    path: 'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z',
  },
  mail: {
    title: 'Email',
    hex: 'D7FF1F',
    path: 'M1.5 4h21A1.5 1.5 0 0 1 24 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-21A1.5 1.5 0 0 1 0 18.5v-13A1.5 1.5 0 0 1 1.5 4zm.9 2.2v.3l9.6 6.4 9.6-6.4v-.3H2.4zm19.2 2.7-9.6 6.4-9.6-6.4v9h19.2v-9z',
  },
};
const aliases: Record<string, string> = { chrome: 'googlechrome', js: 'javascript', ts: 'typescript', golang: 'go', postgres: 'postgresql', awskms: 'amazonwebservices' };

export function iconFor(name: string): Icon | undefined {
  const key = norm(name);
  return extra[key] ?? index.get(aliases[key] ?? key) ?? index.get(key.replace(/js$/, 'dotjs'));
}

export function monogram(name: string) {
  const words = name.replace(/[^A-Za-z0-9+ ]/g, ' ').trim().split(/\s+/);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}
