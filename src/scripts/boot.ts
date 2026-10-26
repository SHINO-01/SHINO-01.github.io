import gsap from 'gsap';

const SEEN_KEY = 'shino-booted';

/** Game-style boot loader. Full sequence on first visit, a quick shutter on return visits. */
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

  return new Promise((resolve) => {
    const state = { p: 0 };
    const tl = gsap.timeline({
      onComplete: () => boot.classList.add('is-done'),
    });

    if (!seen) {
      tl.from(core, { y: 30, opacity: 0, duration: 0.5, ease: 'power3.out' })
        .from(huds, { opacity: 0, duration: 0.4 }, '<')
        .to(state, {
          p: 100,
          duration: 1.7,
          ease: 'steps(28)',
          onUpdate: () => {
            const v = Math.round(state.p);
            pct.textContent = String(v).padStart(3, '0');
            const lit = Math.round((v / 100) * bars.length);
            bars.forEach((b, i) => b.classList.toggle('on', i < lit));
            log.textContent = LOG[Math.min(LOG.length - 1, Math.floor((v / 100) * LOG.length))];
          },
        }, '-=0.1')
        .to(core, { scale: 1.04, duration: 0.12, ease: 'power2.in' })
        .to(core, { scale: 1, opacity: 0, duration: 0.18, ease: 'power2.out' });
    } else {
      gsap.set([core, huds], { opacity: 0 });
    }

    // Shutter wipe: bars sweep in from the left, then out to the right revealing the page.
    tl.to(shutters, { scaleX: 1, duration: 0.42, ease: 'expo.inOut', stagger: 0.05 }, seen ? 0 : '-=0.05')
      .set(boot, { backgroundColor: 'transparent' })
      .call(() => resolve()) // the page intro starts while the shutters clear
      .set(shutters, { transformOrigin: 'right center' })
      .to(shutters, { scaleX: 0, duration: 0.5, ease: 'expo.inOut', stagger: 0.05 });

    // Let impatient visitors skip.
    const skip = () => tl.progress() < 0.85 && tl.timeScale(4);
    boot.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('keydown', skip, { once: true });
  });
}
