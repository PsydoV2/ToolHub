import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";

const FLAGS: { key: string; label: string }[] = [
  { key: "g", label: "global" },
  { key: "i", label: "ignore case" },
  { key: "m", label: "multiline" },
  { key: "s", label: "dot all" },
  { key: "u", label: "unicode" },
];

interface Match {
  match: string;
  index: number;
  groups: string[];
}

export default function RegexTesterTool() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState<Set<string>>(new Set(["g"]));
  const [testText, setTestText] = useState("");

  function toggleFlag(flag: string) {
    setFlags((current) => {
      const next = new Set(current);
      if (next.has(flag)) next.delete(flag);
      else next.add(flag);
      return next;
    });
  }

  const { regex, error } = useMemo(() => {
    if (!pattern) return { regex: null, error: "" };
    try {
      return { regex: new RegExp(pattern, Array.from(flags).join("")), error: "" };
    } catch (e) {
      return {
        regex: null,
        error: e instanceof Error ? e.message : "Invalid regular expression.",
      };
    }
  }, [pattern, flags]);

  const matches: Match[] = useMemo(() => {
    if (!regex || !testText) return [];
    if (!flags.has("g")) {
      const m = regex.exec(testText);
      return m ? [{ match: m[0], index: m.index, groups: m.slice(1) }] : [];
    }

    const found: Match[] = [];
    const re = new RegExp(regex.source, regex.flags);
    let m: RegExpExecArray | null;
    let guard = 0;
    while ((m = re.exec(testText)) !== null && guard < 10000) {
      found.push({ match: m[0], index: m.index, groups: m.slice(1) });
      if (m[0].length === 0) re.lastIndex++;
      guard++;
    }
    return found;
  }, [regex, testText, flags]);

  const highlighted = useMemo(() => {
    if (!matches.length) return null;
    const parts: { text: string; isMatch: boolean }[] = [];
    let cursor = 0;
    for (const m of matches) {
      if (m.index > cursor) parts.push({ text: testText.slice(cursor, m.index), isMatch: false });
      parts.push({ text: m.match, isMatch: true });
      cursor = m.index + m.match.length;
    }
    if (cursor < testText.length) parts.push({ text: testText.slice(cursor), isMatch: false });
    return parts;
  }, [matches, testText]);

  return (
    <>
      <Head>
        <title>ToolHub Regex Tester</title>
        <meta
          name="description"
          content="Test regular expressions against sample text with live match highlighting, entirely in your browser."
        />
      </Head>

      <main>
        <Navbar isSubPage title="Regex Tester" />

        <div className="base64Card">
          <div className="panel">
            <div className="regexPatternRow">
              <span className="regexSlash">/</span>
              <input
                type="text"
                className="regexPatternInput"
                placeholder="pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
              />
              <span className="regexSlash">/{Array.from(flags).join("")}</span>
            </div>

            <div className="regexFlags">
              {FLAGS.map((f) => (
                <label key={f.key} className="regexFlagChip">
                  <input
                    type="checkbox"
                    checked={flags.has(f.key)}
                    onChange={() => toggleFlag(f.key)}
                  />
                  <span>{f.key} — {f.label}</span>
                </label>
              ))}
            </div>

            {error && <p className="warn">{error}</p>}

            <textarea
              rows={6}
              placeholder="Test string…"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
            />

            {highlighted && (
              <div className="regexPreview">
                {highlighted.map((part, i) =>
                  part.isMatch ? (
                    <mark key={i}>{part.text}</mark>
                  ) : (
                    <span key={i}>{part.text}</span>
                  )
                )}
              </div>
            )}

            <div className="regexMatchCount">
              {pattern ? `${matches.length} match${matches.length === 1 ? "" : "es"}` : ""}
            </div>

            {matches.length > 0 && (
              <ul className="regexMatchList">
                {matches.map((m, i) => (
                  <li key={i}>
                    <span className="regexMatchIndex">#{i + 1}</span>
                    <code>{m.match || "(empty match)"}</code>
                    <span className="muted"> at index {m.index}</span>
                    {m.groups.length > 0 && (
                      <span className="muted">
                        {" "}
                        — groups: {m.groups.map((g) => g ?? "undefined").join(", ")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
