function toBase36(value) {
  const base36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  let v = BigInt(value);
  if (v === 0n) return '0';
  while (v > 0n) {
    result = base36[Number(v % 36n)] + result;
    v = v / 36n;
  }
  return result;
}

function Compress(uncompressed) {
  const dictionary = {};
  for (let i = 0; i < 256; i++)
    dictionary[String.fromCharCode(i)] = i;

  let w = '';
  const compressed = [];

  for (let idx = 0; idx < uncompressed.length; idx++) {
    const b = uncompressed[idx];
    const wc = w + String.fromCharCode(b);
    if (dictionary.hasOwnProperty(wc)) {
      w = wc;
    } else {
      compressed.push(dictionary[w]);
      dictionary[wc] = Object.keys(dictionary).length;
      w = String.fromCharCode(b);
    }
  }

  if (w !== '') compressed.push(dictionary[w]);
  return compressed;
}

function CompressedToString(compressed) {
  let result = '';
  for (const i of compressed) {
    const n = toBase36(i);
    result += toBase36(n.length) + n;
  }
  return result;
}

module.exports = { Compress, CompressedToString, toBase36 };
