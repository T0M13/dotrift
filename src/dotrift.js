const DEFAULTS = {
  size:          200,
  width:         null,
  height:        null,
  grid:          150,
  dotSize:       1.2,
  repelRadius:   25,
  repelForce:    22,
  friction:      0.5,
  spring:        0.004,
  ringStrength:  3,
  ringSpeed:     180,
  ringWidth:     14,
  ringDuration:  900,
  idleAnimation: false,   // false | 'drift' | 'breathe' | 'wave'
  idleStrength:  1,        // amplitude multiplier
  idleSpeed:     1,        // speed multiplier
  idleDelay:     2000,     // ms of no interaction before idle starts
  background:    null,
  onReady:       null,
};

export function createDotrift(canvasEl, imageSource, userConfig) {
  const canvas = typeof canvasEl === 'string'
    ? document.querySelector(canvasEl)
    : canvasEl;

  if (!canvas) throw new Error('Dotrift: canvas not found');

  const cfg = Object.assign({}, DEFAULTS, userConfig);
  const W   = cfg.width  || cfg.size;
  const H   = cfg.height || cfg.size;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const transparent = !cfg.background || cfg.background === 'transparent';

  canvas.style.width       = W + 'px';
  canvas.style.height      = H + 'px';
  canvas.style.touchAction = 'none';
  canvas.width  = W * dpr;
  canvas.height = H * dpr;

  const ctx = canvas.getContext('2d', { alpha: transparent });
  ctx.scale(dpr, dpr);

  let count = 0, ox, oy, dx, dy, vx, vy, colors, idlePhases;
  let srcCanvas = null;
  let mouseX = -9999, mouseY = -9999, mouseOn = false, smX = -9999, smY = -9999;
  let shockwaves = [];
  let rafId = null;
  let destroyed = false;
  let firstFrame = true;
  let idleBlend = 0, lastInteraction = performance.now();

  function rebuild() {
    if (!srcCanvas) return;

    const GX   = Math.max(1, Math.round(cfg.grid));
    const step = W / GX;
    const GY   = Math.max(1, Math.round(H / step));

    const tmp = document.createElement('canvas');
    tmp.width = GX; tmp.height = GY;
    const tc  = tmp.getContext('2d');
    tc.imageSmoothingEnabled = true;
    tc.imageSmoothingQuality = 'high';
    tc.drawImage(srcCanvas, 0, 0, GX, GY);
    const px = tc.getImageData(0, 0, GX, GY).data;

    const stepY = H / GY;

    ox         = new Float32Array(GX * GY);
    oy         = new Float32Array(GX * GY);
    dx         = new Float32Array(GX * GY);
    dy         = new Float32Array(GX * GY);
    vx         = new Float32Array(GX * GY);
    vy         = new Float32Array(GX * GY);
    colors     = new Array(GX * GY);
    idlePhases = new Float32Array(GX * GY);
    count      = 0;

    for (let r = 0; r < GY; r++) {
      for (let c = 0; c < GX; c++) {
        const i4 = (r * GX + c) * 4;
        const a  = px[i4 + 3];
        if (a < 18) continue;
        const idx = count++;
        ox[idx] = c * step  + step  * 0.5;
        oy[idx] = r * stepY + stepY * 0.5;
        colors[idx]     = 'rgba(' + px[i4] + ',' + px[i4+1] + ',' + px[i4+2] + ',' + (a / 255).toFixed(2) + ')';
        idlePhases[idx] = Math.random() * Math.PI * 2;
      }
    }
    startLoop();
  }

  function loadImage(source) {
    if (source instanceof HTMLCanvasElement) {
      srcCanvas = source; rebuild(); return;
    }
    const img = source instanceof HTMLImageElement ? source : new Image();
    const finish = () => {
      srcCanvas = document.createElement('canvas');
      srcCanvas.width  = img.naturalWidth;
      srcCanvas.height = img.naturalHeight;
      srcCanvas.getContext('2d').drawImage(img, 0, 0);
      rebuild();
    };
    if (img.complete && img.naturalWidth) { finish(); return; }
    if (!(source instanceof HTMLImageElement)) {
      img.crossOrigin = 'anonymous';
      img.src = source;
    }
    img.addEventListener('load', finish, { once: true });
  }

  function tick(ts) {
    if (destroyed) return;
    let needsAnim = false;

    shockwaves = shockwaves.filter(s => ts - s.t < cfg.ringDuration);
    if (shockwaves.length) needsAnim = true;

    if (mouseOn) {
      smX += (mouseX - smX) * 0.18;
      smY += (mouseY - smY) * 0.18;
    }

    if (transparent) {
      ctx.clearRect(0, 0, W, H);
    } else {
      ctx.fillStyle = cfg.background;
      ctx.fillRect(0, 0, W, H);
    }

    const step = W / cfg.grid;
    const dotR = step * cfg.dotSize;
    const { repelRadius: RR, repelForce: RF, friction: FR, spring: SP,
            ringStrength: SS, ringSpeed: SV, ringWidth: SW, ringDuration: SDur,
            idleAnimation: IA, idleStrength: IS, idleSpeed: IV, idleDelay: ID } = cfg;

    if (IA) {
      const idleReady = ts - lastInteraction > ID;
      idleBlend += ((idleReady ? 1 : 0) - idleBlend) * (idleReady ? 0.04 : 0.12);
      if (idleBlend > 0.001) needsAnim = true;
    }
    const idleT = ts * 0.001 * IV;

    for (let i = 0; i < count; i++) {
      let fx = 0, fy = 0;

      if (mouseOn) {
        const ex = ox[i] + dx[i] - smX;
        const ey = oy[i] + dy[i] - smY;
        const d2 = ex * ex + ey * ey;
        if (d2 < RR * RR && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const s = 1 - d / RR;
          fx += ex / d * s * s * s * RF;
          fy += ey / d * s * s * s * RF;
        }
      }

      for (const sw of shockwaves) {
        const ring = (ts - sw.t) / 1000 * SV;
        const fade = 1 - (ts - sw.t) / SDur;
        const ex = ox[i] - sw.x, ey = oy[i] - sw.y;
        const d  = Math.sqrt(ex * ex + ey * ey);
        if (d < 0.1) continue;
        const diff = Math.abs(d - ring);
        if (diff < SW) {
          fx += ex / d * (1 - diff / SW) * fade * SS;
          fy += ey / d * (1 - diff / SW) * fade * SS;
        }
      }

      if (IA && idleBlend > 0.001) {
        const ph = idlePhases[i];
        if (IA === 'drift') {
          fx += Math.cos(idleT + ph)              * IS * 0.08 * idleBlend;
          fy += Math.sin(idleT * 0.8 + ph + 1.5) * IS * 0.08 * idleBlend;
        } else if (IA === 'breathe') {
          const pulse = Math.sin(idleT * Math.PI * 0.5);
          const ex = ox[i] - W * 0.5, ey = oy[i] - H * 0.5;
          const d  = Math.sqrt(ex * ex + ey * ey) || 1;
          fx += (ex / d) * pulse * IS * 0.3 * idleBlend;
          fy += (ey / d) * pulse * IS * 0.3 * idleBlend;
        } else if (IA === 'wave') {
          fx += Math.sin(idleT * 2 - (oy[i] / H) * Math.PI * 4) * IS * 0.3 * idleBlend;
          fy += Math.sin(idleT * 2 - (ox[i] / W) * Math.PI * 4) * IS * 0.5 * idleBlend;
        }
      }

      fx -= dx[i] * SP * 10;
      fy -= dy[i] * SP * 10;

      vx[i] = (vx[i] + fx) * FR;
      vy[i] = (vy[i] + fy) * FR;
      dx[i] += vx[i];
      dy[i] += vy[i];

      if (vx[i] * vx[i] + vy[i] * vy[i] > 0.0004) needsAnim = true;

      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(ox[i] + dx[i], oy[i] + dy[i], dotR, 0, Math.PI * 2);
      ctx.fill();
    }

    if (firstFrame) {
      firstFrame = false;
      if (cfg.onReady) cfg.onReady();
    }

    rafId = (needsAnim || mouseOn) ? requestAnimationFrame(tick) : null;
  }

  function startLoop() {
    if (!rafId && !destroyed) rafId = requestAnimationFrame(tick);
  }

  // — Mouse (pointer events) —
  function onMove(e) {
    lastInteraction = performance.now();
    const r = canvas.getBoundingClientRect();
    mouseX  = (e.clientX - r.left) * (W / r.width);
    mouseY  = (e.clientY - r.top)  * (H / r.height);
    if (!mouseOn) { mouseOn = true; smX = mouseX; smY = mouseY; }
    startLoop();
  }
  function onLeave() { mouseOn = false; }
  function onClick(e) {
    lastInteraction = performance.now();
    if (!cfg.ringStrength) return;
    const r = canvas.getBoundingClientRect();
    shockwaves.push({
      x: (e.clientX - r.left) * (W / r.width),
      y: (e.clientY - r.top)  * (H / r.height),
      t: performance.now(),
    });
    startLoop();
  }

  // — Touch events (mobile) —
  function getPos(touch) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (touch.clientX - r.left) * (W / r.width),
      y: (touch.clientY - r.top)  * (H / r.height),
    };
  }
  function onTouchStart(e) {
    e.preventDefault();
    lastInteraction = performance.now();
    const p = getPos(e.touches[0]);
    mouseX = p.x; mouseY = p.y;
    mouseOn = true; smX = p.x; smY = p.y;
    if (cfg.ringStrength) shockwaves.push({ x: p.x, y: p.y, t: performance.now() });
    startLoop();
  }
  function onTouchMove(e) {
    e.preventDefault();
    lastInteraction = performance.now();
    const p = getPos(e.touches[0]);
    mouseX = p.x; mouseY = p.y;
    startLoop();
  }
  function onTouchEnd() { mouseOn = false; }

  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseleave', onLeave);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('touchstart',  onTouchStart, { passive: false });
  canvas.addEventListener('touchmove',   onTouchMove,  { passive: false });
  canvas.addEventListener('touchend',    onTouchEnd);
  canvas.addEventListener('touchcancel', onTouchEnd);

  loadImage(imageSource);

  return {
    set(newCfg) {
      const gridChanged = newCfg.grid && newCfg.grid !== cfg.grid;
      Object.assign(cfg, newCfg);
      if (gridChanged) rebuild();
      else startLoop();
    },
    destroy() {
      destroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      canvas.removeEventListener('mousemove',    onMove);
      canvas.removeEventListener('mouseleave',   onLeave);
      canvas.removeEventListener('click',        onClick);
      canvas.removeEventListener('touchstart',   onTouchStart);
      canvas.removeEventListener('touchmove',    onTouchMove);
      canvas.removeEventListener('touchend',     onTouchEnd);
      canvas.removeEventListener('touchcancel',  onTouchEnd);
    },
  };
}

// Legacy namespace API — keeps <script> tag usage working
export const Dotrift = { create: createDotrift };
export default createDotrift;
