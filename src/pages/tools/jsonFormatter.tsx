import { useState } from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";
import { FaCopy, FaTrash } from "react-icons/fa6";
import { motion } from "framer-motion";

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function format(indent: number | undefined) {
    if (!input.trim()) {
      setOutput("");
      setError("");
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indent));
      setError("");
    } catch (e) {
      setOutput("");
      setError(e instanceof Error ? e.message : "Invalid JSON.");
    }
  }

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
  }

  function clear() {
    setInput("");
    setOutput("");
    setError("");
  }

  return (
    <>
      <Head>
        <title>ToolHub JSON Formatter</title>
        <meta
          name="description"
          content="Format, validate and minify JSON, entirely in your browser."
        />
      </Head>

      <main>
        <Navbar isSubPage title="JSON Formatter" />

        <div className="base64Card">
          <div className="hashControls">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => format(2)}
            >
              Format
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => format(undefined)}
            >
              Minify
            </motion.button>
          </div>

          <div className="panel">
            <textarea
              rows={8}
              placeholder="Paste JSON here…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            {error && <p className="warn">{error}</p>}

            <textarea
              rows={8}
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
