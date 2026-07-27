"use client";

import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import ToolItem from "@/components/ToolItem";
import Head from "next/head";
import { AnimatePresence, motion } from "framer-motion";

interface Tool {
  name: string;
  description: string;
  link: string;
  icon: string;
  image?: string;
  tags: string[];
  category: string;
  isNew?: boolean;
  isWorkInProgress?: boolean;
}

const CATEGORY_ORDER = ["Generators", "Text & Dev", "Files & Images", "Design"];

const TOOLS: Tool[] = [
  {
    name: "Passwordgenerator",
    description:
      "Secure, customizable passwords on demand — local-only generation, strength feedback, one-click copy.",
    link: "/tools/password",
    icon: "/ToolIcons/password.svg",
    tags: ["security", "generator"],
    category: "Generators",
  },
  {
    name: "UUID Generator",
    description: "Instantly generate RFC 4122 UUIDs — copy-ready, offline.",
    link: "/tools/uuid",
    icon: "/ToolIcons/uuid.svg",
    tags: ["generator", "dev"],
    category: "Generators",
  },
  {
    name: "QR Code",
    description:
      "Generate QR codes from text or URLs, and scan QR codes from images — entirely offline.",
    link: "/tools/qrcode",
    icon: "/ToolIcons/qrcode.svg",
    tags: ["generator", "encoding", "dev"],
    category: "Generators",
    isNew: true,
  },
  {
    name: "Diff Checker",
    description:
      "Diff Checker is a fast, privacy-friendly tool to compare two texts and instantly highlight additions and deletions with word-level diffs.",
    link: "/tools/diffChecker",
    icon: "/ToolIcons/diffChecker.svg",
    tags: ["text", "dev"],
    category: "Text & Dev",
  },
  {
    name: "Base64",
    description:
      "Encode and decode Base64 text instantly, entirely in your browser.",
    link: "/tools/base64",
    icon: "/ToolIcons/base64.svg",
    tags: ["dev", "text", "encoding"],
    category: "Text & Dev",
  },
  {
    name: "JSON Formatter",
    description:
      "Format, validate and minify JSON with clear error messages.",
    link: "/tools/jsonFormatter",
    icon: "/ToolIcons/jsonFormatter.svg",
    tags: ["dev", "text"],
    category: "Text & Dev",
  },
  {
    name: "Text Case Converter",
    description:
      "Switch between UPPERCASE, lowercase, Title Case, camelCase and more, plus word/character counts.",
    link: "/tools/textCase",
    icon: "/ToolIcons/textCase.svg",
    tags: ["text"],
    category: "Text & Dev",
  },
  {
    name: "Regex Tester",
    description:
      "Test regular expressions against sample text with live match highlighting and group capture.",
    link: "/tools/regexTester",
    icon: "/ToolIcons/regexTester.svg",
    tags: ["dev", "text"],
    category: "Text & Dev",
    isNew: true,
  },
  {
    name: "JWT Decoder",
    description:
      "Decode JSON Web Token headers and payloads locally. Signatures are never verified or sent anywhere.",
    link: "/tools/jwtDecoder",
    icon: "/ToolIcons/jwtDecoder.svg",
    tags: ["dev", "encoding", "security"],
    category: "Text & Dev",
    isNew: true,
  },
  {
    name: "Markdown Converter",
    description:
      "Convert Markdown to HTML with a live preview, or HTML back to Markdown.",
    link: "/tools/markdown",
    icon: "/ToolIcons/markdown.svg",
    tags: ["dev", "text"],
    category: "Text & Dev",
    isNew: true,
  },
  {
    name: "Timestamp Converter",
    description:
      "Convert Unix epoch timestamps to human-readable dates and back, with a live clock.",
    link: "/tools/timestamp",
    icon: "/ToolIcons/timestamp.svg",
    tags: ["dev", "time"],
    category: "Text & Dev",
    isNew: true,
  },
  {
    name: "Hasher",
    description: "Client-side file hashing—supports SHA-256/512, SHA-1, MD5",
    link: "/tools/hashGen",
    icon: "/ToolIcons/hashGen.svg",
    tags: ["security", "files", "dev"],
    category: "Files & Images",
  },
  {
    name: "GPX Merge",
    description:
      "Merge multiple GPX files client-side—keeps POIs, tracks, routes; recalculates bounds; one click to download.",
    link: "/tools/gpxmerge",
    icon: "/ToolIcons/gpxmerge.svg",
    tags: ["files", "geo"],
    category: "Files & Images",
  },
  {
    name: "Image to PDF",
    description: "",
    link: "/tools/imgtopdf",
    icon: "/ToolIcons/pngtopdf.svg",
    tags: ["files", "pdf"],
    category: "Files & Images",
    isWorkInProgress: true,
  },
  {
    name: "PDF Password Removal",
    description:
      "Remove a password or permission lock from a PDF, entirely in your browser — supports RC4, AES-128 and AES-256.",
    link: "/tools/pdfpasswordremoval",
    icon: "/ToolIcons/pdfpasswordremoval.svg",
    tags: ["files", "pdf", "security"],
    category: "Files & Images",
  },
  {
    name: "EXIF Viewer & Remover",
    description:
      "View hidden EXIF metadata in your photos — including GPS location — and strip it before sharing.",
    link: "/tools/exifRemover",
    icon: "/ToolIcons/exifRemover.svg",
    tags: ["files", "security", "images"],
    category: "Files & Images",
    isNew: true,
  },
  {
    name: "Image Compressor",
    description:
      "Resize and compress images with instant before/after size comparison and a live preview.",
    link: "/tools/imageCompressor",
    icon: "/ToolIcons/imageCompressor.svg",
    tags: ["files", "images"],
    category: "Files & Images",
    isNew: true,
  },
  {
    name: "Color Converter",
    description: "Convert colors between HEX, RGB and HSL.",
    link: "/tools/colorConverter",
    icon: "/ToolIcons/colorConverter.svg",
    tags: ["design", "dev"],
    category: "Design",
  },
];

