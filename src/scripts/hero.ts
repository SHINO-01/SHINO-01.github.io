import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];

const hero = () => $('[data-hero]');
let heroChars: HTMLElement[] = [];

/** Hide hero parts before the loader clears so nothing flashes. */
export function heroInitialState() {
  const h = hero();
  if (!h) return;
  gsap.set($('[data-hero-slab]', h), { skewX: -12, yPercent: 110 });
  gsap.set($('[data-hero-tri]', h), { scale: 0, transformOrigin: '100% 100%' });
  gsap.set($$('[data-draw]', h), { strokeDasharray: 900, strokeDashoffset: 900 });
  gsap.set($('[data-hero-main]', h), { xPercent: 30, opacity: 0, filter: 'blur(14px)' });
  const [echoB, echoA] = $$('[data-hero-echo]', h);
  gsap.set(echoB, { xPercent: 85, opacity: 0, scaleX: 1.7 });
  gsap.set(echoA, { xPercent: 65, opacity: 0, scaleX: 1.45 });
  // split solid name lines into letters for the smear-in
  heroChars = $$('[data-hero-line]', h).flatMap((line) => SplitText.create(line, { type: 'chars', charsClass: 'char' }).chars as HTMLElement[]);
  gsap.set(heroChars, { xPercent: -170, scaleX: 2.6, opacity: 0, filter: 'blur(8px)', transformOrigin: '100% 50%' });
  gsap.set($$('[data-hero-in]', h), { y: 28, opacity: 0 });
  gsap.set($('[data-hero-card]', h), { xPercent: 25, opacity: 0 });
  gsap.set($$('[data-sticker]', h), { scale: 0, rotate: -40 });
  gsap.set($$('[data-hero-tapes] .tape'), { yPercent: 260 });
  gsap.set($('[data-hero-ghost]', h), { opacity: 0, x: 120 });
}

