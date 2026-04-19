# WebGPU Realistic Ocean Water Shader with Floating Objects (R3F)

**Bead:** water-shader-ou4
**Created:** 2026-04-19
**Status:** Approved

## Bead Metadata

```yaml
depends_on: []
parallel: false
conflicts_with: []
blocks: []
estimated_hours: 6
```

---

## Problem Statement

### What problem are we solving?

The repository is empty. The user wants a visually convincing, realistic ocean water surface rendered with WebGPU on React Three Fiber (R3F), with a few objects floating on the surface that bob with the waves. Non-interactive (ambient only — no mouse/pointer disturbance). This is a self-contained demo/reference project that must run in a modern browser.

### Why now?

User explicitly requested it. Tracks as feature work because it requires scaffolding a full Vite+React+TS app, adding R3F+three+WebGPU integration, writing a TSL shader (Gerstner + dual normal maps + Fresnel), and synchronizing CPU-side floating object motion to the GPU wave function.

### Who is affected?

- **Primary users:** The project owner (huynhgiabuu) running the dev server locally to view the scene.
- **Secondary users:** Future readers using this as a reference implementation for WebGPU water in R3F.

---

## Scope

### In-Scope

- Vite + React + TypeScript project scaffold at repo root.
- `@react-three/fiber` v9+ Canvas configured to use `three.webgpu.WebGPURenderer` via async `gl` prop.
- Ocean plane mesh (≥200×200 segments) with TSL-based material.
- Gerstner wave vertex displacement: 4 wave terms with varied direction, wavelength, steepness, speed.
- Normal computation: analytic normal from Gerstner derivatives combined with two scrolling normal-map textures (RNB blend) for surface micro-detail.
- Fresnel-based color mix: deep water color ↔ sky/reflection color.
- Environment HDR for reflections (drei `Environment` with a preset).
- 3–5 floating objects (drei primitives or simple meshes — boat/buoy/duck) whose Y position + XZ tilt are sampled every frame from the same Gerstner function so they bob and pitch realistically.
- Orbit camera (drei `OrbitControls`) for viewing, disabled pointer-water interaction.
- WebGPU capability check with a graceful on-screen fallback message if the browser lacks WebGPU support.

### Out-of-Scope

- Mouse/pointer-driven ripples or splash interaction (user said "ko cần tương tác").
- GPU compute ping-pong heightfield simulation (`webgpu_compute_water.html` style). Deferred — overkill for purely ambient ocean.
- Screen-space reflections (`ssr()` node). No shipped reference yet; reflector is sufficient.
- Caustics, foam shader, subsurface scattering, spray particles.
- Server, routing, state management, UI chrome beyond a title overlay.
- Tests (this is a visual demo — success is visual, verified by the user via dev server).

---

## Proposed Solution

### Overview

Scaffold a minimal Vite + React + TypeScript app. Mount a full-window `Canvas` that initializes a `WebGPURenderer` asynchronously. Render a large subdivided plane with a `MeshStandardNodeMaterial` whose `positionNode` implements a Gerstner wave sum in TSL and whose `normalNode` blends the analytic Gerstner normal with two scrolling tileable normal maps. Add an `Environment` for reflections and drei `OrbitControls`. Place 3–5 simple floating objects whose per-frame pose is derived by evaluating the same Gerstner function on the CPU in `useFrame`. Wrap the Canvas in a WebGPU capability check that shows a helpful message if unsupported.

### User Flow

1. User runs `npm run dev` and opens `http://localhost:5173`.
2. A WebGPU-supported browser shows an animated ocean under an HDR sky with 3–5 objects bobbing on the surface.
3. User drags to orbit the camera; scroll to zoom. No interaction with the water itself.
4. An unsupported browser shows a clear message: "WebGPU is not available in this browser. Try Chrome/Edge 113+ on desktop."

---

## Requirements

### Functional Requirements

