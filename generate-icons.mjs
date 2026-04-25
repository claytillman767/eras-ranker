// Generates simple PNG app icons (192x192 and 512x512) using only Node.js built-ins.
// Run once: node generate-icons.mjs
import { createWriteStream } from 'fs';
import { deflateSync } from 'zlib';

function createPNG(size) {
  const bg = { r: 168, g: 85, b: 247 }; // #a855f7 purple

  // Build raw RGBA pixel data
  const pixels = new Uint8Array(size * size * 4);
  const cx = size / 2, cy = size / 2, r = size * 0.42;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= r) {
        // Inside circle — purple background
        pixels[idx]     = bg.r;
        pixels[idx + 1] = bg.g;
        pixels[idx + 2] = bg.b;
        pixels[idx + 3] = 255;
      } else {
        // Outside circle — transparent
        pixels[idx + 3] = 0;
      }
    }
  }

  // Draw a simple star shape on top (white)
  const starCx = cx, starCy = cy;
  const outerR = r * 0.58, innerR = r * 0.25;
  const points = 5;

  // For each pixel, check if it's inside the star polygon
  const starVerts = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const rad = i % 2 === 0 ? outerR : innerR;
    starVerts.push({ x: starCx + Math.cos(angle) * rad, y: starCy + Math.sin(angle) * rad });
  }

  function inPolygon(px, py, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y;
      const xj = poly[j].x, yj = poly[j].y;
      const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (inPolygon(x, y, starVerts)) {
        const idx = (y * size + x) * 4;
        pixels[idx]     = 255;
        pixels[idx + 1] = 255;
        pixels[idx + 2] = 255;
        pixels[idx + 3] = 255;
      }
    }
  }

  // Build PNG binary
  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    const table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c;
    }
    let crc = 0xffffffff;
    for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const dataBuf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(dataBuf.length);
    const crcInput = Buffer.concat([typeBuf, dataBuf]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(crcInput));
    return Buffer.concat([lenBuf, typeBuf, dataBuf, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA color type
  // bytes 10-12 already 0 (compression, filter, interlace)

  // IDAT: raw scanlines with filter byte 0 prepended to each row
  const raw = [];
  for (let y = 0; y < size; y++) {
    raw.push(0); // filter byte
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      raw.push(pixels[idx], pixels[idx+1], pixels[idx+2], pixels[idx+3]);
    }
  }
  const idat = deflateSync(Buffer.from(raw));

  return Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Write both icons
for (const size of [192, 512]) {
  const buf = createPNG(size);
  const out = createWriteStream(`public/icon-${size}.png`);
  out.write(buf);
  out.end();
  console.log(`Generated public/icon-${size}.png (${buf.length} bytes)`);
}
