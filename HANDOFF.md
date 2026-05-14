# dotrift — Project Handoff

A complete reference document covering what dotrift is, how it works internally, everything that was built, and what's planned next.

---

## What it is

**dotrift** is a zero-dependency dot-repulsion particle effect for images. It renders an image as a grid of colored dots on a `<canvas>`. The dots scatter away from the mouse/finger and spring back when it leaves. Clicking fires a shockwave ripple that radiates outward from the click point.

- Works with vanilla JS, React, Vue, Svelte, or any framework
- The core is a single ES module (`src/dotrift.js`) — no build step needed
- Transparent canvas by default, so it inherits whatever background is behind it
- Mobile-friendly: touch events with `preventDefault()` to block scroll interference

**Live demo:** https://t0m13.github.io/dotrift/
**GitHub:** https://github.com/T0M13/dotrift

---

## File structure

```
dotrift/
├── src/
│   ├── dotrift.js        # Core ES module — source of truth
│   └── auto-init.js      # Auto-init via data-dotrift attributes on <img> tags
├── react/
│   └── index.jsx         # React hook (useDotrift) + component (DotriftCanvas)
├── types/
│   ├── index.d.ts        # TypeScript types for the core API
│   └── react.d.ts        # TypeScript types for the React integration
├── dotrift.umd.js        # UMD bundle for <script> tag usage (manual sync with dotrift.js)
├── index.html            # GitHub Pages demo — uses JS API directly, not auto-init
├── demo/
│   └── portrait.webp     # Default demo image (Tamas's portrait)
└── package.json          # npm package config with exports map
```

---

## How the core works (`src/dotrift.js`)

### Initialization

1. `createDotrift(canvasEl, imageSource, userConfig)` is called
2. Canvas is sized to `W × H` (from `width`/`height`/`size` config), scaled by `devicePixelRatio` (capped at 2x)
3. The image is loaded into an off-screen `<canvas>` (`srcCanvas`)
4. `rebuild()` draws `srcCanvas` downsampled to a `GX × GY` grid using `imageSmoothingQuality: 'high'`
5. Pixel data is extracted with `getImageData`. Pixels with alpha < 18 are skipped (transparency support)
6. For every visible pixel, origin positions (`ox`, `oy`), displacement (`dx`, `dy`), velocity (`vx`, `vy`), RGBA color string, and a random idle phase offset are stored in `Float32Array`s

### Per-frame loop (`tick`)

Each animation frame:
1. Dead shockwaves (expired by `ringDuration`) are removed
2. Mouse position is smoothed (`smX`/`smY` — lerp factor 0.18) to avoid jitter
3. Canvas is cleared or filled with `background` color
4. For each dot:
   - **Mouse repulsion**: cubic falloff force pointing away from cursor within `repelRadius`
   - **Shockwave**: ring-shaped force — the ring expands at `ringSpeed` px/s, dots in the ring's `ringWidth` band get pushed radially outward
   - **Idle animation** (if enabled): adds a time-varying force based on mode (see below)
   - **Spring**: linear restoring force pulling dot back to its origin (`dx * spring * 10`)
   - **Physics**: velocity += forces, velocity *= friction, displacement += velocity
5. Dot is drawn as a filled circle at `ox + dx, oy + dy`
6. `needsAnim` tracks whether any dot is still moving — if nothing is moving and mouse is off, `requestAnimationFrame` stops (no idle CPU waste)

### Idle animations

Activated after `idleDelay` ms of no interaction. `idleBlend` fades in/out smoothly (in: factor 0.04, out: 0.12).

| Mode | Behavior |
|---|---|
| `'drift'` | Each dot orbits its own random phase — Lissajous-like float |
| `'breathe'` | All dots pulse radially from center, like breathing |
| `'wave'` | Sine wave travelling diagonally across the grid |

`idleStrength` and `idleSpeed` scale the amplitude and time frequency of all idle modes.

### Events

| Interaction | Implementation |
|---|---|
| Mouse hover | `mousemove` → updates `mouseX/Y`, starts loop |
| Mouse leave | `mouseleave` → `mouseOn = false` |
| Click | `click` → pushes shockwave to `shockwaves[]` |
| Touch start | `touchstart` (passive: false, prevents scroll) → treats first touch as mouse + fires shockwave |
| Touch move | `touchmove` (passive: false) → tracks first touch point |
| Touch end/cancel | → `mouseOn = false` |

`lastInteraction` is updated on any interaction, which resets the idle delay timer.

### API

```js
const fx = createDotrift(canvas, imageSource, config);

fx.set({ repelRadius: 50 }); // live-update any config — rebuilds grid only if grid changes
fx.destroy();                 // cancels rAF, removes all listeners
```

---

## Auto-init (`src/auto-init.js`)

Scans `document.querySelectorAll('img[data-dotrift]')` on `DOMContentLoaded`.

For each matching image:
1. Reads `offsetWidth/Height` (falls back to `naturalWidth/Height`, then 200)
2. Reads any config overrides from `data-*` attributes via `ATTR_MAP`
3. Wraps the `<img>` in a `position:relative` div, copies border-radius and margins from computed style
4. Appends a `<canvas>` on top
5. On `onReady`, hides the original `<img>` — no flash, no layout shift

Supported data attributes:

| Attribute | Config key |
|---|---|
| `data-grid` | `grid` |
| `data-dot-size` | `dotSize` |
| `data-repel-radius` | `repelRadius` |
| `data-repel-force` | `repelForce` |
| `data-friction` | `friction` |
| `data-spring` | `spring` |
| `data-ring-strength` | `ringStrength` |
| `data-ring-speed` | `ringSpeed` |
| `data-ring-width` | `ringWidth` |
| `data-idle-animation` | `idleAnimation` |
| `data-idle-strength` | `idleStrength` |
| `data-idle-speed` | `idleSpeed` |
| `data-idle-delay` | `idleDelay` |
| `data-background` | `background` |