#### FR1 — WebGPU Canvas boots

`Canvas` initializes `WebGPURenderer` via the async `gl` prop, awaits `renderer.init()`, and renders the scene.

**Scenarios:**

- **WHEN** the page loads in Chrome 113+ **THEN** the water scene renders at interactive framerate (≥ 30 fps on integrated GPU, ≥ 60 on dGPU) with no console errors.
- **WHEN** the page loads in a browser without WebGPU **THEN** a fallback message is shown and the app does not crash.

#### FR2 — Gerstner ocean surface

The water mesh displaces vertices via a Gerstner sum and derives normals from the same function.

**Scenarios:**

- **WHEN** the scene renders **THEN** the surface has visible, continuously animating waves with believable crest shapes (not pure sine) and consistent lighting (no normal / displacement mismatch producing inverted highlights).
- **WHEN** wave parameters are edited in source **THEN** the visual result updates on HMR.

#### FR3 — Surface detail via dual normal maps

Two tileable normal-map textures scroll in different directions and speeds; their normals are blended and combined with the analytic Gerstner normal.

**Scenarios:**

- **WHEN** viewed at grazing angle **THEN** fine surface chop is visible (micro-detail), not a plastic-glass mirror.
- **WHEN** viewed at top-down **THEN** tiling artifacts are not glaringly obvious (use different scales/speeds on the two layers).

#### FR4 — Fresnel color mix and reflections

Use a Fresnel term to mix a deep-water color with an environment/sky reflection color; `Environment` HDR provides the sky and reflection source.

**Scenarios:**

- **WHEN** looking straight down **THEN** the water reads as deeper/bluer.
- **WHEN** looking along the horizon **THEN** the water reflects the sky strongly.

#### FR5 — Floating objects follow waves

3–5 floating objects are placed on the surface; their Y position and pitch/roll are updated per-frame by sampling the same Gerstner function on the CPU.

**Scenarios:**

- **WHEN** a wave crest passes an object **THEN** the object rises and tilts naturally along the wave tangent.
- **WHEN** scrubbing time **THEN** object pose is deterministic (no cumulative drift).

#### FR6 — Camera controls

`OrbitControls` allow orbit/zoom. No raycast interaction with the water.

### Non-Functional Requirements

- **Performance:** Target 60 fps on a desktop dGPU at 1080p; ≥ 30 fps on integrated graphics. 200×200 plane (40 000 vertices) + 4 Gerstner waves + 2 normal textures is well within budget.
- **Compatibility:** Chrome/Edge ≥ 113 desktop (WebGPU). Safari Tech Preview with WebGPU flag works best-effort. Firefox Nightly best-effort. No requirement for production Firefox/Safari; capability check handles gracefully.
- **Accessibility:** N/A — visual demo. Fallback message is a plain, readable `<div>` with sufficient contrast.
- **Repo discipline:** No dist/ modifications. `npm run lint:fix` passes. `npm run typecheck` passes.

---

## Success Criteria

- [ ] Project scaffolded with Vite + React + TypeScript at repo root (`package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`).
  - Verify: `npm install && npm run build` exits 0.
- [ ] `npm run typecheck` passes with zero errors.
  - Verify: `npm run typecheck`
- [ ] `npm run lint` passes (or ESLint absent — at minimum `tsc --noEmit` is clean).
  - Verify: `npm run lint` if configured, else `npm run typecheck`.
- [ ] `npm run dev` starts Vite and serves on `http://localhost:5173`.
  - Verify: `npm run dev` prints the local URL.
- [ ] Scene renders an animated ocean with floating objects in Chrome 113+.
  - Verify: Manual — open URL, confirm visible animated waves and bobbing objects, no console errors.
- [ ] Unsupported browsers see a graceful fallback message.
  - Verify: Manual — load in a Safari build without WebGPU flag, confirm message appears, no crash.
