/**
 * Motion-graphic effects shared across sections:
 *  - speed lines: anime concentration lines that "boil" at ~12fps
 *  - waveform: a live signal line that ripples along the Contact status band
 * Everything only runs while on screen.
 */
import gsap from 'gsap';
import { noise } from './dots';

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

/* ───────── topographic contours (Records) ───────── */
/**
 * Marching-squares contour lines over a drifting noise terrain. The cursor raises a soft hill
 * the lines flow around. Coarse grid, ~24fps, only while the section is on screen.
 */
export function initTopo() {
  document.querySelectorAll<HTMLCanvasElement>('[data-topo]').forEach((canvas) => {
    const ctx = canvas.getContext('2d')!;
    const host = canvas.parentElement!;
    const LEVELS = Array.from({ length: 12 }, (_, i) => 0.2 + i * 0.052);
    let w = 0, h = 0, cell = 26, cols = 0, rows = 0, visible = false, last = 0;
    let field = new Float32Array(0);
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      w = host.clientWidth; h = host.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = w < 700 ? 30 : 26;
      cols = Math.ceil(w / cell) + 1; rows = Math.ceil(h / cell) + 1;
      field = new Float32Array(cols * rows);
    };
    if (matchMedia('(pointer: fine)').matches) {
      host.addEventListener('pointermove', (e) => {
        const r = host.getBoundingClientRect();
        mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top;
      });
      host.addEventListener('pointerleave', () => { mouse.tx = mouse.ty = -9999; });
    }

    const draw = (t: number) => {
      const ts = t * 0.00004;
      if (mouse.tx > -999) {
        mouse.x = mouse.x < -999 ? mouse.tx : mouse.x + (mouse.tx - mouse.x) * 0.12;
        mouse.y = mouse.y < -999 ? mouse.ty : mouse.y + (mouse.ty - mouse.y) * 0.12;
      } else { mouse.x = mouse.y = -9999; }
      // sample the terrain at grid corners
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const x = i * cell, y = j * cell;
          let v = noise(x * 0.0021 + ts * 9, y * 0.0021 - ts * 4) * 0.68 + noise(x * 0.0052 - ts * 6, y * 0.0052 + 3.7) * 0.32;
          const dx = x - mouse.x, dy = y - mouse.y;
          v += Math.exp(-(dx * dx + dy * dy) / (2 * 150 * 150)) * 0.22;
          field[j * cols + i] = v;
        }
      }
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1.1;
      LEVELS.forEach((lv, li) => {
        const path = new Path2D();
        for (let j = 0; j < rows - 1; j++) {
          for (let i = 0; i < cols - 1; i++) {
            const a = field[j * cols + i], b = field[j * cols + i + 1];
            const c = field[(j + 1) * cols + i + 1], d = field[(j + 1) * cols + i];
            const idx = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c > lv ? 2 : 0) | (d > lv ? 1 : 0);
            if (idx === 0 || idx === 15) continue;
            const x = i * cell, y = j * cell;
            // interpolated crossing points on each edge
            const top = () => [x + cell * ((lv - a) / (b - a)), y];
            const right = () => [x + cell, y + cell * ((lv - b) / (c - b))];
            const bottom = () => [x + cell * ((lv - d) / (c - d)), y + cell];
            const left = () => [x, y + cell * ((lv - a) / (d - a))];
            const seg = (p: number[], q: number[]) => { path.moveTo(p[0], p[1]); path.lineTo(q[0], q[1]); };
            switch (idx) {
              case 1: case 14: seg(left(), bottom()); break;
              case 2: case 13: seg(bottom(), right()); break;
              case 3: case 12: seg(left(), right()); break;
              case 4: case 11: seg(top(), right()); break;
              case 6: case 9: seg(top(), bottom()); break;
              case 7: case 8: seg(left(), top()); break;
              case 5: seg(left(), top()); seg(bottom(), right()); break;
              case 10: seg(top(), right()); seg(left(), bottom()); break;
            }
          }
        }
        // every fourth line is an accent contour in violet
        ctx.strokeStyle = li % 4 === 1 ? 'rgba(143,99,255,0.45)' : 'rgba(16,16,19,0.15)';
        ctx.stroke(path);
      });
    };

    const tick = (t: number) => {
      if (!visible) return;
      if (t - last > 41) { draw(t); last = t; }
      requestAnimationFrame(tick);
    };
    onScreen(host, (v) => {
      if (v && !visible) { size(); visible = true; canvas.classList.add('is-on'); requestAnimationFrame(tick); }
      else if (!v) visible = false;
    });
    addEventListener('resize', () => visible && size());
  });
}