const ALL_TAGS = Array.from(new Set(TOOLS.flatMap((t) => t.tags))).sort();

export default function Home() {
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const filteredTools = useMemo(() => {
    if (activeTags.length === 0) return TOOLS;
    return TOOLS.filter((tool) =>
      activeTags.some((tag) => tool.tags.includes(tag))
    );
  }, [activeTags]);

  const groupedTools = useMemo(() => {
    const groups = new Map<string, Tool[]>();
    for (const tool of filteredTools) {
      const bucket = groups.get(tool.category) ?? [];
      bucket.push(tool);
      groups.set(tool.category, bucket);
    }
    return CATEGORY_ORDER.map((category) => ({
      category,
      tools: groups.get(category) ?? [],
    })).filter((group) => group.tools.length > 0);
  }, [filteredTools]);

  function toggleTag(tag: string) {
    setActiveTags((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag]
    );
  }

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

        <div
          className="tagFilterBar"
          role="group"
          aria-label="Filter tools by tag"
        >
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              className={`tagChip${activeTags.includes(tag) ? " active" : ""}`}
              aria-pressed={activeTags.includes(tag)}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
          {activeTags.length > 0 && (
            <button
              className="tagChip clear"
              onClick={() => setActiveTags([])}
            >
              Clear filters
            </button>
          )}
        </div>

        {groupedTools.map((group) => (
          <section className="toolSection" key={group.category}>
            {activeTags.length === 0 && (
              <h2 className="toolSectionTitle">{group.category}</h2>
            )}
            <div className="toolWrapper">
              <AnimatePresence mode="popLayout">
                {group.tools.map((tool) => (
                  <motion.div
                    key={tool.link}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ToolItem
                      toolDescription={tool.description}
                      toolName={tool.name}
                      toolLink={tool.link}
                      toolIconUrl={tool.icon}
                      toolImageUrl={tool.image ?? ""}
                      tags={tool.tags}
                      isNew={tool.isNew}
                      isWorkInProgress={tool.isWorkInProgress}
                    ></ToolItem>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        ))}

        {filteredTools.length === 0 && (
          <p className="noResults">No tools match the selected tags.</p>
        )}
      </main>
    </>
  );
}
