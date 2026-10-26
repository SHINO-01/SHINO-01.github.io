import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { getLenis } from './state';

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];

/** Animate a number in an element from 0 to its data-count value. */
function countUp(el: HTMLElement, duration = 1.4) {
  const end = Number(el.dataset.count || 0);
  const o = { v: 0 };
  return gsap.to(o, { v: end, duration, ease: 'power3.out', onUpdate: () => { el.textContent = String(Math.round(o.v)); } });
}

export function initScroll(motion: boolean) {
  navTracking(motion);
  if (!motion) return;

  heroScrollOut();
  headings();
  tapes();
  radar();
  missions();
  projects();
  records();
  contact();

  // Fonts and images can shift layout after load.
  addEventListener('load', () => ScrollTrigger.refresh());
}

/* ───────── nav: active section, pill, rail, hide on scroll, progress ───────── */
function navTracking(motion: boolean) {
  const nav = $('[data-nav]');
  const pill = $('[data-nav-pill]');
  const links = $$('[data-nav-link]');
  const rail = $$('[data-rail-link]');
  const bar = $('.progress i');

  const setActive = (id: string) => {
    links.forEach((l) => l.classList.toggle('is-active', l.dataset.navLink === id));
    rail.forEach((l) => l.classList.toggle('is-active', l.dataset.railLink === id));
    const a = links.find((l) => l.dataset.navLink === id);
    if (a && pill) {
      pill.style.width = `${a.offsetWidth}px`;
      pill.style.transform = `translateX(${a.offsetLeft}px)`;
    }
  };

  links.forEach((l) => {
    const id = l.dataset.navLink!;
    const sec = document.getElementById(id);
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 45%', end: 'bottom 45%',
      onToggle: (self) => self.isActive && setActive(id),
    });
  });
  setActive('agent');
  addEventListener('resize', () => setActive(links.find((l) => l.classList.contains('is-active'))?.dataset.navLink || 'agent'));

  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      if (bar) bar.style.transform = `scaleX(${self.progress})`;
      if (!motion || !nav) return;
      const hide = self.direction === 1 && self.scroll() > innerHeight * 0.6;
      nav.classList.toggle('is-hidden', hide);
    },
  });
}

/* ───────── hero parallax on scroll-out ───────── */
function heroScrollOut() {
  const h = $('[data-hero]');
  if (!h) return;
  const tl = gsap.timeline({ scrollTrigger: { trigger: h, start: 'top top', end: 'bottom top', scrub: 0.6 } });
  tl.to($('[data-hero-portrait]', h), { yPercent: 14, scale: 1.06, ease: 'none' }, 0)
    .to($('.hero__copy', h), { yPercent: -30, opacity: 0.2, ease: 'none' }, 0)
    .to($('[data-hero-slab]', h), { xPercent: 12, ease: 'none' }, 0)
    .to($('[data-hero-ghost]', h), { xPercent: -18, ease: 'none' }, 0)
    .to($('[data-hero-card]', h), { yPercent: -40, opacity: 0, ease: 'none' }, 0);
}

/* ───────── section headings: tab drop + char cascade ───────── */
function headings() {
  $$('[data-shead]').forEach((head) => {
    const title = $('[data-split]', head)!;
    const split = SplitText.create(title, { type: 'words,chars', charsClass: 'char', mask: 'chars' });
    const tl = gsap.timeline({ scrollTrigger: { trigger: head, start: 'top 82%', once: true } });
    tl.from($('[data-shead-tab]', head), { scaleY: 0, transformOrigin: 'top', duration: 0.6, ease: 'expo.out' })
      .from(split.chars, { yPercent: 110, rotate: 12, duration: 0.8, ease: 'expo.out', stagger: 0.03 }, 0.1)
      .from($('[data-shead-kicker]', head), { x: -24, opacity: 0, duration: 0.6, ease: 'power3.out' }, 0.2)
      .from($('.shead__jp', head) ?? [], { xPercent: 40, opacity: 0, duration: 1.2, ease: 'expo.out' }, 0.1);
  });
}

