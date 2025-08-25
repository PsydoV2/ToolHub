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
  return (
    <div className="toolItem">
      {props.isWorkInProgress && (
        <div className="toolItemSoon">
          <LuConstruction />
          Coming soon
        </div>
      )}
      {props.isNew && <div className="toolItemNew">NEW!</div>}
      <div className="toolImageHeader">
        <Image
          width={200}
          height={100}
          src={props.toolImageUrl}
          alt="Tool Header Image"
        ></Image>
      </div>
      <div className="toolItemContent">
        <Image
          width={256}
          height={256}
          src={props.toolIconUrl}
          alt="Tool Icon"
        ></Image>

        <h2>{props.toolName}</h2>

        <p>{props.toolDescription}</p>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Link href={props.toolLink}>
            <FaArrowRight />
          </Link>
        </motion.button>
      </div>
    </div>
  );
}
