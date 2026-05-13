/**
 * particle-fx auto-init
 *
 * Add data-particle-fx to any <img> and the effect is applied automatically.
 * No JavaScript needed beyond including this file.
 *
 * @example
 * <img data-particle-fx src="photo.jpg" />
 *
 * Override any config option via data attributes:
 * <img data-particle-fx data-grid="80" data-repel-radius="40" src="photo.jpg" />
 */

import { createParticleFX } from './particle-fx.js';

const ATTR_MAP = {
  'data-grid':          ['grid',         Number],
  'data-dot-size':      ['dotSize',      Number],
  'data-repel-radius':  ['repelRadius',  Number],
  'data-repel-force':   ['repelForce',   Number],
  'data-friction':      ['friction',     Number],
  'data-spring':        ['spring',       Number],
  'data-ring-strength': ['ringStrength', Number],
  'data-ring-speed':    ['ringSpeed',    Number],
  'data-ring-width':    ['ringWidth',    Number],
  'data-background':    ['background',   String],
};

function initImage(img) {
  const rect = img.getBoundingClientRect();
  const W = img.offsetWidth  || img.naturalWidth  || 200;
  const H = img.offsetHeight || img.naturalHeight || 200;

  const cfg = { width: W, height: H, background: 'transparent' };
  for (const [attr, [key, cast]] of Object.entries(ATTR_MAP)) {
    if (img.hasAttribute(attr)) cfg[key] = cast(img.getAttribute(attr));
  }

  // Wrap img in a fixed-size container
  const wrap = document.createElement('div');
  wrap.style.cssText = `position:relative;width:${W}px;height:${H}px;display:inline-block;`;

  // Copy border-radius from img
  const computed = window.getComputedStyle(img);
  if (computed.borderRadius) wrap.style.borderRadius = computed.borderRadius;
  wrap.style.overflow = 'hidden';

  img.parentNode.insertBefore(wrap, img);
  wrap.appendChild(img);
  img.style.cssText += ';position:absolute;top:0;left:0;width:100%;height:100%;margin:0;';

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;top:0;left:0;';
  wrap.appendChild(canvas);

  cfg.onReady = () => { img.style.display = 'none'; };

  createParticleFX(canvas, img.src, cfg);
}

function init() {
  document.querySelectorAll('img[data-particle-fx]').forEach(initImage);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { initImage };
