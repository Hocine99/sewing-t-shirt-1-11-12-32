/**
 * patternGenerator.js
 * Computes flat 2D sewing pattern pieces for BUNNY PLUSH.
 * Enhanced: match letters, fur direction, opening marks,
 * assembly notes, piece numbering.
 *
 * All dimensions in centimetres. Seam allowance = 1.5 cm.
 */

export const SEAM = 1.5; // cm

/* ── Assembly instructions (French) ────────────────────────────────────────── */
export const ASSEMBLY_STEPS = [
  "Découper toutes les pièces dans le tissu peluche (20 morceaux au total). Respecter le sens du poil indiqué par la flèche verte.",
  "OREILLES : Coudre 1 pièce ext. + 1 pièce int. endroit contre endroit (repère E). Cranter les courbes, retourner, rembourrer légèrement. Répéter ×2.",
  "TÊTE : Coudre les 2 moitiés endroit/endroit, en insérant les oreilles aux repères E (base prise dans la couture). Laisser le cou (repère A) ouvert.",
  "CORPS : Coudre les 2 moitiés endroit/endroit. Laisser ouvert : le haut (cou, repère A) et la zone marquée en orange (rembourrage).",
  "BRAS : Coudre 2 pièces endroit/endroit par paire (repère B). Laisser l'ouverture orange. Cranter, retourner, rembourrer. Répéter ×2.",
  "JAMBES : Coudre 2 pièces endroit/endroit par paire (repère C). Laisser l'ouverture orange. Cranter, retourner, rembourrer. Répéter ×2.",
  "Assembler la tête au corps : coudre au cou en alignant les repères A↔A.",
  "Insérer et coudre les bras sur les côtés du corps (repères B↔B).",
  "Insérer et coudre les jambes au bas du corps (repères C↔C).",
  "QUEUE : Coudre les 2 moitiés endroit/endroit (repère D). Retourner, rembourrer. Coudre au dos du corps au repère D.",
  "Rembourrer le corps généreusement par l'ouverture restante (ouate polyester). Fermer au point d'échelle (ladder stitch).",
  "FINITIONS : Poser les yeux de sécurité (AVANT de fermer la tête !), broder le nez et les moustaches.",
];

/* ── Main entry ────────────────────────────────────────────────────────────── */

export function generatePattern(p) {
  const S    = p.bodySize / 16;
  const chub = p.chubbiness / 100;
  const T    = 6; // total distinct piece types

  const pieces = [];
  pieces.push(buildBodyPiece(S, chub, T));
  pieces.push(buildHeadPiece(S, chub, T));
  pieces.push(buildEarPiece(S, p.earLength, T));
  pieces.push(buildArmPiece(S, chub, T));
  pieces.push(buildLegPiece(S, chub, T));
  pieces.push(buildTailPiece(S, p.tailSize, T));

  return pieces;
}

// ─── Piece builders ───────────────────────────────────────────────────────────

/** Corps — ovale, ×2 (devant & dos) */
function buildBodyPiece(S, chub, T) {
  const w = 18 * S * chub;
  const h = 22 * S;
  const pts = ellipsePoints(w / 2, h / 2, 24);
  const minX = Math.min(...pts.map(p => p[0]));
  const minY = Math.min(...pts.map(p => p[1]));
  const outline = pts.map(([x, y]) => [x - minX, y - minY]);
  const withSA = expandOutline(outline, SEAM);

  return {
    id: 'body',
    label: 'Corps (×2)',
    number: `1/${T}`,
    outline,
    withSeamAllowance: withSA,
    grainLine: [[w / 2, SEAM + 1], [w / 2, h - SEAM - 1]],
    furDirection: [[w * 0.78, h * 0.72], [w * 0.78, h * 0.28]],
    notches: [
      { pos: [w / 2, h],           letter: 'A', label: 'Cou → Tête' },
      { pos: [w * 0.12, h * 0.7],  letter: 'B', label: 'Bras G' },
      { pos: [w * 0.88, h * 0.7],  letter: 'B', label: 'Bras D' },
      { pos: [w * 0.18, h * 0.18], letter: 'C', label: 'Jambe G' },
      { pos: [w * 0.82, h * 0.18], letter: 'C', label: 'Jambe D' },
      { pos: [w / 2, 0],           letter: 'D', label: 'Queue (dos)' },
    ],
    openings: [
      { from: [w * 0.3, 0], to: [w * 0.7, 0], label: 'Ouvert pour rembourrer' },
    ],
    assemblyNote: 'Endroit/endroit · laisser bas ouvert',
  };
}

