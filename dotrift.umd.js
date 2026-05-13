/*!
 * dotrift v1.0.0 — UMD build (script tag / CommonJS / AMD)
 * For ES module usage: import from 'dotrift'
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Dotrift = factory());
})(this, function () {

  const DEFAULTS = {
    size: 200, width: null, height: null, grid: 120, dotSize: 1.2,
    repelRadius: 25, repelForce: 22, friction: 0.5, spring: 0.004,
    ringStrength: 3, ringSpeed: 180, ringWidth: 14, ringDuration: 900,
    background: null, onReady: null,
  };

  function createDotrift(canvasEl, imageSource, userConfig) {
    const canvas = typeof canvasEl === 'string' ? document.querySelector(canvasEl) : canvasEl;
    if (!canvas) throw new Error('Dotrift: canvas not found');

    const cfg = Object.assign({}, DEFAULTS, userConfig);
    const W = cfg.width || cfg.size, H = cfg.height || cfg.size;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const transparent = !cfg.background || cfg.background === 'transparent';

    canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; canvas.style.touchAction = 'none';
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d', { alpha: transparent });
    ctx.scale(dpr, dpr);

    let count = 0, ox, oy, dx, dy, vx, vy, colors, srcCanvas = null;
    let mouseX = -9999, mouseY = -9999, mouseOn = false, smX = -9999, smY = -9999;
    let shockwaves = [], rafId = null, destroyed = false, firstFrame = true;

    function rebuild() {
      if (!srcCanvas) return;
      const GX = Math.max(1, Math.round(cfg.grid)), step = W / GX, GY = Math.max(1, Math.round(H / step));
      const tmp = document.createElement('canvas'); tmp.width = GX; tmp.height = GY;
      const tc = tmp.getContext('2d'); tc.imageSmoothingEnabled = true; tc.imageSmoothingQuality = 'high';
      tc.drawImage(srcCanvas, 0, 0, GX, GY);
      const px = tc.getImageData(0, 0, GX, GY).data, stepY = H / GY;
      ox = new Float32Array(GX * GY); oy = new Float32Array(GX * GY);
      dx = new Float32Array(GX * GY); dy = new Float32Array(GX * GY);
      vx = new Float32Array(GX * GY); vy = new Float32Array(GX * GY);
      colors = new Array(GX * GY); count = 0;
      for (let r = 0; r < GY; r++) for (let c = 0; c < GX; c++) {
        const i4 = (r * GX + c) * 4, a = px[i4 + 3];
        if (a < 18) continue;
        const idx = count++;
        ox[idx] = c * step + step * 0.5; oy[idx] = r * stepY + stepY * 0.5;
        colors[idx] = 'rgba(' + px[i4] + ',' + px[i4+1] + ',' + px[i4+2] + ',' + (a/255).toFixed(2) + ')';
      }
      startLoop();
    }

    function loadImage(source) {
      if (source instanceof HTMLCanvasElement) { srcCanvas = source; rebuild(); return; }
      const img = source instanceof HTMLImageElement ? source : new Image();
      const finish = () => {
        srcCanvas = document.createElement('canvas');
        srcCanvas.width = img.naturalWidth; srcCanvas.height = img.naturalHeight;
        srcCanvas.getContext('2d').drawImage(img, 0, 0); rebuild();
      };
      if (img.complete && img.naturalWidth) { finish(); return; }
      if (!(source instanceof HTMLImageElement)) { img.crossOrigin = 'anonymous'; img.src = source; }
      img.addEventListener('load', finish, { once: true });
    }

    function tick(ts) {
      if (destroyed) return;
      let needsAnim = false;
      shockwaves = shockwaves.filter(s => ts - s.t < cfg.ringDuration);
      if (shockwaves.length) needsAnim = true;
      if (mouseOn) { smX += (mouseX - smX) * 0.18; smY += (mouseY - smY) * 0.18; }
      transparent ? ctx.clearRect(0, 0, W, H) : (ctx.fillStyle = cfg.background, ctx.fillRect(0, 0, W, H));
      const step = W / cfg.grid, dotR = step * cfg.dotSize;
      const { repelRadius: RR, repelForce: RF, friction: FR, spring: SP, ringStrength: SS, ringSpeed: SV, ringWidth: SW, ringDuration: SDur } = cfg;
      for (let i = 0; i < count; i++) {
        let fx = 0, fy = 0;
        if (mouseOn) {
          const ex = ox[i]+dx[i]-smX, ey = oy[i]+dy[i]-smY, d2 = ex*ex+ey*ey;
          if (d2 < RR*RR && d2 > 0.01) { const d=Math.sqrt(d2),s=1-d/RR,f=s*s*s*RF; fx+=ex/d*f; fy+=ey/d*f; }
        }
        for (const sw of shockwaves) {
          const ring=(ts-sw.t)/1000*SV, fade=1-(ts-sw.t)/SDur, ex=ox[i]-sw.x, ey=oy[i]-sw.y, d=Math.sqrt(ex*ex+ey*ey);
          if (d < 0.1) continue;
          const diff=Math.abs(d-ring);
          if (diff < SW) { fx+=ex/d*(1-diff/SW)*fade*SS; fy+=ey/d*(1-diff/SW)*fade*SS; }
        }
        fx -= dx[i]*SP*10; fy -= dy[i]*SP*10;
        vx[i]=(vx[i]+fx)*FR; vy[i]=(vy[i]+fy)*FR; dx[i]+=vx[i]; dy[i]+=vy[i];
        if (vx[i]*vx[i]+vy[i]*vy[i] > 0.0004) needsAnim = true;
        ctx.fillStyle = colors[i]; ctx.beginPath(); ctx.arc(ox[i]+dx[i], oy[i]+dy[i], dotR, 0, Math.PI*2); ctx.fill();
      }
      if (firstFrame) { firstFrame = false; if (cfg.onReady) cfg.onReady(); }
      rafId = (needsAnim || mouseOn) ? requestAnimationFrame(tick) : null;
    }

    function startLoop() { if (!rafId && !destroyed) rafId = requestAnimationFrame(tick); }

    function onMove(e) {
      const r = canvas.getBoundingClientRect();
      mouseX = (e.clientX-r.left)*(W/r.width); mouseY = (e.clientY-r.top)*(H/r.height);
      if (!mouseOn) { mouseOn = true; smX = mouseX; smY = mouseY; }
      startLoop();
    }
    function onLeave() { mouseOn = false; }
    function onUp() { mouseOn = false; }
    function onClick(e) {
      if (!cfg.ringStrength) return;
      const r = canvas.getBoundingClientRect();
      shockwaves.push({ x:(e.clientX-r.left)*(W/r.width), y:(e.clientY-r.top)*(H/r.height), t:performance.now() });
      startLoop();
    }

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('click', onClick);
    loadImage(imageSource);

    return {
      set(newCfg) { const g = newCfg.grid && newCfg.grid !== cfg.grid; Object.assign(cfg, newCfg); g ? rebuild() : startLoop(); },
      destroy() { destroyed=true; if(rafId)cancelAnimationFrame(rafId); canvas.removeEventListener('pointermove',onMove); canvas.removeEventListener('pointerleave',onLeave); canvas.removeEventListener('pointerup',onUp); canvas.removeEventListener('pointercancel',onUp); canvas.removeEventListener('click',onClick); },
    };
  }

  return { create: createDotrift };
});
