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
  type Shard = { cx: number; cy: number; delay: number; dist: number; lift: number; spin: number; m: DOMMatrix };
  let shards: Shard[] = [], w = 0, ht = 0, dw = 0, dh = 0, dpr = 1;
  let tex: CanvasPattern | null = null;
  let diamond = new Path2D();
  let cleared = true, drawnP = -1;

  const layout = () => {
    dpr = 1; // shards are moving and fading, so 1x is indistinguishable and halves the per-frame GPU upload
    w = canvas.clientWidth; ht = canvas.clientHeight;
    if (!w || !ht || !img.naturalWidth) return;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(ht * dpr);
    // fit the photo once into an offscreen texture (object-fit: contain, bottom), so each
    // frame only fills shapes from it instead of re-sampling the full-size image per shard
    const off = document.createElement('canvas');
    off.width = canvas.width; off.height = canvas.height;
    const scale = Math.min(off.width / img.naturalWidth, off.height / img.naturalHeight);
    const iw = img.naturalWidth * scale, ih = img.naturalHeight * scale;
    off.getContext('2d')!.drawImage(img, (off.width - iw) / 2, off.height - ih, iw, ih);
    tex = ctx.createPattern(off, 'no-repeat');
    // tall diamonds, like the reference lattice; rows offset by half a diamond
    dw = Math.max(46, w / 13); dh = dw * 1.45;
    diamond = new Path2D();
    diamond.moveTo(0, -dh / 2); diamond.lineTo(dw / 2, 0); diamond.lineTo(0, dh / 2); diamond.lineTo(-dw / 2, 0); diamond.closePath();
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
          // maps the texture so this shard shows its own patch of the photo wherever it moves
          m: new DOMMatrix().translate(-cx, -cy).scale(1 / dpr),
        });
      }
    }
  };

  const draw = () => {
    // nothing to draw until the exit has started (the canvas is hidden at the top of the page)
    if (state.p < 0.01) {
      if (!cleared) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); cleared = true; drawnP = -1; }
      return;
    }
    if (!w || !tex) layout();
    if (!tex) return;
    // scrub smoothing emits many sub-pixel updates; only repaint when the motion is visible
    if (Math.abs(state.p - drawnP) < 0.0025) return;
    drawnP = state.p;
    cleared = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = tex;
    const seam = Math.min(1, state.p * 6) * 0.14;
    for (const s of shards) {
      const lp = Math.max(0, Math.min(1, (state.p * 1.6 - s.delay) / 0.7));
      const e = lp * lp * (3 - 2 * lp);
      const alpha = 1 - Math.max(0, (e - 0.55) / 0.45);
      if (alpha <= 0.01) continue;
      const gap = 1 - seam - e * 0.3; // seams open, then shards shrink
      const a = e * s.spin, cos = Math.cos(a) * gap * dpr, sin = Math.sin(a) * gap * dpr;
      ctx.globalAlpha = alpha;
      ctx.setTransform(cos, sin, -sin, cos, (s.cx - e * s.dist) * dpr, (s.cy + e * s.lift) * dpr);
      tex.setTransform(s.m);
      ctx.fill(diamond);
    }
    ctx.globalAlpha = 1;
  };

  addEventListener('resize', () => { w = 0; tex = null; drawnP = -1; draw(); });
  const api = { state, draw };
  cache.set(h, api);
  return api;
}

