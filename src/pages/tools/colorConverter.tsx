import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";
import { FaCopy } from "react-icons/fa6";
import { motion } from "framer-motion";

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHsl(r: number, g: number, b: number) {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rN) h = ((gN - bN) / d) % 6;
  else if (max === gN) h = (bN - rN) / d + 2;
  else h = (rN - gN) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

const isValidHex = (hex: string) => /^#[0-9a-fA-F]{6}$/.test(hex);

export default function ColorConverter() {
  const [hex, setHex] = useState("#1d6fe2");

  const rgb = useMemo(
    () => (isValidHex(hex) ? hexToRgb(hex) : null),
    [hex]
  );
  const hsl = useMemo(
    () => (rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null),
    [rgb]
  );

  const rgbString = rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : "";
  const hslString = hsl ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : "";

  function copy(value: string) {
    if (!value) return;
    navigator.clipboard.writeText(value);
  }

  return (
    <>
      <Head>
        <title>ToolHub Color Converter</title>
        <meta
          name="description"
          content="Convert colors between HEX, RGB and HSL, entirely in your browser."
        />
      </Head>

      <main>
        <Navbar isSubPage title="Color Converter" />

        <div className="colorCard">
          <div className="colorPickRow">
            <input
              type="color"
              value={isValidHex(hex) ? hex : "#000000"}
              onChange={(e) => setHex(e.target.value)}
            />
            <input
              type="text"
              className="colorHexInput"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              placeholder="#1d6fe2"
            />
          </div>

          {!isValidHex(hex) && (
            <p className="warn">Enter a valid hex color, e.g. #1d6fe2</p>
          )}

          <div className="colorValues">
            <div className="colorValueRow">
              <span className="colorValueLabel">HEX</span>
              <span className="colorValueField">{hex}</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => copy(hex)}
              >
                <FaCopy />
              </motion.button>
            </div>
            <div className="colorValueRow">
              <span className="colorValueLabel">RGB</span>
              <span className="colorValueField">{rgbString || "—"}</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => copy(rgbString)}
                disabled={!rgbString}
              >
                <FaCopy />
              </motion.button>
            </div>
            <div className="colorValueRow">
              <span className="colorValueLabel">HSL</span>
              <span className="colorValueField">{hslString || "—"}</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => copy(hslString)}
                disabled={!hslString}
              >
                <FaCopy />
              </motion.button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
