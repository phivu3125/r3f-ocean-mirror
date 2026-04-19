# R3F Ocean Water Shader

A realistic, non-interactive ocean scene built with **React Three Fiber** and
three.js's built-in **planar-reflection `Water`** material, lit by a warm
golden-hour `Sky`. A few pieces of driftwood — crates, planks, branches — bob
on the surface. Includes a collapsible FPS / perf panel.

![three](https://img.shields.io/badge/three-0.170-black)
![r3f](https://img.shields.io/badge/@react--three/fiber-v9-black)
![react](https://img.shields.io/badge/react-19-61dafb)
![renderer](https://img.shields.io/badge/renderer-WebGL-orange)

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc --noEmit && vite build
npm run typecheck  # tsc --noEmit
```

Works in any modern browser with WebGL2 (Chrome, Edge, Firefox, Safari).
No WebGPU required.

## Credits & inspiration

The visual approach is directly inspired by
[**nhtoby311/WaterSurface**](https://github.com/nhtoby311/WaterSurface), which
demonstrates how to wrap three.js's built-in `Water` class cleanly inside R3F.
The core water material is the canonical
[`three/examples/jsm/objects/Water.js`](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/objects/Water.js)
and its tileable [`waternormals.jpg`](https://github.com/mrdoob/three.js/blob/dev/examples/textures/waternormals.jpg)
normal map from the official three.js examples.

## How it works

### Water surface — planar reflection, not displacement

`src/scene/Ocean.tsx` wraps `three/examples/jsm/objects/Water.js`. Unlike a
Gerstner-wave approach, the plane is geometrically flat; the motion comes from:

1. A second scene pass that renders the world into a `WebGLRenderTarget` from
   the reflected camera (Lengyel oblique clip plane).
2. Four scrolling samples of `waternormals.jpg` at different scales, summed to
   produce animated surface normals.
3. Those normals distort the reflection UV, giving the rippling look.
4. A Schlick Fresnel term plus Blinn-Phong sun highlight on top.

Animation is driven by `useFrame((_, delta) => water.material.uniforms.time.value += delta)`.

### Sky & lighting

`<Sky>` from `@react-three/drei` provides atmospheric scattering. A single
sun direction is computed from spherical coords once and re-used for:

- The `Sky` sunPosition
- The water's `sunDirection` uniform (so the specular hotspot aligns with the sky)
- A `directionalLight` (for the floaters' shadows)

Tone-mapping is ACES Filmic at exposure 0.55 to keep the horizon from clipping.

### Floating objects

`src/scene/FloatingObjects.tsx` places 7 driftwood pieces — 2 crates, 2 planks,
3 branches. Each one bobs / rolls / pitches via stacked sines in `useFrame`
(no Gerstner sampling, because the water surface itself is flat). Materials
have a small `emissive` lift so they stay readable when silhouetted against
the bright sunlit horizon.

### Perf panel

`src/ui/StatsPanel.tsx` uses `stats.js` with two pieces:

- `<StatsUpdater/>` lives **inside** `<Canvas>` and calls `stats.begin/end`
  from `useFrame(..., -1000)` — so the counters ride R3F's own render tick
  instead of a parallel `requestAnimationFrame` loop.
- `<StatsPanel/>` lives **outside** `<Canvas>` and owns the DOM. It can
  collapse into a small round Next.js-style pill button, and it respects
  iOS `env(safe-area-inset-*)` so it stays visible on mobile.

Both share a module-level singleton `Stats` instance so the DOM is stable
across expand/collapse.

## File map

```
src/
├── App.tsx                 Canvas, Sky, lights, OrbitControls, mounts everything
├── main.tsx                React 19 root
├── scene/
│   ├── Ocean.tsx           Wraps three.js Water class (planar reflection)
│   └── FloatingObjects.tsx 7 driftwood pieces with sine-bob animation
└── ui/
    └── StatsPanel.tsx      Collapsible FPS panel (stats.js)
public/
└── water/
    └── waternormals.jpg    Tileable normal map from three.js examples
```

## Tuning

- **Sun angle** — `elevation` / `azimuth` constants in `src/App.tsx`. Low
  elevation (~3°) gives the warm golden-hour look; raise it for midday.
- **Water colour** — `waterColor` prop on `<Ocean>` (default `0x001e2f`).
- **Distortion** — `distortionScale` prop on `<Ocean>` (default `3.7`). Higher
  = more chaotic reflection rippling.
- **Reflection quality vs perf** — `textureWidth` / `textureHeight` in
  `Ocean.tsx` (currently 512). Drop to 256 for a cheap ~30% GPU win.

## Non-goals

- No pointer / mouse ripple interaction (ambient waves only).
- No compute-shader wave simulation.
- No SSR, foam, caustics, or underwater refraction.
- No tests — this is a visual demo.
