import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";
import { FaCopy, FaTrash } from "react-icons/fa6";
import { motion } from "framer-motion";

function base64UrlDecode(segment: string) {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  const withPadding = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  const binary = atob(withPadding);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const TIME_CLAIMS = new Set(["exp", "iat", "nbf"]);

function prettyPayload(json: unknown) {
  if (typeof json !== "object" || json === null) return JSON.stringify(json, null, 2);
  const entries = Object.entries(json as Record<string, unknown>).map(
    ([key, value]) => {
      if (TIME_CLAIMS.has(key) && typeof value === "number") {
        return [key, `${value} (${new Date(value * 1000).toISOString()})`] as const;
      }
      return [key, value] as const;
    }
  );
  return JSON.stringify(Object.fromEntries(entries), null, 2);
}

interface DecodedJwt {
  header: string;
  payload: string;
  signature: string;
}

export default function JwtDecoderTool() {
  const [token, setToken] = useState("");

  const decoded: DecodedJwt | null = useMemo(() => {
    const trimmed = token.trim();
    if (!trimmed) return null;

    const parts = trimmed.split(".");
    if (parts.length !== 3) return null;

    try {
      const header = JSON.parse(base64UrlDecode(parts[0]));
      const payload = JSON.parse(base64UrlDecode(parts[1]));
      return {
        header: JSON.stringify(header, null, 2),
        payload: prettyPayload(payload),
        signature: parts[2],
      };
    } catch {
      return null;
    }
  }, [token]);

  const errorMessage = useMemo(() => {
    const trimmed = token.trim();
    if (!trimmed || decoded) return "";
    if (trimmed.split(".").length !== 3) {
      return "A JWT has three dot-separated parts: header.payload.signature.";
    }
    return "Could not decode this token. Check that it's a valid JWT.";
  }, [token, decoded]);

  const payloadText = decoded?.payload ?? "";

  async function copy(value: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
  }

  function clear() {
    setToken("");
  }

  return (
    <>
      <Head>
        <title>ToolHub JWT Decoder</title>
        <meta
          name="description"
          content="Decode JSON Web Token (JWT) headers and payloads, entirely in your browser. Signatures are not verified."
        />
      </Head>

      <main>
        <Navbar isSubPage title="JWT Decoder" />

        <div className="base64Card">
          <div className="panel">
            <textarea
              rows={4}
              placeholder="Paste a JWT (header.payload.signature)…"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />

            <p className="warn">
              This only decodes the token locally — it does not verify the
              signature. Never treat an unverified token as trustworthy.
            </p>

            {errorMessage && <p className="warn">{errorMessage}</p>}

            {decoded && (
              <>
                <div className="jwtField">
                  <span className="fileFieldLabel">Header</span>
                  <textarea rows={4} readOnly value={decoded.header} />
                </div>
                <div className="jwtField">
                  <span className="fileFieldLabel">Payload</span>
                  <textarea rows={8} readOnly value={decoded.payload} />
                </div>
                <div className="jwtField">
                  <span className="fileFieldLabel">Signature (not verified)</span>
                  <textarea rows={2} readOnly value={decoded.signature} />
                </div>
              </>
            )}

            <div className="actions">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => copy(payloadText)}
                disabled={!payloadText}
              >
                <FaCopy />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={clear}
                disabled={!token}
              >
                <FaTrash />
              </motion.button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
