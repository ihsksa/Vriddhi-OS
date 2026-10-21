import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPng(width, height, r, g, b) {
  // Simple uncompressed/deflated raw RGBA PNG generator
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = chunk('IHDR', ihdr);

  // Raw image scanlines
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      // Create calming green gradient with smooth edge radius
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isCenter = dist < width * 0.42;
      
      // Soothing emerald gradient: #064e3b (6, 78, 59) to #059669 (5, 150, 105)
      const grad = (y / height);
      let red = Math.floor(6 + grad * 10);
      let green = Math.floor(78 + grad * 70);
      let blue = Math.floor(59 + grad * 35);
      let alpha = 255;

      // Stylized inner growth glyph line
      const normX = x / width;
      const normY = y / height;
      const inV = (normY > 0.35 && normY < 0.65) && (
        Math.abs((normY - 0.5) - (normX - 0.45) * 0.8) < 0.05 ||
        Math.abs((normY - 0.5) + (normX - 0.35) * 0.9) < 0.05 ||
        (normX > 0.6 && normX < 0.75 && Math.abs(normY - 0.35) < 0.03)
      );

      if (inV) {
        red = 167; // #a7f3d0 mint accent
        green = 243;
        blue = 208;
      }

      rawData[offset++] = red;
      rawData[offset++] = green;
      rawData[offset++] = blue;
      rawData[offset++] = alpha;
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const idatChunk = chunk('IDAT', idatData);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('./public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512));

console.log('PWA PNG Icons generated successfully.');
