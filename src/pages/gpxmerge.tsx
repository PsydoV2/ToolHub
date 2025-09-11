"use client";
import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";
import { FaFileCode, FaFileDownload, FaFileUpload } from "react-icons/fa";
import { FaCodeMerge } from "react-icons/fa6";
import { VscClearAll } from "react-icons/vsc";

type Counts = {
  wpt: number;
  trk: number;
  trkseg: number;
  trkpt: number;
  rte: number;
  rtept: number;
};

const GPX_NS = "http://www.topografix.com/GPX/1/1";
const XSI_NS = "http://www.w3.org/2001/XMLSchema-instance";

function parseGpx(xml: string): Document {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const err = doc.getElementsByTagName("parsererror")[0];
  if (err) throw new Error("Invalid GPX/XML");
  return doc;
}

function els(doc: Document | Element, local: string): Element[] {
  // Namespaceneutral: holt alle Elemente mit passendem Tag (GPX nutzt Default-NS)
  return Array.from(
    (doc as Document).getElementsByTagNameNS?.("*", local) ??
      (doc as Element).getElementsByTagName(local)
  );
}

function importAll(merged: Document, parent: Element, nodes: Element[]) {
  for (const n of nodes) {
    parent.appendChild(merged.importNode(n, true));
  }
}

function collectCounts(doc: Document): Counts {
  const get = (name: string) => els(doc, name).length;
  return {
    wpt: get("wpt"),
    trk: get("trk"),
    trkseg: get("trkseg"),
    trkpt: get("trkpt"),
    rte: get("rte"),
    rtept: get("rtept"),
  };
}

function computeBounds(docs: Document[]) {
  let minlat = +Infinity,
    minlon = +Infinity,
    maxlat = -Infinity,
    maxlon = -Infinity;
  const pull = (e: Element) => {
    const lat = parseFloat(e.getAttribute("lat") || "");
    const lon = parseFloat(e.getAttribute("lon") || "");
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      if (lat < minlat) minlat = lat;
      if (lon < minlon) minlon = lon;
      if (lat > maxlat) maxlat = lat;
      if (lon > maxlon) maxlon = lon;
    }
  };
  for (const d of docs) {
    els(d, "wpt").forEach(pull);
    els(d, "trkpt").forEach(pull);
    els(d, "rtept").forEach(pull);
  }
  if (!Number.isFinite(minlat)) return null;
  return { minlat, minlon, maxlat, maxlon };
}

function buildMerged(docs: Document[]) {
  const impl = document.implementation;
  const merged = impl.createDocument(GPX_NS, "gpx", null);
  const root = merged.documentElement;

  // Root-Attribute
  root.setAttribute("version", "1.1");
  root.setAttribute("creator", "ToolHub GPX Merge");
  root.setAttribute("xmlns", GPX_NS);
  root.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xsi", XSI_NS);
  root.setAttributeNS(
    XSI_NS,
    "xsi:schemaLocation",
    `${GPX_NS} http://www.topografix.com/GPX/1/1/gpx.xsd`
  );

  // (Optional) erste Metadata übernehmen
  const firstMeta = docs.map((d) => els(d, "metadata")[0]).find(Boolean);
  if (firstMeta) {
    root.appendChild(merged.importNode(firstMeta, true));
  } else {
    root.appendChild(merged.createElementNS(GPX_NS, "metadata"));
  }

  // WPT/TRK/RTE sammeln
  for (const d of docs) {
    importAll(merged, root, els(d, "wpt"));
    importAll(merged, root, els(d, "trk"));
    importAll(merged, root, els(d, "rte"));
  }

  // Bounds berechnen/setzen
  const bounds = computeBounds(docs);
  if (bounds) {
    // bounds in <metadata>, neu setzen/ersetzen
    const meta =
      els(merged, "metadata")[0] ||
      root.insertBefore(
        merged.createElementNS(GPX_NS, "metadata"),
        root.firstChild
      );
    // vorhandene bounds entfernen
    els(meta, "bounds").forEach((b) => b.parentElement?.removeChild(b));
    const b = merged.createElementNS(GPX_NS, "bounds");
    b.setAttribute("minlat", bounds.minlat.toFixed(6));
    b.setAttribute("minlon", bounds.minlon.toFixed(6));
    b.setAttribute("maxlat", bounds.maxlat.toFixed(6));
    b.setAttribute("maxlon", bounds.maxlon.toFixed(6));
    meta.appendChild(b);
  }

  const counts = collectCounts(merged);
  return { merged, counts };
}

function serialize(doc: Document): string {
  const xml = new XMLSerializer().serializeToString(doc);
  // XML declaration hinzufügen (optional, viele Apps mögen das)
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
}

export default function GpxMerge() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string>(""); // merged GPX XML
  const [counts, setCounts] = useState<Counts | null>(null);
  const [busy, setBusy] = useState(false);

  const fileInfo = useMemo(
    () =>
      files.map((f) => ({
        name: f.name,
        size: f.size,
      })),
    [files]
  );

  async function handleMerge() {
    setError(null);
    setBusy(true);
    setResult("");
    setCounts(null);

    try {
      if (!files.length) {
        setError("Please select at least one .gpx file.");
        setBusy(false);
        return;
      }

      // Dateien lesen & parsen
      const texts = await Promise.all(files.map((f) => f.text()));
      const docs = texts.map(parseGpx);

      // Mergen
      const { merged, counts } = buildMerged(docs);
      const xml = serialize(merged);

      setCounts(counts);
      setResult(xml);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Merging failed.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!result) return;
    const blob = new Blob([result], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `merged.gpx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Head>
        <title>ToolHub GPX Merge</title>
        <meta
          name="description"
          content="Merge multiple GPX files (waypoints, tracks, routes) into one."
        />
      </Head>

      <main>
        <Navbar isSubPage title="GPX Merge" />

        <div className="gpxcard">
          <label>
            <input
              type="file"
              accept=".gpx,application/gpx+xml"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
            <FaFileUpload />
          </label>

          {fileInfo.length > 0 && (
            <div className="gpxfiles">
              {fileInfo.map((f, i) => (
                <div key={i} className="gpxfile">
                  <FaFileCode />
                  {f.name}{" "}
                  <span className="muted">
                    ({(f.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="actions">
            <button
              className="btn"
              onClick={handleMerge}
              disabled={busy || !files.length}
            >
              <FaCodeMerge /> {busy ? "Merging…" : "Merge"}
            </button>
            <button
              className="btn secondary"
              onClick={() => {
                setFiles([]);
                setResult("");
                setCounts(null);
                setError(null);
              }}
              disabled={busy && true}
            >
              <VscClearAll />
              Clear
            </button>
            <div className="spacer" />
            <button className="btn" onClick={download} disabled={!result}>
              <FaFileDownload />
              Download .gpx
            </button>
          </div>

          {error && <p className="err">{error}</p>}

          {counts && (
            <div className="stats">
              <span>
                Waypoints: <b>{counts.wpt}</b>
              </span>
              <span>
                Tracks: <b>{counts.trk}</b>
              </span>
              <span>
                Track Segments: <b>{counts.trkseg}</b>
              </span>
              <span>
                Track Points: <b>{counts.trkpt}</b>
              </span>
              <span>
                Routes: <b>{counts.rte}</b>
              </span>
              <span>
                Route Points: <b>{counts.rtept}</b>
              </span>
            </div>
          )}

          {result && (
            <details className="preview">
              <summary>Preview XML</summary>
              <textarea readOnly value={result} rows={12} />
            </details>
          )}
        </div>
      </main>
    </>
  );
}
