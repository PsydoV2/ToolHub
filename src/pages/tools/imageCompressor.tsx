import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";
import { FaDownload } from "react-icons/fa6";
import { motion } from "framer-motion";

type Format = "image/jpeg" | "image/webp" | "image/png";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageCompressorTool() {
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [quality, setQuality] = useState(0.8);
  const [format, setFormat] = useState<Format>("image/jpeg");
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);
  const [busy, setBusy] = useState(false);

  function handleFile(nextFile: File | undefined) {
    if (!nextFile) return;
    setFile(nextFile);
    setResultUrl("");
    setResultSize(0);

    const img = new Image();
    img.onload = () => {
      setImage(img);
      setMaxWidth(img.naturalWidth);
    };
    img.src = URL.createObjectURL(nextFile);
  }

  useEffect(() => {
    if (!image || !file) return;
    let cancelled = false;

    const scale = Math.min(1, maxWidth / image.naturalWidth);
    const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale));
    const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    const kickoff = setTimeout(() => {
      setBusy(true);
      canvas.toBlob(
        (blob) => {
          if (cancelled || !blob) {
            setBusy(false);
            return;
          }
          setResultUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(blob);
          });
          setResultSize(blob.size);
          setBusy(false);
        },
        format,
        format === "image/png" ? undefined : quality
      );
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(kickoff);
    };
  }, [image, file, maxWidth, quality, format]);

  function download() {
    if (!resultUrl || !file) return;
    const ext = format === "image/jpeg" ? "jpg" : format === "image/webp" ? "webp" : "png";
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = file.name.replace(/\.[^.]+$/, "") + `-compressed.${ext}`;
    a.click();
  }

  const savings =
    file && resultSize
      ? Math.round((1 - resultSize / file.size) * 100)
      : null;

  return (
    <>
      <Head>
        <title>ToolHub Image Compressor</title>
        <meta
          name="description"
          content="Resize and compress images entirely in your browser — no uploads, adjust quality and dimensions with instant preview."
        />
      </Head>

      <main>
        <Navbar isSubPage title="Image Compressor" />

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

            {image && (
              <>
                <div className="imgCompressorControls">
                  <label className="imgCompressorField">
                    <span className="fileFieldLabel">
                      Max width: {maxWidth}px (original {image.naturalWidth}px)
                    </span>
                    <input
                      type="range"
                      min={50}
                      max={image.naturalWidth}
                      value={maxWidth}
                      onChange={(e) => setMaxWidth(Number(e.target.value))}
                    />
                  </label>

                  {format !== "image/png" && (
                    <label className="imgCompressorField">
                      <span className="fileFieldLabel">
                        Quality: {Math.round(quality * 100)}%
                      </span>
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                      />
                    </label>
                  )}

                  <label className="imgCompressorField">
                    <span className="fileFieldLabel">Format</span>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value as Format)}
                    >
                      <option value="image/jpeg">JPEG</option>
                      <option value="image/webp">WebP</option>
                      <option value="image/png">PNG</option>
                    </select>
                  </label>
                </div>

                <div className="imgCompressorPreviewRow">
                  {resultUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resultUrl} alt="Compressed preview" className="exifPreview" />
                  )}
                </div>

                {file && (
                  <p className="muted">
                    {formatSize(file.size)} → {resultSize ? formatSize(resultSize) : "…"}
                    {savings !== null && savings > 0 && ` (${savings}% smaller)`}
                  </p>
                )}
              </>
            )}

            <div className="actions">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={download}
                disabled={!resultUrl || busy}
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
