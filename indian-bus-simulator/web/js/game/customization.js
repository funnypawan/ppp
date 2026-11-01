/**
 * Bus customisation catalogue: every option can be applied to the live 3D bus
 * the moment it is chosen.
 */

export const PAINTS = [
  { id: 'solid', name: 'Solid', price: 0, description: 'Single colour body paint' },
  { id: 'two_tone', name: 'Two Tone', price: 2500, description: 'Split body with a contrasting skirt' },
  { id: 'stripe', name: 'Stripe', price: 3500, description: 'Classic waist-line stripe' },
  { id: 'gradient', name: 'Gradient', price: 5000, description: 'Soft fade from roof to bumper' },
  { id: 'livery', name: 'Operator Livery', price: 8000, description: 'Full painted livery with roof band' },
];

export const BODY_COLORS = [
  { id: 'red', name: 'Sindoor Red', hex: '#c0392b', price: 0 },
  { id: 'orange', name: 'Marigold', hex: '#e07b27', price: 0 },
  { id: 'yellow', name: 'Haldi Yellow', hex: '#e8b923', price: 0 },
  { id: 'green', name: 'Tulsi Green', hex: '#2f7a4d', price: 0 },
  { id: 'blue', name: 'Indigo Blue', hex: '#1f4e79', price: 1500 },
  { id: 'white', name: 'Ivory White', hex: '#e8e6de', price: 1500 },
  { id: 'black', name: 'Midnight Black', hex: '#1b1d21', price: 2500 },
  { id: 'purple', name: 'Jamuni Purple', hex: '#5b2d82', price: 2500 },
  { id: 'teal', name: 'Peacock Teal', hex: '#12776e', price: 3000 },
  { id: 'silver', name: 'Brushed Silver', hex: '#b9bec4', price: 4000 },
];

export const INTERIOR_COLORS = [
  { id: 'beige', name: 'Sand Beige', hex: '#d8c9a8', price: 0 },
  { id: 'olive', name: 'Army Olive', hex: '#7d8460', price: 0 },
  { id: 'navy', name: 'Coach Navy', hex: '#2b3a55', price: 1200 },
  { id: 'maroon', name: 'Seat Maroon', hex: '#6b2230', price: 1200 },
  { id: 'grey', name: 'Slate Grey', hex: '#8b8f94', price: 1800 },
];

export const SEAT_DESIGNS = [
  { id: 'standard', name: 'Standard Bench', price: 0, description: 'Vinyl bench seats' },
  { id: 'reclining', name: 'Reclining AC', price: 12000, description: 'Reclining seats with armrests' },
  { id: 'velvet', name: 'Velvet Tourist', price: 18000, description: 'Plush two-tone tourist seats' },
  { id: 'sleeper', name: 'Sleeper Berths', price: 26000, description: 'Upper and lower berths' },
  { id: 'leather', name: 'Executive Leather', price: 34000, description: 'Premium leather coach seats' },
];

export const WHEEL_TYPES = [
  { id: 'standard', name: 'Steel Rim', price: 0, description: 'Original steel wheels' },
  { id: 'alloy', name: 'Alloy Wheel', price: 7000, description: 'Lightweight alloy wheels' },
  { id: 'chrome', name: 'Chrome Cover', price: 9500, description: 'Decorative chrome wheel covers' },
];

export const RIM_TYPES = [
  { id: 'steel', name: 'Steel', price: 0 },
  { id: 'painted', name: 'Painted', price: 2500 },
  { id: 'polished', name: 'Polished', price: 4000 },
];

export const HEADLIGHT_TYPES = [
  { id: 'halogen', name: 'Halogen', price: 0, brightness: 1.0, color: 0xfff2cc },
  { id: 'led', name: 'LED Projector', price: 6000, brightness: 1.35, color: 0xe8f4ff },
  { id: 'fog', name: 'Fog + Projector', price: 8500, brightness: 1.2, color: 0xffe0b0 },
  { id: 'xenon', name: 'Xenon HID', price: 12000, brightness: 1.6, color: 0xd8ecff },
];

