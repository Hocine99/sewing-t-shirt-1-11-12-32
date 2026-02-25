/**
 * exporter.js
 * SVG and PDF export for bunny plush sewing pattern.
 * Enhanced: match letters, fur direction, opening marks,
 * piece numbering, legend, assembly instructions page.
 */

import { generatePattern, pieceBounds, SEAM, ASSEMBLY_STEPS } from './patternGenerator.js';

const CM_TO_PX = 37.795275591; // 1 cm = 37.795 px at 96 dpi
const CANVAS_PAD = 2;   // cm
const PIECE_GAP  = 4;   // cm

// ─── SVG Export ──────────────────────────────────────────────────────────────

export function exportSVG(p) {
  const pieces = generatePattern(p);
  const svg = buildSVGString(pieces);
  downloadBlob(svg, 'bunny-plush-pattern.svg', 'image/svg+xml');
}

function buildSVGString(pieces) {
  const bounds = pieces.map(pieceBounds);
  const totalW = bounds.reduce((s, b) => s + b.width, 0)
                 + PIECE_GAP * (pieces.length - 1)
                 + CANVAS_PAD * 2;
  const totalH = Math.max(...bounds.map(b => b.height)) + CANVAS_PAD * 2 + 6;

  const W = (totalW * CM_TO_PX).toFixed(2);
  const H = (totalH * CM_TO_PX).toFixed(2);

  const lines = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}px" height="${H}px" viewBox="0 0 ${W} ${H}">`);

  // Marker defs
  lines.push(`<defs>`);
  lines.push(`  <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#888"/></marker>`);
  lines.push(`  <marker id="arr-r" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto-start-reverse"><path d="M0,0 L0,6 L6,3 z" fill="#888"/></marker>`);
  lines.push(`  <marker id="fur" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><path d="M0,0 L0,8 L10,4 z" fill="#2d8a4e"/></marker>`);
  lines.push(`</defs>`);

  lines.push(`<rect width="100%" height="100%" fill="#ffffff"/>`);

  // Title
  lines.push(`<text x="${f(totalW * CM_TO_PX / 2)}" y="22" text-anchor="middle" font-family="system-ui,sans-serif" font-size="16" font-weight="700" fill="#222">Patron Peluche Lapin \u2014 Marge de couture : ${SEAM} cm</text>`);

  // 10 cm scale bar
  const barXpx = CANVAS_PAD * CM_TO_PX;
  const barYpx = (totalH - CANVAS_PAD * 0.5) * CM_TO_PX;
  const barLen = 10 * CM_TO_PX;
  lines.push(`<g id="scale-ref" font-family="system-ui,sans-serif">`);
  lines.push(`  <line x1="${f(barXpx)}" y1="${f(barYpx)}" x2="${f(barXpx + barLen)}" y2="${f(barYpx)}" stroke="#000" stroke-width="1.5"/>`);
  lines.push(`  <line x1="${f(barXpx)}" y1="${f(barYpx - 5)}" x2="${f(barXpx)}" y2="${f(barYpx + 5)}" stroke="#000" stroke-width="1.5"/>`);
  lines.push(`  <line x1="${f(barXpx + barLen)}" y1="${f(barYpx - 5)}" x2="${f(barXpx + barLen)}" y2="${f(barYpx + 5)}" stroke="#000" stroke-width="1.5"/>`);
  lines.push(`  <text x="${f(barXpx + barLen / 2)}" y="${f(barYpx - 9)}" text-anchor="middle" font-size="11" fill="#000">10 cm (v\u00e9rifier \u00e0 la r\u00e8gle)</text>`);
  lines.push(`</g>`);

  // Place each piece
  let xCursor = CANVAS_PAD;

  pieces.forEach((piece, idx) => {
    const b = bounds[idx];
    const gx = xCursor * CM_TO_PX;
    const gy = (CANVAS_PAD + 1) * CM_TO_PX; // +1 for title

    lines.push(`<g id="${piece.id}" transform="translate(${f(gx)},${f(gy)})">`);

    const px = (x) => f((x - b.x) * CM_TO_PX);
    const py = (y) => f((b.y + b.height - y) * CM_TO_PX);

    // Seam allowance outline (dashed grey)
    lines.push(`  <path d="${ptsToPath(piece.withSeamAllowance, b)}" fill="none" stroke="#bbb" stroke-width="0.7" stroke-dasharray="5 3"/>`);

    // Main cutting outline (solid)
    lines.push(`  <path d="${ptsToPath(piece.outline, b)}" fill="#eef3ff" stroke="#222" stroke-width="1.5"/>`);

    // Grain line (dashed grey with arrows + DROIT FIL label)
    if (piece.grainLine) {
      const [g1, g2] = piece.grainLine;
      lines.push(`  <line x1="${px(g1[0])}" y1="${py(g1[1])}" x2="${px(g2[0])}" y2="${py(g2[1])}" stroke="#888" stroke-width="0.8" marker-end="url(#arr)" marker-start="url(#arr-r)" stroke-dasharray="6 3"/>`);
      const gmx = ((Number(px(g1[0])) + Number(px(g2[0]))) / 2) - 12;
      const gmy = (Number(py(g1[1])) + Number(py(g2[1]))) / 2;
      lines.push(`  <text x="${f(gmx)}" y="${f(gmy)}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="7" fill="#888" transform="rotate(-90 ${f(gmx)} ${f(gmy)})">DROIT FIL</text>`);
    }

    // Fur direction arrow (solid green)
    if (piece.furDirection) {
      const [fd1, fd2] = piece.furDirection;
      lines.push(`  <line x1="${px(fd1[0])}" y1="${py(fd1[1])}" x2="${px(fd2[0])}" y2="${py(fd2[1])}" stroke="#2d8a4e" stroke-width="1.8" marker-end="url(#fur)"/>`);
      const flx = Number(px(fd2[0])) + 10;
      const fly = Number(py(fd2[1])) + 4;
      lines.push(`  <text x="${f(flx)}" y="${f(fly)}" font-family="system-ui,sans-serif" font-size="7" fill="#2d8a4e" font-weight="600">\u2193 Sens du poil</text>`);
    }

    // Match letter notches (red circle with letter)
    (piece.notches || []).forEach(n => {
      const nx = Number(px(n.pos[0]));
      const ny = Number(py(n.pos[1]));
      lines.push(`  <circle cx="${f(nx)}" cy="${f(ny)}" r="8" fill="#fff" stroke="#cc0000" stroke-width="1.2"/>`);
      lines.push(`  <text x="${f(nx)}" y="${f(ny + 3.5)}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" font-weight="700" fill="#cc0000">${n.letter}</text>`);
    });

    // Opening marks (orange dashed line + label)
    (piece.openings || []).forEach(op => {
      const ox1 = px(op.from[0]), oy1 = py(op.from[1]);
      const ox2 = px(op.to[0]),   oy2 = py(op.to[1]);
      lines.push(`  <line x1="${ox1}" y1="${oy1}" x2="${ox2}" y2="${oy2}" stroke="#e67e22" stroke-width="2.5" stroke-dasharray="4 3"/>`);
      const omx = (Number(ox1) + Number(ox2)) / 2;
      const omy = Math.max(Number(oy1), Number(oy2)) + 14;
      lines.push(`  <text x="${f(omx)}" y="${f(omy)}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="7" fill="#e67e22" font-weight="600">${op.label}</text>`);
    });

    // Piece number (top-left corner)
    lines.push(`  <text x="6" y="18" font-family="system-ui,sans-serif" font-size="12" font-weight="700" fill="#444">${piece.number}</text>`);

    // Piece label (centred)
    const cx = f((b.width / 2) * CM_TO_PX);
    const cy = f((b.height / 2) * CM_TO_PX);
    lines.push(`  <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="600" fill="#222">${piece.label}</text>`);

    // Assembly note (italic, below label)
    if (piece.assemblyNote) {
      lines.push(`  <text x="${cx}" y="${f(Number(cy) + 18)}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="9" fill="#666" font-style="italic">${piece.assemblyNote}</text>`);
    }

    // Seam allowance info
    lines.push(`  <text x="${cx}" y="${f(Number(cy) + 32)}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="8" fill="#999">Marge : ${SEAM} cm</text>`);

    lines.push(`</g>`);
    xCursor += b.width + PIECE_GAP;
  });

  // Legend box (bottom-right)
  const legendX = (totalW - 16) * CM_TO_PX;
  const legendY = (totalH - 7) * CM_TO_PX;
  lines.push(`<g id="legend" transform="translate(${f(legendX)},${f(legendY)})" font-family="system-ui,sans-serif">`);
  lines.push(`  <rect width="550" height="190" rx="4" fill="#f8f8f8" stroke="#ccc" stroke-width="0.5"/>`);
  lines.push(`  <text x="10" y="18" font-size="10" font-weight="700" fill="#333">L\u00e9gende :</text>`);
  lines.push(`  <line x1="10" y1="34" x2="60" y2="34" stroke="#222" stroke-width="1.5"/>`);
  lines.push(`  <text x="70" y="38" font-size="8" fill="#444">Ligne de coupe</text>`);
  lines.push(`  <line x1="10" y1="52" x2="60" y2="52" stroke="#bbb" stroke-width="0.7" stroke-dasharray="5 3"/>`);
  lines.push(`  <text x="70" y="56" font-size="8" fill="#444">Marge de couture (${SEAM} cm)</text>`);
  lines.push(`  <line x1="10" y1="70" x2="60" y2="70" stroke="#888" stroke-width="0.8" stroke-dasharray="6 3" marker-end="url(#arr)"/>`);
  lines.push(`  <text x="70" y="74" font-size="8" fill="#444">Droit fil</text>`);
  lines.push(`  <line x1="10" y1="88" x2="60" y2="88" stroke="#2d8a4e" stroke-width="1.8" marker-end="url(#fur)"/>`);
  lines.push(`  <text x="70" y="92" font-size="8" fill="#444">Sens du poil (direction fourrure)</text>`);
  lines.push(`  <circle cx="25" cy="108" r="8" fill="#fff" stroke="#cc0000" stroke-width="1.2"/>`);
  lines.push(`  <text x="25" y="111.5" text-anchor="middle" font-size="10" font-weight="700" fill="#cc0000">A</text>`);
  lines.push(`  <text x="70" y="112" font-size="8" fill="#444">Rep\u00e8re de correspondance (A\u2194A, B\u2194B...)</text>`);
  lines.push(`  <line x1="10" y1="128" x2="60" y2="128" stroke="#e67e22" stroke-width="2.5" stroke-dasharray="4 3"/>`);
  lines.push(`  <text x="70" y="132" font-size="8" fill="#444">Laisser ouvert (ne pas coudre)</text>`);
  lines.push(`  <text x="10" y="155" font-size="9" font-weight="600" fill="#333">Total : 20 pi\u00e8ces \u00e0 d\u00e9couper</text>`);
  lines.push(`  <text x="10" y="168" font-size="8" fill="#666">Corps \u00d72 \u00b7 T\u00eate \u00d72 \u00b7 Oreille \u00d74 \u00b7 Bras \u00d74 \u00b7 Jambe \u00d74 \u00b7 Queue \u00d72</text>`);
  lines.push(`  <text x="10" y="182" font-size="8" fill="#666">Imprimer \u00e0 100% \u2014 v\u00e9rifier la barre 10 cm avec une r\u00e8gle</text>`);
  lines.push(`</g>`);

  lines.push(`</svg>`);
  return lines.join('\n');
}

