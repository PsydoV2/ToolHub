import { useEffect, useRef, useState, type ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";
import { MdQrCode2 } from "react-icons/md";
import { FaCopy, FaChevronDown, FaChevronUp } from "react-icons/fa6";
import { motion } from "framer-motion";
import jsQR from "jsqr";
import {
  buildMatrix,
  renderQrToCanvas,
  renderQrToSvg,
  perceivedBrightness,
  SCAN_RISK_BRIGHTNESS_THRESHOLD,
  type ShapeStyle,
} from "@/lib/qrRender";

type ErrorLevel = "L" | "M" | "Q" | "H";
type ExportFormat = "png" | "jpeg" | "webp" | "svg";
type Quality = "2" | "4" | "8";

const PREVIEW_SIZE = 320;
const QUALITY_BASE = 128;

const SHAPE_OPTIONS: { value: ShapeStyle; label: string }[] = [
  { value: "circle", label: "Circle" },
  { value: "rounded", label: "Rounded" },
  { value: "square", label: "Square" },
];

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WebP" },
  { value: "svg", label: "SVG" },
];

const QUALITY_OPTIONS: { value: Quality; label: string }[] = [
  { value: "2", label: "2x" },
  { value: "4", label: "4x" },
  { value: "8", label: "8x" },
];

function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="segGroup">
      {options.map((opt) => (
        <motion.button
          key={opt.value}
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className={value === opt.value ? "active" : ""}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </motion.button>
      ))}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="qrSection">
      <button type="button" className="qrSectionHeader" onClick={() => setOpen((o) => !o)}>
        {title}
        {open ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      {open && <div className="qrSectionBody">{children}</div>}
    </div>
  );
}