- [ ] No mouse/pointer interactivity affects the water surface.
  - Verify: Manual — click/drag on the water, confirm waves unchanged.

---

## Technical Context

### Existing Patterns

- No existing source — this bead scaffolds the first source files.
- `.opencode/` and `.beads/` tooling exists and must not be disturbed.

### Key Files (to be created)

- `package.json` — Dependencies and scripts.
- `vite.config.ts` — Vite + React plugin config.
- `tsconfig.json`, `tsconfig.node.json` — TypeScript strict.
- `index.html` — Vite entry.
- `src/main.tsx` — React root.
- `src/App.tsx` — Canvas + scene composition.
- `src/scene/Ocean.tsx` — Ocean plane + material.
- `src/scene/FloatingObjects.tsx` — Floaters that sample Gerstner.
- `src/shader/gerstner.ts` — Gerstner TSL function + CPU mirror for floaters.
- `src/shader/waterMaterial.ts` — TSL material builder (position/normal/color nodes).
- `src/lib/webgpuSupport.ts` — Capability check helper.
- `public/normals/waterNormal1.jpg`, `public/normals/waterNormal2.jpg` — Tileable normal maps (downloaded or generated).

### Affected Files

```yaml
files:
  - package.json
  - vite.config.ts
  - tsconfig.json
  - tsconfig.node.json
  - index.html
  - src/main.tsx
  - src/App.tsx
  - src/scene/Ocean.tsx
  - src/scene/FloatingObjects.tsx
  - src/shader/gerstner.ts
  - src/shader/waterMaterial.ts
  - src/lib/webgpuSupport.ts
  - public/normals/waterNormal1.jpg
  - public/normals/waterNormal2.jpg
```

### Dependency Plan

Runtime:

- `react` ^18 or ^19
- `react-dom` ^18 or ^19
- `three` latest (must include `three/webgpu` + `three/tsl` entrypoints — ≥ 0.170)
- `@react-three/fiber` ^9 (v9 required for WebGPURenderer async gl)
- `@react-three/drei` latest compatible with R3F v9

Dev:

- `typescript` ^5
- `vite` ^5 or ^6
- `@vitejs/plugin-react` latest
- `@types/react`, `@types/react-dom`, `@types/three`

---

## Risks & Mitigations

| Risk                                                         | Likelihood | Impact | Mitigation                                                                                                                                        |
| ------------------------------------------------------------ | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `three/webgpu` / `three/tsl` import paths or TSL API drift   | Medium     | Medium | Pin `three` to a known working minor; reference live `webgpu_reflection.html` source; update imports if build fails.                              |
| R3F v9 async-gl typing issues with TypeScript strict         | Medium     | Low    | Use `ThreeToJSXElements` pattern from pmndrs docs; cast props through `any` at the Canvas boundary if typings lag.                                |
| Normal derivation mismatch causing inverted highlights       | Medium     | High   | Derive analytic normal from the same Gerstner function; unit-test numerically by sampling a tiny mesh if lighting looks wrong.                    |
| Normal map textures unavailable (no network)                 | Low        | Medium | Bundle two known-tileable maps. If fetch fails, fall back to pure analytic normals (visible but acceptable).                                      |
| WebGPU unavailable on the user's browser                     | Medium     | Low    | Capability check in `src/lib/webgpuSupport.ts` that shows a clear message before mounting the Canvas.                                             |
| CPU Gerstner evaluation for floaters drifts vs GPU waves     | Medium     | Medium | Share a single `gerstnerWaves` constant array in `src/shader/gerstner.ts` imported by both TSL builder and CPU sampler.                           |
| `pnpm` vs `npm` choice (tech-stack says pnpm, task uses npm) | Low        | Low    | Use `npm` for the new app scaffold; `.opencode/` tooling uses pnpm independently. Document in README snippet inside `src/App.tsx` header comment. |

---

## Open Questions

