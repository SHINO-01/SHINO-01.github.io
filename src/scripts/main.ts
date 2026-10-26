import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import Lenis from 'lenis';
import { runBoot } from './boot';
import { heroIntro, heroIdle, heroInitialState } from './hero';
import { initScroll } from './scroll';
import { initUI } from './ui';
import { setLenis } from './state';
import { initDots } from './dots';
import { initSpeedLines, initCrts } from './fx';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

const root = document.documentElement;
if (root.classList.contains('motion') && 'scrollRestoration' in history) history.scrollRestoration = 'manual';
const motion = root.classList.contains('motion');
(window as any).__booted = true;

// Smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync.
const lenis = motion ? new Lenis({ lerp: 0.1, wheelMultiplier: 1 }) : null;
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
setLenis(lenis);

initUI(lenis, motion);

if (!motion) {
  // Reduced motion: everything is already visible; only wire up non-animated behaviour.
  initScroll(false);
} else {
  heroInitialState();
  root.classList.remove('is-loading');
  document.fonts.ready.then(async () => {
    const held: string = (window as any).__hash || location.hash;
    const hash = held && document.querySelector(held) ? held : '';
    lenis?.stop();
    // Always build the scroll choreography from the top; jumping to a #section happens afterwards.
    // (Creating one-shot triggers while already scrolled past them breaks ScrollTrigger's refresh.)
    window.scrollTo(0, 0);
    await runBoot();
    lenis?.start();
    heroIntro();
    heroIdle();
    initDots();
    initSpeedLines();
    initCrts();
    initScroll(true);
    if (hash) {
      // pinned sections add height, so re-measure before jumping
      ScrollTrigger.refresh();
      lenis?.resize();
      lenis?.scrollTo(hash, { immediate: true, force: true });
      history.replaceState(null, '', hash);
    }
  });
}
