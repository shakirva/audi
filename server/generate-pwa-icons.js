// PWA Icon Generator for Venueza
// Generates all required PWA icon sizes from the brand identity
const fs = require('fs');
const path = require('path');

const SIZES = [72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512];
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');

// Venueza brand SVG icon — stylized geometric shape
function generateSVG(size, maskable = false) {
  const padding = maskable ? Math.round(size * 0.1) : 0;
  const innerSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  
  // The new logo is a geometric stacked shape
  // Drawn using thick strokes for crisp scaling
  const sw = Math.max(2, innerSize * 0.12); // stroke width
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0A0A0A"/>
  <g transform="translate(${padding}, ${padding})">
    <path d="
      M ${innerSize * 0.25} ${innerSize * 0.35} 
      L ${innerSize * 0.50} ${innerSize * 0.18} 
      L ${innerSize * 0.75} ${innerSize * 0.35} 
      L ${innerSize * 0.75} ${innerSize * 0.70} 
      L ${innerSize * 0.50} ${innerSize * 0.87} 
      L ${innerSize * 0.25} ${innerSize * 0.70} 
      Z
      M ${innerSize * 0.25} ${innerSize * 0.48}
      L ${innerSize * 0.50} ${innerSize * 0.65}
      L ${innerSize * 0.75} ${innerSize * 0.48}
    " fill="none" stroke="#FFFFFF" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

// Write all icons
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

SIZES.forEach(size => {
  // Regular icon
  fs.writeFileSync(path.join(OUTPUT_DIR, `icon-${size}x${size}.svg`), generateSVG(size, false));
  console.log(`✅ icon-${size}x${size}.svg`);
  
  // Maskable icon (with safe zone padding)
  fs.writeFileSync(path.join(OUTPUT_DIR, `icon-${size}x${size}-maskable.svg`), generateSVG(size, true));
  console.log(`✅ icon-${size}x${size}-maskable.svg`);
});

// Apple touch icon (180x180)
fs.writeFileSync(path.join(OUTPUT_DIR, 'apple-touch-icon.svg'), generateSVG(180, false));
console.log('✅ apple-touch-icon.svg');

// Favicon (32x32 simplified)
const faviconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0A0A0A"/>
  <path d="
    M 8 11 L 16 6 L 24 11 L 24 21 L 16 26 L 8 21 Z
    M 8 15 L 16 20 L 24 15
  " fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
fs.writeFileSync(path.join(OUTPUT_DIR, 'favicon.svg'), faviconSVG);
console.log('✅ favicon.svg');

console.log('\n🎉 All PWA icons generated!');