> **Note:** `size`, `width`, `height`, `ringDuration`, and `onReady` are not exposed as data attributes — they're set automatically from the image's rendered size.

---

## React integration (`react/index.jsx`)

### `useDotrift(src, config)` hook

- Returns a `canvasRef` to attach to a `<canvas>` element
- Mounts effect on `src` change, cleans up on unmount
- A second `useEffect` watches `config` and calls `fx.set(config)` for live updates without remounting

### `<DotriftCanvas>` component

Thin wrapper — takes `src`, optional `style`/`className`, and spreads everything else as config to `useDotrift`.

```jsx
<DotriftCanvas src="/photo.jpg" size={200} grid={110} repelRadius={30} style={{ borderRadius: 16 }} />
```

---

## All config options

| Option | Type | Default | Description |
|---|---|---|---|
| `size` | number | 200 | Canvas size in px (both axes). Overridden by `width`/`height`. |
| `width` | number | null | Canvas width in px |
| `height` | number | null | Canvas height in px |
| `grid` | number | 150 | Dot columns across the width. More = higher fidelity, more CPU. |
| `dotSize` | number | 1.2 | Dot radius as fraction of grid step. 1.0 = touching, 1.2 = slightly overlapping. |
| `repelRadius` | number | 25 | Mouse repulsion radius in px |
| `repelForce` | number | 22 | Mouse repulsion strength (cubic falloff) |
| `friction` | number | 0.5 | Velocity damping per frame (0–1). Lower = snappier return. |
| `spring` | number | 0.004 | Spring force pulling dots to origin |
| `ringStrength` | number | 3 | Click shockwave strength. `0` = disabled. |
| `ringSpeed` | number | 180 | Shockwave expansion speed in px/s |
| `ringWidth` | number | 14 | Shockwave ring thickness in px |
| `ringDuration` | number | 900 | Shockwave lifetime in ms |
| `idleAnimation` | `false\|'drift'\|'breathe'\|'wave'` | false | Idle animation mode |
| `idleStrength` | number | 1 | Idle animation amplitude multiplier |
| `idleSpeed` | number | 1 | Idle animation speed multiplier |
| `idleDelay` | number | 2000 | Ms of no interaction before idle fades in |
| `background` | string | null | Canvas fill color. `null`/`'transparent'` = transparent. |
| `onReady` | function | null | Callback fired after first frame is rendered |

---

## UMD bundle (`dotrift.umd.js`)

The UMD file is kept manually in sync with `src/dotrift.js`. There is no build step. When `dotrift.js` changes, update `dotrift.umd.js` to match (wrap in `(function(global, factory){...})` UMD wrapper, expose `Dotrift` and `createDotrift` on `window`).

---

## npm package exports

```json
{
  ".":       { "import": "./src/dotrift.js", "require": "./dotrift.umd.js" },
  "./react": { "import": "./react/index.jsx" }
}
```

TypeScript types are at `./types/index.d.ts` and `./types/react.d.ts`.

---

## Workflow notes

- **Validate syntax before pushing:** `node --input-type=module < src/dotrift.js`
- **SSH auth:** `eval "$(ssh-agent -s)" && ssh-add /home/tomiapps/.ssh/github`
- **ATTR_MAP** in `auto-init.js` must be updated for every new config option
- **UMD bundle** must be kept in sync manually when the core changes
- **Never include AI attribution** in commit messages

---

## What was built (history)

1. Initial release — core particle engine, mouse hover + click shockwave
2. GitHub Pages demo (`index.html`) with live portrait
3. README and preview image
4. CORS fix — pass `img` element directly instead of URL to avoid taint on cached images
5. Layout fix — copy computed margins from `img` to wrapper div
6. Touch/swipe support for mobile (pointer events approach)
7. Touch fix — replaced pointer events with `touchstart/touchmove/touchend + preventDefault` for reliable mobile support
8. `touch-action: none` on canvas and wrapper div
9. Local image upload to demo (FileReader, no server — pure client-side)
10. Uploaded image cropping fix — center-crop to square using `object-fit: cover` behavior
11. Idle animations: `drift`, `breathe`, `wave` modes
12. `idleDelay` + smooth `idleBlend` fade in/out — resets on any interaction
13. Live controls panel in demo — sliders for all physics params, pill buttons for idle modes
14. Default `grid` bumped to 150; idle disabled by default in demo

---

## Planned features (priority order)

1. **Multi-touch** — each finger its own independent repel field
2. **Swipe trail** — trail of disturbance following swipe path, not just the current finger position
3. **Attract mode** — pull dots toward cursor instead of repelling (toggle or separate option)
4. **Double tap** — stronger shockwave burst on double tap
5. **Color shift on interaction** — dots near cursor brighten or hue-shift
6. **Dot size variation** — slightly randomize individual dot sizes for organic look
7. **Gravity** — dots drift downward and spring back
8. **Inertia on fast swipe** — swipe velocity maps to repel force magnitude

---

## Demo page notes

`index.html` uses the JS API directly (not auto-init). It:
- Loads `demo/portrait.webp` by passing the `<img>` element to `createDotrift` (avoids CORS taint)
- Has a live controls panel with range sliders for physics and pill buttons for idle mode
- Has a local image upload (FileReader → draws to canvas → center-crops to square → passes canvas to `createDotrift`)
- The upload crop uses `drawImage` with source rect calculated for cover-fit to the canvas dimensions

---

*dotrift by Tamas Illes — MIT License*