export function heroIntro() {
  const h = hero();
  if (!h) return;
  const tl = gsap.timeline({
    defaults: { ease: 'expo.out' },
    onComplete: () => { document.documentElement.dataset.heroReady = '1'; dispatchEvent(new Event('hero:ready')); },
  });
  tl.to($('[data-hero-slab]', h), { yPercent: 0, duration: 1.1 })
    .to($('[data-hero-tri]', h), { scale: 1, duration: 0.9 }, 0.15)
    .to($('[data-hero-ghost]', h), { opacity: 1, x: 0, duration: 1.4 }, 0.1)
    // シノ and the outlined surname draw themselves on, stroke by stroke
    .to($$('[data-hero-jp] [data-draw]', h), { strokeDashoffset: 0, duration: 1.8, stagger: 0.3, ease: 'power2.inOut' }, 0.35)
    .to($$('[data-hero-draw] [data-draw]', h), { strokeDashoffset: 0, duration: 1.4, stagger: 0.07, ease: 'power2.inOut' }, 0.75)
    // afterimage dash-in: violet then lime silhouettes overshoot, the portrait lands, echoes settle behind it
    .to($$('[data-hero-echo]', h), { xPercent: -7, opacity: 0.9, scaleX: 1, duration: 0.55, ease: 'power4.out', stagger: 0.07 }, 0.3)
    .to($('[data-hero-main]', h), { xPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power4.out' }, 0.5)
    .to($$('[data-hero-echo]', h), { xPercent: (i) => (i ? -1.4 : -2.6), duration: 0.9, ease: 'elastic.out(1, 0.5)', stagger: 0.05 }, 0.85)
    .add(() => glitch(true), 1)
    // name letters smear in from the left and snap to shape
    .to(heroChars, { xPercent: 0, scaleX: 1, opacity: 1, filter: 'blur(0px)', duration: 0.75, stagger: 0.035, ease: 'expo.out' }, 0.3)
    .to($$('[data-hero-in]', h), { y: 0, opacity: 1, duration: 0.8, stagger: 0.07 }, 0.6)
    .to($('[data-hero-card]', h), { xPercent: 0, opacity: 1, duration: 0.9 }, 0.8)
    .to($$('[data-sticker]', h), { scale: 1, rotate: 0, duration: 0.7, ease: 'back.out(2.2)', stagger: 0.1 }, 1)
    .to($$('[data-hero-tapes] .tape'), { yPercent: 0, duration: 0.9, stagger: 0.08, ease: 'power4.out' }, 0.7)
    .add(() => { gsap.set([$('[data-hero-main]', h), ...heroChars], { clearProps: 'filter' }); });
  // Play the whole intro ~35% slower so each beat reads clearly.
  tl.timeScale(0.74);
  return tl;
}

/* ───────── idle behaviours ───────── */

let glitching = false;
/** Slice-and-shift glitch on the portrait, with an ink-layer flash. */
function glitch(strong = false) {
  const h = hero();
  if (!h || glitching) return;
  glitching = true;
  const slices = $$('[data-hero-slices] > div', h);
  const ink = $('[data-hero-ink]', h);
  const main = $('[data-hero-main]', h);
  const frames = strong ? 6 : 4;
  const tl = gsap.timeline({ onComplete: () => { glitching = false; } });
  for (let f = 0; f < frames; f++) {
    tl.add(() => {
      slices.forEach((s) => {
        const top = gsap.utils.random(0, 90);
        const hgt = gsap.utils.random(2, 12);
        gsap.set(s, {
          opacity: Math.random() > 0.35 ? 1 : 0,
          x: gsap.utils.random(-40, 40),
          clipPath: `inset(${top}% 0 ${Math.max(0, 100 - top - hgt)}% 0)`,
          filter: Math.random() > 0.5 ? 'hue-rotate(90deg) saturate(3)' : 'none',
        });
      });
      gsap.set(ink, { opacity: Math.random() > 0.5 ? 0.9 : 0, x: gsap.utils.random(-14, 14) });
      gsap.set(main, { x: gsap.utils.random(-6, 6) });
    }, f * 0.055);
  }
  tl.add(() => {
    gsap.set(slices, { opacity: 0, x: 0 });
    gsap.set(ink, { opacity: 0, x: 0 });
    gsap.set(main, { x: 0 });
  }, frames * 0.055);
}

export function heroIdle() {
  const h = hero();
  if (!h) return;

  // Recurring glitch while the hero is on screen.
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(h);
  const loop = () => {
    gsap.delayedCall(gsap.utils.random(2.8, 5.2), () => { if (visible && !document.hidden) glitch(); loop(); });
  };
  loop();

  // Stickers bob gently.
  $$('[data-sticker]', h).forEach((s, i) => {
    gsap.to(s, { yPercent: -9, rotate: i % 2 ? 4 : -4, duration: 2 + i * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.6 + i * 0.2 });
  });

  // Role rotator with a decode effect.
  const role = $('[data-role-rotator]', h);
  const roles: string[] = JSON.parse(role?.dataset.roles || '[]');
  if (role && roles.length > 1) {
    let i = 0;
    gsap.timeline({ repeat: -1, delay: 2.5, repeatDelay: 2.4 }).add(() => {
      i = (i + 1) % roles.length;
      gsap.to(role, { duration: 0.9, scrambleText: { text: roles[i], chars: 'アイウエオカキクケコサシスセソ01#%&', speed: 0.6 } });
    });
  }

  // Mouse parallax: each layer moves by its own depth.
  const fine = matchMedia('(pointer: fine)').matches;
  if (fine) {
    const layers: [string, number][] = [
      ['[data-hero-portrait]', 18], ['[data-hero-jp]', -36], ['[data-hero-ghost]', -14], ['[data-hero-card]', 10], ['.sticker--bubble', 16],
    ];
    const movers = layers.map(([sel, d]) => {
      const el = $(sel, h);
      return el && { x: gsap.quickTo(el, 'x', { duration: 1, ease: 'power3.out' }), y: gsap.quickTo(el, 'y', { duration: 1, ease: 'power3.out' }), d };
    }).filter(Boolean) as { x: (v: number) => void; y: (v: number) => void; d: number }[];
    // afterimages lag behind the portrait and stretch with pointer speed
    const echoes = $$('[data-hero-echo]', h).map((el, i) => ({
      x: gsap.quickTo(el, 'x', { duration: 1.4 + i * 0.5, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'y', { duration: 1.4 + i * 0.5, ease: 'power3.out' }),
      sx: gsap.quickTo(el, 'scaleX', { duration: 0.6, ease: 'power2.out' }),
      k: 1 + i * 0.6,
    }));
    let lx = 0, ly = 0, lt = performance.now(), stretch = 0;
    h.addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      movers.forEach((m) => { m.x(nx * m.d); m.y(ny * m.d * 0.6); });
      const now = performance.now();
      const speed = Math.hypot(e.clientX - lx, e.clientY - ly) / Math.max(8, now - lt);
      lx = e.clientX; ly = e.clientY; lt = now;
      stretch = Math.max(stretch, Math.min(0.22, speed * 0.05));
      echoes.forEach((ec) => {
        ec.x(-nx * 26 * ec.k);
        ec.y(-ny * 12 * ec.k);
      });
    });
    // stretch follows pointer speed and relaxes when the pointer stops
    gsap.ticker.add(() => {
      if (stretch < 0.002) return;
      stretch *= 0.92;
      echoes.forEach((ec) => ec.sx(1 + stretch * ec.k));
    });

    // name letters lift and lean toward the cursor
    const pulls = heroChars.map((c) => ({ c, y: gsap.quickTo(c, 'y', { duration: 0.45, ease: 'power3.out' }), sk: gsap.quickTo(c, 'skewX', { duration: 0.45, ease: 'power3.out' }) }));
    const name = $('#hero-name', h);
    name?.addEventListener('pointermove', (e) => {
      pulls.forEach((p) => {
        const r = p.c.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        const f = Math.max(0, 1 - Math.hypot(dx, dy) / 190);
        p.y(-f * f * 30);
        p.sk(-(dx / 190) * f * 20);
      });
    });
    name?.addEventListener('pointerleave', () => pulls.forEach((p) => { p.y(0); p.sk(0); }));
  }

  // halftone light band sweeping across the slab
  const scan = $('[data-hero-scan]', h);
  if (scan) gsap.fromTo(scan, { xPercent: -45 }, { xPercent: 45, duration: 1.8, ease: 'power2.inOut', repeat: -1, repeatDelay: 2.6, delay: 2 });

}
