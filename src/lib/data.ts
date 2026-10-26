import { getCollection, getEntry } from 'astro:content';

const byOrder = <T extends { data: { order: number } }>(a: T, b: T) => a.data.order - b.data.order;

export async function loadSite() {
  const site = (await getEntry('site', 'main'))!.data;
  const profile = (await getEntry('profile', 'main'))!.data;
  const skills = (await getEntry('skills', 'main'))!.data;
  const experience = (await getCollection('experience')).sort(byOrder).map((e) => e.data);
  const projects = (await getCollection('projects')).sort(byOrder).map((e) => e.data);
  const education = (await getCollection('education')).sort(byOrder).map((e) => e.data);
  const publications = (await getCollection('publications')).sort(byOrder).map((e) => e.data);
  return { site, profile, skills, experience, projects, education, publications };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2025-05" → "May 2025", "present" → "Present" */
export function fmtMonth(ym: string) {
  if (ym === 'present') return 'Present';
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Human duration between two YYYY-MM values, inclusive of both months. */
export function duration(start: string, end: string) {
  const now = new Date();
  const [sy, sm] = start.split('-').map(Number);
  const [ey, em] = end === 'present' ? [now.getFullYear(), now.getMonth() + 1] : end.split('-').map(Number);
  const months = Math.max(1, (ey - sy) * 12 + (em - sm));
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y && `${y} yr`, m && `${m} mo`].filter(Boolean).join(' ');
}

export type SiteCopy = Awaited<ReturnType<typeof loadSite>>['site'];

/** Resolve a path inside /public against the configured base path. */
export function asset(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}