/** Tête — cercle, ×2 */
function buildHeadPiece(S, chub, T) {
  const r = 15 * S * Math.pow(chub, 0.3);
  const pts = ellipsePoints(r / 2, r / 2, 24);
  const minX = Math.min(...pts.map(p => p[0]));
  const minY = Math.min(...pts.map(p => p[1]));
  const outline = pts.map(([x, y]) => [x - minX, y - minY]);
  const withSA = expandOutline(outline, SEAM);

  return {
    id: 'head',
    label: 'Tête (×2)',
    number: `2/${T}`,
    outline,
    withSeamAllowance: withSA,
    grainLine: [[r / 2, SEAM + 1], [r / 2, r - SEAM - 1]],
    furDirection: [[r * 0.78, r * 0.7], [r * 0.78, r * 0.3]],
    notches: [
      { pos: [r / 2, 0],    letter: 'A', label: 'Cou → Corps' },
      { pos: [r * 0.28, r], letter: 'E', label: 'Oreille G' },
      { pos: [r * 0.72, r], letter: 'E', label: 'Oreille D' },
    ],
    openings: [],
    assemblyNote: 'Insérer oreilles (E) · laisser cou (A) ouvert',
  };
}

/** Oreille — rect arrondi, ×4 (2 ext + 2 int accent) */
function buildEarPiece(S, earLength, T) {
  const w = 5 * S;
  const h = earLength;
  const rr = w * 0.45;
  const outline = roundedRect(w, h, rr);
  const withSA = expandOutline(outline, SEAM);

  return {
    id: 'ear',
    label: 'Oreille (×4)',
    number: `3/${T}`,
    outline,
    withSeamAllowance: withSA,
    grainLine: [[w / 2, SEAM + 0.5], [w / 2, h - SEAM - 0.5]],
    furDirection: [[w * 0.75, h * 0.35], [w * 0.75, h * 0.65]],
    notches: [
      { pos: [w / 2, 0], letter: 'E', label: 'Base → Tête' },
    ],
    openings: [
      { from: [w * 0.15, 0], to: [w * 0.85, 0], label: 'Base ouverte' },
    ],
    assemblyNote: '2 ext. + 2 int. (accent) · retourner',
  };
}

/** Bras — petit ovale, ×4 */
function buildArmPiece(S, chub, T) {
  const w = 7 * S * chub;
  const h = 11 * S;
  const pts = ellipsePoints(w / 2, h / 2, 20);
  const minX = Math.min(...pts.map(p => p[0]));
  const minY = Math.min(...pts.map(p => p[1]));
  const outline = pts.map(([x, y]) => [x - minX, y - minY]);
  const withSA = expandOutline(outline, SEAM);

  return {
    id: 'arm',
    label: 'Bras (×4)',
    number: `4/${T}`,
    outline,
    withSeamAllowance: withSA,
    grainLine: [[w / 2, SEAM + 0.5], [w / 2, h - SEAM - 0.5]],
    furDirection: [[w * 0.75, h * 0.68], [w * 0.75, h * 0.32]],
    notches: [
      { pos: [w / 2, h], letter: 'B', label: 'Épaule → Corps' },
    ],
    openings: [
      { from: [0, h * 0.35], to: [0, h * 0.65], label: 'Ouvert pour retourner' },
    ],
    assemblyNote: 'Paires endroit/endroit · retourner · rembourrer',
  };
}

/** Jambe — ovale trapu, ×4 */
function buildLegPiece(S, chub, T) {
  const w = 10 * S * chub;
  const h = 8 * S;
  const pts = ellipsePoints(w / 2, h / 2, 20);
  const minX = Math.min(...pts.map(p => p[0]));
  const minY = Math.min(...pts.map(p => p[1]));
  const outline = pts.map(([x, y]) => [x - minX, y - minY]);
  const withSA = expandOutline(outline, SEAM);

  return {
    id: 'leg',
    label: 'Jambe (×4)',
    number: `5/${T}`,
    outline,
    withSeamAllowance: withSA,
    grainLine: [[w / 2, SEAM + 0.5], [w / 2, h - SEAM - 0.5]],
    furDirection: [[w * 0.75, h * 0.65], [w * 0.75, h * 0.35]],
    notches: [
      { pos: [w / 2, h], letter: 'C', label: 'Hanche → Corps' },
    ],
    openings: [
      { from: [0, h * 0.35], to: [0, h * 0.65], label: 'Ouvert pour retourner' },
    ],
    assemblyNote: 'Paires endroit/endroit · retourner · rembourrer',
  };
}

