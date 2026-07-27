# ToolHub

A free collection of small, privacy-friendly browser tools. Everything runs
entirely client-side — no uploads, no tracking, no server processing.

## Tools

| Tool | Description |
| --- | --- |
| Password Generator | Secure, customizable passwords with strength feedback |
| UUID Generator | RFC 4122 UUIDs, copy-ready |
| Diff Checker | Word-level diff between two texts |
| GPX Merge | Merge multiple GPX files (tracks, routes, waypoints) into one |
| Hasher | MD5 / SHA-1 / SHA-256 / SHA-384 / SHA-512 for text or files |
| Base64 | Encode/decode Base64 text |
| JSON Formatter | Format, minify and validate JSON |
| Text Case Converter | UPPERCASE, lowercase, Title Case, camelCase, snake_case, kebab-case, plus word/character counts |
| Color Converter | HEX ↔ RGB ↔ HSL |
| PDF Password Removal | Remove a password or permission lock from a PDF (RC4, AES-128, AES-256) |
| Image to PDF | Work in progress |

Tools are tagged (`security`, `dev`, `text`, `files`, …) and filterable from
the homepage.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Building

```bash
npm run build
```

This produces a static export in `out/` (see `next.config.ts`,
`output: "export"`) — the whole site is static HTML/JS/CSS with no backend.

## Project structure

```
src/
  components/   Navbar, Footer, ToolItem (homepage card)
  lib/          Shared logic (crypto primitives, PDF parsing)
  pages/        One file per route; pages/tools/* are the individual tools
  styles/       Single global stylesheet (CSS custom properties for theming)
public/
  ToolIcons/    Per-tool icons shown on the homepage
```

## Adding a new tool

1. Add a page under `src/pages/tools/your-tool.tsx` (copy an existing simple
   tool as a starting point).
2. Add an icon to `public/ToolIcons/`.
3. Add an entry to the `TOOLS` array in `src/pages/index.tsx`, including a
   `tags` list so it shows up in the tag filter.

## Tech

Next.js (Pages Router, static export) · React · TypeScript · Framer Motion ·
plain CSS with light/dark theme support via CSS custom properties.
