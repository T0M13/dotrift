/**
 * dotrift auto-init
 *
 * Add data-dotrift to any <img> and the effect is applied automatically.
 * No JavaScript needed beyond including this file.
 *
 * @example
 * <img data-dotrift src="photo.jpg" />
 *
 * Override any config option via data attributes:
 * <img data-dotrift data-grid="80" data-repel-radius="40" src="photo.jpg" />
 */

import { createDotrift, createTextCanvas } from './dotrift.js';

const TEXT_ATTR_MAP = {
  'data-font':           ['font',          String],
  'data-color':          ['color',         String],
  'data-padding':        ['padding',       Number],
  'data-align':          ['align',         String],
  'data-letter-spacing': ['letterSpacing', Number],
  'data-line-height':    ['lineHeight',    Number],
  'data-text-bg':        ['background',    String],
};

const ATTR_MAP = {
  'data-grid':           ['grid',          Number],
  'data-dot-size':       ['dotSize',       Number],
  'data-repel-radius':   ['repelRadius',   Number],
  'data-repel-force':    ['repelForce',    Number],
  'data-friction':       ['friction',      Number],
  'data-spring':         ['spring',        Number],
  'data-ring-strength':  ['ringStrength',  Number],
  'data-ring-speed':     ['ringSpeed',     Number],
  'data-ring-width':     ['ringWidth',     Number],
  'data-idle-animation': ['idleAnimation', String],
  'data-idle-strength':  ['idleStrength',  Number],
  'data-idle-speed':     ['idleSpeed',     Number],
  'data-idle-delay':     ['idleDelay',     Number],
  'data-background':     ['background',    String],
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

  // Copy relevant styles from img to wrapper
  const computed = window.getComputedStyle(img);
  if (computed.borderRadius) wrap.style.borderRadius = computed.borderRadius;
  if (computed.marginTop)    wrap.style.marginTop    = computed.marginTop;
  if (computed.marginBottom) wrap.style.marginBottom = computed.marginBottom;
  if (computed.marginLeft)   wrap.style.marginLeft   = computed.marginLeft;
  if (computed.marginRight)  wrap.style.marginRight  = computed.marginRight;
  wrap.style.overflow    = 'hidden';
  wrap.style.touchAction = 'none';

  img.parentNode.insertBefore(wrap, img);
  wrap.appendChild(img);
  img.style.cssText += ';position:absolute;top:0;left:0;width:100%;height:100%;margin:0;';

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;top:0;left:0;';
  wrap.appendChild(canvas);

  cfg.onReady = () => { img.style.display = 'none'; };

  createDotrift(canvas, img, cfg);
}

function fontFromComputed(cs) {
  const style   = cs.fontStyle   || 'normal';
  const variant = cs.fontVariant || 'normal';
  const weight  = cs.fontWeight  || 'normal';
  const size    = cs.fontSize    || '16px';
  const family  = cs.fontFamily  || 'sans-serif';
  return `${style} ${variant} ${weight} ${size} ${family}`;
}

function initText(el) {
  const text = el.getAttribute('data-dotrift-text') || el.textContent.trim();
  const computed = window.getComputedStyle(el);

  const textOpts = {
    text,
    font:  fontFromComputed(computed),
    color: computed.color || '#000',
  };

  const lhRaw = parseFloat(computed.lineHeight);
  const fsRaw = parseFloat(computed.fontSize);
  if (!Number.isNaN(lhRaw) && !Number.isNaN(fsRaw) && fsRaw > 0) {
    textOpts.lineHeight = lhRaw / fsRaw;
  }
  const lsRaw = parseFloat(computed.letterSpacing);
  if (!Number.isNaN(lsRaw)) textOpts.letterSpacing = lsRaw;
  if (computed.textAlign === 'left' || computed.textAlign === 'right' || computed.textAlign === 'center') {
    textOpts.align = computed.textAlign;
  }

  for (const [attr, [key, cast]] of Object.entries(TEXT_ATTR_MAP)) {
    if (el.hasAttribute(attr)) textOpts[key] = cast(el.getAttribute(attr));
  }

  const textCanvas = createTextCanvas(textOpts);
  const W = textCanvas.width;
  const H = textCanvas.height;

  const cfg = { width: W, height: H, background: 'transparent' };
  for (const [attr, [key, cast]] of Object.entries(ATTR_MAP)) {
    if (el.hasAttribute(attr)) cfg[key] = cast(el.getAttribute(attr));
  }

  const wrap = document.createElement('div');
  wrap.style.cssText = `position:relative;width:${W}px;height:${H}px;display:inline-block;touch-action:none;`;

  const computed = window.getComputedStyle(el);
  if (computed.marginTop)    wrap.style.marginTop    = computed.marginTop;
  if (computed.marginBottom) wrap.style.marginBottom = computed.marginBottom;
  if (computed.marginLeft)   wrap.style.marginLeft   = computed.marginLeft;
  if (computed.marginRight)  wrap.style.marginRight  = computed.marginRight;

  el.parentNode.insertBefore(wrap, el);
  el.style.display = 'none';

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;top:0;left:0;';
  wrap.appendChild(canvas);

  createDotrift(canvas, textCanvas, cfg);
}

function init() {
  document.querySelectorAll('img[data-dotrift]').forEach(initImage);
  const textEls = document.querySelectorAll('[data-dotrift-text]');
  const startText = () => textEls.forEach(initText);
  if (textEls.length && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(startText);
  } else {
    startText();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { initImage, initText };
