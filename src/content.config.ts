/**
 * Content schemas. Every YAML file in /content is validated against these
 * at build time, so a typo or missing field fails loudly with a clear message.
 * You normally never need to touch this file — just edit the YAML.
 */
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse } from 'yaml';

/** A YAML file holding a single object (profile, skills). */
const single = (path: string) =>
  file(path, { parser: (text) => ({ main: parse(text) }) });

/** A YAML file holding a list. Entries keep the order they are written in. */
const list = (path: string) =>
  file(path, {
    parser: (text) => {
      const items = (parse(text) ?? []) as Record<string, unknown>[];
      return Object.fromEntries(items.map((item, i) => [String(i).padStart(3, '0'), { ...item, order: i }]));
    },
  });

const yearMonth = z
  .union([z.string(), z.date()])
  .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 7) : String(v)))
  .refine((v) => /^\d{4}-\d{2}$/.test(v), 'Use YYYY-MM, e.g. 2025-05');
const endDate = z.union([z.literal('present'), yearMonth]);
const link = z.object({ label: z.string(), url: z.url() });

export const collections = {
  profile: defineCollection({
    loader: single('content/profile.yaml'),
    schema: z.object({
      name: z.string(),
      nameLines: z.array(z.string()).min(1).max(3),
      codename: z.string(),
      codenameJp: z.string().default(''),
      title: z.string(),
      roles: z.array(z.string()).min(1),
      tagline: z.string(),
      location: z.string(),
      availability: z.object({ open: z.boolean(), label: z.string() }),
      email: z.email(),
      spokenLanguages: z.array(z.string()).default([]),
      cv: z.string().optional(),
      portrait: z.object({ main: z.string(), ink: z.string(), alt: z.string() }),
      rank: z.string().max(2),
      attribute: z.string(),
      faction: z.string(),
      socials: z.array(link.extend({ icon: z.string() })).default([]),
    }),
  }),
  skills: defineCollection({
    loader: single('content/skills.yaml'),
    schema: z.object({
      attributes: z
        .array(z.object({ name: z.string(), value: z.number().min(0).max(100) }))
        .min(3)
        .max(8),
      loadout: z.array(z.object({ slot: z.string(), items: z.array(z.string()) })),
    }),
  }),
  experience: defineCollection({
    loader: list('content/experience.yaml'),
    schema: z.object({
      order: z.number(),
      role: z.string(),
      company: z.string(),
      location: z.string().optional(),
      start: yearMonth,
      end: endDate,
      highlights: z.array(z.string()).default([]),
      stack: z.array(z.string()).default([]),
    }),
  }),
  projects: defineCollection({
    loader: list('content/projects.yaml'),
    schema: z.object({
      order: z.number(),
      name: z.string(),
      tagline: z.string(),
      rank: z.enum(['S', 'A', 'B']).default('A'),
      color: z.enum(['volt', 'ether', 'hazard', 'cyan']).default('volt'),
      glyph: z.string().max(3).optional(),
      year: z.union([z.number(), z.string()]).optional(),
      image: z.string().optional(),
      highlights: z.array(z.string()).default([]),
      stack: z.array(z.string()).default([]),
      links: z.array(link).default([]),
    }),
  }),
  education: defineCollection({
    loader: list('content/education.yaml'),
    schema: z.object({
      order: z.number(),
      qualification: z.string(),
      focus: z.string().optional(),
      institution: z.string(),
      location: z.string().optional(),
      start: yearMonth,
      end: endDate,
      notes: z.array(z.string()).default([]),
    }),
  }),
  publications: defineCollection({
    loader: list('content/publications.yaml'),
    schema: z.object({
      order: z.number(),
      title: z.string(),
      venue: z.string(),
      year: z.union([z.number(), z.string()]),
      url: z.url().optional(),
      metric: z.object({ value: z.number().min(0).max(100), label: z.string() }).optional(),
      highlights: z.array(z.string()).default([]),
    }),
  }),
};
