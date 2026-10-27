const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s);
const cache = new WeakMap<HTMLElement, { state: { p: number }; draw: () => void }>();

/**
 * Rhombus-lattice shatter of the hero portrait, drawn on one canvas.
 * At p = 0 the shards tile seamlessly (identical to the photo); as p grows, gaps open and
 * shards peel away left-side-first, drifting left with a little lift, spin and shrink.
 */
export function diamondShards(h: HTMLElement) {
  const hit = cache.get(h);
  if (hit) return hit;
  const canvas = $<HTMLCanvasElement>('[data-hero-shards]', h);
  const img = $<HTMLImageElement>('[data-hero-main]', h);
  const state = { p: 0 };
  if (!canvas || !img) return { state, draw: () => {} };
  const ctx = canvas.getContext('2d')!;
  type Shard = { cx: number; cy: number; delay: number; dist: number; lift: number; spin: number };
  let shards: Shard[] = [], w = 0, ht = 0, dw = 0, dh = 0;

  const layout = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; ht = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = ht * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // tall diamonds, like the reference lattice; rows offset by half a diamond
    dw = Math.max(46, w / 13); dh = dw * 1.45;
    shards = [];
    for (let row = -1; row * (dh / 2) < ht + dh; row++) {
      for (let col = -1; col * dw < w + dw; col++) {
        const cx = col * dw + (row % 2 ? dw / 2 : 0), cy = row * (dh / 2);
        const nx = Math.max(0, Math.min(1, cx / w));
        shards.push({
          cx, cy,
          delay: nx * 0.45 + Math.random() * 0.18 + (cy / ht) * 0.07, // left side breaks first
          dist: w * (0.55 + Math.random() * 0.6),
          lift: (Math.random() - 0.65) * ht * 0.25,
          spin: (Math.random() - 0.5) * 2.2,
        });
      }
    }
  };

  const draw = () => {
    if (!w) layout();
    ctx.clearRect(-w, -ht, w * 3, ht * 3);
    if (!img.complete || !img.naturalWidth) return;
    // the photo is drawn object-fit: contain, anchored to the bottom of the box
    const scale = Math.min(w / img.naturalWidth, ht / img.naturalHeight);
    const iw = img.naturalWidth * scale, ih = img.naturalHeight * scale;
    const ox = (w - iw) / 2, oy = ht - ih;
    for (const s of shards) {
      const lp = Math.max(0, Math.min(1, (state.p * 1.6 - s.delay) / 0.7));
      const e = lp * lp * (3 - 2 * lp);
      const gap = 1 - Math.min(1, state.p * 6) * 0.14 - e * 0.3; // seams open, then shards shrink
      const alpha = 1 - Math.max(0, (e - 0.55) / 0.45);
      if (alpha <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(s.cx - e * s.dist, s.cy + e * s.lift);
      ctx.rotate(e * s.spin);
      ctx.scale(gap, gap);
      ctx.beginPath();
      ctx.moveTo(0, -dh / 2); ctx.lineTo(dw / 2, 0); ctx.lineTo(0, dh / 2); ctx.lineTo(-dw / 2, 0); ctx.closePath();
      ctx.clip();
      // paint only this shard's patch of the photo, positioned as if still in place
      ctx.drawImage(img, (s.cx - dw / 2 - ox) / scale, (s.cy - dh / 2 - oy) / scale, dw / scale, dh / scale, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    }
  };

  addEventListener('resize', () => { w = 0; draw(); });
  const api = { state, draw };
  cache.set(h, api);
  return api;
}

