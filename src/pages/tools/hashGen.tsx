"use client";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";
import { MdAbc, MdOutlineFilePresent } from "react-icons/md";
import { motion } from "framer-motion";
import { FaArrowsRotate, FaCopy } from "react-icons/fa6";

type Algo = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
type Encoding = "hex" | "base64";

export default function HashTool() {
  const [mode, setMode] = useState<"text" | "files">("text");
  const [algo, setAlgo] = useState<Algo>("SHA-256");
  const [enc, setEnc] = useState<Encoding>("hex");
  const [uppercase, setUppercase] = useState(false);

  // Text
  const [input, setInput] = useState("");
  const [textHash, setTextHash] = useState("");

  // Files
  const [files, setFiles] = useState<File[]>([]);
  const [fileResults, setFileResults] = useState<
    Array<{ name: string; size: number; hash: string }>
  >([]);
  const [busy, setBusy] = useState(false);

  // --- Helpers ---
  function toHex(bytes: Uint8Array, upper = false) {
    const s = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
      ""
    );
    return upper ? s.toUpperCase() : s;
  }
  function toBase64(bytes: Uint8Array, upper = false) {
    const bin = String.fromCharCode(...bytes);
    const b64 = btoa(bin);
    return upper ? b64.toUpperCase() : b64;
  }
  function encodeOut(bytes: Uint8Array) {
    return enc === "hex" ? toHex(bytes, uppercase) : toBase64(bytes, uppercase);
  }
  async function hashTextNow() {
    const data = new TextEncoder().encode(input);
    const bytes = await computeHash(algo, data);
    setTextHash(encodeOut(bytes));
  }

  // live-recompute for text
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = new TextEncoder().encode(input);
      const bytes = await computeHash(algo, data);
      if (!cancelled) setTextHash(encodeOut(bytes));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, algo, enc, uppercase]);

  async function hashSelectedFiles() {
    if (!files.length) return;
    setBusy(true);
    try {
      const res: Array<{ name: string; size: number; hash: string }> = [];
      for (const f of files) {
        const buf = new Uint8Array(await f.arrayBuffer());
        const bytes = await computeHash(algo, buf);
        res.push({ name: f.name, size: f.size, hash: encodeOut(bytes) });
      }
      setFileResults(res);
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      alert("Copy failed. Please copy manually.");
    }
  }

  const fileInfo = useMemo(
    () => files.map((f) => ({ name: f.name, size: f.size })),
    [files]
  );

  return (
    <>
      <Head>
        <title>ToolHub Hash</title>
        <meta
          name="description"
          content="Generate hashes (MD5, SHA-1/256/384/512) for text or files, client-side."
        />
      </Head>
      <main>
        <Navbar isSubPage title="Hash" />

        <div className="hashCard">
          <div className="hashControls">
            <label className="hashAlgoCtrl">
              <select
                value={algo}
                onChange={(e) => setAlgo(e.target.value as Algo)}
              >
                <option>SHA-256</option>
                <option>SHA-512</option>
                <option>SHA-384</option>
                <option>SHA-1</option>
                <option>MD5</option>
              </select>
            </label>

            <label className="hashOutCtrl">
              <select
                value={enc}
                onChange={(e) => setEnc(e.target.value as Encoding)}
              >
                <option value="hex">Hex</option>
                <option value="base64">Base64</option>
              </select>
            </label>

            <label className="hashUpCtrl">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
              />
              <span>Uppercase</span>
            </label>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={`tab ${mode === "text" ? "active" : ""}`}
              onClick={() => setMode("text")}
            >
              <MdAbc />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={`tab ${mode === "files" ? "active" : ""}`}
              onClick={() => setMode("files")}
            >
              <MdOutlineFilePresent />
            </motion.button>
          </div>

          {algo === "SHA-1" && (
            <p className="warn">
              SHA-1 is considered cryptographically broken. Prefer SHA-256 or
              higher for integrity.
            </p>
          )}
          {algo === "MD5" && (
            <p className="warn">
              MD5 is not collision-resistant. Use only for legacy checksums.
            </p>
          )}

          {mode === "text" ? (
            <section className="panel">
              <textarea
                rows={6}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type or paste text…"
              />

              <textarea rows={3} readOnly value={textHash} />

              <div className="actions">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  onClick={hashTextNow}
                >
                  <FaArrowsRotate />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  onClick={() => copy(textHash)}
                  disabled={!textHash}
                >
                  <FaCopy />
                </motion.button>
              </div>
            </section>
          ) : (
            <section className="panel">
              <label className="col">
                <span className="lbl">Files</span>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    setFiles(Array.from(e.target.files ?? []));
                    setFileResults([]);
                  }}
                />
                {fileInfo.length > 0 && (
                  <ul className="files">
                    {fileInfo.map((f, i) => (
                      <li key={i}>
                        {f.name}{" "}
                        <span className="muted">
                          ({(f.size / 1024).toFixed(1)} KB)
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </label>

              <div className="actions">
                <button
                  className="btn"
                  onClick={hashSelectedFiles}
                  disabled={busy || !files.length}
                >
                  {busy ? "Hashing…" : "Hash files"}
                </button>
                <button
                  className="btn secondary"
                  onClick={() => {
                    setFiles([]);
                    setFileResults([]);
                  }}
                >
                  Clear
                </button>
              </div>

              {fileResults.length > 0 && (
                <div className="results">
                  {fileResults.map((r, i) => (
                    <div className="resultRow" key={i}>
                      <div className="fn">
                        <b>{r.name}</b>{" "}
                        <span className="muted">
                          ({(r.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <textarea
                        className="hashOut"
                        readOnly
                        rows={2}
                        value={r.hash}
                      />
                      <button className="btn tiny" onClick={() => copy(r.hash)}>
                        Copy
                      </button>
                    </div>
                  ))}
                  <div className="actions">
                    <button
                      className="btn"
                      onClick={() =>
                        copy(
                          fileResults
                            .map((r) => `${r.name}\t${r.hash}`)
                            .join("\n")
                        )
                      }
                    >
                      Copy all
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}

/* ===================== Hash core ===================== */

async function computeHash(algo: Algo, data: Uint8Array): Promise<Uint8Array> {
  if (algo === "MD5") {
    return md5Bytes(data);
  }

  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Crypto not available.");
  }

  const digest = await subtle.digest(algo, data as BufferSource);
  return new Uint8Array(digest);
}

/* -------- Minimal MD5 (pure TS, little-endian) -------- */
function md5Bytes(input: Uint8Array): Uint8Array {
  // init constants
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

  // pad
  const origLenBits = BigInt(input.length) * 8n;
  const withOne = input.length + 1;
  const padLen = (withOne % 64 <= 56 ? 56 : 120) - (withOne % 64);
  const totalLen = input.length + 1 + padLen + 8;
  const msg = new Uint8Array(totalLen);
  msg.set(input, 0);
  msg[input.length] = 0x80;
  // length (LE 64-bit)
  const dv = new DataView(msg.buffer);
  dv.setUint32(totalLen - 8, Number(origLenBits & 0xffffffffn), true);
  dv.setUint32(totalLen - 4, Number((origLenBits >> 32n) & 0xffffffffn), true);

  // init state
  let a = 0x67452301 >>> 0;
  let b = 0xefcdab89 >>> 0;
  let c = 0x98badcfe >>> 0;
  let d = 0x10325476 >>> 0;

  const leftRotate = (x: number, n: number) =>
    ((x << n) | (x >>> (32 - n))) >>> 0;

  // process 512-bit chunks
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

  // output little-endian a,b,c,d
  const out = new Uint8Array(16);
  const outDv = new DataView(out.buffer);
  outDv.setUint32(0, a, true);
  outDv.setUint32(4, b, true);
  outDv.setUint32(8, c, true);
  outDv.setUint32(12, d, true);
  return out;
}
