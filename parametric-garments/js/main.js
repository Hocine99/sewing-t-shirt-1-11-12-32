/**
 * main.js
 * Entry point: wires parameter panel → 3D preview → pattern generator → exporter.
 */

import { PARAM_DEFS, params } from './parameters.js';
import { Preview3D }          from './preview3d.js';
import { exportSVG, exportPDF } from './exporter.js';

// ─── DOM references ───────────────────────────────────────────────────────────

const canvasEl       = document.getElementById('viewport-canvas');
const exportSvgBtn   = document.getElementById('btn-export-svg');
const exportPdfBtn   = document.getElementById('btn-export-pdf');
const measureSection = document.getElementById('section-measurements');
const styleSection   = document.getElementById('section-style');

// ─── Initialise 3D preview ────────────────────────────────────────────────────

const preview = new Preview3D(canvasEl);
preview.update(params.getAll());

// ─── ✅ NOUVEAU — Debounce helper ─────────────────────────────────────────────

/**
 * Retarde l'exécution de `fn` de `delay` ms après le dernier appel.
 * Protège le CPU lors de déplacements rapides du slider.
 */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ─── ✅ NOUVEAU — Mise à jour 3D debounced (30ms) ────────────────────────────

const debouncedUpdate = debounce(() => {
  preview.update(params.getAll());
  updatePatternInfo();
}, 30);

// ─── Build parameter controls ─────────────────────────────────────────────────

function buildControls() {
  PARAM_DEFS.forEach(def => {
    const isSelect = def.type === 'select';
    const target   = isSelect ? styleSection : measureSection;

    const wrapper = document.createElement('div');
    wrapper.className = 'param-row';

    const labelRow = document.createElement('div');
    labelRow.className = 'param-label-row';

    const label = document.createElement('label');
    label.htmlFor   = `param-${def.id}`;
    label.textContent = def.label;
    labelRow.appendChild(label);

    if (isSelect) {
      const select = document.createElement('select');
      select.id        = `param-${def.id}`;
      select.className = 'param-select';

      def.options.forEach(opt => {
        const option = document.createElement('option');
        option.value       = opt;
        option.textContent = opt.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        if (opt === def.default) option.selected = true;
        select.appendChild(option);
      });

      // Les selects n'ont pas besoin de debounce (changements discrets)
      select.addEventListener('change', e => {
        params.set(def.id, e.target.value);
      });

      wrapper.appendChild(labelRow);
      wrapper.appendChild(select);

    } else {
      const valueSpan = document.createElement('span');
      valueSpan.className   = 'param-value';
      valueSpan.textContent = `${params.get(def.id)} ${def.unit}`;
      labelRow.appendChild(valueSpan);

      const slider = document.createElement('input');
      slider.type      = 'range';
      slider.id        = `param-${def.id}`;
      slider.className = 'param-slider';
      slider.min       = def.min;
      slider.max       = def.max;
      slider.step      = def.step;
      slider.value     = params.get(def.id);

      slider.addEventListener('input', e => {
        const val = Number(e.target.value);
        // Mise à jour immédiate du label (pas besoin de debounce)
        valueSpan.textContent = `${val} ${def.unit}`;
        // Mise à jour du store → déclenche 'change' → debouncedUpdate
        params.set(def.id, val);
      });

      wrapper.appendChild(labelRow);
      wrapper.appendChild(slider);
    }

    target.appendChild(wrapper);
  });
}

buildControls();

// ─── ✅ Réactivité : changement paramètre → mise à jour 3D debounced ─────────

params.addEventListener('change', debouncedUpdate);

// ─── Pattern info panel ───────────────────────────────────────────────────────

function updatePatternInfo() {
  const infoEl = document.getElementById('pattern-info');
  if (!infoEl) return;
  const p = params.getAll();
  infoEl.textContent =
    `Body ${p.bodySize} cm · Ears ${p.earLength} cm (${p.earStyle}) · ${p.color} · ${p.accessory === 'none' ? 'no accessory' : p.accessory}`;
}

updatePatternInfo();

// ─── Export buttons ───────────────────────────────────────────────────────────

exportSvgBtn.addEventListener('click', () => {
  exportSvgBtn.disabled     = true;
  exportSvgBtn.textContent  = 'Generating…';
  setTimeout(() => {
    try {
      exportSVG(params.getAll());
    } catch (err) {
      console.error('SVG export failed', err);
      alert('SVG export failed: ' + err.message);
    } finally {
      exportSvgBtn.disabled    = false;
      exportSvgBtn.textContent = 'Export SVG';
    }
  }, 50);
});

exportPdfBtn.addEventListener('click', async () => {
  exportPdfBtn.disabled    = true;
  exportPdfBtn.textContent = 'Generating…';
  try {
    await exportPDF(params.getAll());
  } catch (err) {
    console.error('PDF export failed', err);
    alert('PDF export failed: ' + err.message);
  } finally {
    exportPdfBtn.disabled    = false;
    exportPdfBtn.textContent = 'Export PDF';
  }
});

// ─── Resize handling ──────────────────────────────────────────────────────────

const ro = new ResizeObserver(() => preview.resize());
ro.observe(canvasEl.parentElement);
