import { useState } from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";
import { FaCopy, FaTrash } from "react-icons/fa6";
import { motion } from "framer-motion";

function toBase64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function fromBase64(b64: string) {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export default function Base64Tool() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function run(value: string, nextMode: "encode" | "decode") {
    setInput(value);
    if (!value) {
      setOutput("");
      setError("");
      return;
    }
    try {
      setOutput(nextMode === "encode" ? toBase64(value) : fromBase64(value));
      setError("");
    } catch {
      setOutput("");
      setError("Invalid input for this mode.");
    }
  }

  function switchMode(nextMode: "encode" | "decode") {
    setMode(nextMode);
    run(input, nextMode);
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
        <title>ToolHub Base64</title>
        <meta
          name="description"
          content="Encode and decode Base64 text, entirely in your browser."
        />
      </Head>

      <main>
        <Navbar isSubPage title="Base64" />

        <div className="base64Card">
          <div className="hashControls">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={mode === "encode" ? "active" : ""}
              onClick={() => switchMode("encode")}
            >
              Encode
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={mode === "decode" ? "active" : ""}
              onClick={() => switchMode("decode")}
            >
              Decode
            </motion.button>
          </div>

          <div className="panel">
            <textarea
              rows={6}
              placeholder={
                mode === "encode" ? "Text to encode…" : "Base64 to decode…"
              }
              value={input}
              onChange={(e) => run(e.target.value, mode)}
            />

            {error && <p className="warn">{error}</p>}

            <textarea rows={6} readOnly placeholder="Result…" value={output} />

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
