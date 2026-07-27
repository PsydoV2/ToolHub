/** Minimal MD5 implementation (pure TS, little-endian). Used for legacy
 * checksums (hashGen) and for PDF standard-security-handler key derivation
 * (pdfCrypto), which mandates MD5 regardless of its cryptographic status. */
export function md5(input: Uint8Array): Uint8Array {
  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
    9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
    16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
    15, 21,
  ];
  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0;
  }

  const origLenBits = BigInt(input.length) * 8n;
  const withOne = input.length + 1;
  const padLen = (withOne % 64 <= 56 ? 56 : 120) - (withOne % 64);
  const totalLen = input.length + 1 + padLen + 8;
  const msg = new Uint8Array(totalLen);
  msg.set(input, 0);
  msg[input.length] = 0x80;
  const dv = new DataView(msg.buffer);
  dv.setUint32(totalLen - 8, Number(origLenBits & 0xffffffffn), true);
  dv.setUint32(totalLen - 4, Number((origLenBits >> 32n) & 0xffffffffn), true);

  let a = 0x67452301 >>> 0;
  let b = 0xefcdab89 >>> 0;
  let c = 0x98badcfe >>> 0;
  let d = 0x10325476 >>> 0;

  const leftRotate = (x: number, n: number) =>
    ((x << n) | (x >>> (32 - n))) >>> 0;

  for (let i = 0; i < msg.length; i += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) {
      M[j] = dv.getUint32(i + j * 4, true);
    }
    let A = a,
      B = b,
      C = c,
      D = d;

    for (let j = 0; j < 64; j++) {
      let F, g;
      if (j < 16) {
        F = (B & C) | (~B & D);
        g = j;
      } else if (j < 32) {
        F = (D & B) | (~D & C);
        g = (5 * j + 1) % 16;
      } else if (j < 48) {
        F = B ^ C ^ D;
        g = (3 * j + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * j) % 16;
      }
      const tmp = D;
      D = C;
      C = B;
      const sum = (A + F + K[j] + M[g]) >>> 0;
      B = (B + leftRotate(sum, s[j])) >>> 0;
      A = tmp;
    }

    a = (a + A) >>> 0;
    b = (b + B) >>> 0;
    c = (c + C) >>> 0;
    d = (d + D) >>> 0;
  }

  const out = new Uint8Array(16);
  const outDv = new DataView(out.buffer);
  outDv.setUint32(0, a, true);
  outDv.setUint32(4, b, true);
  outDv.setUint32(8, c, true);
  outDv.setUint32(12, d, true);
  return out;
}
