/**
 * Motion-graphic effects shared across sections:
 *  - speed lines: anime concentration lines that "boil" at ~12fps
 *  - CRT: TV static that tunes in to the screen content when it scrolls into view
 * Everything only runs while on screen.
 */
import gsap from 'gsap';

const onScreen = (el: Element, cb: (visible: boolean) => void) =>
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: '80px' }).observe(el);

/* ───────── speed lines ───────── */
const INK = { paper: '241,240,234', ink: '16,16,19', volt: '215,255,31' } as const;

export function initSpeedLines() {
  document.querySelectorAll<HTMLCanvasElement>('[data-speed]').forEach((canvas) => {
    const ctx = canvas.getContext('2d')!;
    const fx = Number(canvas.dataset.fx ?? 0.5);
    const fy = Number(canvas.dataset.fy ?? 0.5);
    const rgb = INK[(canvas.dataset.tone as keyof typeof INK) || 'paper'];
    let w = 0, h = 0, visible = false, last = 0, intensity = 0.55;

    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const cx = w * fx, cy = h * fy;
      const reach = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
      const count = 90;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.06;
        // empty eye around the focus, lines start at a jittered radius
        const r0 = reach * (0.2 + Math.random() * 0.22);
        const r1 = reach * 1.05;
        const spread = (0.004 + Math.random() * 0.012) * (0.6 + intensity);
        ctx.fillStyle = `rgba(${rgb},${(0.08 + Math.random() * 0.22) * intensity})`;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a - spread) * r1, cy + Math.sin(a - spread) * r1);
        ctx.lineTo(cx + Math.cos(a + spread) * r1, cy + Math.sin(a + spread) * r1);
        ctx.closePath();
        ctx.fill();
      }
    };

    const tick = (t: number) => {
      if (!visible) return;
      if (t - last > 83) { draw(); last = t; } // ~12fps, like animation on twos
      requestAnimationFrame(tick);
    };
    onScreen(canvas, (v) => {
      if (v && !visible) { size(); visible = true; requestAnimationFrame(tick); }
      else if (!v) { visible = false; canvas.width = canvas.height = 0; }
    });
    addEventListener('resize', () => visible && size());

    // let scroll choreography punch the lines harder for a moment
    const st = { v: intensity };
    canvas.addEventListener('speed:punch', () => {
      st.v = 1.7;
      gsap.to(st, { v: 0.55, duration: 1.1, ease: 'power3.out', overwrite: true, onUpdate: () => { intensity = st.v; } });
    });
  });
}

/* ───────── CRT televisions ───────── */
export function initCrts() {
  document.querySelectorAll<HTMLElement>('[data-crt]').forEach((tv) => {
    const canvas = tv.querySelector<HTMLCanvasElement>('[data-crt-noise]')!;
    const ctx = canvas.getContext('2d')!;
    const content = tv.querySelector<HTMLElement>('[data-crt-content]')!;
    const roll = tv.querySelector<HTMLElement>('[data-crt-roll]')!;
    const img = ctx.createImageData(canvas.width, canvas.height);
    let visible = false, last = 0, tuned = false;

    const noise = () => {
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    };
    const tick = (t: number) => {
      if (!visible) return;
      if (t - last > 66) { noise(); last = t; }
      requestAnimationFrame(tick);
    };

    const tune = () => {
      tuned = true;
      gsap.timeline()
        .set(canvas, { opacity: 0.95 })
        .set(content, { opacity: 0 })
        // flicker in, like a channel locking on
        .to(content, { opacity: 1, duration: 0.05, repeat: 5, yoyo: true, ease: 'steps(1)' }, 0.45)
        .fromTo(content, { scaleY: 0.05, scaleX: 1.3 }, { scaleY: 1, scaleX: 1, duration: 0.35, ease: 'expo.out' }, 0.45)
        .to(content, { opacity: 1, duration: 0.01 })
        .to(canvas, { opacity: 0.14, duration: 0.4 }, 0.6);
    };

    onScreen(tv, (v) => {
      if (v && !visible) { visible = true; requestAnimationFrame(tick); if (!tuned) tune(); }
      else if (!v) visible = false;
    });

    // rolling bar drifts down the screen every few seconds
    gsap.to(roll, { top: '110%', duration: 2.4, ease: 'none', repeat: -1, repeatDelay: 2.6 });

    // hovering knocks the signal out briefly
    tv.addEventListener('pointerenter', () => {
      gsap.timeline()
        .to(canvas, { opacity: 0.9, duration: 0.05 })
        .to(content, { x: 6, skewX: 20, duration: 0.05 }, 0)
        .to(content, { x: 0, skewX: 0, duration: 0.2, ease: 'power3.out' })
        .to(canvas, { opacity: 0.14, duration: 0.3 }, '<');
    });
  });
}
