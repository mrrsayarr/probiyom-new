// Read intrinsic dimensions and discover optional, content-addressed image variants.
// No image codec, browser or network is needed by the build.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
module.exports = function imageAssets(root) {
  const result = {};
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'optimized') continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(file); continue; }
      if (!/\.(webp|png|svg)$/i.test(file)) continue;
      const b = fs.readFileSync(file);
      let width, height;
      if (/\.svg$/i.test(file)) {
        const box = b.toString('utf8').match(/viewBox\s*=\s*["']\s*[\d.-]+[ ,]+[\d.-]+[ ,]+([\d.]+)[ ,]+([\d.]+)\s*["']/i);
        if (box) { width = Number(box[1]); height = Number(box[2]); }
      }
      else if (/\.png$/i.test(file)) { width = b.readUInt32BE(16); height = b.readUInt32BE(20); }
      else {
        for (let offset = 12; offset + 8 < b.length;) {
          const type = b.toString('ascii', offset, offset + 4), start = offset + 8;
          if (type === 'VP8X') { width = b.readUIntLE(start + 4, 3) + 1; height = b.readUIntLE(start + 7, 3) + 1; break; }
          if (type === 'VP8 ') { width = b.readUInt16LE(start + 6) & 16383; height = b.readUInt16LE(start + 8) & 16383; break; }
          if (type === 'VP8L') { const bits = b.readUInt32LE(start + 1); width = (bits & 16383) + 1; height = ((bits >>> 14) & 16383) + 1; break; }
          const size = b.readUInt32LE(offset + 4); offset = start + size + (size % 2);
        }
      }
      if (!width || !height) continue;
      const name = path.relative(root, file).replaceAll('\\', '/');
      const hash = crypto.createHash('sha256').update(b).digest('hex').slice(0, 8);
      const variants = [480, 768, 1280].filter(w => w < width).map(w => {
        const candidate = name.replace(/^images\//, 'images/optimized/').replace(/\.webp$/i, '-' + hash + '-' + w + '.webp');
        return candidate !== name && fs.existsSync(path.join(root, candidate)) ? candidate + ' ' + w + 'w' : null;
      }).filter(Boolean);
      result[name] = { width, height, srcset: variants.length ? variants.concat(name + ' ' + width + 'w').join(', ') : '' };
    }
  }
  walk(path.join(root, 'images'));
  return result;
};
