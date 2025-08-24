import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";

type Options = {
  uppercase: boolean;
  noHyphen: boolean;
  braces: boolean;
  count: number;
};

function uuidv4(): string {
  // Bevorzugt: native crypto.randomUUID (Browser/Node modern)
  if (
    typeof crypto !== "undefined" &&
    typeof (crypto as any).randomUUID === "function"
  ) {
    return (crypto as any).randomUUID();
  }
  // Fallback: RFC4122 v4 mit (krypto-)Zufall
  const bytes = new Uint8Array(16);
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  const hex = Array.from(bytes, toHex).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function formatUuid(u: string, o: Options) {
  let s = u;
  if (o.noHyphen) s = s.replace(/-/g, "");
  if (o.uppercase) s = s.toUpperCase();
  if (o.braces) s = `{${s}}`;
  return s;
}

export default function UUIDPage() {
  const [opts, setOpts] = useState<Options>({
    uppercase: false,
    noHyphen: false,
    braces: false,
    count: 1,
  });
  const [uuids, setUuids] = useState<string[]>([]);

  function generate() {
    const list: string[] = [];
    const n = Math.min(50, Math.max(1, opts.count));
    for (let i = 0; i < n; i++) list.push(formatUuid(uuidv4(), opts));
    setUuids(list);
  }

  useEffect(() => {
    // Initial nach Mount generieren (vermeidet SSR-Differenzen)
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(uuids.join("\n"));
    } catch {
      alert("Copy failed. Please copy manually.");
    }
  }

  return (
    <>
      <Head>
        <title>ToolHub UUID</title>
        <meta
          name="description"
          content="Instantly generate RFC 4122 UUIDs — copy-ready, offline."
        />
      </Head>

      <main>
        <Navbar isSubPage title="UUID" />

        <section className="wrap">
          <div className="card">
            <header className="cardHeader">
              <h1>UUID Generator (v4)</h1>
              <p className="muted">
                Generate copy-ready UUIDs. Options apply to each generated
                value.
              </p>
            </header>

            <div className="output">
              <textarea
                className="box"
                rows={Math.min(10, Math.max(3, uuids.length || 1))}
                readOnly
                value={uuids.join("\n")}
                placeholder="Your UUID will appear here…"
              />
              <div className="actions">
                <button className="btn" onClick={generate}>
                  Generate
                </button>
                <button
                  className="btn secondary"
                  onClick={copyAll}
                  disabled={!uuids.length}
                >
                  Copy all
                </button>
              </div>
            </div>

            <div className="grid">
              <label className="ctrl check">
                <input
                  type="checkbox"
                  checked={opts.uppercase}
                  onChange={(e) =>
                    setOpts((o) => ({ ...o, uppercase: e.target.checked }))
                  }
                />
                <span>Uppercase</span>
              </label>

              <label className="ctrl check">
                <input
                  type="checkbox"
                  checked={opts.noHyphen}
                  onChange={(e) =>
                    setOpts((o) => ({ ...o, noHyphen: e.target.checked }))
                  }
                />
                <span>Remove hyphens</span>
              </label>

              <label className="ctrl check">
                <input
                  type="checkbox"
                  checked={opts.braces}
                  onChange={(e) =>
                    setOpts((o) => ({ ...o, braces: e.target.checked }))
                  }
                />
                <span>Curly braces</span>
              </label>

              <label className="ctrl">
                <span>Count</span>
                <div className="countRow">
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={opts.count}
                    onChange={(e) =>
                      setOpts((o) => ({ ...o, count: Number(e.target.value) }))
                    }
                  />
                  <input
                    className="num"
                    type="number"
                    min={1}
                    max={50}
                    value={opts.count}
                    onChange={(e) => {
                      const v = Math.min(
                        50,
                        Math.max(1, Number(e.target.value || 0))
                      );
                      setOpts((o) => ({ ...o, count: v }));
                    }}
                  />
                </div>
              </label>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
