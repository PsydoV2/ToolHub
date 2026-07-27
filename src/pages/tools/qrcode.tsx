import { useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";
import { MdQrCode2 } from "react-icons/md";
import { FaCopy, FaDownload } from "react-icons/fa6";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import jsQR from "jsqr";

export default function QrCodeTool() {
  const [mode, setMode] = useState<"generate" | "scan">("generate");

  // Generate
  const [text, setText] = useState("");
  const [dataUrl, setDataUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Scan
  const [scanResult, setScanResult] = useState("");
  const [scanError, setScanError] = useState("");

  async function generate(value: string) {
    setText(value);
    if (!value) {
      setDataUrl("");
      return;
    }
    try {
      const url = await QRCode.toDataURL(value, {
        width: 320,
        margin: 2,
      });
      setDataUrl(url);
    } catch {
      setDataUrl("");
    }
  }

  function downloadQr() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qrcode.png";
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
          content="Generate QR codes from text or URLs, and scan QR codes from images — entirely in your browser."
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
                onChange={(e) => generate(e.target.value)}
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

              <div className="actions">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={downloadQr}
                  disabled={!dataUrl}
                >
                  <FaDownload />
                </motion.button>
              </div>
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