/* ───────── tape marquees, sped up and skewed by scroll velocity ───────── */
function tapes() {
  const tracks = $$('[data-tape]').map((tape) => {
    const track = $('[data-tape-track]', tape)!;
    const dir = Number(tape.dataset.dir || 1);
    return { track, dir, x: 0, visible: true, tape };
  });
  tracks.forEach((t) => new IntersectionObserver(([e]) => { t.visible = e.isIntersecting; }).observe(t.tape));
  let skew = 0;
  gsap.ticker.add((_, dt) => {
    const v = getLenis()?.velocity ?? 0;
    skew += (gsap.utils.clamp(-8, 8, v * 0.4) - skew) * 0.1;
    tracks.forEach((t) => {
      if (!t.visible) return;
      const half = t.track.scrollWidth / 2;
      t.x -= t.dir * (0.05 + Math.abs(v) * 0.02) * dt;
      if (t.x <= -half) t.x += half;
      if (t.x > 0) t.x -= half;
      t.track.style.transform = `translate3d(${t.x}px,0,0) skewX(${-skew}deg)`;
    });
  });
}

/* ───────── loadout radar ───────── */
function radar() {
  const fig = $('[data-radar]');
  if (!fig) return;
  const values: number[] = JSON.parse(fig.dataset.values || '[]');
  const C = Number(fig.dataset.center), R = Number(fig.dataset.radius);
  const shape = $<SVGPolygonElement>('[data-radar-shape]', fig)!;
  const nodes = $$<SVGCircleElement>('[data-radar-node]', fig);
  const N = values.length;
  const state = values.map(() => 0);
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / N - Math.PI / 2;
    return [C + Math.cos(a) * ((R * v) / 100), C + Math.sin(a) * ((R * v) / 100)];
  };
  const render = () => {
    shape.setAttribute('points', state.map((v, i) => pt(i, v).join(',')).join(' '));
    nodes.forEach((n, i) => { const [x, y] = pt(i, state[i]); n.setAttribute('cx', String(x)); n.setAttribute('cy', String(y)); });
  };
  render();

  const sec = fig.closest('section')!;
  const tl = gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 75%', once: true } });
  tl.from($$('.radar__grid > *', fig), { opacity: 0, scale: 0.6, transformOrigin: `${C}px ${C}px`, duration: 0.7, stagger: 0.04, ease: 'expo.out' })
    .from($$('[data-radar-label]', fig), { opacity: 0, duration: 0.4, stagger: 0.05 }, 0.2);
  values.forEach((v, i) => {
    tl.to(state, { [i]: v, duration: 1.3, ease: 'elastic.out(1, 0.6)', onUpdate: render }, 0.35 + i * 0.07);
  });

  gsap.from($$('[data-gear]', sec), {
    scrollTrigger: { trigger: $('.slots', sec), start: 'top 80%', once: true },
    y: 26, opacity: 0, rotate: () => gsap.utils.random(-6, 6), duration: 0.6, ease: 'back.out(2)', stagger: 0.025,
  });
  gsap.from($$('[data-slot] .slot__name', sec), {
    scrollTrigger: { trigger: $('.slots', sec), start: 'top 80%', once: true },
    clipPath: 'inset(0 100% 0 0)', duration: 0.8, ease: 'expo.out', stagger: 0.08,
  });
}

