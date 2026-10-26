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

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

const root = document.documentElement;
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
    const hash = location.hash && document.querySelector(location.hash) ? location.hash : '';
    lenis?.stop();
    if (!hash) window.scrollTo(0, 0);
    await runBoot();
    lenis?.start();
    heroIntro();
    heroIdle();
    initScroll(true);
    if (hash) lenis?.scrollTo(hash, { immediate: true, force: true });
  });
}
