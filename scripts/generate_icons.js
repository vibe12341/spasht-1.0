import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(2, 9); // truecolor RGB
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    const crc = crc32(combined) >>> 0;
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // Raw image scanlines
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      // Draw a subtle border and eye icon shape if near center
      const dx = (x - width / 2) / (width / 2);
      const dy = (y - height / 2) / (height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.45 && dist > 0.35) {
        // Cyan ring
        rawData[pxOffset] = 56;
        rawData[pxOffset + 1] = 189;
        rawData[pxOffset + 2] = 248;
      } else if (dist <= 0.2) {
        // Cyan center
        rawData[pxOffset] = 14;
        rawData[pxOffset + 1] = 165;
        rawData[pxOffset + 2] = 233;
      } else {
        // Slate background
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation
function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  table[i] = c;
}

if (!fs.existsSync('public')) fs.mkdirSync('public', { recursive: true });
if (!fs.existsSync('static')) fs.mkdirSync('static', { recursive: true });

const png192 = createPNG(192, 192, 15, 23, 42);
const png512 = createPNG(512, 512, 15, 23, 42);
const pngMaskable = createPNG(512, 512, 15, 23, 42);
const appleIcon = createPNG(180, 180, 15, 23, 42);

fs.writeFileSync('public/pwa-192x192.png', png192);
fs.writeFileSync('public/pwa-512x512.png', png512);
fs.writeFileSync('public/pwa-maskable-512x512.png', pngMaskable);
fs.writeFileSync('public/apple-touch-icon.png', appleIcon);

fs.writeFileSync('static/pwa-192x192.png', png192);
fs.writeFileSync('static/pwa-512x512.png', png512);
fs.writeFileSync('static/pwa-maskable-512x512.png', pngMaskable);
fs.writeFileSync('static/apple-touch-icon.png', appleIcon);

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="128" fill="#0f172a"/>
  <path d="M64 256C64 256 128 128 256 128C384 128 448 256 448 256C448 256 384 384 256 384C128 384 64 256 64 256Z" stroke="#38bdf8" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="256" cy="256" r="64" fill="#0284c7" stroke="#38bdf8" stroke-width="24"/>
  <path d="M256 192V160M256 352V320M160 256H128M384 256H352" stroke="#38bdf8" stroke-width="24" stroke-linecap="round"/>
</svg>`;

fs.writeFileSync('public/icon.svg', svgIcon);
fs.writeFileSync('static/icon.svg', svgIcon);
console.log('Icons generated successfully.');
