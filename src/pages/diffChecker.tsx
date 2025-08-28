import Head from "next/head";
import React, { ReactNode, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { FaArrowRightArrowLeft, FaEraser } from "react-icons/fa6";

type OpType = "equal" | "add" | "remove";
type Op = { type: OpType; tokens: string[] };

// --- Utilities -------------------------------------------------------------

function tokenizeWords(s: string): string[] {
  const text = (s ?? "").trim();
  if (!text) return [];
  return text
    .replace(/(\r\n|\r|\n)/g, " \n ")
    .split(/(\s+|[.,;:!?()"'`´„“”\[\]{}<>])/)
    .filter((t) => t && !/^\s+$/.test(t));
}

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

function renderWithBreaks(text: string) {
  const parts = text.split("\n");
  const out: (string | ReactNode)[] = [];
  parts.forEach((p, idx) => {
    out.push(p);
    if (idx < parts.length - 1) out.push(<br key={`br-${idx}`} />);
  });
  return out;
}

// --- Component -------------------------------------------------------------

export default function DiffChecker() {
  const [left, setLeft] = useState<string>("");
  const [right, setRight] = useState<string>("");

  const tokensA = useMemo(() => tokenizeWords(left), [left]);
  const tokensB = useMemo(() => tokenizeWords(right), [right]);

  const ops = useMemo<Op[]>(
    () => lcsDiff(tokensA, tokensB),
    [tokensA, tokensB]
  );

  // Stats (Zeichen, nicht nur Tokens)
  const addsChars = useMemo(
    () =>
      ops
        .filter((o) => o.type === "add")
        .reduce(
          (acc, o) => acc + o.tokens.reduce((a, t) => a + t.length, 0),
          0
        ),
    [ops]
  );
  const removesChars = useMemo(
    () =>
      ops
        .filter((o) => o.type === "remove")
        .reduce(
          (acc, o) => acc + o.tokens.reduce((a, t) => a + t.length, 0),
          0
        ),
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
            <button className="btn" onClick={swap}>
              <FaArrowRightArrowLeft />
            </button>
            <button className="btn secondary" onClick={clearBoth}>
              <FaEraser />
            </button>
            <span>
              +{addsChars} / −{removesChars} chars
            </span>
          </div>

          <div className="diff">
            {ops.length === 0 && (
              <p className="muted">Enter text to see the diff.</p>
            )}
            {ops.map((op, i) => {
              const text = op.tokens.join("");
              if (!text) return null;
              const content = renderWithBreaks(text);
              if (op.type === "equal") return <span key={i}>{content}</span>;
              if (op.type === "add")
                return (
                  <mark key={i} className="add">
                    {content}
                  </mark>
                );
              return (
                <span key={i} className="del">
                  {content}
                </span>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
