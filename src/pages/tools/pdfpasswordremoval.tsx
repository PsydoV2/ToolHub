"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";
import { FaFilePdf, FaFileDownload, FaFileUpload } from "react-icons/fa";
import { VscClearAll } from "react-icons/vsc";
import { unlockPdf, UnlockResult } from "@/lib/pdfUnlock";

type Stage =
  | "idle"
  | "analyzing"
  | "not-protected"
  | "unsupported"
  | "need-password"
  | "wrong-password"
  | "success";

export default function PdfPasswordRemoval() {
  const [fileName, setFileName] = useState("");
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState("");

  function applyResult(result: UnlockResult, name: string) {
    if (result.status === "not-protected") {
      setStage("not-protected");
    } else if (result.status === "unsupported") {
      setStage("unsupported");
      setReason(result.reason);
    } else if (result.status === "wrong-password") {
      // Only reached from the initial silent empty-password attempt.
      setStage("need-password");
    } else {
      const blob = new Blob([result.bytes as BlobPart], {
        type: "application/pdf",
      });
      setResultUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
      setResultName(name.replace(/\.pdf$/i, "") + "-unlocked.pdf");
      setStage("success");
    }
  }

  async function handleFile(file: File) {
    setStage("analyzing");
    setReason("");
    setPassword("");
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFileName(file.name);

    const bytes = new Uint8Array(await file.arrayBuffer());
    setFileBytes(bytes);
    const result = await unlockPdf(bytes, "");
    applyResult(result, file.name);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fileBytes || !password) return;
    setStage("analyzing");
    const result = await unlockPdf(fileBytes, password);
    if (result.status === "wrong-password") {
      setStage("wrong-password");
    } else {
      applyResult(result, fileName);
    }
  }

  function reset() {
    setFileName("");
    setFileBytes(null);
    setStage("idle");
    setReason("");
    setPassword("");
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  return (
    <>
      <Head>
        <title>ToolHub PDF Password Removal</title>
        <meta
          name="description"
          content="Remove a password from a PDF, entirely in your browser — no uploads."
        />
      </Head>
      <main>
        <Navbar isSubPage title="PDF Password Removal" />

        <div className="gpxcard">
          <label>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <FaFileUpload />
          </label>

          {fileName && (
            <div className="gpxfiles">
              <div className="gpxfile">
                <FaFilePdf />
                {fileName}
              </div>
            </div>
          )}

          {stage === "analyzing" && <p className="pdfNote">Analyzing…</p>}

          {stage === "not-protected" && (
            <p className="err">
              This PDF isn&apos;t password protected — there&apos;s nothing to
              remove.
            </p>
          )}

          {stage === "unsupported" && <p className="err">{reason}</p>}

          {(stage === "need-password" || stage === "wrong-password") && (
            <form className="pdfPasswordForm" onSubmit={handlePasswordSubmit}>
              <p className="pdfNote">
                This PDF requires a password to open. Enter it below to
                remove the protection — everything happens locally in your
                browser, the file is never uploaded.
              </p>
              <div className="pdfPasswordRow">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="PDF password"
                  autoFocus
                />
                <button type="submit" disabled={!password}>
                  Unlock
                </button>
              </div>
              {stage === "wrong-password" && (
                <p className="err">Wrong password. Please try again.</p>
              )}
            </form>
          )}

          {stage === "success" && resultUrl && (
            <div className="actions">
              <a className="pdfDownloadBtn" href={resultUrl} download={resultName}>
                <FaFileDownload /> Download unlocked PDF
              </a>
            </div>
          )}

          <div className="actions">
            <button onClick={reset} disabled={!fileName}>
              <VscClearAll /> Clear
            </button>
          </div>

          <p className="pdfNote pdfLimits">
            Supports the PDF Standard security handler: RC4 (40/128-bit),
            AES-128 and AES-256. PDFs using compressed cross-reference
            streams aren&apos;t supported yet.
          </p>
        </div>
      </main>
    </>
  );
}
