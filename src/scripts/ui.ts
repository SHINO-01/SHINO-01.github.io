import gsap from 'gsap';
import type Lenis from 'lenis';

const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];
const SCRAMBLE = 'アイウエオカキクケコサシスセソタチツテト#%&*+=<>';

export function initUI(lenis: Lenis | null, motion: boolean) {
  anchors(lenis);
  mobileMenu(lenis, motion);
  copyEmail();
  if (!motion) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine) {
    cursor();
    magnetic();
    tilt();
  }
  scramble();
}

/* Smooth anchor scrolling through Lenis. */
function anchors(lenis: Lenis | null) {
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href')!;
    const target = id.length > 1 ? document.querySelector<HTMLElement>(id) : null;
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else target.scrollIntoView();
    history.replaceState(null, '', id);
    // move focus for keyboard and screen reader users
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}

/* Custom reticle cursor. */
function cursor() {
  const el = document.querySelector<HTMLElement>('.cursor');
  if (!el) return;
  const dot = el.querySelector<HTMLElement>('.cursor__dot')!;
  const ring = el.querySelector<HTMLElement>('.cursor__ring')!;
  const dx = gsap.quickTo(dot, 'x', { duration: 0.08 }), dy = gsap.quickTo(dot, 'y', { duration: 0.08 });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });
  gsap.set([dot, ring], { x: -100, y: -100 });
  addEventListener('pointermove', (e) => {
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    const hit = (e.target as HTMLElement).closest('a, button, [data-tilt], [data-gear]');
    el.classList.toggle('is-hover', !!hit);
  });
  addEventListener('pointerdown', () => el.classList.add('is-down'));
  addEventListener('pointerup', () => el.classList.remove('is-down'));
  document.documentElement.addEventListener('pointerleave', () => gsap.set([dot, ring], { x: -100, y: -100 }));
}

/* Buttons lean toward the pointer. */
function magnetic() {
  $$('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.25);
      y((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)', overwrite: true });
    });
  });
}

/* Project cards tilt in 3D, with a holographic sheen following the pointer. */
function tilt() {
  $$('[data-tilt]').forEach((card) => {
    const depthEls = $$<HTMLElement>('[data-depth]', card);
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.classList.add('is-tilting');
      card.style.setProperty('--ry', `${(px - 0.5) * 14}deg`);
      card.style.setProperty('--rx', `${(0.5 - py) * 10}deg`);
      card.style.setProperty('--mx', `${px * 100}%`);
      card.style.setProperty('--my', `${py * 100}%`);
      depthEls.forEach((d) => {
        const k = Number(d.dataset.depth) / 30;
        d.style.transform = `translate(${(px - 0.5) * 24 * k}px, ${(py - 0.5) * 18 * k}px)`;
      });
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--rx', '0deg');
      depthEls.forEach((d) => { d.style.transform = ''; });
    });
  });
}

/* Decode effect on nav links. */
function scramble() {
  $$('[data-scramble]').forEach((el) => {
    const text = el.textContent!.trim();
    el.setAttribute('aria-label', text);
    el.addEventListener('pointerenter', () => {
      gsap.to(el, { duration: 0.5, scrambleText: { text, chars: SCRAMBLE, speed: 0.8, revealDelay: 0.05 }, overwrite: true });
    });
  });
}

/* Copy email to clipboard with confirmation. */
function copyEmail() {
  const status = document.querySelector<HTMLElement>('[data-copy-status]');
  $$('[data-copy-btn]').forEach((btn) => {
    const label = btn.querySelector<HTMLElement>('[data-copy-label]')!;
    const original = label.textContent;
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copyBtn!);
        label.textContent = 'Email copied';
        if (status) status.textContent = 'Email address copied to clipboard';
      } catch {
        label.textContent = 'Copy failed, select the address above';
      }
      setTimeout(() => { label.textContent = original; }, 2200);
    });
  });
}

/* Full-screen mobile menu. */
function mobileMenu(lenis: Lenis | null, motion: boolean) {
  const btn = document.querySelector<HTMLButtonElement>('[data-burger]');
  const menu = document.querySelector<HTMLElement>('[data-mmenu]');
  if (!btn || !menu) return;
  const cols = $$('.mmenu__bg i', menu);
  const links = $$('[data-mmenu-link]', menu);
  let open = false;

  const set = (next: boolean) => {
    open = next;
    btn.setAttribute('aria-expanded', String(open));
    if (open) {
      menu.hidden = false;
      lenis?.stop();
      if (motion) {
        gsap.timeline()
          .fromTo(cols, { scaleY: 0, transformOrigin: 'top' }, { scaleY: 1, duration: 0.5, ease: 'expo.out', stagger: 0.06 })
          .fromTo(links, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.05 }, 0.15);
      }
      links[0]?.focus();
    } else {
      lenis?.start();
      if (motion) {
        gsap.timeline({ onComplete: () => { menu.hidden = true; } })
          .to(links, { y: -30, opacity: 0, duration: 0.25, stagger: 0.02 })
          .to(cols, { scaleY: 0, transformOrigin: 'bottom', duration: 0.4, ease: 'expo.in', stagger: 0.05 }, 0.1);
      } else menu.hidden = true;
    }
  };
  btn.addEventListener('click', () => set(!open));
  links.forEach((l) => l.addEventListener('click', () => set(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { set(false); btn.focus(); } });
}
