import Head from "next/head";
import React, { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { FaArrowRightArrowLeft, FaEraser } from "react-icons/fa6";

type OpType = "equal" | "add" | "remove";
type Op = { type: OpType; tokens: string[] };

// --- Utilities -------------------------------------------------------------

// Zeichenweise Tokenisierung (inkl. Leerzeichen und \n)
function tokenizeChars(s: string): string[] {
  if (s == null) return [];
  // Array.from bewahrt Surrogate-Pairs korrekt (Emoji etc.)
  return Array.from(s);
}

// LCS-Diff (unverändert, arbeitet jetzt auf Zeichenbasis)
function lcsDiff(a: string[], b: string[]): Op[] {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0)
  );
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const opsRev: { type: OpType; token: string }[] = [];
  let i = n,
    j = m;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      opsRev.push({ type: "equal", token: a[i - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      opsRev.push({ type: "remove", token: a[i - 1] });
      i--;
    } else {
      opsRev.push({ type: "add", token: b[j - 1] });
      j--;
    }
  }
  while (i > 0) {
    opsRev.push({ type: "remove", token: a[i - 1] });
    i--;
  }
  while (j > 0) {
    opsRev.push({ type: "add", token: b[j - 1] });
    j--;
  }

  const ops: Op[] = [];
  for (const { type, token } of opsRev.reverse()) {
    const last = ops[ops.length - 1];
    if (last && last.type === type) last.tokens.push(token);
    else ops.push({ type, tokens: [token] });
  }
  return ops;
}

// --- Component -------------------------------------------------------------

export default function DiffChecker() {
  const [left, setLeft] = useState<string>("");
  const [right, setRight] = useState<string>("");

  const tokensA = useMemo(() => tokenizeChars(left), [left]);
  const tokensB = useMemo(() => tokenizeChars(right), [right]);

  const ops = useMemo<Op[]>(
    () => lcsDiff(tokensA, tokensB),
    [tokensA, tokensB]
  );

  // Stats (Zeichen)
  const addsChars = useMemo(
    () =>
      ops
        .filter((o) => o.type === "add")
        .reduce((acc, o) => acc + o.tokens.length, 0),
    [ops]
  );
  const removesChars = useMemo(
    () =>
      ops
        .filter((o) => o.type === "remove")
        .reduce((acc, o) => acc + o.tokens.length, 0),
    [ops]
  );

  const swap = () => {
    setLeft(right);
    setRight(left);
  };
  const clearBoth = () => {
    setLeft("");
    setRight("");
  };

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
        <Navbar isSubPage title="Difference Checker" />

        <div className="diffCheckerWrap">
          <div className="inputs">
            <textarea
              rows={8}
              value={left}
              onChange={(e) => setLeft(e.target.value)}
              placeholder="Paste original text…"
            />

            <textarea
              rows={8}
              value={right}
              onChange={(e) => setRight(e.target.value)}
              placeholder="Paste modified text…"
            />
          </div>

          <div className="actions">
            <button className="btn" onClick={swap} aria-label="Swap">
              <FaArrowRightArrowLeft />
            </button>
            <button
              className="btn secondary"
              onClick={clearBoth}
              aria-label="Clear both"
            >
              <FaEraser />
            </button>
            <span>
              +{addsChars} / −{removesChars} chars
            </span>
          </div>

          {/* white-space: pre-wrap übernimmt Leerzeichen & Zeilenumbrüche */}
          <div className="diff">
            {ops.length === 0 && (
              <p className="muted">Enter text to see the diff.</p>
            )}
            {ops.map((op, i) => {
              const text = op.tokens.join("");
              if (!text) return null;
              if (op.type === "equal") return <span key={i}>{text}</span>;
              if (op.type === "add")
                return (
                  <mark key={i} className="add">
                    {text}
                  </mark>
                );
              return (
                <span key={i} className="del">
                  {text}
                </span>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
