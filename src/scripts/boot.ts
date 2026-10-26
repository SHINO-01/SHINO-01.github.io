import gsap from 'gsap';

const SEEN_KEY = 'shino-booted';

/** Game-style boot loader. Full ~2s sequence on first visit in a tab, a ~1s condensed one on reloads. */
export function runBoot(): Promise<void> {
  const boot = document.getElementById('boot');
  if (!boot) return Promise.resolve();

  let seen = false;
  try { seen = sessionStorage.getItem(SEEN_KEY) === '1'; sessionStorage.setItem(SEEN_KEY, '1'); } catch {}

  const LOG: string[] = JSON.parse(boot.dataset.bootLines || '[""]');
  const bars = [...boot.querySelectorAll<HTMLElement>('.boot__bar i')];
  const pct = boot.querySelector<HTMLElement>('[data-boot-pct]')!;
  const log = boot.querySelector<HTMLElement>('[data-boot-log]')!;
  const core = boot.querySelector<HTMLElement>('.boot__core')!;
  const huds = boot.querySelectorAll<HTMLElement>('.boot__hud');
  const shutters = boot.querySelectorAll<HTMLElement>('.boot__shutters i');

  // First visit in a tab: ~2s full sequence. Reloads: ~1s condensed version of the same sequence.
  const T = seen
    ? { intro: 0.15, count: 0.35, steps: 10, pulse: 0.08, out: 0.12, wipeIn: 0.22, wipeOut: 0.34, stagger: 0.03 }
    : { intro: 0.3, count: 0.95, steps: 22, pulse: 0.1, out: 0.15, wipeIn: 0.34, wipeOut: 0.45, stagger: 0.04 };

  return new Promise((resolve) => {
    const state = { p: 0 };
    const tl = gsap.timeline({
      onComplete: () => boot.classList.add('is-done'),
    });

    tl.from(core, { y: 24, opacity: 0, duration: T.intro, ease: 'power3.out' })
      .from(huds, { opacity: 0, duration: T.intro }, '<')
      .to(state, {
        p: 100,
        duration: T.count,
        ease: `steps(${T.steps})`,
        onUpdate: () => {
          const v = Math.round(state.p);
          pct.textContent = String(v).padStart(3, '0');
          const lit = Math.round((v / 100) * bars.length);
          bars.forEach((b, i) => b.classList.toggle('on', i < lit));
          log.textContent = LOG[Math.min(LOG.length - 1, Math.floor((v / 100) * LOG.length))];
        },
      })
      .to(core, { scale: 1.04, duration: T.pulse, ease: 'power2.in' })
      .to(core, { scale: 1, opacity: 0, duration: T.out, ease: 'power2.out' })
      // Shutter wipe: bars sweep in from the left, then out to the right revealing the page.
      .to(shutters, { scaleX: 1, duration: T.wipeIn, ease: 'expo.inOut', stagger: T.stagger }, '-=0.05')
      .set(boot, { backgroundColor: 'transparent' })
      .call(() => resolve()) // the page intro starts while the shutters clear
      .set(shutters, { transformOrigin: 'right center' })
      .to(shutters, { scaleX: 0, duration: T.wipeOut, ease: 'expo.inOut', stagger: T.stagger });

    // A click skips ahead; key presses don't, so the loader stays visible.
    const skip = () => tl.progress() < 0.85 && tl.timeScale(4);
    boot.addEventListener('pointerdown', skip, { once: true });
  });
}
