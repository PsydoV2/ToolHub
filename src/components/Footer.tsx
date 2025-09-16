// components/Footer.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const links = [
  { href: "/imprint", label: "Imprint" },
  { href: "/privacy", label: "Privacy" },
];

export default function Footer() {
  return (
    <motion.footer
      className="footer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="footWrap">
        <nav className="links" aria-label="Footer">
          {links.map((l) => (
            <motion.span key={l.href} whileHover={{ y: -1 }}>
              <Link href={l.href} className="link">
                {l.label}
              </Link>
            </motion.span>
          ))}
        </nav>

        <p className="copy">
          &copy; {new Date().getFullYear()} ToolHub — All rights reserved.
        </p>
      </div>
    </motion.footer>
  );
}
