# Bunny Plush Designer

**Auteurs :**
- Hocine BOUROUIH
- Mohamed AIDAOUI
- Rayan BELDI

---

A browser-based 3D parametric plush bunny designer. Customize your bunny in real-time and export sewing patterns.

## Features

- **Live 3D Preview** — Three.js scene with orbit controls; rebuilds the bunny mesh instantly as you adjust parameters
- **Parameter Panel** — sliders for body size, ear length, tail size, chubbiness; dropdowns for ear style, color, and accessories
- **6 Colors** — White, Pink, Brown, Grey, Beige, Black
- **3 Ear Styles** — Straight, Floppy, Lop
- **3 Accessories** — Bowtie, Scarf, Ribbon
- **Pattern Generator** — computes flat 2D sewing pattern pieces (body, head, ears, arms, legs, tail) with 1.5 cm seam allowances
- **SVG Export** — true-scale vector SVG with grain lines, notches, and a 10 cm scale reference bar
- **PDF Export** — A4 landscape tiled PDF with registration marks and assembly information
- **100% Offline** — no server, no build step, no database

## Quick Start

```bash
# Using Node.js (npx)
npx serve parametric-garments

# Or Python
python -m http.server 8080 --directory parametric-garments
```

Then open `http://localhost:3000` (or the port shown).

## Usage

1. Use the **left panel** sliders to adjust dimensions (body size, ear length, tail, chubbiness)
2. Select **ear style**, **color**, and **accessory** from the dropdowns
3. The 3D bunny updates **instantly** on every change
4. Click **Export SVG** to download a vector sewing pattern
5. Click **Export PDF** to download an A4-tiled, print-ready PDF

## Parameters

| Parameter | Range | Default |
|-----------|-------|---------|
| Body Size | 8–30 cm | 16 cm |
| Ear Length | 4–18 cm | 10 cm |
| Tail Size | 1–6 cm | 3 cm |
| Chubbiness | 50–150 % | 100 % |
| Ear Style | straight / floppy / lop | straight |
| Color | white / pink / brown / grey / beige / black | white |
| Accessory | none / bowtie / scarf / ribbon | none |

## CDN Dependencies

- [Three.js r160](https://threejs.org/) — 3D graphics
- [jsPDF 2.5.1](https://artskydj.github.io/jsPDF/) — PDF generation