| Question                                      | Owner | Due Date | Status   |
| --------------------------------------------- | ----- | -------- | -------- |
| None — research closed, scope locked by user. | —     | —        | Resolved |

---

## Tasks

### Scaffold Vite+React+TS project [scaffold]

Repo contains a working Vite + React + TypeScript app with `npm run dev` and `npm run build` scripts; no water/3D code yet.

**Metadata:**

```yaml
depends_on: []
parallel: false
conflicts_with: []
files:
  - package.json
  - vite.config.ts
  - tsconfig.json
  - tsconfig.node.json
  - index.html
  - src/main.tsx
  - src/App.tsx
```

**Verification:**

- `npm install` completes without errors.
- `npm run build` exits 0 and produces `dist/`.
- `npm run dev` starts and prints `Local: http://localhost:5173`.
- `npx tsc --noEmit` (or `npm run typecheck`) prints no errors.

---

### Install R3F + three + WebGPU deps [scaffold]

`package.json` has `three`, `@react-three/fiber` (v9+), `@react-three/drei`, `@types/three` installed at versions that export `three/webgpu` and `three/tsl`.

**Metadata:**

```yaml
depends_on: ["Scaffold Vite+React+TS project"]
parallel: false
files:
  - package.json
```

**Verification:**

- `node -e "require.resolve('three/webgpu'); require.resolve('three/tsl'); console.log('ok')"` prints `ok`.
- `node -e "require.resolve('@react-three/fiber')"` exits 0.

---

### WebGPU capability check helper [infra]

`src/lib/webgpuSupport.ts` exports a boolean (or async check) function that returns whether `navigator.gpu` exists and can request an adapter. `src/App.tsx` renders a fallback `<div>` with a clear message when unsupported.

**Metadata:**

```yaml
depends_on: ["Install R3F + three + WebGPU deps"]
parallel: true
files:
  - src/lib/webgpuSupport.ts
  - src/App.tsx
```

**Verification:**

- Loading app in a WebGPU browser renders the Canvas (manual).
- Loading app in a browser without `navigator.gpu` shows the fallback text (manual; can be simulated by temporarily forcing the check to return false).
- `npx tsc --noEmit` is clean.

---

### Canvas with WebGPURenderer async init [infra]

`src/App.tsx` mounts an R3F `<Canvas>` whose `gl` prop is an async factory returning an initialized `WebGPURenderer`. Scene includes lights, `Environment` (drei), `OrbitControls`, and placeholders for Ocean + FloatingObjects.

**Metadata:**

```yaml
depends_on: ["WebGPU capability check helper"]
parallel: false
files:
  - src/App.tsx
```

**Verification:**

- `npm run dev` starts; page loads in Chrome 113+ without console errors.
- Canvas occupies full window; OrbitControls respond to drag/scroll.
- `npx tsc --noEmit` is clean.

---

### Gerstner wave module (shared CPU+GPU) [shader]

`src/shader/gerstner.ts` exports a `WAVES` constant array (`{direction: [x,z], wavelength, steepness, speed}[]`), a TSL `Fn` builder that returns `{position: vec3, normal: vec3}` given `positionLocal` and `time`, and a CPU function `sampleGerstner(x, z, t): {y, tangent, bitangent}` that mirrors the GPU computation exactly.

**Metadata:**

```yaml
depends_on: ["Canvas with WebGPURenderer async init"]
parallel: true
files:
  - src/shader/gerstner.ts
```

**Verification:**

- Unit sanity check: `sampleGerstner(0,0,0).y` is a finite number.
- Re-evaluating at the same (x,z,t) returns identical output (determinism).
- `npx tsc --noEmit` is clean.

---

### TSL water material builder [shader]

`src/shader/waterMaterial.ts` exports a factory that returns a `MeshStandardNodeMaterial` configured with: `positionNode` = Gerstner displacement; `normalNode` = RNB-blended dual scrolling normal maps combined with analytic Gerstner normal; `colorNode` = Fresnel mix of deep-water color and environment reflection; metalness/roughness tuned for water.

