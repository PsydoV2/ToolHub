import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";
import { FaCopy, FaTrash } from "react-icons/fa6";
import { motion } from "framer-motion";

function words(text: string) {
  return text.trim().length ? text.trim().split(/\s+/) : [];
}

const CASES: { label: string; transform: (text: string) => string }[] = [
  { label: "UPPERCASE", transform: (t) => t.toUpperCase() },
  { label: "lowercase", transform: (t) => t.toLowerCase() },
  {
    label: "Title Case",
    transform: (t) =>
      t.replace(
        /\w\S*/g,
        (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      ),
  },
  {
    label: "Sentence case",
    transform: (t) =>
      t
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, (m) => m.toUpperCase()),
  },
  {
    label: "camelCase",
    transform: (t) =>
      words(t)
        .map((w, i) =>
          i === 0
            ? w.toLowerCase()
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        .join(""),
  },
  {
    label: "snake_case",
    transform: (t) =>
      words(t)
        .map((w) => w.toLowerCase())
        .join("_"),
  },
  {
    label: "kebab-case",
    transform: (t) =>
      words(t)
        .map((w) => w.toLowerCase())
        .join("-"),
  },
];

export default function TextCase() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const stats = useMemo(
    () => ({
      chars: input.length,
      words: words(input).length,
      lines: input.length ? input.split(/\n/).length : 0,
    }),
    [input]
  );

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
  }

  function clear() {
    setInput("");
    setOutput("");
  }

  return (
    <>
      <Head>
        <title>ToolHub Text Case Converter</title>
        <meta
          name="description"
          content="Convert text case (upper, lower, title, camelCase, snake_case…) and count words/characters, entirely in your browser."
        />
      </Head>

      <main>
        <Navbar isSubPage title="Text Case Converter" />

        <div className="base64Card">
          <div className="panel">
            <textarea
              rows={6}
              placeholder="Type or paste text…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            <div className="textStats">
              <span>{stats.chars} chars</span>
              <span>{stats.words} words</span>
              <span>{stats.lines} lines</span>
            </div>

            <div className="caseButtons">
              {CASES.map((c) => (
                <motion.button
                  key={c.label}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setOutput(c.transform(input))}
                  disabled={!input}
                >
                  {c.label}
                </motion.button>
              ))}
            </div>

            <textarea
              rows={6}
              readOnly
              placeholder="Result…"
              value={output}
            />

            <div className="actions">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyOutput}
                disabled={!output}
              >
                <FaCopy />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={clear}
                disabled={!input && !output}
              >
                <FaTrash />
              </motion.button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
