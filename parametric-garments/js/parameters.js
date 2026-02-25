/**
 * parameters.js
 * Single source of truth for all garment parameters.
 * Provides an EventTarget-based change notification system.
 */

export const PARAM_DEFS = [
  {
    id: 'bodySize',
    label: 'Body Size',
    unit: 'cm',
    min: 8,
    max: 30,
    step: 1,
    default: 16,
  },
  {
    id: 'earLength',
    label: 'Ear Length',
    unit: 'cm',
    min: 4,
    max: 18,
    step: 0.5,
    default: 10,
  },
  {
    id: 'tailSize',
    label: 'Tail Size',
    unit: 'cm',
    min: 1,
    max: 6,
    step: 0.5,
    default: 3,
  },
  {
    id: 'chubbiness',
    label: 'Chubbiness',
    unit: '%',
    min: 50,
    max: 150,
    step: 5,
    default: 100,
  },
  {
    id: 'earStyle',
    label: 'Ear Style',
    type: 'select',
    options: ['straight', 'floppy', 'lop'],
    default: 'straight',
  },
  {
    id: 'color',
    label: 'Color',
    type: 'select',
    options: ['white', 'pink', 'brown', 'grey', 'beige', 'black'],
    default: 'white',
  },
  {
    id: 'accessory',
    label: 'Accessory',
    type: 'select',
    options: ['none', 'bowtie', 'scarf', 'ribbon'],
    default: 'none',
  },
];

export const BUNNY_COLORS = {
  white:  0xf5f0e8,
  pink:   0xf0b8c8,
  brown:  0x8b6847,
  grey:   0xa0a0a5,
  beige:  0xdec8a0,
  black:  0x2a2a2e,
};

class ParameterStore extends EventTarget {
  constructor() {
    super();
    this._values = {};
    for (const def of PARAM_DEFS) {
      this._values[def.id] = def.default;
    }
  }

  get(id) {
    return this._values[id];
  }

  set(id, value) {
    const def = PARAM_DEFS.find(d => d.id === id);
    if (!def) throw new Error(`Unknown parameter: ${id}`);

    if (def.type === 'select') {
      if (!def.options.includes(value)) throw new Error(`Invalid value for ${id}: ${value}`);
    } else {
      value = Math.min(def.max, Math.max(def.min, Number(value)));
    }

    const prev = this._values[id];
    this._values[id] = value;

    if (prev !== value) {
      this.dispatchEvent(new CustomEvent('change', { detail: { id, value, prev } }));
    }
  }

  getAll() {
    return { ...this._values };
  }
}

export const params = new ParameterStore();
