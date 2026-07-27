import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Head from "next/head";
import { FaCopy } from "react-icons/fa6";
import { motion } from "framer-motion";

function toLocalDateTimeInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function TimestampTool() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 1000);
    const kickoff = setTimeout(tick, 0);
    return () => {
      clearInterval(id);
      clearTimeout(kickoff);
    };
  }, []);

  // Epoch -> date
  const [epochInput, setEpochInput] = useState("");

  const parsedDate = useMemo(() => {
    const trimmed = epochInput.trim();
    if (!trimmed || !/^-?\d+$/.test(trimmed)) return null;
    const value = Number(trimmed);
    const ms = trimmed.replace("-", "").length > 10 ? value : value * 1000;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [epochInput]);

  // Date -> epoch
  const [dateInput, setDateInput] = useState("");

  const epochFromDate = useMemo(() => {
    if (!dateInput) return null;
    const date = new Date(dateInput);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [dateInput]);

  async function copy(value: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
  }

  return (
    <>
      <Head>
        <title>ToolHub Timestamp Converter</title>
        <meta
          name="description"
          content="Convert Unix epoch timestamps to human-readable dates and back, entirely in your browser."
        />
      </Head>

      <main>
        <Navbar isSubPage title="Timestamp Converter" />

        <div className="base64Card">
          <div className="panel">
            <div className="timestampNow">
              <span className="fileFieldLabel">Current time</span>
              <div className="colorValueRow">
                <span className="colorValueLabel">Seconds</span>
                <span className="colorValueField">
                  {now !== null ? Math.floor(now / 1000) : "—"}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => copy(now !== null ? String(Math.floor(now / 1000)) : "")}
                  disabled={now === null}
                >
                  <FaCopy />
                </motion.button>
              </div>
              <div className="colorValueRow">
                <span className="colorValueLabel">Milliseconds</span>
                <span className="colorValueField">{now ?? "—"}</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => copy(now !== null ? String(now) : "")}
                  disabled={now === null}
                >
                  <FaCopy />
                </motion.button>
              </div>
            </div>

            <div className="timestampSection">
              <span className="fileFieldLabel">Epoch → Date</span>
              <input
                type="text"
                className="colorHexInput"
                placeholder="e.g. 1700000000 or 1700000000000"
                value={epochInput}
                onChange={(e) => setEpochInput(e.target.value)}
              />
              {epochInput && !parsedDate && (
                <p className="warn">Enter a valid integer epoch timestamp.</p>
              )}
              {parsedDate && (
                <div className="colorValues">
                  <div className="colorValueRow">
                    <span className="colorValueLabel">Local</span>
                    <span className="colorValueField">{parsedDate.toString()}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => copy(parsedDate.toString())}
                    >
                      <FaCopy />
                    </motion.button>
                  </div>
                  <div className="colorValueRow">
                    <span className="colorValueLabel">UTC</span>
                    <span className="colorValueField">{parsedDate.toUTCString()}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => copy(parsedDate.toUTCString())}
                    >
                      <FaCopy />
                    </motion.button>
                  </div>
                  <div className="colorValueRow">
                    <span className="colorValueLabel">ISO 8601</span>
                    <span className="colorValueField">{parsedDate.toISOString()}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => copy(parsedDate.toISOString())}
                    >
                      <FaCopy />
                    </motion.button>
                  </div>
                </div>
              )}
            </div>

            <div className="timestampSection">
              <span className="fileFieldLabel">Date → Epoch</span>
              <input
                type="datetime-local"
                className="colorHexInput"
                step={1}
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
              />
              <button
                type="button"
                className="timestampNowBtn"
                onClick={() => setDateInput(toLocalDateTimeInputValue(new Date()))}
              >
                Use current time
              </button>
              {epochFromDate && (
                <div className="colorValues">
                  <div className="colorValueRow">
                    <span className="colorValueLabel">Seconds</span>
                    <span className="colorValueField">
                      {Math.floor(epochFromDate.getTime() / 1000)}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        copy(String(Math.floor(epochFromDate.getTime() / 1000)))
                      }
                    >
                      <FaCopy />
                    </motion.button>
                  </div>
                  <div className="colorValueRow">
                    <span className="colorValueLabel">Milliseconds</span>
                    <span className="colorValueField">{epochFromDate.getTime()}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => copy(String(epochFromDate.getTime()))}
                    >
                      <FaCopy />
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