**Metadata:**

```yaml
depends_on: ["Gerstner wave module (shared CPU+GPU)"]
parallel: false
files:
  - src/shader/waterMaterial.ts
  - public/normals/waterNormal1.jpg
  - public/normals/waterNormal2.jpg
```

**Verification:**

- In dev server, ocean surface visibly animates with non-sinusoidal crests.
- Specular highlights track the waves (no inverted highlights).
- Fine chop visible at grazing angle.
- `npx tsc --noEmit` is clean.

---

### Ocean component [scene]

`src/scene/Ocean.tsx` renders a `PlaneGeometry` (e.g. 100×100 world units, 256×256 segments) rotated so it lies in the XZ plane, using the material from `waterMaterial.ts`. Material receives `time` via a `useFrame` uniform update.

**Metadata:**

```yaml
depends_on: ["TSL water material builder"]
parallel: false
files:
  - src/scene/Ocean.tsx
  - src/App.tsx
```

**Verification:**

- Ocean visible when app runs; fills the viewport horizon.
- Waves animate over time (not static).
- Camera orbit reveals waves from all angles without z-fighting or holes.

---

### FloatingObjects component [scene]

`src/scene/FloatingObjects.tsx` places 3–5 objects (e.g., a small boat = Box, a buoy = Sphere/Cylinder, a duck = drei `useGLTF` if a free asset is trivially available; otherwise simple meshes with colors). Each frame, it calls `sampleGerstner(x, z, t)` to set `object.position.y` and `object.rotation` (pitch/roll from tangent/bitangent). Uses `useFrame` and refs.

**Metadata:**

```yaml
depends_on: ["Gerstner wave module (shared CPU+GPU)", "Ocean component"]
parallel: false
files:
  - src/scene/FloatingObjects.tsx
  - src/App.tsx
```

**Verification:**

- All floaters visibly bob with the waves; their Y closely matches the ocean surface at their (x,z).
- Floaters tilt along wave slope — not just translate.
- No floater penetrates the ocean surface at rest (visually flush).

---

### Verification pass & polish [qa]

All gates green; visible demo is convincing; no console errors or warnings (besides known R3F/three dev noise).

**Metadata:**

```yaml
depends_on: ["FloatingObjects component"]
parallel: false
files: []
```

**Verification:**

- `npm run build` exits 0.
- `npx tsc --noEmit` is clean.
- `npm run dev` → manual visual QA in Chrome 113+: waves, reflections, floaters bobbing, OrbitControls, no water-pointer interaction, fallback message when `navigator.gpu` is temporarily stubbed to undefined.

---

## Dependency Legend

| Field            | Purpose                                           | Example                                    |
| ---------------- | ------------------------------------------------- | ------------------------------------------ |
| `depends_on`     | Must complete before this task starts             | `["Setup database", "Create schema"]`      |
| `parallel`       | Can run concurrently with other parallel tasks    | `true` / `false`                           |
| `conflicts_with` | Cannot run in parallel (same files)               | `["Update config"]`                        |
| `files`          | Files this task modifies (for conflict detection) | `["src/db/schema.ts", "src/db/client.ts"]` |

---

## Notes

- User requirement (verbatim, VN): "ko cần tương tác, chỉ cần làm water shader, gợn sóng biển như thực tế và có thả nổi vài object lên đó." → No pointer interaction; realistic ocean ripples; a few floating objects.
- Research done (compressed earlier): four approaches surveyed; chose Gerstner + dual normal maps + Fresnel + reflector-optional. Compute ping-pong sim explicitly deferred.
- Repo is not a git repo yet. `/create` normally expects git; workspace-setup is skipped (see Phase 9 report). We will initialize git as part of the scaffold task if the user later requests branch-based workflow.
- PowerShell tip: command chaining uses `;` not `&&`.
