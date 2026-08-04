import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";
import { MdQrCode2 } from "react-icons/md";
import { FaCopy, FaDownload, FaFileCode } from "react-icons/fa6";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import jsQR from "jsqr";

type ErrorLevel = "L" | "M" | "Q" | "H";

function embedLogoInSvg(svg: string, logoUrl: string, bgColor: string): string {
  const overlay = `<rect x="38%" y="38%" width="24%" height="24%" fill="${bgColor}"/><image x="40%" y="40%" width="20%" height="20%" href="${logoUrl}" xlink:href="${logoUrl}" preserveAspectRatio="xMidYMid slice"/>`;
  return svg
    .replace("<svg ", '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ')
    .replace("</svg>", `${overlay}</svg>`);
}

export default function QrCodeTool() {
  const [mode, setMode] = useState<"generate" | "scan">("generate");

  // Generate
  const [text, setText] = useState("");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>("M");
  const [size, setSize] = useState(320);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [dataUrl, setDataUrl] = useState("");
  const [svgMarkup, setSvgMarkup] = useState("");
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Scan
  const [scanResult, setScanResult] = useState("");
  const [scanError, setScanError] = useState("");

  useEffect(() => {
    if (!text) return;

    let cancelled = false;

    (async () => {
      try {
        const canvas = qrCanvasRef.current ?? document.createElement("canvas");
        await QRCode.toCanvas(canvas, text, {
          width: size,
          margin: 2,
          errorCorrectionLevel: errorLevel,
          color: { dark: fgColor, light: bgColor },
        });

        if (logoImg) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const logoSize = canvas.width * 0.22;
            const x = (canvas.width - logoSize) / 2;
            const y = (canvas.height - logoSize) / 2;
            const pad = logoSize * 0.12;
            ctx.fillStyle = bgColor;
            ctx.fillRect(x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2);
            ctx.drawImage(logoImg, x, y, logoSize, logoSize);
          }
        }

        const svg = await QRCode.toString(text, {
          type: "svg",
          margin: 2,
          errorCorrectionLevel: errorLevel,
          color: { dark: fgColor, light: bgColor },
        });

        if (cancelled) return;
        setDataUrl(canvas.toDataURL("image/png"));
        setSvgMarkup(logoDataUrl ? embedLogoInSvg(svg, logoDataUrl, bgColor) : svg);
      } catch {
        if (!cancelled) {
          setDataUrl("");
          setSvgMarkup("");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [text, fgColor, bgColor, errorLevel, size, logoImg, logoDataUrl]);

  function handleTextChange(value: string) {
    setText(value);
    if (!value) {
      setDataUrl("");
      setSvgMarkup("");
    }
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

  function downloadQr() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qrcode.png";
    a.click();
  }

  function downloadSvg() {
    if (!svgMarkup) return;
    const blob = new Blob([svgMarkup], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qrcode.svg";
    a.click();
    URL.revokeObjectURL(url);
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
      const canvas = canvasRef.current ?? document.createElement("canvas");
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
          content="Generate custom-colored QR codes with logos, adjustable size and error correction, export as PNG or SVG, and scan QR codes from images — entirely in your browser."
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
                rows={4}
                placeholder="Text or URL to encode…"
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
              />

              <div className="qrOptions">
                <div className="qrColorRow">
                  <label className="qrColorField">
                    <span className="fileFieldLabel">Foreground</span>
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
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
                </div>

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

                <label className="imgCompressorField">
                  <span className="fileFieldLabel">Size: {size}px</span>
                  <input
                    type="range"
                    min={128}
                    max={1024}
                    step={32}
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
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
              </div>

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

              <div className="actions">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={downloadQr}
                  disabled={!dataUrl}
                  title="Download PNG"
                >
                  <FaDownload />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={downloadSvg}
                  disabled={!svgMarkup}
                  title="Download SVG"
                >
                  <FaFileCode />
                </motion.button>
              </div>

              <canvas ref={qrCanvasRef} style={{ display: "none" }} />
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

              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
