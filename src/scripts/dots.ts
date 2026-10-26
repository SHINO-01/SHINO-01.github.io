/**
 * Cursor-reactive halftone fields for every [data-dots] layer on the page.
 * Each canvas is viewport-sized (sticky inside its section), only allocated and
 * drawn while its section is visible, and the dot grid is pinned to the page so
 * it scrolls with the content.
 */
const GAP = 22;
const REACH = 200;

const TONES = {
  dark: { hot: '215,255,31', base: '139,141,152', baseAlpha: 0.1 },
  light: { hot: '143,99,255', base: '16,16,19', baseAlpha: 0.07 },
  volt: { hot: '16,16,19', base: '16,16,19', baseAlpha: 0 },
} as const;

type Tone = keyof typeof TONES;

const mouse = { x: -9999, y: -9999 };

export function initDots() {
  const layers = [...document.querySelectorAll<HTMLElement>('[data-dots]')];
  if (!layers.length) return;
  const fine = matchMedia('(pointer: fine)').matches;
  if (fine) {
    addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  }
  layers.forEach((layer) => field(layer));
}

function field(layer: HTMLElement) {
  const canvas = layer.querySelector('canvas')!;
  const ctx = canvas.getContext('2d')!;
  const tone = TONES[(layer.dataset.dots as Tone) || 'dark'];
  const base = layer.dataset.dotsBase || 'faint';
  const host = layer.parentElement!;
  let w = 0, h = 0, dpr = 1, running = false;
  // eased cursor position in canvas space, so the bloom trails the pointer slightly
  const p = { x: -9999, y: -9999 };

  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = (t: number) => {
    const c = canvas.getBoundingClientRect();
    const hostTop = host.getBoundingClientRect().top;
    const tx = mouse.x - c.left, ty = mouse.y - c.top;
    const far = mouse.x < -999;
    p.x = far ? -9999 : p.x < -999 ? tx : p.x + (tx - p.x) * 0.14;
    p.y = far ? -9999 : p.y < -999 ? ty : p.y + (ty - p.y) * 0.14;

    ctx.clearRect(0, 0, w, h);
    // grid rows are anchored to the section, not the canvas
    const offset = (((hostTop - c.top) % GAP) + GAP) % GAP;
    const time = t * 0.0018;
    const waveW = w * 0.62;

    if (base !== 'none' && tone.baseAlpha > 0) {
      ctx.fillStyle = `rgba(${tone.base},${base === 'wave' ? 0.16 : tone.baseAlpha})`;
      ctx.beginPath();
      for (let y = offset + GAP / 2; y < h; y += GAP) {
        for (let x = GAP / 2; x < (base === 'wave' ? waveW : w); x += GAP) {
          let r = 0.9;
          if (base === 'wave') {
            const fade = 1 - x / waveW;
            r = 0.6 + ((Math.sin(x * 0.012 + y * 0.008 - time) + 1) / 2) * 1.1 * fade;
          }
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    }

    // bloom around the cursor
    if (p.x > -REACH && p.x < w + REACH && p.y > -REACH && p.y < h + REACH) {
      const x0 = Math.max(GAP / 2, Math.floor((p.x - REACH) / GAP) * GAP + GAP / 2);
      const y0 = Math.floor((p.y - REACH - offset) / GAP) * GAP + offset + GAP / 2;
      for (let y = y0; y < p.y + REACH; y += GAP) {
        for (let x = x0; x < p.x + REACH; x += GAP) {
          const near = 1 - Math.hypot(x - p.x, y - p.y) / REACH;
          if (near <= 0.02) continue;
          ctx.fillStyle = `rgba(${tone.hot},${0.25 + near * 0.75})`;
          ctx.beginPath();
          ctx.arc(x, y, 0.9 + near * 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  };

  const tick = (t: number) => { if (running) { draw(t); requestAnimationFrame(tick); } };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) {
      size();
      running = true;
      requestAnimationFrame(tick);
    } else if (!e.isIntersecting && running) {
      running = false;
      canvas.width = canvas.height = 0; // release the backing store while off screen
    }
  }).observe(layer);
  addEventListener('resize', () => { if (running) size(); });
}
