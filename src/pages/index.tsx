import Navbar from "@/components/Navbar";
import ToolItem from "@/components/ToolItem";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>ToolHub — Free, Privacy-Friendly Browser Tools</title>
        <meta
          name="description"
          content="A free collection of small, privacy-friendly tools that run entirely in your browser — password generator, UUID generator, diff checker, file hasher and more. No uploads, no tracking."
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="ToolHub — Free, Privacy-Friendly Browser Tools" />
        <meta
          property="og:description"
          content="Small, privacy-friendly tools that run entirely in your browser — no uploads, no tracking."
        />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="ToolHub — Free, Privacy-Friendly Browser Tools" />
        <meta
          name="twitter:description"
          content="Small, privacy-friendly tools that run entirely in your browser — no uploads, no tracking."
        />
      </Head>
      <main>
        <Navbar title="ToolHub"></Navbar>
        <p className="hero">
          Free, client-side tools for everyday tasks. Everything runs
          locally in your browser — your files and data are never uploaded.
        </p>
        <div className="toolWrapper">
          <ToolItem
            toolDescription="Secure, customizable passwords on demand — local-only generation, strength feedback, one-click copy."
            toolName="Passwordgenerator"
            toolLink="/tools/password"
            toolIconUrl="/ToolIcons/password.svg"
            toolImageUrl=""
          ></ToolItem>
          <ToolItem
            toolDescription="Instantly generate RFC 4122 UUIDs — copy-ready, offline."
            toolName="UUID Generator"
            toolLink="/tools/uuid"
            toolIconUrl="/ToolIcons/uuid.svg"
            toolImageUrl=""
          ></ToolItem>
          <ToolItem
            toolDescription="Diff Checker is a fast, privacy-friendly tool to compare two texts and instantly highlight additions and deletions with word-level diffs."
            toolName="Diff Checker"
            toolLink="/tools/diffChecker"
            toolIconUrl="/ToolIcons/diffChecker.svg"
            toolImageUrl=""
          ></ToolItem>
          <ToolItem
            toolDescription="Merge multiple GPX files client-side—keeps POIs, tracks, routes; recalculates bounds; one click to download."
            toolName="GPX Merge"
            toolLink="/tools/gpxmerge"
            toolIconUrl="/ToolIcons/gpxmerge.svg"
            toolImageUrl=""
          ></ToolItem>
          <ToolItem
            toolDescription="Client-side file hashing—supports SHA-256/512, SHA-1, MD5"
            toolName="Hasher"
            toolLink="/tools/hashGen"
            toolIconUrl="/ToolIcons/hashGen.svg"
            toolImageUrl=""
            isNew
          ></ToolItem>
          <ToolItem
            toolDescription=""
            toolName="Image to PDF"
            toolLink="/tools/imgtopdf"
            toolIconUrl="/ToolIcons/pngtopdf.svg"
            toolImageUrl=""
            isWorkInProgress
          ></ToolItem>
          <ToolItem
            toolDescription=""
            toolName="PDF Password removal"
            toolLink="/tools/pdfpasswordremoval"
            toolIconUrl="/ToolIcons/pdfpasswordremoval.svg"
            toolImageUrl=""
            isWorkInProgress
          ></ToolItem>
        </div>
      </main>
    </>
  );
}