/* ───────── mission log ───────── */
function missions() {
  const log = $('[data-log]');
  if (!log) return;
  const fill = $('[data-log-fill]', log)!;
  gsap.fromTo(fill, { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { trigger: log, start: 'top 65%', end: 'bottom 65%', scrub: 0.5 } });

  $$('[data-mission]').forEach((m) => {
    const right = m.classList.contains('mission--r') || innerWidth <= 900;
    const card = $('[data-mission-card]', m)!;
    const tl = gsap.timeline({ scrollTrigger: { trigger: m, start: 'top 78%', once: true } });
    tl.from($('[data-mission-node]', m), { scale: 0, rotate: -180, duration: 0.7, ease: 'back.out(2)' })
      .from(card, { x: right ? 90 : -90, rotate: right ? 2.5 : -2.5, opacity: 0, clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.out' }, 0.05)
      .from($$('.mission__list li, .mission__stack li', card), { y: 14, opacity: 0, duration: 0.5, stagger: 0.04, ease: 'power3.out' }, 0.35)
      .from($('[data-stamp]', card), { scale: 2.6, opacity: 0, rotate: -30, duration: 0.35, ease: 'power4.in' }, 0.6)
      .to(card, { x: '+=6', duration: 0.05, repeat: 3, yoyo: true, ease: 'none' });

    // side panel: slab, tag and film strip slam in from the screen edge
    const side = $('[data-mside]', m);
    if (side) {
      const dir = m.classList.contains('mission--l') ? 1 : -1;
      tl.from($('[data-mside-hatch]', side), { scaleX: 0, duration: 0.7, ease: 'expo.out' }, 0.1)
        .from($('[data-mside-tag]', side), { xPercent: 70 * dir, skewX: -18 * dir, opacity: 0, duration: 0.8, ease: 'expo.out' }, 0.2)
        .from($('.mside__num', side), { yPercent: 60, opacity: 0, duration: 0.6, ease: 'back.out(2)' }, 0.45)
        .from($('[data-mside-film]', side), { scaleX: 0, duration: 0.6, ease: 'expo.out' }, 0.4)
        .from($$('.mside__code, .mside__jp', side), { opacity: 0, y: 12, duration: 0.5, stagger: 0.08 }, 0.55);
      gsap.fromTo($('[data-mside-year]', side), { yPercent: 35 }, {
        yPercent: -35, ease: 'none',
        scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      });
    }
  });
}

/* ───────── projects: horizontal pinned gallery ───────── */
function projects() {
  const sec = $('[data-projects]');
  if (!sec) return;
  const track = $('[data-proj-track]', sec)!;
  const bar = $('[data-proj-progress]', sec);
  const cards = $$('[data-pcard]', sec);
  const mm = gsap.matchMedia();

  mm.add('(min-width: 901px)', () => {
    const distance = () => Math.max(0, track.scrollWidth - innerWidth);
    const scroller = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: sec, start: 'top top', end: () => `+=${distance()}`,
        pin: $('[data-proj-pin]', sec), scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (self) => { if (bar) bar.style.transform = `scaleX(${self.progress})`; },
        // slide the section rail away so it never covers the cards
        onToggle: (self) => document.querySelector('[data-rail]')?.classList.toggle('is-away', self.isActive),
      },
    });
    cards.forEach((c) => {
      gsap.from(c, {
        yPercent: 18, rotate: 6, opacity: 0.2, ease: 'power2.out',
        scrollTrigger: { trigger: c, containerAnimation: scroller, start: 'left 105%', end: 'left 55%', scrub: true },
      });
    });
  });
  mm.add('(max-width: 900px)', () => {
    cards.forEach((c) => gsap.from(c, { y: 60, opacity: 0, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 85%', once: true } }));
  });
}

/* ───────── records ───────── */
function records() {
  $$('[data-trophy]').forEach((t) => {
    const fillEl = $<SVGCircleElement>('[data-gauge-fill]', t);
    const tl = gsap.timeline({ scrollTrigger: { trigger: t, start: 'top 78%', once: true } });
    tl.from(t, { y: 70, opacity: 0, duration: 0.9, ease: 'expo.out' })
      .from($('.trophy__banner', t), { clipPath: 'inset(0 100% 0 0)', duration: 0.6, ease: 'expo.out' }, 0.2);
    if (fillEl) {
      const circ = Number(fillEl.dataset.circ);
      tl.from(fillEl, { strokeDashoffset: circ, duration: 1.6, ease: 'power3.inOut' }, 0.3);
      const num = $('[data-count]', t);
      if (num) tl.add(countUp(num, 1.6), 0.3);
    }
    tl.to($('.trophy__shine', t), { xPercent: 200, duration: 1.1, ease: 'power2.inOut' }, 1.2);
  });
  gsap.from($$('[data-idcard]'), {
    scrollTrigger: { trigger: $('.ids'), start: 'top 82%', once: true },
    x: 70, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.12,
  });
}

/* ───────── contact ───────── */
function contact() {
  const sec = $('#contact');
  if (!sec) return;
  const track = $('[data-marquee-track]', sec);
  if (track) {
    gsap.fromTo(track, { xPercent: 0 }, { xPercent: -30, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 0.4 } });
  }
  const title = $('[data-split]', sec);
  if (title) {
    const split = SplitText.create(title, { type: 'words,chars', charsClass: 'char', mask: 'chars' });
    gsap.from(split.chars, { scrollTrigger: { trigger: title, start: 'top 82%', once: true }, yPercent: 110, duration: 0.8, ease: 'expo.out', stagger: 0.018 });
  }
  gsap.from($$('.contact__lede, .mailbox, .contact__row, .contact__socials li, .contact__langs', sec), {
    scrollTrigger: { trigger: $('.contact__inner', sec), start: 'top 75%', once: true },
    y: 30, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06,
  });
}
