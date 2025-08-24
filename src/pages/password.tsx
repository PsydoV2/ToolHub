import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMS = "0123456789";
// Bewusst „sichere“ Sonderzeichen: keine Quotes, Slash/Backslash, Klammern, <>, Pipes etc.
const SAFE_SYMBOLS = "!@#$%^*_+-=?";

type Options = {
  length: number;
  lower: boolean;
  upper: boolean;
  nums: boolean;
  syms: boolean;
};

function getCryptoRandomInt(max: number) {
  // 0..max-1, kryptographisch
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

function shuffleSecure(arr: string[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = getCryptoRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generatePassword(opts: Options) {
  const pools: string[] = [];
  if (opts.lower) pools.push(LOWER);
  if (opts.upper) pools.push(UPPER);
  if (opts.nums) pools.push(NUMS);
  if (opts.syms) pools.push(SAFE_SYMBOLS);

  if (pools.length === 0) return "";

  // Mindestens ein Zeichen aus jeder gewählten Kategorie
  const required: string[] = [];
  for (const pool of pools) {
    required.push(pool[getCryptoRandomInt(pool.length)]);
  }

  // Gesamter Zeichenvorrat
  const all = pools.join("");

  // Rest auffüllen
  const rest: string[] = [];
  const remaining = Math.max(0, opts.length - required.length);
  for (let i = 0; i < remaining; i++) {
    rest.push(all[getCryptoRandomInt(all.length)]);
  }

  // Zusammenmischen
  return shuffleSecure([...required, ...rest]).join("");
}

function estimateStrength(pw: string) {
  if (!pw) return { score: 0, label: "Too short" };
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasNum = /[0-9]/.test(pw);
  const hasSym = /[!@#$%^*_\+\-=\?]/.test(pw);
  const variety = [hasLower, hasUpper, hasNum, hasSym].filter(Boolean).length;

  // Simple Heuristik: Länge und Vielfalt
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  if (variety >= 2) score++;
  if (variety >= 3) score++;
  if (variety === 4) score++;

  // Map auf 0..4
  const capped = Math.min(4, Math.floor(score / 2));
  const label = ["Very weak", "Weak", "Fair", "Strong", "Very strong"][capped];
  return { score: capped, label };
}

export default function Password() {
  const [opts, setOpts] = useState<Options>({
    length: 16,
    lower: true,
    upper: true,
    nums: true,
    syms: true,
  });
  const [pw, setPw] = useState("");

  function regen() {
    const next = generatePassword(opts);
    setPw(next);
  }

  useEffect(() => {
    // Initial nach Mount generieren (vermeidet SSR/crypto)
    regen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const strength = useMemo(() => estimateStrength(pw), [pw]);

  async function copyPw() {
    try {
      await navigator.clipboard.writeText(pw);
    } catch {
      // Fallback: Auswahl markieren
      alert("Copy failed. Please copy manually.");
    }
  }

  const anySelected = opts.lower || opts.upper || opts.nums || opts.syms;

  return (
    <>
      <Head>
        <title>ToolHub Password</title>
        <meta
          name="description"
          content="Generate strong passwords with safe symbols."
        />
      </Head>

      <main>
        <Navbar isSubPage title="ToolHub" />

        <section className="wrap">
          <div className="card">
            <header className="cardHeader">
              <h1>Password Generator</h1>
              <p className="muted">
                Uses only “safe” symbols: <code>{SAFE_SYMBOLS}</code>
              </p>
            </header>

            <div className="outputRow">
              <input
                className="passwordField"
                type="text"
                readOnly
                value={pw}
                placeholder="Your password…"
              />
              <div className="btnRow">
                <button className="btn" onClick={regen} disabled={!anySelected}>
                  Regenerate
                </button>
                <button
                  className="btn secondary"
                  onClick={copyPw}
                  disabled={!pw}
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="strength">
              <div className={`bar s${strength.score}`} />
              <span className="label">{strength.label}</span>
            </div>

            <div className="grid">
              <label className="control">
                <span>Length</span>
                <div className="lengthRow">
                  <input
                    type="range"
                    min={8}
                    max={64}
                    value={opts.length}
                    onChange={(e) =>
                      setOpts((o) => ({ ...o, length: Number(e.target.value) }))
                    }
                  />
                  <input
                    className="lenInput"
                    type="number"
                    min={8}
                    max={64}
                    value={opts.length}
                    onChange={(e) => {
                      const v = Math.max(
                        8,
                        Math.min(64, Number(e.target.value || 0))
                      );
                      setOpts((o) => ({ ...o, length: v }));
                    }}
                  />
                </div>
              </label>

              <label className="control check">
                <input
                  type="checkbox"
                  checked={opts.lower}
                  onChange={(e) =>
                    setOpts((o) => ({ ...o, lower: e.target.checked }))
                  }
                />
                <span>Lowercase (a–z)</span>
              </label>

              <label className="control check">
                <input
                  type="checkbox"
                  checked={opts.upper}
                  onChange={(e) =>
                    setOpts((o) => ({ ...o, upper: e.target.checked }))
                  }
                />
                <span>Uppercase (A–Z)</span>
              </label>

              <label className="control check">
                <input
                  type="checkbox"
                  checked={opts.nums}
                  onChange={(e) =>
                    setOpts((o) => ({ ...o, nums: e.target.checked }))
                  }
                />
                <span>Numbers (0–9)</span>
              </label>

              <label className="control check">
                <input
                  type="checkbox"
                  checked={opts.syms}
                  onChange={(e) =>
                    setOpts((o) => ({ ...o, syms: e.target.checked }))
                  }
                />
                <span>Symbols ({SAFE_SYMBOLS})</span>
              </label>
            </div>

            {!anySelected && (
              <p className="warn">Select at least one character type.</p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
