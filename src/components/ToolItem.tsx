"use client";

import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import { motion } from "framer-motion";
import { LuConstruction } from "react-icons/lu";

interface ToolItemProps {
  toolName: string;
  toolDescription: string;
  toolImageUrl: string;
  toolIconUrl: string;
  toolLink: string;
  isWorkInProgress?: boolean;
  isNew?: boolean;
}

export default function ToolItem(props: ToolItemProps) {
  const content = (
    <>
      {props.isWorkInProgress && (
        <div className="toolItemSoon">
          <LuConstruction />
          Coming soon
        </div>
      )}
      {props.isNew && <div className="toolItemNew">NEW!</div>}
      <div className="toolImageHeader">
        {props.toolImageUrl && (
          <Image
            width={200}
            height={100}
            src={props.toolImageUrl}
            alt={`${props.toolName} preview`}
          ></Image>
        )}
      </div>
      <div className="toolItemContent">
        <Image
          width={256}
          height={256}
          src={props.toolIconUrl}
          alt={`${props.toolName} icon`}
        ></Image>

        <h2>{props.toolName}</h2>

        <p>{props.toolDescription}</p>

        <motion.span
          className="toolItemGo"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          aria-hidden="true"
        >
          <FaArrowRight />
        </motion.span>
      </div>
    </>
  );

  if (props.isWorkInProgress) {
    return (
      <div className="toolItem" aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={props.toolLink}
      className="toolItem"
      aria-label={`Open ${props.toolName}`}
    >
      {content}
    </Link>
  );
}