// ─── PDF Export ──────────────────────────────────────────────────────────────

export async function exportPDF(p) {
  if (!window.jspdf) throw new Error('jsPDF not loaded');
  const { jsPDF } = window.jspdf;

  const pieces = generatePattern(p);

  // A4 landscape dimensions (mm)
  const PAGE_W_TOTAL = 297;
  const PAGE_H_TOTAL = 210;
  const MARGIN = 12;
  const USABLE_W = PAGE_W_TOTAL - MARGIN * 2;
  const USABLE_H = PAGE_H_TOTAL - MARGIN * 2;
  const OVERLAP  = 8;
  const CM_TO_MM = 10;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let firstPage = true;

  // ── Pattern piece pages ──
  pieces.forEach(piece => {
    const b = pieceBounds(piece);
    const pieceWmm = b.width  * CM_TO_MM;
    const pieceHmm = b.height * CM_TO_MM;

    const tilesX = Math.max(1, Math.ceil(pieceWmm / USABLE_W));
    const tilesY = Math.max(1, Math.ceil(pieceHmm / USABLE_H));

    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        if (!firstPage) doc.addPage('a4', 'landscape');
        firstPage = false;

        const vpX = tx * (USABLE_W - OVERLAP);
        const vpY = ty * (USABLE_H - OVERLAP);

        // Page border
        doc.setDrawColor(200);
        doc.setLineWidth(0.2);
        doc.rect(MARGIN, MARGIN, USABLE_W, USABLE_H);

        // Registration marks
        [[MARGIN, MARGIN], [MARGIN + USABLE_W, MARGIN],
         [MARGIN, MARGIN + USABLE_H], [MARGIN + USABLE_W, MARGIN + USABLE_H]]
          .forEach(([rx, ry]) => drawRegMark(doc, rx, ry));

        // Header with piece number
        doc.setFontSize(9);
        doc.setTextColor(80);
        doc.text(
          `${piece.number} ${piece.label}  \u2014  Page ${ty * tilesX + tx + 1}/${tilesX * tilesY}  (col ${tx+1}/${tilesX}, lig ${ty+1}/${tilesY})`,
          MARGIN + 2, MARGIN + 5
        );
        doc.text(`Marge de couture : ${SEAM} cm  |  Imprimer \u00e0 100 % \u2014 ne pas ajuster \u00e0 la page`, MARGIN + 2, MARGIN + 9);

        const toPageX = (x) => MARGIN + ((x - b.x) * CM_TO_MM - vpX);
        const toPageY = (y) => MARGIN + ((b.y + b.height - y) * CM_TO_MM - vpY);

        // Seam allowance outline (dashed)
        drawPolyPDF(doc, piece.withSeamAllowance, toPageX, toPageY, [170, 170, 170], 0.3, [3, 2]);

        // Main cutting outline (solid)
        drawPolyPDF(doc, piece.outline, toPageX, toPageY, [30, 30, 30], 0.5, null);

        // Grain line with arrows
        if (piece.grainLine) {
          const [g1, g2] = piece.grainLine;
          doc.setDrawColor(136);
          doc.setLineWidth(0.3);
          doc.setLineDashPattern([2, 1.5], 0);
          doc.line(toPageX(g1[0]), toPageY(g1[1]), toPageX(g2[0]), toPageY(g2[1]));
          doc.setLineDashPattern([], 0);
          drawArrowHead(doc, toPageX(g2[0]), toPageY(g2[1]), toPageX(g1[0]), toPageY(g1[1]), 136);
          drawArrowHead(doc, toPageX(g1[0]), toPageY(g1[1]), toPageX(g2[0]), toPageY(g2[1]), 136);
        }

        // Fur direction arrow (green)
        if (piece.furDirection) {
          const [fd1, fd2] = piece.furDirection;
          doc.setDrawColor(45, 138, 78);
          doc.setLineWidth(0.6);
          doc.setLineDashPattern([], 0);
          doc.line(toPageX(fd1[0]), toPageY(fd1[1]), toPageX(fd2[0]), toPageY(fd2[1]));
          drawArrowHead(doc, toPageX(fd1[0]), toPageY(fd1[1]), toPageX(fd2[0]), toPageY(fd2[1]), [45, 138, 78]);
          doc.setFontSize(6);
          doc.setTextColor(45, 138, 78);
          doc.text('Sens du poil', toPageX(fd2[0]) + 2, toPageY(fd2[1]) + 1);
        }

        // Match letter notches (circle + letter)
        (piece.notches || []).forEach(n => {
          const nx = toPageX(n.pos[0]);
          const ny = toPageY(n.pos[1]);
          doc.setDrawColor(204, 0, 0);
          doc.setFillColor(255, 255, 255);
          doc.setLineWidth(0.4);
          doc.setLineDashPattern([], 0);
          doc.circle(nx, ny, 2.5, 'FD');
          doc.setFontSize(8);
          doc.setTextColor(204, 0, 0);
          doc.text(n.letter, nx, ny + 1, { align: 'center' });
        });

        // Opening marks (orange dashed)
        (piece.openings || []).forEach(op => {
          const ox1 = toPageX(op.from[0]), oy1 = toPageY(op.from[1]);
          const ox2 = toPageX(op.to[0]),   oy2 = toPageY(op.to[1]);
          doc.setDrawColor(230, 126, 34);
          doc.setLineWidth(0.8);
          doc.setLineDashPattern([1.5, 1], 0);
          doc.line(ox1, oy1, ox2, oy2);
          doc.setLineDashPattern([], 0);
          doc.setFontSize(5);
          doc.setTextColor(230, 126, 34);
          doc.text(op.label, (ox1 + ox2) / 2, Math.max(oy1, oy2) + 3, { align: 'center' });
        });

        // 10 cm scale bar
        const barX = MARGIN + 5;
        const barY = MARGIN + USABLE_H - 8;
        doc.setDrawColor(0);
        doc.setLineWidth(0.4);
        doc.setLineDashPattern([], 0);
        doc.line(barX, barY, barX + 100, barY);
        doc.line(barX, barY - 2, barX, barY + 2);
        doc.line(barX + 100, barY - 2, barX + 100, barY + 2);
        doc.setFontSize(7);
        doc.setTextColor(0);
        doc.text('10 cm', barX + 50, barY - 3, { align: 'center' });
      }
    }
  });

  // ── Assembly Instructions Page ──
  doc.addPage('a4', 'portrait');
  const PW = 210, PH = 297;
  const M = 15;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(34, 34, 34);
  doc.text('Guide d\'assemblage \u2014 Peluche Lapin', PW / 2, M + 5, { align: 'center' });

  // Cutting summary
  let yPos = M + 18;
  doc.setFontSize(11);
  doc.setTextColor(34);
  doc.text('Liste de coupe (20 pi\u00e8ces) :', M, yPos);
  yPos += 7;
  doc.setFontSize(9);
  doc.setTextColor(60);
  const cutList = [
    '1/6  Corps \u00d72 (devant + dos)',
    '2/6  T\u00eate \u00d72 (devant + dos)',
    '3/6  Oreille \u00d74 (2 ext\u00e9rieur + 2 int\u00e9rieur accent)',
    '4/6  Bras \u00d74 (2 paires gauche/droite)',
    '5/6  Jambe \u00d74 (2 paires gauche/droite)',
    '6/6  Queue \u00d72',
  ];
  cutList.forEach(line => {
    doc.text('    ' + line, M, yPos);
    yPos += 5;
  });

  // Assembly steps
  yPos += 5;
  doc.setFontSize(12);
  doc.setTextColor(34);
  doc.text('\u00c9tapes d\'assemblage :', M, yPos);
  yPos += 8;

  ASSEMBLY_STEPS.forEach((step, i) => {
    const stepNum = `${i + 1}.`;
    const textLines = doc.splitTextToSize(step, PW - M * 2 - 12);

    doc.setFontSize(9);
    doc.setTextColor(204, 0, 0);
    doc.text(stepNum, M, yPos);

    doc.setTextColor(50);
    textLines.forEach((line, li) => {
      doc.text(line, M + 8, yPos + li * 4.5);
    });

    yPos += textLines.length * 4.5 + 3;

    // Page break if needed
    if (yPos > PH - M - 10 && i < ASSEMBLY_STEPS.length - 1) {
      doc.addPage('a4', 'portrait');
      yPos = M + 10;
    }
  });

  // Legend section
  yPos += 8;
  if (yPos > PH - M - 50) {
    doc.addPage('a4', 'portrait');
    yPos = M + 10;
  }
  doc.setFontSize(11);
  doc.setTextColor(34);
  doc.text('L\u00e9gende du patron :', M, yPos);
  yPos += 6;
  doc.setFontSize(8);
  doc.setTextColor(80);
  const legendItems = [
    '\u2014 Trait plein noir : ligne de coupe',
    '\u2014 Tirets gris : marge de couture (1.5 cm)',
    '\u2014 Fl\u00e8che grise (tirets) : droit fil',
    '\u2014 Fl\u00e8che verte : sens du poil (direction de la fourrure)',
    '\u2014 Cercle rouge + lettre : rep\u00e8re de correspondance (A\u2194A, B\u2194B...)',
    '\u2014 Tirets orange : laisser ouvert (ne pas coudre)',
  ];
  legendItems.forEach(item => {
    doc.text(item, M + 2, yPos);
    yPos += 5;
  });

  // Tips section
  yPos += 6;
  doc.setFontSize(11);
  doc.setTextColor(34);
  doc.text('Conseils de couture :', M, yPos);
  yPos += 6;
  doc.setFontSize(8);
  doc.setTextColor(80);
  const tips = [
    '\u2022 Utiliser du tissu minky, polaire ou peluche (poil court recommand\u00e9).',
    '\u2022 Couper le tissu envers vers le haut, poil vers la table.',
    '\u2022 Respecter le sens du poil (fl\u00e8che verte) pour un rendu uniforme.',
    '\u2022 Cranter les courbes avant de retourner (petites entailles dans la marge).',
    '\u2022 Utiliser de la ouate de polyester pour le rembourrage.',
    '\u2022 Poser les yeux de s\u00e9curit\u00e9 AVANT de fermer la t\u00eate.',
    '\u2022 Fermer les ouvertures au point d\'\u00e9chelle (ladder stitch) pour un r\u00e9sultat invisible.',
    '\u2022 Brosser les coutures pour lib\u00e9rer les poils coinc\u00e9s apr\u00e8s assemblage.',
  ];
  tips.forEach(tip => {
    doc.text(tip, M + 2, yPos);
    yPos += 5;
  });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text('Patron g\u00e9n\u00e9r\u00e9 par Bunny Plush Designer', PW / 2, PH - 8, { align: 'center' });

  doc.save('bunny-plush-pattern.pdf');
}

