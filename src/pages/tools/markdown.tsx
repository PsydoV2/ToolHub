import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";
import { FaCopy, FaTrash } from "react-icons/fa6";
import { motion } from "framer-motion";
import { marked } from "marked";
import DOMPurify from "dompurify";
import TurndownService from "turndown";

const turndownService = new TurndownService();

export default function MarkdownTool() {
  const [mode, setMode] = useState<"toHtml" | "toMarkdown">("toHtml");
  const [input, setInput] = useState("");

  const rawHtml = useMemo(() => {
    if (mode !== "toHtml" || !input) return "";
    return marked.parse(input, { async: false }) as string;
  }, [mode, input]);

  const safeHtml = useMemo(() => {
    if (typeof window === "undefined" || !rawHtml) return "";
    return DOMPurify.sanitize(rawHtml);
  }, [rawHtml]);

  const markdownOutput = useMemo(() => {
    if (mode !== "toMarkdown" || !input) return "";
    try {
      return turndownService.turndown(input);
    } catch {
      return "";
    }
  }, [mode, input]);

  const output = mode === "toHtml" ? rawHtml : markdownOutput;

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
  }

  function clear() {
    setInput("");
  }

  return (
    <>
      <Head>
        <title>ToolHub Markdown Converter</title>
        <meta
          name="description"
          content="Convert Markdown to HTML with a live preview, or HTML back to Markdown — entirely in your browser."
        />
      </Head>

      <main>
        <Navbar isSubPage title="Markdown Converter" />

        <div className="base64Card">
          <div className="hashControls">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={mode === "toHtml" ? "active" : ""}
              onClick={() => setMode("toHtml")}
            >
              Markdown → HTML
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={mode === "toMarkdown" ? "active" : ""}
              onClick={() => setMode("toMarkdown")}
            >
              HTML → Markdown
            </motion.button>
          </div>

          <div className="panel">
            <textarea
              rows={8}
              placeholder={
                mode === "toHtml" ? "Type or paste Markdown…" : "Type or paste HTML…"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            {mode === "toHtml" && (
              <div className="markdownPreview" dangerouslySetInnerHTML={{ __html: safeHtml }} />
            )}

            <textarea rows={8} readOnly placeholder="Result…" value={output} />

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
                disabled={!input}
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
