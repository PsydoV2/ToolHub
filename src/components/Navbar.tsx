"use client";

import Link from "next/link";
import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { FaMoon, FaSun } from "react-icons/fa6";
import { motion } from "framer-motion";

interface NavbarProps {
  isSubPage?: boolean;
  title: string;
}

export default function Navbar(props: NavbarProps) {
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.dataset.theme == "dark"
  );

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.dataset.theme = "dark";
    } else {
      document.documentElement.dataset.theme = "light";
    }
  };

  return (
    <nav>
      {props.isSubPage ? (
        <Link href="/">
          <FaArrowLeft /> Back
        </Link>
      ) : (
        <div>{/* Leeres div damit die flex box nicht broken ist */}</div>
      )}

      <h1>{props.title}</h1>

      <motion.button
        onClick={toggleDarkMode}
        aria-label="Toggle Dark Mode"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        {isDarkMode ? <FaSun /> : <FaMoon />}
      </motion.button>
    </nav>
  );
}
