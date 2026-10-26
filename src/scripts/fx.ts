/**
 * Motion-graphic effects shared across sections:
 *  - speed lines: anime concentration lines that "boil" at ~12fps
 *  - waveform: a live signal line that ripples along the Contact status band
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
    const follow = canvas.dataset.follow;
    let w = 0, h = 0, visible = false, last = 0, intensity = 0.55;
    const focus = { x: -1, y: -1 };

    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      let cx = w * fx, cy = h * fy;
      if (follow) {
        // aim at the followed element closest to the middle of the viewport, gliding between them
        const c = canvas.getBoundingClientRect();
        let best: DOMRect | null = null, bestD = Infinity;
        document.querySelectorAll(follow).forEach((el) => {
          const r = el.getBoundingClientRect();
          const d = Math.abs(r.top + r.height / 2 - innerHeight * 0.45);
          if (d < bestD) { bestD = d; best = r; }
        });
        if (best) {
          const b = best as DOMRect;
          const tx = b.left + b.width / 2 - c.left, ty = b.top + b.height / 2 - c.top;
          if (focus.x < 0) { focus.x = tx; focus.y = ty; }
          focus.x += (tx - focus.x) * 0.3; focus.y += (ty - focus.y) * 0.3;
          cx = focus.x; cy = focus.y;
        }
      }
      const reach = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
      const count = 90;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.06;
        // empty eye around the focus, lines start at a jittered radius
        const r0 = follow ? 150 + Math.random() * 230 : reach * (0.2 + Math.random() * 0.22);
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

/* ───────── signal waveform ───────── */
export function initWaves() {
  document.querySelectorAll<SVGSVGElement>('[data-wave]').forEach((svg) => {
    const line = svg.querySelector<SVGPathElement>('[data-wave-line]')!;
    const echo = svg.querySelector<SVGPathElement>('[data-wave-echo]')!;
    let visible = false, last = 0, w = 0, h = 0;
    // occasional bursts of a sharper, taller signal travelling along the line
    const bursts: { x: number; life: number }[] = [];

    const size = () => {
      w = svg.clientWidth; h = svg.clientHeight;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    };
    const path = (t: number, phase: number, amp: number) => {
      const mid = h / 2;
      let d = '';
      for (let x = 0; x <= w; x += 4) {
        // envelope: quiet where it leaves the band, livelier to the right
        const env = Math.min(1, x / 140) * (0.55 + 0.45 * Math.sin(x * 0.004 + t * 0.4));
        let y = Math.sin(x * 0.035 - t * 3.2 + phase) * 0.55 + Math.sin(x * 0.011 + t * 1.3 + phase) * 0.45;
        for (const b of bursts) {
          const dx = x - b.x;
          if (Math.abs(dx) < 60) y += Math.sin(dx * 0.35) * (1 - Math.abs(dx) / 60) * 2.2 * b.life;
        }
        d += `${x ? 'L' : 'M'}${x} ${(mid + y * amp * env).toFixed(1)}`;
      }
      return d;
    };
    const tick = (now: number) => {
      if (!visible) return;
      if (now - last > 33) {
        last = now;
        const t = now / 1000;
        if (Math.random() < 0.02) bursts.push({ x: 0, life: 1 });
        for (let i = bursts.length - 1; i >= 0; i--) {
          bursts[i].x += 9; bursts[i].life *= 0.985;
          if (bursts[i].x > w + 60) bursts.splice(i, 1);
        }
        line.setAttribute('d', path(t, 0, h * 0.2));
        echo.setAttribute('d', path(t - 0.18, 1.4, h * 0.3));
      }
      requestAnimationFrame(tick);
    };
    onScreen(svg, (v) => {
      if (v && !visible) { size(); visible = true; requestAnimationFrame(tick); }
      else if (!v) visible = false;
    });
    addEventListener('resize', () => visible && size());
  });
}