export default function QrCodeTool() {
  const [mode, setMode] = useState<"generate" | "scan">("generate");

  // Content
  const [text, setText] = useState("");
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>("M");

  // Style
  const [dotShape, setDotShape] = useState<ShapeStyle>("square");
  const [finderOuterShape, setFinderOuterShape] = useState<ShapeStyle>("square");
  const [finderInnerShape, setFinderInnerShape] = useState<ShapeStyle>("square");

  // Colors
  const [dotColor, setDotColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [finderBorderColor, setFinderBorderColor] = useState("#000000");
  const [finderDotColor, setFinderDotColor] = useState("#000000");

  // Center overlay
  const [overlayText, setOverlayText] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);

  // Badge
  const [badgeLabel, setBadgeLabel] = useState("");
  const [badgeColor, setBadgeColor] = useState("#4f46e5");
  const [badgeCornerShape, setBadgeCornerShape] = useState<ShapeStyle>("rounded");

  // Export
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState<Quality>("4");

  const [dataUrl, setDataUrl] = useState("");
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Scan
  const [scanResult, setScanResult] = useState("");
  const [scanError, setScanError] = useState("");
  const scanCanvasRef = useRef<HTMLCanvasElement>(null);

  const style = {
    dotShape,
    finderOuterShape,
    finderInnerShape,
    dotColor,
    bgColor,
    finderBorderColor,
    finderDotColor,
    errorCorrectionLevel: errorLevel,
  };
  const overlay = {
    overlayText,
    logoUrl: logoDataUrl,
    badgeLabel,
    badgeColor,
    badgeCornerShape,
  };

  const riskyColorFields = [
    { label: "Dot", color: dotColor },
    { label: "Finder border", color: finderBorderColor },
    { label: "Finder dot", color: finderDotColor },
  ].filter((f) => perceivedBrightness(f.color) > SCAN_RISK_BRIGHTNESS_THRESHOLD);

  useEffect(() => {
    if (!text) return;

    try {
      const matrix = buildMatrix(text, errorLevel);
      const canvas = previewCanvasRef.current ?? document.createElement("canvas");
      renderQrToCanvas(canvas, matrix, style, overlay, logoImg, PREVIEW_SIZE);
      setDataUrl(canvas.toDataURL("image/png"));
    } catch {
      setDataUrl("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    text,
    dotShape,
    finderOuterShape,
    finderInnerShape,
    dotColor,
    bgColor,
    finderBorderColor,
    finderDotColor,
    errorLevel,
    overlayText,
    logoImg,
    badgeLabel,
    badgeColor,
    badgeCornerShape,
  ]);

  function handleTextChange(value: string) {
    setText(value);
    if (!value) setDataUrl("");
  }

  function handleLogo(file: File | undefined) {
    if (!file) {
      setLogoDataUrl(null);
      setLogoImg(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const img = new Image();
      img.onload = () => {
        setLogoDataUrl(url);
        setLogoImg(img);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  }

  function download() {
    if (!text) return;
    const pixelSize = QUALITY_BASE * Number(quality);
    const matrix = buildMatrix(text, errorLevel);

    if (format === "svg") {
      const svg = renderQrToSvg(matrix, style, overlay, logoDataUrl, pixelSize);
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "qrcode.svg";
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const canvas = document.createElement("canvas");
    renderQrToCanvas(canvas, matrix, style, overlay, logoImg, pixelSize);
    const mime =
      format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
    const url = canvas.toDataURL(mime, format === "jpeg" ? 0.95 : undefined);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qrcode.${format === "jpeg" ? "jpg" : format}`;
    a.click();
  }

  async function copyText() {
    if (!scanResult) return;
    await navigator.clipboard.writeText(scanResult);
  }

  function scanFile(file: File | undefined) {
    if (!file) return;
    setScanResult("");
    setScanError("");

    const img = new Image();
    img.onload = () => {
      const canvas = scanCanvasRef.current ?? document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        setScanResult(code.data);
      } else {
        setScanError("No QR code found in this image.");
      }
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => setScanError("Could not load image.");
    img.src = URL.createObjectURL(file);
  }

  return (
    <>
      <Head>
        <title>ToolHub QR Code</title>
        <meta
          name="description"
          content="Generate styled QR codes with custom colors, dot and finder shapes, a center logo or text, and an optional badge — export as PNG, JPEG, WebP or SVG, and scan QR codes from images, entirely in your browser."
        />
      </Head>

      <main>
        <Navbar isSubPage title="QR Code" />

        <div className="base64Card">
          <div className="hashControls">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={mode === "generate" ? "active" : ""}
              onClick={() => setMode("generate")}
            >
              Generate
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={mode === "scan" ? "active" : ""}
              onClick={() => setMode("scan")}
            >
              Scan
            </motion.button>
          </div>

          {mode === "generate" ? (
            <div className="panel">
              <textarea
                rows={3}
                placeholder="Text or URL to encode…"
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
              />

              <div className="qrPreview">
                {dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dataUrl} alt="Generated QR code" width={240} height={240} />
                ) : (
                  <div className="qrPlaceholder">
                    <MdQrCode2 />
                  </div>
                )}
              </div>

              <Section title="Style">
                <label className="fileFieldLabel">Dot shape</label>
                <Seg options={SHAPE_OPTIONS} value={dotShape} onChange={setDotShape} />
                <label className="fileFieldLabel">Finder outer shape</label>
                <Seg
                  options={SHAPE_OPTIONS}
                  value={finderOuterShape}
                  onChange={setFinderOuterShape}
                />
                <label className="fileFieldLabel">Finder inner shape</label>
                <Seg
                  options={SHAPE_OPTIONS}
                  value={finderInnerShape}
                  onChange={setFinderInnerShape}
                />
              </Section>

              <Section title="Colors">
                <div className="qrColorRow">
                  <label className="qrColorField">
                    <span className="fileFieldLabel">Dot</span>
                    <input
                      type="color"
                      value={dotColor}
                      onChange={(e) => setDotColor(e.target.value)}
                    />
                  </label>
                  <label className="qrColorField">
                    <span className="fileFieldLabel">Background</span>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                    />
                  </label>
                  <label className="qrColorField">
                    <span className="fileFieldLabel">Finder border</span>
                    <input
                      type="color"
                      value={finderBorderColor}
                      onChange={(e) => setFinderBorderColor(e.target.value)}
                    />
                  </label>
                  <label className="qrColorField">
                    <span className="fileFieldLabel">Finder dot</span>
                    <input
                      type="color"
                      value={finderDotColor}
                      onChange={(e) => setFinderDotColor(e.target.value)}
                    />
                  </label>
                </div>
                {riskyColorFields.length > 0 && (
                  <p className="warn">
                    {riskyColorFields.map((f) => f.label).join(", ")}{" "}
                    {riskyColorFields.length > 1 ? "colors are" : "color is"} too light to scan
                    reliably — use a darker shade.
                  </p>
                )}

                <label className="imgCompressorField">
                  <span className="fileFieldLabel">Error correction: {errorLevel}</span>
                  <select
                    value={errorLevel}
                    onChange={(e) => setErrorLevel(e.target.value as ErrorLevel)}
                  >
                    <option value="L">Low (~7%)</option>
                    <option value="M">Medium (~15%)</option>
                    <option value="Q">Quartile (~25%)</option>
                    <option value="H">High (~30%)</option>
                  </select>
                </label>
                {(overlayText || logoDataUrl) && errorLevel !== "H" && errorLevel !== "Q" && (
                  <p className="muted">
                    Tip: use Quartile or High error correction when adding a logo or center text,
                    so the code stays scannable.
                  </p>
                )}
              </Section>

              <Section title="Center overlay">
                <label className="imgCompressorField">
                  <span className="fileFieldLabel">Text</span>
                  <input
                    type="text"
                    className="qrTextInput"
                    placeholder="SCAN ME"
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                  />
                </label>
                <label className="fileField">
                  <span className="fileFieldLabel">Logo (optional)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogo(e.target.files?.[0])}
                  />
                </label>
              </Section>

              <Section title="Badge">
                <label className="imgCompressorField">
                  <span className="fileFieldLabel">Label</span>
                  <input
                    type="text"
                    className="qrTextInput"
                    placeholder="Visit our website"
                    value={badgeLabel}
                    onChange={(e) => setBadgeLabel(e.target.value)}
                  />
                </label>
                <label className="qrColorField">
                  <span className="fileFieldLabel">Color</span>
                  <input
                    type="color"
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                  />
                </label>
                <label className="fileFieldLabel">Corner shape</label>
                <Seg
                  options={SHAPE_OPTIONS}
                  value={badgeCornerShape}
                  onChange={setBadgeCornerShape}
                />
              </Section>

              <div className="qrDownloadRow">
                <label className="fileFieldLabel">Format</label>
                <Seg options={FORMAT_OPTIONS} value={format} onChange={setFormat} />
                <label className="fileFieldLabel">Quality</label>
                <Seg options={QUALITY_OPTIONS} value={quality} onChange={setQuality} />

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="qrDownloadBtn"
                  onClick={download}
                  disabled={!dataUrl}
                >
                  Download {format.toUpperCase()}
                </motion.button>
              </div>

              <canvas ref={previewCanvasRef} style={{ display: "none" }} />
            </div>
          ) : (
            <div className="panel">
              <label className="fileField">
                <span className="fileFieldLabel">Image with a QR code</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => scanFile(e.target.files?.[0])}
                />
              </label>

              {scanError && <p className="warn">{scanError}</p>}

              <textarea
                rows={4}
                readOnly
                placeholder="Decoded content will appear here…"
                value={scanResult}
              />

              <div className="actions">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={copyText}
                  disabled={!scanResult}
                >
                  <FaCopy />
                </motion.button>
              </div>

              <canvas ref={scanCanvasRef} style={{ display: "none" }} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
