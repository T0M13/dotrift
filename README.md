<p align="center">
  <img src="https://tamas-illes.com/wp-content/uploads/2024/12/tomi_lowpoly.webp" width="140" alt="dotrift — dot-repulsion effect demo" style="border-radius:40px" />
</p>

<h1 align="center">dotrift</h1>
<p align="center">Dot-repulsion particle effect for images.</p>
<p align="center">
  <a href="https://t0m13.github.io/dotrift/demo/"><strong>→ Live demo</strong></a>
</p>
Hover to scatter dots, click to send a shockwave ripple.

---

## The simplest way — just add `data-dotrift` to any image

```html
<script type="module" src="dotrift/src/auto-init.js"></script>

<img data-dotrift src="photo.jpg" />
```

That's it. The script reads the image's natural size, wraps it in a canvas, and applies the effect automatically. The original image is the placeholder until the canvas is ready — no flash, no layout shift.

Override any option via data attributes:

```html
<img
  data-dotrift
  data-grid="80"
  data-repel-radius="40"
  data-ring-strength="0"
  src="photo.jpg"
/>
```

---

## Script tag (no bundler)

```html
<script src="dotrift/dotrift.umd.js"></script>

<img id="photo" src="photo.jpg" />

<script>
  const img = document.getElementById('photo');
  const canvas = document.createElement('canvas');
  img.parentNode.insertBefore(canvas, img);
  img.style.display = 'none';

  Dotrift.create(canvas, img.src, { size: 200, grid: 100 });
</script>
```

---

## ES module

```js
import { createDotrift } from 'dotrift';

const canvas = document.querySelector('#my-canvas');
const fx = createDotrift(canvas, '/photo.jpg', { size: 200, grid: 100 });

// Update live
fx.set({ repelRadius: 50 });

// Clean up
fx.destroy();
```

---

## React

```jsx
import { DotriftCanvas } from 'dotrift/react';

export default function Profile() {
  return (
    <DotriftCanvas
      src="/photo.jpg"
      size={200}
      grid={110}
      repelRadius={30}
      style={{ borderRadius: 16 }}
    />
  );
}
```

Or use the hook directly:

```jsx
import { useDotrift } from 'dotrift/react';

export default function Profile() {
  const ref = useDotrift('/photo.jpg', { size: 200, grid: 110 });
  return <canvas ref={ref} style={{ borderRadius: 16 }} />;
}
```

Works with **TanStack**, **Next.js**, **Remix**, **Vite**, or any React setup.

---

## Vue / Svelte / any framework

The core is framework-agnostic. Get a reference to a canvas element and call `createDotrift`:

```js
// Vue
import { onMounted, onUnmounted, ref } from 'vue';
import { createDotrift } from 'dotrift';

const canvasRef = ref(null);
let fx;

onMounted(() => {
  fx = createDotrift(canvasRef.value, '/photo.jpg', { size: 200 });
});
onUnmounted(() => fx?.destroy());
```

---

## Config options

| Option | Default | Description |
|---|---|---|
| `size` | `200` | Canvas size in px (width & height). Overridden by `width`/`height`. |
| `width` | `null` | Canvas width in px. Use for non-square. |
| `height` | `null` | Canvas height in px. Use for non-square. |
| `grid` | `120` | Dots along the width axis. More = sharper, heavier. |
| `dotSize` | `1.2` | Dot radius as fraction of step. `1.0` = touching, `1.2` = overlapping. |
| `repelRadius` | `25` | Mouse repulsion radius in px. |
| `repelForce` | `22` | Mouse repulsion strength. |
| `friction` | `0.5` | Velocity damping (0–1). Lower = snappier return. |
| `spring` | `0.004` | Spring force pulling dots home. |
| `ringStrength` | `3` | Click shockwave strength. `0` = disabled. |
| `ringSpeed` | `180` | Shockwave expansion speed in px/s. |
| `ringWidth` | `14` | Shockwave ring thickness in px. |
| `background` | `null` | Fill color. `null` / `'transparent'` = transparent canvas. |
| `onReady` | `null` | Callback fired after first frame is rendered. |

---

## License

MIT © [Tamas Illes](https://tamas-illes.com)
