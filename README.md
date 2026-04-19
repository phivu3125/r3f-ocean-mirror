# WebGPU Water Shader (R3F)

Realistic ocean water shader built with **three.js WebGPU + TSL** and
**React Three Fiber v9**, with a few buoys / crates / rafts floating on the
surface.

![stack](https://img.shields.io/badge/three-0.170-black) ![stack](https://img.shields.io/badge/R3F-v9-black) ![stack](https://img.shields.io/badge/WebGPU-required-blue)

## Run

```bash
npm install
npm run dev       # open http://localhost:5173
npm run build     # production build
npm run typecheck # tsc --noEmit
```

Requires a **WebGPU-enabled browser** (Chrome 113+, Edge 113+, Chromium 113+).
The app detects unsupported browsers and shows a fallback message instead of
rendering a broken scene.

## How it works

### Gerstner waves on both CPU and GPU

`src/shader/gerstner.ts` defines a 5-wave ocean preset and two functions:

- `sampleGerstner(x, z, t)` — CPU scalar evaluation
- `sampleGerstnerNormal(x, z, t)` — finite-difference normal

The **same math** is encoded in TSL inside `src/shader/waterMaterial.ts` so
the GPU-displaced water surface and the CPU-sampled floating objects stay
visually locked together. No texture assets required.

### Material

`createWaterMaterial()` builds a `MeshStandardNodeMaterial` with:

- `positionNode` = Gerstner displacement
- `normalNode` = analytic normal from summed partial derivatives of the
  displacement function (exact, not a finite-difference approximation)
- `colorNode` = fresnel mix of deep / shallow / sky tint colors

### Scene

`src/App.tsx` mounts an R3F `<Canvas>` with an async `gl` factory that
returns an initialized `WebGPURenderer`. `src/scene/Ocean.tsx` is a plane
(200×200, 220 segments). `src/scene/FloatingObjects.tsx` samples the Gerstner
function each frame in `useFrame` to position and tilt 5 objects.

## File map

```
src/
├── App.tsx                     Canvas + renderer bootstrap
├── main.tsx                    React root
├── lib/
│   └── webgpuSupport.ts        Capability check (navigator.gpu)
├── scene/
│   ├── Ocean.tsx               Plane + water material
│   └── FloatingObjects.tsx     Buoys / crates / rafts, Gerstner-sampled
└── shader/
    ├── gerstner.ts             Shared CPU+GPU wave definition
    └── waterMaterial.ts        TSL Standard material with Gerstner + fresnel
```

## Tuning

All wave parameters live in `OCEAN_WAVES` in `src/shader/gerstner.ts`:

```ts
{
  direction: ([dx, dz], amplitude, wavelength, speed, steepness);
}
```

Adjust `amplitude` for swell size, `wavelength` for spatial frequency,
`steepness` ∈ [0, 1] for sharper crests. Color and fresnel uniforms are
exposed from `createWaterMaterial()` if you want a GUI later.

## Non-goals

- No pointer / mouse interaction (ambient waves only, per spec)
- No compute-shader ripple simulation
- No screen-space reflections or foam / caustics