// ─── Drawing helpers ─────────────────────────────────────────────────────────

/**
 * Convert a list of pattern points to an SVG path string.
 * Handles Y-flip relative to bounding box.
 */
function ptsToPath(pts, b) {
  if (!pts || pts.length === 0) return '';
  const cmPx = CM_TO_PX;
  const parts = pts.map(([x, y], i) => {
    const sx = (x - b.x) * cmPx;
    const sy = (b.y + b.height - y) * cmPx;
    return `${i === 0 ? 'M' : 'L'}${sx.toFixed(2)},${sy.toFixed(2)}`;
  });
  return parts.join(' ') + ' Z';
}

/**
 * Draw a polygon on a jsPDF doc using mapped coordinates.
 */
function drawPolyPDF(doc, pts, toX, toY, rgb, lw, dash) {
  if (!pts || pts.length < 2) return;
  doc.setDrawColor(...rgb);
  doc.setLineWidth(lw);
  if (dash) doc.setLineDashPattern(dash, 0);
  else doc.setLineDashPattern([], 0);

  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    doc.line(toX(a[0]), toY(a[1]), toX(b[0]), toY(b[1]));
  }
}

function drawRegMark(doc, x, y) {
  const r = 3;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([], 0);
  doc.line(x - r, y, x + r, y);
  doc.line(x, y - r, x, y + r);
  doc.circle(x, y, 1.2, 'S');
}

/** Draw a small triangle arrowhead at the end of a line (from→to) */
function drawArrowHead(doc, fromX, fromY, toX, toY, color) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const len = 2.5;
  const spread = 0.45;
  const x1 = toX - len * Math.cos(angle - spread);
  const y1 = toY - len * Math.sin(angle - spread);
  const x2 = toX - len * Math.cos(angle + spread);
  const y2 = toY - len * Math.sin(angle + spread);
  if (Array.isArray(color)) doc.setFillColor(...color);
  else doc.setFillColor(color);
  doc.triangle(toX, toY, x1, y1, x2, y2, 'F');
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function f(n) { return Number(n).toFixed(2); }

function downloadBlob(text, filename, mime) {
  const blob = new Blob([text], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
