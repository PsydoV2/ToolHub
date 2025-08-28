import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";

type Op = { type: "equal" | "add" | "remove"; text: string };

function tokenize(input: string): string[] {
  // Wörter, Whitespaces und Satzzeichen getrennt
  return input.match(/\w+|\s+|[^\s\w]/g) ?? [];
}

function diffTokens(a: string, b: string): Op[] {
  const A = tokenize(a);
  const B = tokenize(b);
  const m = A.length,
    n = B.length;

  // LCS-DP
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        A[i - 1] === B[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Traceback
  const ops: Op[] = [];
  let i = m,
    j = n;
  while (i > 0 && j > 0) {
    if (A[i - 1] === B[j - 1]) {
      ops.push({ type: "equal", text: A[i - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      ops.push({ type: "remove", text: A[i - 1] });
      i--;
    } else {
      ops.push({ type: "add", text: B[j - 1] });
      j--;
    }
  }
  while (i-- > 0) ops.push({ type: "remove", text: A[i + 1] });
  while (j-- > 0) ops.push({ type: "add", text: B[j + 1] });

  ops.reverse();

  // gleichartige Nachbarn zusammenfassen
  const merged: Op[] = [];
  for (const o of ops) {
    const last = merged[merged.length - 1];
    if (last && last.type === o.type) last.text += o.text;
    else merged.push({ ...o });
  }
  return merged;
}

export default function DiffChecker() {
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");

  const ops = useMemo(() => diffTokens(oldText, newText), [oldText, newText]);

  const adds = useMemo(
    () =>
      ops
        .filter((o) => o.type === "add")
        .reduce((n, o) => n + o.text.length, 0),
    [ops]
  );
  const removes = useMemo(
    () =>
      ops
        .filter((o) => o.type === "remove")
        .reduce((n, o) => n + o.text.length, 0),
    [ops]
  );

  function swap() {
    setOldText(newText);
    setNewText(oldText);
  }
  function clearBoth() {
    setOldText("");
    setNewText("");
  }

  return (
    <>
      <Head>
        <title>ToolHub Diff</title>
        <meta
          name="description"
          content="Compare two texts and highlight differences (adds/removes) live."
        />
      </Head>
      <main>
        <Navbar isSubPage title="Diff" />

        <section className="wrap">
          <div className="card">
            <header className="cardHeader">
              <h1>Diff Checker</h1>
              <p className="muted">
                Paste two texts to see additions and removals highlighted.
              </p>
            </header>

            <div className="inputs">
              <label className="col">
                <span className="lbl">Original</span>
                <textarea
                  rows={8}
                  value={oldText}
                  onChange={(e) => setOldText(e.target.value)}
                  placeholder="Paste original text…"
                />
              </label>

              <label className="col">
                <span className="lbl">Modified</span>
                <textarea
                  rows={8}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Paste modified text…"
                />
              </label>
            </div>

            <div className="actions">
              <button className="btn" onClick={swap}>
                Swap
              </button>
              <button className="btn secondary" onClick={clearBoth}>
                Clear
              </button>
              <div className="spacer" />
              <span className="muted small">
                +{adds} / −{removes} chars
              </span>
            </div>

            <div className="diff">
              {ops.map((op, i) => {
                if (op.type === "equal") return <span key={i}>{op.text}</span>;
                if (op.type === "add")
                  return (
                    <mark key={i} className="add">
                      {op.text}
                    </mark>
                  );
                return (
                  <span key={i} className="del">
                    {op.text}
                  </span>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
