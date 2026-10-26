import gsap from 'gsap';

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];

const hero = () => $('[data-hero]');

/** Hide hero parts before the loader clears so nothing flashes. */
export function heroInitialState() {
  const h = hero();
  if (!h) return;
  gsap.set($('[data-hero-slab]', h), { skewX: -12, yPercent: 110 });
  gsap.set($('[data-hero-tri]', h), { scale: 0, transformOrigin: '100% 100%' });
  gsap.set($('[data-hero-jp]', h), { yPercent: -30, opacity: 0 });
  gsap.set($('[data-hero-portrait]', h), { xPercent: 18, opacity: 0, filter: 'blur(18px)' });
  gsap.set($$('[data-hero-line]', h), { yPercent: 115, skewY: 7 });
  gsap.set($$('[data-hero-in]', h), { y: 28, opacity: 0 });
  gsap.set($('[data-hero-card]', h), { xPercent: 25, opacity: 0 });
  gsap.set($$('[data-sticker]', h), { scale: 0, rotate: -40 });
  gsap.set($$('.hero__tapes .tape', h), { yPercent: 260 });
  gsap.set($('[data-hero-ghost]', h), { opacity: 0, x: 120 });
}

export function heroIntro() {
  const h = hero();
  if (!h) return;
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to($('[data-hero-slab]', h), { yPercent: 0, duration: 1.1 })
    .to($('[data-hero-tri]', h), { scale: 1, duration: 0.9 }, 0.15)
    .to($('[data-hero-ghost]', h), { opacity: 1, x: 0, duration: 1.4 }, 0.1)
    .to($('[data-hero-jp]', h), { yPercent: 0, opacity: 0.85, duration: 1.2 }, 0.3)
    .to($('[data-hero-portrait]', h), { xPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'power4.out' }, 0.35)
    .add(() => glitch(true), 0.9)
    .to($$('[data-hero-line]', h), { yPercent: 0, skewY: 0, duration: 1, stagger: 0.09 }, 0.3)
    .to($$('[data-hero-in]', h), { y: 0, opacity: 1, duration: 0.8, stagger: 0.07 }, 0.6)
    .to($('[data-hero-card]', h), { xPercent: 0, opacity: 1, duration: 0.9 }, 0.8)
    .to($$('[data-sticker]', h), { scale: 1, rotate: 0, duration: 0.7, ease: 'back.out(2.2)', stagger: 0.1 }, 1)
    .to($$('.hero__tapes .tape', h), { yPercent: 0, duration: 0.9, stagger: 0.08, ease: 'power4.out' }, 0.7)
    .add(() => { gsap.set($('[data-hero-portrait]', h), { clearProps: 'filter' }); });
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
      ['[data-hero-portrait]', 18], ['[data-hero-jp]', -36], ['[data-hero-ghost]', -14], ['[data-hero-card]', 10], ['.sticker--bubble', 34], ['.sticker--burst', 44], ['.sticker--code', 26],
    ];
    const movers = layers.map(([sel, d]) => {
      const el = $(sel, h);
      return el && { x: gsap.quickTo(el, 'x', { duration: 1, ease: 'power3.out' }), y: gsap.quickTo(el, 'y', { duration: 1, ease: 'power3.out' }), d };
    }).filter(Boolean) as { x: (v: number) => void; y: (v: number) => void; d: number }[];
    h.addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      movers.forEach((m) => { m.x(nx * m.d); m.y(ny * m.d * 0.6); });
    });
  }

  halftone(h);
}

/* ───────── halftone dot field ───────── */
function halftone(h: HTMLElement) {
  const canvas = $<HTMLCanvasElement>('[data-halftone]', h);
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  const GAP = 22;
  let w = 0, ht = 0, dpr = 1;
  const mouse = { x: -999, y: -999, tx: -999, ty: -999 };
  let running = false;

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = h.clientWidth; ht = h.clientHeight;
    canvas.width = w * dpr; canvas.height = ht * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  new ResizeObserver(resize).observe(h);

  h.addEventListener('pointermove', (e) => {
    const r = h.getBoundingClientRect();
    mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top;
  });
  h.addEventListener('pointerleave', () => { mouse.tx = -999; mouse.ty = -999; });

  const draw = (t: number) => {
    mouse.x += (mouse.tx - mouse.x) * 0.12;
    mouse.y += (mouse.ty - mouse.y) * 0.12;
    ctx.clearRect(0, 0, w, ht);
    const time = t * 0.0006;
    for (let y = GAP / 2; y < ht; y += GAP) {
      for (let x = GAP / 2; x < w * 0.62; x += GAP) {
        // fade the field out towards the art side, add a slow travelling wave
        const fade = 1 - x / (w * 0.62);
        const wave = (Math.sin(x * 0.012 + y * 0.008 - time * 3) + 1) / 2;
        const dx = x - mouse.x, dy = y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const near = Math.max(0, 1 - dist / 200);
        const r = 0.6 + wave * 1.1 * fade + near * 5;
        if (near > 0.02) ctx.fillStyle = `rgba(215,255,31,${0.25 + near * 0.75})`;
        else ctx.fillStyle = `rgba(139,141,152,${0.12 + wave * 0.18 * fade})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
  const tick = (t: number) => { if (running) { draw(t); requestAnimationFrame(tick); } };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; requestAnimationFrame(tick); }
    else if (!e.isIntersecting) running = false;
  }).observe(h);
}
