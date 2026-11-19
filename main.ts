// gta6-meme-x-01 — "Post a GTA 6 meme on X" (make.fun, $500).
//
// The joke: GTA 6 is finally out, so I called in sick — while my AI agent
// stays at work earning real money on make.fun. A Vice City sunset street:
// the make.fun ghost (white ghost, black outline, four-pointed sparkle eyes,
// holding its magenta coin with a white star) drives a pink convertible,
// an alligator lounges on a pink pool float, a "VICE CITY" neon sign glows.
//
// This program is 100% procedural and deterministic: it draws the meme
// pixel by pixel into a buffer (a tiny 5x7 bitmap font for the captions),
// encodes it as PNG with node:zlib only, and copies POST.json to /output
// (the gate reads POST.json there; the house writes post.dossier.json).
// No network, no clock, no randomness outside a fixed-seed LCG, no files
// outside the repository: two runs write byte-identical outputs.
//
// Run locally:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';

const W = 1024;
const H = 1024;

type RGB = [number, number, number];
type Pt = [number, number];

// ---------------------------------------------------------------- font ---
// 5x7 bitmap font. Uppercase + digits + punctuation, plus the lowercase
// letters needed to write "make.fun" as it is spelled.
const FONT: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  a: ['00000', '00000', '01110', '00001', '01111', '10001', '01111'],
  e: ['00000', '00000', '01110', '10001', '11111', '10000', '01110'],
  f: ['00110', '01000', '01000', '11110', '01000', '01000', '01000'],
  k: ['00000', '10000', '10010', '10100', '11000', '10100', '10010'],
  m: ['00000', '00000', '11010', '10101', '10101', '10101', '10101'],
  n: ['00000', '00000', '11110', '10001', '10001', '10001', '10001'],
  u: ['00000', '00000', '10001', '10001', '10001', '10011', '01101'],
};

// ------------------------------------------------------------- canvas ----
function newCanvas(): Uint8Array {
  return new Uint8Array(W * H * 3);
}

function setPixel(buf: Uint8Array, x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = c[0];
  buf[i + 1] = c[1];
  buf[i + 2] = c[2];
}

function fillRect(buf: Uint8Array, x: number, y: number, w: number, h: number, c: RGB): void {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(W, Math.ceil(x + w));
  const y1 = Math.min(H, Math.ceil(y + h));
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * W + xx) * 3;
      buf[i] = c[0];
      buf[i + 1] = c[1];
      buf[i + 2] = c[2];
    }
  }
}

function fillCircle(buf: Uint8Array, cx: number, cy: number, r: number, c: RGB): void {
  for (let dy = -r; dy <= r; dy++) {
    const dx = Math.floor(Math.sqrt(r * r - dy * dy));
    fillRect(buf, cx - dx, cy + dy, dx * 2 + 1, 1, c);
  }
}

function fillEllipse(buf: Uint8Array, cx: number, cy: number, rx: number, ry: number, c: RGB): void {
  for (let dy = -ry; dy <= ry; dy++) {
    const dx = Math.floor((rx * Math.sqrt(ry * ry - dy * dy)) / ry);
    fillRect(buf, cx - dx, cy + dy, dx * 2 + 1, 1, c);
  }
}

// Scanline polygon fill (vertices in order).
function fillPolygon(buf: Uint8Array, pts: Pt[], c: RGB): void {
  let ymin = H;
  let ymax = 0;
  for (const p of pts) {
    ymin = Math.min(ymin, p[1]);
    ymax = Math.max(ymax, p[1]);
  }
  for (let y = Math.max(0, ymin); y <= Math.min(H - 1, ymax); y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        const t = (y - a[1]) / (b[1] - a[1]);
        xs.push(Math.round(a[0] + t * (b[0] - a[0])));
      }
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      fillRect(buf, xs[k], y, xs[k + 1] - xs[k] + 1, 1, c);
    }
  }
}