export const HORN_TYPES = [
  { id: 'air', name: 'Air Horn', price: 0, description: 'Classic bus air horn' },
  { id: 'electric', name: 'Electric Horn', price: 1500, description: 'Clear two-tone electric horn' },
  { id: 'twin', name: 'Twin Trumpet', price: 4000, description: 'Deep twin trumpet horn' },
  { id: 'musical', name: 'Musical Horn', price: 6500, description: 'Playable multi-tone horn' },
];

export const STICKERS = [
  { id: 'none', name: 'None', price: 0 },
  { id: 'route', name: 'Route Board', price: 800 },
  { id: 'temple', name: 'Temple Motif', price: 1200 },
  { id: 'lotus', name: 'Lotus Badge', price: 1800 },
  { id: 'tiger', name: 'Tiger Stripe', price: 2200 },
  { id: 'city', name: 'City Skyline', price: 2600 },
  { id: 'tricolor', name: 'Tricolour Band', price: 3000 },
  { id: 'khelo', name: 'Khelo India Mark', price: 3200 },
];

export const WINDOW_TINTS = [
  { id: 'clear', name: 'Clear Glass', price: 0, value: 0.08 },
  { id: 'light', name: 'Light Tint', price: 900, value: 0.3 },
  { id: 'medium', name: 'Medium Tint', price: 1600, value: 0.55 },
  { id: 'dark', name: 'Dark Tint', price: 2400, value: 0.78 },
];

export const PLATE_STYLES = [
  { id: 'white_black', name: 'White on Black', fg: '#f2f2f2', bg: '#141414' },
  { id: 'yellow_black', name: 'Yellow on Black', fg: '#ffd400', bg: '#141414' },
  { id: 'green_white', name: 'Green on White', fg: '#1b5e20', bg: '#f2f2f2' },
];

export const CUSTOM_CATALOG = {
  paints: PAINTS,
  bodyColors: BODY_COLORS,
  interiorColors: INTERIOR_COLORS,
  seatDesigns: SEAT_DESIGNS,
  wheels: WHEEL_TYPES,
  rims: RIM_TYPES,
  headlights: HEADLIGHT_TYPES,
  horns: HORN_TYPES,
  stickers: STICKERS,
  windowTints: WINDOW_TINTS,
  plateStyles: PLATE_STYLES,
};

export const DEFAULT_CUSTOMIZATION = {
  paint: 'solid',
  bodyColor: null, // falls back to the bus default paint
  interiorColor: 'beige',
  seatDesign: 'standard',
  wheels: 'standard',
  rims: 'steel',
  headlights: 'halogen',
  horn: 'air',
  stickers: [],
  licensePlate: 'MH 12 AB 1234',
  windowTint: 0.3,
  plateStyle: 'white_black',
};

export function catalogEntry(group, id) {
  const list = CUSTOM_CATALOG[group] || [];
  return list.find((e) => e.id === id) || list[0];
}

/** Total price of a customisation set (sum of the non-default upgrades). */
export function customizationPrice(custom) {
  let total = 0;
  const groups = [
    ['paints', custom.paint],
    ['bodyColors', custom.bodyColor],
    ['interiorColors', custom.interiorColor],
    ['seatDesigns', custom.seatDesign],
    ['wheels', custom.wheels],
    ['rims', custom.rims],
    ['headlights', custom.headlights],
    ['horns', custom.horn],
    ['windowTints', custom.windowTintLevel],
  ];
  for (const [group, id] of groups) {
    if (!id) continue;
    const entry = catalogEntry(group, id);
    total += entry.price || 0;
  }
  for (const sticker of custom.stickers || []) {
    total += catalogEntry('stickers', sticker).price || 0;
  }
  return total;
}
