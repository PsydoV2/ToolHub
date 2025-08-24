"use client";

import Link from "next/link";
import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";

interface NavbarProps {
  isSubPage?: boolean;
  title: string;
}

export default function Navbar(props: NavbarProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

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

      <button onClick={() => setIsDarkMode(!isDarkMode)}>
        {isDarkMode ? "Light Mode" : "Dark Mode"}{" "}
      </button>
    </nav>
  );
}
