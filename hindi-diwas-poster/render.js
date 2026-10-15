// Rasterise an SVG with @resvg/resvg-js
// usage: node render.js <input.svg> <output.png> [width]
const fs = require('fs');
const { Resvg } = require('@resvg/resvg-js');
const [, , inp, outp, w] = process.argv;
const opts = { background: 'white', font: { loadSystemFonts: false, defaultFontFamily: 'Mukta' } };
if (w) opts.fitTo = { mode: 'width', value: Number(w) };
fs.writeFileSync(outp, new Resvg(fs.readFileSync(inp, 'utf8'), opts).render().asPng());
console.log('wrote', outp);
