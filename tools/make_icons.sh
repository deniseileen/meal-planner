#!/bin/bash
# Builds the home-screen icons in app/icons/ from the app's own martian drawing.
# Needs node and rsvg-convert (brew install librsvg).  Run: bash tools/make_icons.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/app/icons"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"
cp "$ROOT"/app/js/martian.js "$ROOT"/app/js/data.js "$TMP"/
echo '{"type":"module"}' > "$TMP/package.json"

cat > "$TMP/make.js" <<'EOF'
import { writeFileSync } from 'node:fs';
import { martianBody, skinDefs } from './martian.js';

const chef = {
  id: 'icon-martian-01',
  look: { color: '#2a9d8f', pattern: 'stripes', extra: 'chef', face: 'happy', eyes: '#2fae4e' },
};
const stars = [[70, 80, 3], [430, 60, 2.5], [460, 170, 2], [52, 210, 2], [400, 110, 1.6], [120, 40, 1.8]]
  .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".85"/>`).join('');

// scale: how big the martian is; maskable icons keep everything inside the central safe circle
function icon(scale, baseY) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    ${skinDefs('ic')}
    <radialGradient id="bg" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="#5a2a9a"/><stop offset=".6" stop-color="#2c1450"/><stop offset="1" stop-color="#170b2c"/></radialGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d99a55"/><stop offset="1" stop-color="#a5612d"/></linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  ${stars}
  <g transform="translate(256 ${baseY}) scale(${scale})">${martianBody(chef, 'ic')}</g>
  <rect x="0" y="${baseY - 20 * scale}" width="512" height="${512 - baseY + 20 * scale}" fill="url(#wood)"/>
  <rect x="0" y="${baseY - 20 * scale}" width="512" height="6" fill="#f2bf7d"/>
  <ellipse cx="256" cy="${baseY + 22 * scale}" rx="${92 * scale}" ry="${22 * scale}" fill="#fffaf0" stroke="#5a4636" stroke-width="${4 * scale}"/>
  <ellipse cx="256" cy="${baseY + 22 * scale}" rx="${60 * scale}" ry="${13 * scale}" fill="#f4a340"/>
</svg>`;
}
writeFileSync('icon.svg', icon(1.12, 440));
writeFileSync('icon-maskable.svg', icon(0.86, 395));
EOF
(cd "$TMP" && node make.js)

rsvg-convert -w 512 -h 512 "$TMP/icon.svg" -o "$OUT/icon-512.png"
rsvg-convert -w 192 -h 192 "$TMP/icon.svg" -o "$OUT/icon-192.png"
rsvg-convert -w 180 -h 180 "$TMP/icon.svg" -o "$OUT/apple-touch-icon.png"
rsvg-convert -w 512 -h 512 "$TMP/icon-maskable.svg" -o "$OUT/icon-maskable-512.png"
rsvg-convert -w 32 -h 32 "$TMP/icon.svg" -o "$OUT/favicon-32.png"
ls -la "$OUT"