/** Queue — petit cercle, ×2 */
function buildTailPiece(S, tailSize, T) {
  const r = tailSize * S * 0.8;
  const d = r * 2;
  const pts = ellipsePoints(r, r, 16);
  const minX = Math.min(...pts.map(p => p[0]));
  const minY = Math.min(...pts.map(p => p[1]));
  const outline = pts.map(([x, y]) => [x - minX, y - minY]);
  const withSA = expandOutline(outline, SEAM);

  return {
    id: 'tail',
    label: 'Queue (×2)',
    number: `6/${T}`,
    outline,
    withSeamAllowance: withSA,
    grainLine: [[d / 2, SEAM + 0.3], [d / 2, d - SEAM - 0.3]],
    furDirection: null,
    notches: [
      { pos: [d / 2, 0], letter: 'D', label: 'Base → dos du Corps' },
    ],
    openings: [
      { from: [d * 0.25, d], to: [d * 0.75, d], label: 'Ouvert pour retourner' },
    ],
    assemblyNote: 'Endroit/endroit · retourner · rembourrer · coudre au dos',
  };
}

// ─── Shape helpers ────────────────────────────────────────────────────────────

/** Generate points on an ellipse centered at origin */
function ellipsePoints(rx, ry, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    pts.push([rx * Math.cos(angle), ry * Math.sin(angle)]);
  }
  return pts;
}

/** Generate a rounded rectangle outline */
function roundedRect(w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  const pts = [];
  const steps = 6; // per corner

  // Bottom-left corner
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI + (Math.PI / 2) * (i / steps);
    pts.push([r + r * Math.cos(a), r + r * Math.sin(a)]);
  }
  // Bottom-right corner
  for (let i = 0; i <= steps; i++) {
    const a = (3 * Math.PI / 2) + (Math.PI / 2) * (i / steps);
    pts.push([w - r + r * Math.cos(a), r + r * Math.sin(a)]);
  }
  // Top-right corner
  for (let i = 0; i <= steps; i++) {
    const a = 0 + (Math.PI / 2) * (i / steps);
    pts.push([w - r + r * Math.cos(a), h - r + r * Math.sin(a)]);
  }
  // Top-left corner
  for (let i = 0; i <= steps; i++) {
    const a = (Math.PI / 2) + (Math.PI / 2) * (i / steps);
    pts.push([r + r * Math.cos(a), h - r + r * Math.sin(a)]);
  }

  return pts;
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────

/**
 * ✅ REMPLACÉ — Offset polygon par bissectrice des normales d'arêtes.
 * Correct pour polygones concaves (encolure, emmanchure).
 * Clamp miter à 3× pour éviter les pointes extrêmes.
 */
function expandOutline(pts, amount) {
  const n = pts.length;

  // Sens de rotation : aire > 0 → CCW en repère Y-haut
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
  }
  const sign = area >= 0 ? 1 : -1;

  return pts.map((pt, i) => {
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];

    // Arête entrante prev → pt
    const dx1 = pt[0] - prev[0],  dy1 = pt[1] - prev[1];
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
    const nx1  =  sign * dy1 / len1;
    const ny1  = -sign * dx1 / len1;

    // Arête sortante pt → next
    const dx2 = next[0] - pt[0],  dy2 = next[1] - pt[1];
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
    const nx2  =  sign * dy2 / len2;
    const ny2  = -sign * dx2 / len2;

    // Bissectrice = moyenne des deux normales unitaires
    let bx = nx1 + nx2;
    let by = ny1 + ny2;
    const bLen = Math.sqrt(bx * bx + by * by) || 1;
    bx /= bLen;
    by /= bLen;

    // Longueur miter : amount / cos(demi-angle), clampée à 3×
    const dot   = Math.max(0.33, bx * nx2 + by * ny2);
    const scale = Math.min(amount / dot, amount * 3);

    return [pt[0] + bx * scale, pt[1] + by * scale];
  });
}

/**
 * Bounding box d'une pièce (en cm, sur withSeamAllowance).
 */
export function pieceBounds(piece) {
  const pts  = piece.withSeamAllowance;
  const xs   = pts.map(p => p[0]);
  const ys   = pts.map(p => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    x:      minX,
    y:      minY,
    width:  Math.max(...xs) - minX,
    height: Math.max(...ys) - minY,
  };
}
