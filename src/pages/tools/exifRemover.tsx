import { useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";
import { FaDownload } from "react-icons/fa6";
import { motion } from "framer-motion";
import { parse as parseExif } from "exifr";

interface MetaEntry {
  key: string;
  value: string;
}

function formatValue(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "number") return Number(value.toFixed(6)).toString();
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
}

export default function ExifRemoverTool() {
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [metadata, setMetadata] = useState<MetaEntry[] | null>(null);
  const [hasGps, setHasGps] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cleanUrl, setCleanUrl] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<File | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    fileRef.current = file;
    setFileName(file.name);
    setMetadata(null);
    setCleanUrl("");
    setError("");
    setHasGps(false);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const tags = await parseExif(file, { gps: true });
      if (!tags) {
        setMetadata([]);
        return;
      }
      const entries = Object.entries(tags)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => ({ key, value: formatValue(value) }));
      setMetadata(entries);
      setHasGps("latitude" in tags && "longitude" in tags);
    } catch {
      setError("Could not read metadata from this file — it may not contain any.");
      setMetadata([]);
    }
  }

  async function stripAndDownload() {
    const file = fileRef.current;
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const img = await loadImage(file);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.drawImage(img, 0, 0);

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.95)
      );
      if (!blob) throw new Error("Could not encode image");

      const url = URL.createObjectURL(blob);
      setCleanUrl(url);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName.replace(/\.[^.]+$/, "") + "-clean.jpg";
      a.click();
    } catch {
      setError("Could not process this image.");
    } finally {
      setBusy(false);
    }
  }

  function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("load failed"));
      img.src = URL.createObjectURL(file);
    });
  }

  return (
    <>
      <Head>
        <title>ToolHub EXIF Viewer & Remover</title>
        <meta
          name="description"
          content="View EXIF metadata hidden in your photos and strip it before sharing — entirely in your browser, nothing is uploaded."
        />
      </Head>

      <main>
        <Navbar isSubPage title="EXIF Viewer & Remover" />

        <div className="base64Card">
          <div className="panel">
            <label className="fileField">
              <span className="fileFieldLabel">Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>

            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview" className="exifPreview" />
            )}

            {error && <p className="warn">{error}</p>}

            {hasGps && (
              <p className="warn">
                This photo contains GPS location data. Remove the metadata
                before sharing it if you don&apos;t want your location
                exposed.
              </p>
            )}

            {metadata && metadata.length === 0 && !error && (
              <p className="muted">No EXIF metadata found in this file.</p>
            )}

            {metadata && metadata.length > 0 && (
              <ul className="exifList">
                {metadata.map((entry) => (
                  <li key={entry.key}>
                    <span className="exifKey">{entry.key}</span>
                    <span className="exifValue">{entry.value}</span>
                  </li>
                ))}
              </ul>
            )}

            {cleanUrl && (
              <p className="muted">
                Downloaded a metadata-free copy of {fileName}.
              </p>
            )}

            <div className="actions">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={stripAndDownload}
                disabled={!fileName || busy}
              >
                <FaDownload />
              </motion.button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