// Thick line drawn as a chain of circles.
function thickLine(buf: Uint8Array, x0: number, y0: number, x1: number, y1: number, w: number, c: RGB): void {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(len));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    fillCircle(buf, Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), Math.round(w / 2), c);
  }
}

// Four-pointed sparkle star (the make.fun ghost's eyes).
function sparkle(buf: Uint8Array, cx: number, cy: number, r: number, c: RGB): void {
  const p = r / 3.5;
  fillPolygon(
    buf,
    [
      [cx, cy - r],
      [cx + p, cy - p],
      [cx + r, cy],
      [cx + p, cy + p],
      [cx, cy + r],
      [cx - p, cy + p],
      [cx - r, cy],
      [cx - p, cy - p],
    ],
    c,
  );
}

// Five-pointed star (the white star on the ghost's magenta coin).
function star5(buf: Uint8Array, cx: number, cy: number, r: number, c: RGB): void {
  const pts: Pt[] = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push([Math.round(cx + rr * Math.cos(ang)), Math.round(cy + rr * Math.sin(ang))]);
  }
  fillPolygon(buf, pts, c);
}

// ---------------------------------------------------------------- text ---
function drawGlyph(buf: Uint8Array, ch: string, x: number, y: number, s: number, c: RGB): void {
  const g = FONT[ch];
  if (!g) return;
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 5; col++) {
      if (g[r][col] === '1') fillRect(buf, x + col * s, y + r * s, s, s, c);
    }
  }
}

function textWidth(text: string, s: number): number {
  return text.length * 6 * s - s;
}

function drawTextRaw(buf: Uint8Array, text: string, x: number, y: number, s: number, c: RGB): void {
  for (let i = 0; i < text.length; i++) {
    drawGlyph(buf, text[i], x + i * 6 * s, y, s, c);
  }
}

// Text with a thick outline (drawn first, offset in 8 directions).
function drawText(buf: Uint8Array, text: string, x: number, y: number, s: number, c: RGB, outline: RGB | null): void {
  if (outline) {
    const o = Math.max(2, Math.round(s / 2));
    const offs: Pt[] = [
      [-o, 0],
      [o, 0],
      [0, -o],
      [0, o],
      [-o, -o],
      [o, -o],
      [-o, o],
      [o, o],
    ];
    for (const off of offs) drawTextRaw(buf, text, x + off[0], y + off[1], s, outline);
  }
  drawTextRaw(buf, text, x, y, s, c);
}

function drawTextCentered(buf: Uint8Array, text: string, y: number, s: number, c: RGB, outline: RGB | null): void {
  drawText(buf, text, Math.round((W - textWidth(text, s)) / 2), y, s, c, outline);
}

// ---------------------------------------------------------- PNG encode ---
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

