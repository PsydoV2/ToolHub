import { md5 } from "./md5";
import { aesCbcDecryptNoPad, aesCbcEncryptNoPad, aesCbcDecryptPKCS7, rc4 } from "./aes";

/** ISO 32000-1 Standard Security Handler, revisions 2-4 (RC4 40/128-bit,
 * AES-128) and ISO 32000-2 revision 6 (AES-256). Covers the "Standard"
 * security handler only (no public-key/certificate security), which is what
 * essentially every password-protected PDF in the wild uses. */

export const STANDARD_PAD = new Uint8Array([
  0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41, 0x64, 0x00, 0x4e, 0x56, 0xff,
  0xfa, 0x01, 0x08, 0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80, 0x2f, 0x0c,
  0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a,
]);

function concatBytes(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrs) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

function repeatBytes(arr: Uint8Array, times: number): Uint8Array {
  const out = new Uint8Array(arr.length * times);
  for (let i = 0; i < times; i++) out.set(arr, i * arr.length);
  return out;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function padPassword(passwordBytes: Uint8Array): Uint8Array {
  if (passwordBytes.length >= 32) return passwordBytes.subarray(0, 32);
  return concatBytes(passwordBytes, STANDARD_PAD.subarray(0, 32 - passwordBytes.length));
}

/* ===================== Revisions 2-4 (RC4 / AES-128) ===================== */

export interface KeyParamsR234 {
  password: Uint8Array;
  O: Uint8Array;
  P: number;
  ID0: Uint8Array;
  R: number;
  keyLengthBytes: number;
  encryptMetadata: boolean;
}

/** ISO 32000-1 Algorithm 2: compute the file encryption key. */
export function computeFileKeyR234(params: KeyParamsR234): Uint8Array {
  const { password, O, P, ID0, R, keyLengthBytes, encryptMetadata } = params;
  const padded = padPassword(password);
  const pBytes = new Uint8Array(4);
  new DataView(pBytes.buffer).setInt32(0, P, true);

  let input = concatBytes(padded, O, pBytes, ID0);
  if (R >= 4 && !encryptMetadata) {
    input = concatBytes(input, new Uint8Array([0xff, 0xff, 0xff, 0xff]));
  }

  let hash = md5(input);
  if (R >= 3) {
    for (let i = 0; i < 50; i++) {
      hash = md5(hash.subarray(0, keyLengthBytes));
    }
  }
  return hash.subarray(0, keyLengthBytes);
}

/** ISO 32000-1 Algorithms 4/5: recompute U and compare, to validate a
 * password before attempting decryption (avoids silently producing a
 * corrupted PDF from a wrong password). */
export function validatePasswordR234(
  fileKey: Uint8Array,
  R: number,
  ID0: Uint8Array,
  storedU: Uint8Array
): boolean {
  if (R === 2) {
    const computed = rc4(fileKey, STANDARD_PAD);
    return timingSafeEqual(computed, storedU.subarray(0, 32));
  }
  let enc = rc4(fileKey, md5(concatBytes(STANDARD_PAD, ID0)));
  for (let i = 1; i <= 19; i++) {
    const key = new Uint8Array(fileKey.length);
    for (let j = 0; j < fileKey.length; j++) key[j] = fileKey[j] ^ i;
    enc = rc4(key, enc);
  }
  return timingSafeEqual(enc, storedU.subarray(0, 16));
}

function computeObjectKey(
  fileKey: Uint8Array,
  objNum: number,
  genNum: number,
  isAES: boolean
): Uint8Array {
  const extra = new Uint8Array(isAES ? 9 : 5);
  extra[0] = objNum & 0xff;
  extra[1] = (objNum >> 8) & 0xff;
  extra[2] = (objNum >> 16) & 0xff;
  extra[3] = genNum & 0xff;
  extra[4] = (genNum >> 8) & 0xff;
  if (isAES) {
    extra[5] = 0x73;
    extra[6] = 0x41;
    extra[7] = 0x6c;
    extra[8] = 0x54; // "sAlT"
  }
  const hash = md5(concatBytes(fileKey, extra));
  return hash.subarray(0, Math.min(fileKey.length + 5, 16));
}

/** ISO 32000-1 Algorithm 1: decrypt one string/stream's raw bytes. */
export function decryptDataR234(
  data: Uint8Array,
  fileKey: Uint8Array,
  objNum: number,
  genNum: number,
  isAES: boolean
): Uint8Array {
  const objKey = computeObjectKey(fileKey, objNum, genNum, isAES);
  if (isAES) {
    if (data.length < 16) return new Uint8Array(0);
    return aesCbcDecryptPKCS7(data.subarray(16), objKey, data.subarray(0, 16));
  }
  return rc4(objKey, data);
}

/* ===================== Revision 6 (AES-256) ===================== */

async function sha(algo: "SHA-256" | "SHA-384" | "SHA-512", data: Uint8Array) {
  const digest = await crypto.subtle.digest(algo, data as BufferSource);
  return new Uint8Array(digest);
}

/** ISO 32000-2 Algorithm 2.B (hash algorithm underlying R6 key derivation). */
async function hash2B(password: Uint8Array, salt: Uint8Array): Promise<Uint8Array> {
  let K = await sha("SHA-256", concatBytes(password, salt));
  let round = 0;
  for (;;) {
    const K1 = repeatBytes(concatBytes(password, K), 64);
    const E = aesCbcEncryptNoPad(K1, K.subarray(0, 16), K.subarray(16, 32));
    let sum = 0;
    for (let i = 0; i < 16; i++) sum += E[i];
    const mod = sum % 3;
    K = await sha(mod === 0 ? "SHA-256" : mod === 1 ? "SHA-384" : "SHA-512", E);
    round++;
    if (round >= 64 && E[E.length - 1] <= round - 32) break;
  }
  return K.subarray(0, 32);
}

/** ISO 32000-2 Algorithm 2.A (user-password path): validate the password
 * against U, and if valid, derive the file encryption key from UE. */
export async function computeFileKeyR6(
  password: Uint8Array,
  U: Uint8Array,
  UE: Uint8Array
): Promise<{ fileKey: Uint8Array; passwordMatches: boolean }> {
  const validationSalt = U.subarray(32, 40);
  const keySalt = U.subarray(40, 48);
  const hash = await hash2B(password, validationSalt);
  const passwordMatches = timingSafeEqual(hash, U.subarray(0, 32));
  const intermediateKey = await hash2B(password, keySalt);
  const fileKey = aesCbcDecryptNoPad(UE, intermediateKey, new Uint8Array(16));
  return { fileKey, passwordMatches };
}

/** R6 uses a single file key for every object (no per-object mixing). */
export function decryptDataR6(data: Uint8Array, fileKey: Uint8Array): Uint8Array {
  if (data.length < 16) return new Uint8Array(0);
  return aesCbcDecryptPKCS7(data.subarray(16), fileKey, data.subarray(0, 16));
}
