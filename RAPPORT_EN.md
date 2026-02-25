# Project Report — Bunny Plush Designer

## 3D Parametric Bunny Plush Sewing Pattern Generator

**Authors:**
- Hocine BOUROUIH
- Mohamed AIDAOUI
- Rayan BELDI

**Date:** March 2026

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Project Objective](#2-project-objective)
3. [Technology Choices and Justifications](#3-technology-choices-and-justifications)
4. [Project Architecture](#4-project-architecture)
5. [Chosen Solution: Parametric Pattern Drafting](#5-chosen-solution-parametric-pattern-drafting)
6. [Algorithm Explanation](#6-algorithm-explanation)
7. [Implemented Features](#7-implemented-features)
8. [Exports and Sewing](#8-exports-and-sewing)
9. [Architecture Diagram](#9-architecture-diagram)
10. [Conclusion](#10-conclusion)

---

## 1. Introduction

This project is a web application that allows you to design a 3D bunny plush, customize its dimensions and appearance in real time, then export print-ready sewing patterns in SVG and PDF format. Everything runs entirely in the browser, with no server, no database, and no build step (*zero build step*).

---

## 2. Project Objective

Create a **3D parametric design tool** allowing a user to:

1. Visualize a plush bunny in real time in an interactive 3D viewport.
2. Modify dimensions (body size, ear length, tail size, chubbiness) and style (color, ear style, accessory) via a control panel.
3. Automatically export the **2D sewing patterns** corresponding to the chosen dimensions, with all professional sewing annotations (matching notches, fur direction, seam allowances, openings, assembly guide).

---

## 3. Technology Choices and Justifications

| Technology | Role | Justification |
|------------|------|---------------|
| **Native HTML/CSS/JS** | Structure, style, logic | No framework dependency (React, Vue…) → lightweight, portable project, no build |
| **Three.js v0.160.1** | WebGL 3D rendering | Reference library for 3D rendering in the browser. Loaded via CDN + ES modules `importmap` |
| **jsPDF 2.5.1** | Client-side PDF generation | Enables generating multi-page tiled PDFs directly in the browser, without a server |
| **ES Modules** | Modular architecture | Native browser `import/export` — no bundler needed (Webpack, Vite…) |
| **CSS custom properties** | Consistent dark theme | Centralized CSS variables in `:root` to maintain visual consistency |
| **Google Fonts (Inter)** | Typography | Modern and readable font for the user interface |

### Why Not Blender?

We chose to **develop our own pattern generator (in-house)**, using the **parametric pattern drafting** technique: pieces are algorithmically calculated in JavaScript from user-entered parameters (body size, ear length, chubbiness, tail size), **without going through Blender**.

Reasons for this choice:
- **Real time**: patterns recalculate instantly with each slider modification — impossible with a Blender export/import workflow.
- **Portability**: the application runs in any browser, without installing Blender or any third-party software.
- **Full control**: we control the output format (vector SVG, tiled A4 PDF), sewing annotations, matching notches — elements that are difficult to automatically extract from a 3D mesh.
- **Lightweight**: no bulky `.blend` files, no conversion pipeline → the entire project fits in ~1,400 lines of code.

---

## 4. Project Architecture

### File Structure

```
parametric-garments/
├── index.html              ← HTML entry point
├── style.css               ← Dark theme, flexbox layout, controls
├── README.md               ← User documentation
├── RAPPORT.md              ← This report
└── js/
    ├── parameters.js       ← Parameter definitions + EventTarget store
    ├── preview3d.js        ← Three.js scene + 3D bunny construction
    ├── patternGenerator.js ← Parametric pattern drafting algorithm
    ├── exporter.js         ← SVG + PDF export with sewing annotations
    └── main.js             ← JS entry point: UI ↔ 3D ↔ export wiring
```

### Role of Each File

| File | Lines | Role |
|------|-------|------|
| `parameters.js` | ~120 | **Single source of truth.** Defines the 7 parameters (bodySize, earLength, tailSize, chubbiness, earStyle, color, accessory), their min/max bounds, their default values. Provides a `ParameterStore` based on `EventTarget` to notify consumers of changes (3D preview, pattern generator). Exports the `BUNNY_COLORS` palette (6 hex colors). |
| `preview3d.js` | ~523 | **3D engine.** Initializes the WebGL scene (renderer, camera, 3-point lights, floor, grid). Generates procedural plush textures via canvas (soft noise mimicking fur). Builds the bunny from simple primitives (SphereGeometry, CylinderGeometry, TorusGeometry): body, belly, head, cheeks, muzzle, nose, eyes (with highlight), ears (3 styles), arms (with paw pads), legs (with soles), pompom tail, whiskers (6 strands). Manages the 3 accessories (bow tie, scarf, ribbon). |
| `patternGenerator.js` | ~325 | **Algorithmic core.** Calculates the 6 types of 2D pattern pieces (body, head, ear, arm, leg, tail) based on parameters. Each piece contains: cutting outline, outline with seam allowance (1.5 cm), grain line, fur direction arrow, lettered matching notches (A–E), openings, assembly note. Exports the 12 assembly steps in French. |
| `exporter.js` | ~485 | **SVG + PDF export.** Converts pieces to vector SVG (at 1:1 scale, 96 dpi) with legend, title, 10 cm scale bar, lettered notches, fur direction arrows, opening marks. Generates a tiled landscape A4 PDF with 8 mm overlap, corner alignment marks, and a final portrait page with assembly guide (cutting list, 12 steps, symbol legend, sewing tips). |
| `main.js` | ~168 | **Orchestrator.** Dynamically generates UI controls (sliders, selects) from `PARAM_DEFS`. Wires store `change` events to debounced 3D updates (30 ms). Manages SVG/PDF export buttons. Observes viewport resize via `ResizeObserver`. |
| `index.html` | ~98 | **HTML skeleton.** 2-column layout (320 px panel + 3D viewport). Loads Three.js via `importmap`, jsPDF via CDN UMD. |
| `style.css` | ~381 | **Visual theme.** Dark design, 28 CSS variables, flexbox layout, custom styled sliders, buttons with icons, viewport with overlay ("3D Preview" badge, "Drag to orbit" hint). |

---

## 5. Chosen Solution: Parametric Pattern Drafting

### What is Parametric Pattern Drafting?

**Parametric pattern drafting** is a technique where sewing pattern pieces are not drawn by hand, but **calculated mathematically** from numerical parameters (dimensions, proportions). This is the method used by the modern textile industry for automatic size grading.

### Our Approach

In our project, we apply this technique to the plush toy domain: each piece of the bunny (body, head, ear, arm, leg, tail) is defined as a **parameterized geometric shape** whose dimensions depend directly on user parameters.

**Input Parameters → Parameterized Geometric Shapes:**

| Parameter | Effect on Pattern |
|-----------|------------------|
| `bodySize` (8–30 cm) | Controls the global scale factor `S = bodySize / 16` which multiplies all dimensions |
| `chubbiness` (50–150 %) | Multiplies the **width** of pieces (body, arms, legs) without affecting height → thinner or chubbier bunny |
| `earLength` (4–18 cm) | Directly defines the height of the ear piece |
| `tailSize` (1–6 cm) | Defines the radius of the tail piece |

**The Complete Pipeline:**

```
User parameters (sliders)
        │
        ▼
  ParameterStore (EventTarget)
        │
        ├──────────────────────────────────┐
        ▼                                  ▼
  3D Preview (Three.js)          Pattern Generator (2D)
  ↳ _buildBunny(params)          ↳ generatePattern(params)
  ↳ 3D primitives (spheres,     ↳ 2D shapes (ellipses,
    cylinders, torus)               rounded rectangles)
  ↳ Real-time WebGL rendering   ↳ Pieces with margins,
                                    notches, annotations
        │                                  │
        ▼                                  ▼
  Interactive 3D canvas           SVG / PDF Exporter
  (orbit, zoom, pan)              (download)
```

---

## 6. Algorithm Explanation

### 6.1 Piece Outline Generation

Each piece is calculated by a dedicated function in `patternGenerator.js`. The algorithm follows these steps:

#### Step 1: Scale Factor Calculation

```javascript
const S    = p.bodySize / 16;   // scale factor (1.0 for bodySize=16)
const chub = p.chubbiness / 100; // chubbiness factor (1.0 for 100%)
```

The default value for `bodySize` is 16 cm, so `S = 1.0` is the reference size. All dimensions are multiplied by `S`.

#### Step 2: Outline Generation (Ellipse or Rounded Rectangle)

For pieces with elliptical outlines (body, head, arm, leg, tail), we sample a parameterized ellipse:

```javascript
function ellipsePoints(rx, ry, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    pts.push([rx * Math.cos(angle), ry * Math.sin(angle)]);
  }
  return pts;
}
```

- `rx`, `ry` = ellipse semi-radii (depend on `S` and `chub`)
- `n` = number of sample points (16–24 for a smooth curve)

For ears (elongated shape), we use a rounded rectangle (`roundedRect`) that generates 4 corners with parameterized radius.

#### Step 3: Polygon Offset (Seam Allowance)

The seam allowance (1.5 cm) is calculated by **edge normal bisector offset**:

```javascript
function expandOutline(pts, amount) {
  // 1. Determine winding direction (signed area)
  // 2. For each vertex:
  //    a. Calculate the incoming edge normal (prev → pt)
  //    b. Calculate the outgoing edge normal (pt → next)
  //    c. Bisector = average of the two normals
  //    d. Miter length = amount / cos(half-angle), clamped to 3×
  //    e. New point = pt + bisector × miter length
}
```

This algorithm is a simplified implementation of the **Minkowski offset** for convex polygons. Clamping to 3× prevents extreme spikes at sharp angles.

#### Step 4: Metadata Enrichment

Each piece is returned with its professional annotations:

```javascript
return {
  id: 'body',
  label: 'Body (×2)',            // name + number of cuts
  number: '1/6',                 // piece number
  outline,                       // cutting outline (polygon)
  withSeamAllowance,             // outline + 1.5 cm margin
  grainLine: [[x1,y1],[x2,y2]], // grain line arrow
  furDirection: [[...],[...]],   // fur direction arrow
  notches: [                     // matching notches
    { pos: [x,y], letter: 'A', label: 'Neck → Head' },
    ...
  ],
  openings: [                    // areas to leave open
    { from: [x,y], to: [x,y], label: 'Open for stuffing' },
  ],
  assemblyNote: '...',           // assembly note
};
```

### 6.2 3D Bunny Rendering

The 3D bunny is built in `preview3d.js` by the `_buildBunny(p)` method which assembles **simple Three.js primitives**:

| Part | Geometry | Note |
|------|----------|------|
| Body | `SphereGeometry` (flattened Y×1.1, X×chub) | Vertical oval |
| Belly | `SphereGeometry` (slightly smaller) | Accent color |
| Head | `SphereGeometry` | Positioned at the top of the body |
| Cheeks | 2 × `SphereGeometry` | Protrude on the sides |
| Eyes | 2 × `SphereGeometry` + white highlight | Black + bright dot |
| Nose | `SphereGeometry` (pink) | Inverted triangle |
| Muzzle | `SphereGeometry` (Z-flattened) | White nose area |
| Ears | 2 × `CylinderGeometry` + inner accent | 3 pose styles |
| Arms | 2 × `SphereGeometry` (flattened) + paw pads | Sides of body |
| Legs | 2 × `SphereGeometry` (flattened) + soles | Bottom of body |
| Tail | `SphereGeometry` | Rear pompom |
| Whiskers | 6 × thin `CylinderGeometry` | 3 per side |

**Procedural textures:** fur textures are generated by HTML5 canvas (6,000 random points + directional lines → fluffy appearance), then applied as `CanvasTexture` with bump mapping (`bumpScale: 0.015`) and high roughness (`roughness: 0.95`).

**Lighting:** 3-point system (key light with shadows, bluish fill light, rear rim light) + hemisphere + ambient.

### 6.3 SVG and PDF Export

#### SVG

The SVG is generated line by line in `buildSVGString()`:

1. **Coordinate conversion**: pattern (cm, Y-up) → SVG (px, Y-down) via `CM_TO_PX = 37.795` (96 dpi) and Y inversion.
2. **Layout**: pieces side by side with 4 cm spacing.
3. **Rendered annotations**: dashed outline (margin), solid outline (cut), grain/fur direction arrows (SVG markers), red lettered circles (notches), orange lines (openings), framed legend.

#### PDF

The PDF is generated by jsPDF with A4 tiling:

1. **Tiling**: if a piece exceeds the printable area (273 × 186 mm), it is cut into tiles with 8 mm overlap.
2. **Registration marks**: cross + circle at all 4 corners of each page to align sheets.
3. **Instructions page**: last page in portrait A4 containing the cutting list (20 pieces), the 12 assembly steps, the symbol legend, and 8 sewing tips.

---

## 7. Implemented Features

### 7.1 Real-Time 3D Preview

- WebGL rendering with Three.js (ACES filmic tone mapping, PCFSoftShadowMap)
- Orbital controls (rotation, zoom, pan) via `OrbitControls`
- Debounced update at 30 ms (fluidity guaranteed when moving sliders)
- Procedural textures mimicking plush fur

### 7.2 Parametric Customization

| Category | Parameters |
|----------|------------|
| **Dimensions** | Body size (8–30 cm), Ear length (4–18 cm), Tail size (1–6 cm), Chubbiness (50–150 %) |
| **Style** | Ear style (straight / floppy / lop), Color (6 choices), Accessory (bow tie / scarf / ribbon) |

### 7.3 Smart Sewing Pattern

- 6 piece types → 20 pieces to cut
- 1.5 cm seam allowance calculated by polygon offset
- **Lettered matching notches** (A↔A for neck, B↔B for arms, C↔C for legs, D↔D for tail, E↔E for ears)
- **Fur direction** (green arrow)
- **Openings** (orange dashes)
- **Grain line** (gray dashed arrow)
- Piece numbering (1/6 to 6/6)

### 7.4 Print-Ready Exports

- **Vector SVG** at 1:1 scale with full legend
- **Tiled A4 PDF** with alignment marks, 8 mm overlap
- **Assembly guide page** included in the PDF (12 steps + tips)

---

## 8. Exports and Sewing

### Which Format to Use?

| Format | Use Case | Advantage |
|--------|----------|-----------|
| **PDF** | Home printing (A4) | Automatically tiled, alignment marks, assembly guide included |
| **SVG** | Plotter / laser cutter or Cricut | Single sheet at scale, pure vector, editable in Inkscape |

### Sewing Annotations

| Symbol | Description |
|--------|-------------|
| Solid black line | Cutting line |
| Gray dashes | Seam allowance (1.5 cm) |
| Gray arrow (dashed) | Grain line (fabric warp direction) |
| Solid green arrow | Fur direction |
| Red circle + letter | Matching notch (A↔A, B↔B...) |
| Orange dashes | Area to leave open (stuffing / turning) |

### Cutting List

| No. | Piece | Quantity |
|-----|-------|----------|
| 1/6 | Body | ×2 (front + back) |
| 2/6 | Head | ×2 (front + back) |
| 3/6 | Ear | ×4 (2 outer + 2 inner accent) |
| 4/6 | Arm | ×4 (2 pairs L/R) |
| 5/6 | Leg | ×4 (2 pairs L/R) |
| 6/6 | Tail | ×2 |
| **Total** | | **20 pieces** |

---

## 9. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        index.html                           │
│  ┌──────────────┐    ┌────────────────────────────────────┐ │
│  │   UI Panel    │    │       3D Viewport (canvas)        │ │
│  │  (sliders,    │    │                                    │ │
│  │   selects)    │    │    Three.js WebGL                  │ │
│  │              │    │    OrbitControls                   │ │
│  └──────┬───────┘    └───────────────▲────────────────────┘ │
│         │                            │                      │
└─────────┼────────────────────────────┼──────────────────────┘
          │                            │
          ▼                            │
┌─────────────────────┐       ┌────────┴─────────────┐
│   parameters.js     │       │    preview3d.js       │
│                     │       │                       │
│  PARAM_DEFS[]       │──────▶│  Preview3D class      │
│  BUNNY_COLORS{}     │       │  _buildBunny(params)  │
│  ParameterStore     │       │  _buildBowtie()       │
│  (EventTarget)      │       │  _buildScarf()        │
│                     │       │  _buildRibbon()       │
│  .set() → 'change'  │       │  _makePlushMat()      │
└────────┬────────────┘       └───────────────────────┘
         │
         │  params.getAll()
         │
         ▼
┌─────────────────────┐       ┌───────────────────────┐
│ patternGenerator.js │──────▶│     exporter.js       │
│                     │       │                       │
│ generatePattern(p)  │       │ exportSVG(p)          │
│ buildBodyPiece()    │       │ exportPDF(p)          │
│ buildHeadPiece()    │       │ buildSVGString()      │
│ buildEarPiece()     │       │ Assembly guide        │
│ buildArmPiece()     │       │ Legend / tips         │
│ buildLegPiece()     │       │                       │
│ buildTailPiece()    │       │ ↓ Download            │
│ expandOutline()     │       │ bunny-plush-pattern   │
│ ellipsePoints()     │       │ .svg / .pdf           │
│ roundedRect()       │       └───────────────────────┘
│ ASSEMBLY_STEPS[]    │
└─────────────────────┘
```

### Data Flow

```
User moves a slider
       │
       ▼
main.js : slider.addEventListener('input')
       │
       ▼
params.set('bodySize', 22)
       │
       ▼
ParameterStore.dispatchEvent('change')
       │
       ├──────────────────────────┐
       ▼                          ▼
debouncedUpdate (30ms)      updatePatternInfo()
       │                    ↳ displays text info
       ▼
preview.update(params.getAll())
       │
       ▼
_buildBunny({bodySize:22, ...})
       │
       ▼
New 3D mesh displayed on canvas
```

```
User clicks "Export PDF"
       │
       ▼
exporter.exportPDF(params.getAll())
       │
       ▼
patternGenerator.generatePattern(params)
       │
       ├── buildBodyPiece(S, chub, 6)    → outline + metadata
       ├── buildHeadPiece(S, chub, 6)    → outline + metadata
       ├── buildEarPiece(S, earLen, 6)   → outline + metadata
       ├── buildArmPiece(S, chub, 6)     → outline + metadata
       ├── buildLegPiece(S, chub, 6)     → outline + metadata
       └── buildTailPiece(S, tailSz, 6)  → outline + metadata
       │
       ▼
jsPDF : tiled A4 landscape pages
       + alignment marks
       + sewing annotations
       + assembly guide page (portrait)
       │
       ▼
Download: bunny-plush-pattern.pdf
```

---

## 10. Conclusion

This project demonstrates that it is possible to create a **complete parametric design tool** — from real-time 3D visualization to printable sewing patterns — using only standard web technologies (HTML, CSS, JavaScript, WebGL via Three.js), without resorting to heavy tools like Blender and without a backend server.

The choice of **algorithmic parametric pattern drafting** (in-house, without Blender) proved particularly well-suited because it enables:
- **Instant responsiveness**: patterns recalculate with each slider movement.
- **Annotation precision** (notches, fur direction, openings) impossible to obtain by simple UV unwrapping of a 3D mesh.
- **Full portability**: the application works offline in any modern browser.