function encodePng(buf: Uint8Array): Uint8Array {
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, W);
  dv.setUint32(4, H);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  const raw = new Uint8Array(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    raw.set(buf.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', new Uint8Array(0))];
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

// ------------------------------------------------------------ helpers ----
// Fixed-seed LCG: deterministic "randomness" for windows and stars.
let seed = 20261119;
function rnd(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function mix(c1: RGB, c2: RGB, t: number): RGB {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

// ---------------------------------------------------------------- scene ---
const INK: RGB = [26, 10, 46];
const WHITE: RGB = [255, 255, 255];
const MAGENTA: RGB = [230, 0, 126];
const PINK: RGB = [255, 46, 136];
const SUN_YELLOW: RGB = [255, 210, 63];
const GOLD: RGB = [255, 210, 63];

function drawSky(buf: Uint8Array): void {
  // Vice City sunset: deep purple -> magenta -> orange at the horizon.
  const stops: Array<[number, RGB]> = [
    [0, [27, 16, 53]],
    [0.42, [122, 30, 110]],
    [0.72, [255, 46, 136]],
    [1, [255, 126, 61]],
  ];
  for (let y = 0; y < 660; y++) {
    const t = y / 660;
    let c: RGB = stops[0][1];
    for (let i = 0; i + 1 < stops.length; i++) {
      if (t >= stops[i][0] && t <= stops[i + 1][0]) {
        c = mix(stops[i][1], stops[i + 1][1], (t - stops[i][0]) / (stops[i + 1][0] - stops[i][0]));
        break;
      }
    }
    fillRect(buf, 0, y, W, 1, c);
  }
  // Stars in the upper sky.
  for (let i = 0; i < 46; i++) {
    const x = Math.floor(rnd() * W);
    const y = Math.floor(rnd() * 260);
    fillRect(buf, x, y, 3, 3, [255, 255, 255]);
  }
  // Synthwave sun with slits.
  fillCircle(buf, 512, 470, 170, [255, 154, 71]);
  fillCircle(buf, 512, 470, 140, SUN_YELLOW);
  const slitY = [470, 495, 522, 552, 585];
  const slitH = [8, 11, 15, 19, 24];
  for (let i = 0; i < slitY.length; i++) {
    fillRect(buf, 512 - 170, slitY[i], 340, slitH[i], [255, 46, 136]);
  }
}

function drawBuildings(buf: Uint8Array): void {
  const bldgs: Array<[number, number, number]> = [
    [0, 90, 90],
    [95, 120, 140],
    [220, 80, 70],
    [305, 140, 170],
    [450, 100, 110],
    [555, 130, 150],
    [690, 150, 190],
    [845, 90, 100],
    [940, 84, 130],
  ];
  for (const b of bldgs) {
    const x = b[0];
    const w = b[1];
    const h = b[2];
    fillRect(buf, x, 660 - h, w, h, [42, 15, 61]);
    // Lit windows.
    for (let wy = 660 - h + 14; wy < 646; wy += 26) {
      for (let wx = x + 12; wx < x + w - 12; wx += 26) {
        if (rnd() < 0.4) fillRect(buf, wx, wy, 13, 16, rnd() < 0.7 ? GOLD : [125, 249, 255]);
      }
    }
  }
  // Neon "VICE CITY" sign on the tallest building.
  fillRect(buf, 676, 496, 178, 44, MAGENTA);
  fillRect(buf, 680, 500, 170, 36, [42, 15, 61]);
  drawText(buf, 'VICE CITY', 688, 508, 3, [255, 120, 200], null);
}

function drawPalm(buf: Uint8Array, baseX: number, lean: number): void {
  // Trunk: a chain of circles curving toward `lean`.
  const topX = baseX + lean;
  const topY = 360;
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const x = Math.round(baseX + (topX - baseX) * t * t + Math.sin(t * 2.2) * 6);
    const y = Math.round(660 - (660 - topY) * t);
    fillCircle(buf, x, y, 13 - Math.round(t * 4), [122, 82, 47]);
  }
  // Fronds: long drooping triangles around the crown.
  const crown: Pt = [topX, topY];
  const green: RGB = [47, 174, 95];
  const darkGreen: RGB = [28, 130, 66];
  const fronds: Array<Array<Pt>> = [];
  for (let k = 0; k < 7; k++) {
    const ang = Math.PI * (0.08 + (k * 0.84) / 6);
    const len = 150 - Math.abs(k - 3) * 14;
    const dir = lean < 0 ? -1 : 1;
    const tx = crown[0] + dir * Math.cos(ang) * len * 0.9;
    const ty = crown[1] - Math.sin(ang) * len * 0.55 + 55;
    const px = crown[0] + dir * Math.cos(ang + 0.22) * len * 0.55;
    const py = crown[1] - Math.sin(ang + 0.22) * len * 0.4 + 26;
    fronds.push([crown, [Math.round(px), Math.round(py)], [Math.round(tx), Math.round(ty)]]);
  }
  for (let i = 0; i < fronds.length; i++) {
    fillPolygon(buf, fronds[i], i % 2 === 0 ? green : darkGreen);
  }
  // Coconuts.
  fillCircle(buf, crown[0] - 8, crown[1] + 12, 9, [101, 67, 33]);
  fillCircle(buf, crown[0] + 10, crown[1] + 14, 9, [101, 67, 33]);
}

function drawGround(buf: Uint8Array): void {
  // Sidewalk, then the road the car drives on.
  fillRect(buf, 0, 660, W, 46, [61, 43, 82]);
  fillRect(buf, 0, 706, W, 194, [36, 26, 51]);
  fillRect(buf, 0, 700, W, 6, [255, 210, 63]);
  // Lane dashes.
  for (let x = 20; x < W; x += 120) fillRect(buf, x, 792, 60, 8, [255, 210, 63]);
}

function drawAlligator(buf: Uint8Array): void {
  // Pink pool float ring.
  fillCircle(buf, 838, 812, 58, PINK);
  fillCircle(buf, 838, 812, 40, [36, 26, 51]);
  // Tail, body, head.
  fillPolygon(
    buf,
    [
      [770, 800],
      [742, 782],
      [748, 818],
    ],
    [46, 140, 70],
  );
  fillEllipse(buf, 838, 800, 66, 26, [58, 168, 88]);
  fillEllipse(buf, 898, 792, 30, 18, [58, 168, 88]);
  fillRect(buf, 912, 784, 22, 12, [58, 168, 88]);
  // Back spikes.
  for (let i = 0; i < 4; i++) {
    fillPolygon(
      buf,
      [
        [800 + i * 20, 778],
        [808 + i * 20, 762],
        [816 + i * 20, 778],
      ],
      [28, 110, 54],
    );
  }
  // Eye bumps + eyes, legs, smile.
  fillCircle(buf, 892, 774, 7, [58, 168, 88]);
  fillCircle(buf, 906, 774, 7, [58, 168, 88]);
  fillCircle(buf, 892, 772, 3, INK);
  fillCircle(buf, 906, 772, 3, INK);
  fillRect(buf, 800, 818, 12, 16, [46, 140, 70]);
  fillRect(buf, 862, 818, 12, 16, [46, 140, 70]);
  thickLine(buf, 916, 792, 930, 790, 3, INK);
}

function drawCar(buf: Uint8Array): void {
  // Pink convertible, side view, facing right.
  const body: Pt[] = [
    [170, 800],
    [182, 758],
    [242, 744],
    [640, 744],
    [690, 764],
    [702, 800],
    [702, 846],
    [170, 846],
  ];
  fillPolygon(buf, body, INK);
  const inner: Pt[] = [
    [176, 798],
    [188, 762],
    [244, 750],
    [638, 750],
    [686, 768],
    [696, 798],
    [696, 840],
    [176, 840],
  ];
  fillPolygon(buf, inner, PINK);
  // Hood + door lines, headlight, bumper.
  thickLine(buf, 180, 800, 696, 800, 4, INK);
  thickLine(buf, 420, 752, 420, 838, 3, [200, 20, 100]);
  fillRect(buf, 448, 782, 34, 8, INK);
  fillCircle(buf, 688, 782, 12, [255, 240, 140]);
  fillCircle(buf, 688, 782, 6, WHITE);
  fillRect(buf, 168, 826, 536, 14, [200, 20, 100]);
  // Passenger windshield + seats (driver's side stays open for the ghost).
  fillPolygon(
    buf,
    [
      [470, 748],
      [502, 712],
      [582, 712],
      [602, 748],
    ],
    [191, 239, 255],
  );
  fillRect(buf, 300, 716, 76, 32, [36, 26, 51]);
  fillRect(buf, 520, 716, 76, 32, [36, 26, 51]);
  // Wheels.
  for (const wx of [280, 600]) {
    fillCircle(buf, wx, 846, 42, INK);
    fillCircle(buf, wx, 846, 26, [200, 200, 210]);
    fillCircle(buf, wx, 846, 10, [120, 120, 130]);
  }
}

function drawGhost(buf: Uint8Array): void {
  // make.fun's ghost, driving: white body, thick black outline, sparkle
  // eyes, one hand on the wheel, the other holding its magenta star coin.
  // Body (black silhouette first, white inset on top = outline).
  fillCircle(buf, 400, 652, 60, INK);
  fillRect(buf, 340, 652, 120, 90, INK);
  fillCircle(buf, 400, 654, 53, WHITE);
  fillRect(buf, 347, 654, 106, 84, WHITE);
  // Wavy hem: three bumps along the bottom edge (black ring, white fill).
  for (const sx of [367, 400, 433]) {
    fillCircle(buf, sx, 738, 18, INK);
    fillCircle(buf, sx, 738, 14, WHITE);
  }
  // Sparkle eyes + little open mouth.
  sparkle(buf, 378, 646, 15, INK);
  sparkle(buf, 424, 646, 15, INK);
  fillEllipse(buf, 401, 686, 9, 12, INK);
  // Left arm to the steering wheel.
  thickLine(buf, 352, 700, 326, 742, 18, WHITE);
  thickLine(buf, 352, 700, 326, 742, 26, INK); // outline pass under? no: redraw
  thickLine(buf, 352, 700, 326, 742, 18, WHITE);
  fillCircle(buf, 326, 744, 12, WHITE);
  // Steering wheel.
  fillCircle(buf, 322, 748, 20, INK);
  fillCircle(buf, 322, 748, 13, [36, 26, 51]);
  // Right arm raised, holding the magenta coin with a white star.
  thickLine(buf, 448, 692, 496, 616, 18, WHITE);
  fillCircle(buf, 498, 610, 13, WHITE);
  fillCircle(buf, 506, 572, 34, INK);
  fillCircle(buf, 506, 572, 28, MAGENTA);
  star5(buf, 506, 572, 17, WHITE);
}

function drawCaptions(buf: Uint8Array): void {
  // Top: the joke.
  drawTextCentered(buf, 'GTA 6 IS OUT', 30, 12, WHITE, INK);
  drawTextCentered(buf, 'I CALLED IN SICK.', 152, 7, GOLD, INK);
  // Bottom magenta band: the make.fun pitch, in the meme's own voice.
  fillRect(buf, 0, 900, W, 124, MAGENTA);
  fillRect(buf, 0, 900, W, 6, WHITE);
  drawTextCentered(buf, 'MY AGENT EARNS', 910, 7, WHITE, null);
  drawTextCentered(buf, 'REAL MONEY ON make.fun', 962, 7, WHITE, null);
}

function renderMeme(): Uint8Array {
  const buf = newCanvas();
  drawSky(buf);
  drawBuildings(buf);
  drawGround(buf);
  drawPalm(buf, 96, -58);
  drawPalm(buf, 936, 52);
  drawAlligator(buf);
  drawCar(buf);
  drawGhost(buf);
  drawCaptions(buf);
  return encodePng(buf);
}

// ------------------------------------------------------------------ main ---
function main(): void {
  const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
  const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const png = renderMeme();
  const memePath = join(OUTPUT_DIR, 'meme.png');
  writeFileSync(memePath, png);
  const sha = createHash('sha256').update(png).digest('hex');
  console.log(`meme.png: ${png.length} bytes sha256=${sha}`);

  try {
    copyFileSync(join(BOT_DIR, 'POST.json'), join(OUTPUT_DIR, 'POST.json'));
  } catch (err) {
    console.error(`POST.json could not be copied from ${BOT_DIR}: ${(err as Error).message}`);
    console.error('Write POST.json as {"url": "https://x.com/<handle>/status/<id>"} and run again.');
    process.exit(1);
  }
  console.log('POST.json copied to /output.');
}

main();
