# SHINO — portfolio

Anime-game style portfolio for Sakif Hussain Shachcha. Static site built with
[Astro](https://astro.build), animated with [GSAP](https://gsap.com) and
[Lenis](https://lenis.darkroom.engineering), deployed to GitHub Pages.

## Updating your content

You never need to touch code for routine updates. Everything lives in `/content`:

| File | What it controls |
| --- | --- |
| `content/profile.yaml` | Name, title, tagline, location, availability light, email, socials, CV file, portrait |
| `content/skills.yaml` | Radar chart attributes (0–100) and the grouped tool "loadout" |
| `content/experience.yaml` | Work history (newest first) |
| `content/projects.yaml` | Project cards: rank, colour, highlights, stack, links, optional screenshot |
| `content/education.yaml` | Degrees and certificates |
| `content/publications.yaml` | Papers, awards, talks (with optional animated metric ring) |

Each file has comments at the top explaining its fields. To add an entry, copy
an existing block and edit it.

- **Dates** are `YYYY-MM`. Use `end: present` for a current role or degree.
- **Tool logos** appear automatically when the name matches a
  [Simple Icons](https://simpleicons.org) title (e.g. `PostgreSQL`, `Docker`).
  Anything else gets a monogram badge.
- **New CV:** replace `public/cv/Sakif_Hussain_Resume.pdf` (or change `cv:` in
  `profile.yaml`).
- **Project screenshots:** drop an image in `public/projects/` and set
  `image: projects/your-file.webp` on the project.
- **Availability:** set `availability.open: false` in `profile.yaml` to turn
  off the "open to roles" light and tape.

If you make a mistake (missing field, bad date), the build stops and tells you
exactly which file, entry and field is wrong.

## Running locally

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # production build into /dist
npm run preview  # serve the production build
```

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository on the `main` branch.
   - Name it `SHINO-01.github.io` to serve from `https://shino-01.github.io/`.
   - Any other name serves from `https://shino-01.github.io/<repo>/`. The base
     path is set automatically.
2. In the repository, open **Settings → Pages** and set **Source** to
   **GitHub Actions**.
3. Every push to `main` rebuilds and deploys (`.github/workflows/deploy.yml`).

Using a custom domain? Add a `public/CNAME` file containing the domain, and
set `SITE_URL=https://your-domain` / `BASE_PATH=/` in the workflow.

## Where things live

```
content/            ← your data (edit these)
public/agent/       portrait cut-outs (sticker + ink versions)
public/cv/          downloadable CV
src/content.config.ts   schemas that validate the YAML
src/components/     one Astro component per section
src/scripts/        motion: boot loader, hero, scroll choreography, cursor & UI
src/styles/global.css   colour, type and shared UI tokens
```

### Replacing the portrait

The hero uses two aligned transparent images of the same size: a colour
cut-out with a white sticker outline (`agent-sticker.webp`) and an ink-style
version used for the glitch effect (`agent-ink.webp`). Keep both the same
dimensions so the glitch lines up.

## Motion and accessibility

- The boot loader plays once per browser session; click or press any key to skip.
- Visitors with *reduce motion* enabled get a static page: no loader,
  parallax, pinning or marquees.
- Custom cursor and 3D card tilt only activate on devices with a fine pointer.
