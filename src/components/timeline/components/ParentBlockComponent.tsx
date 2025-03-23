// src/timeline/components/ParentBlockComponent.tsx
import React from "react";
import { Block, BlockType } from "../types";
import { getBlockHeight, getScale } from "../constants";
interface ParentBlockComponentProps {
  block: Block;
}

export const ParentBlockComponent: React.FC<ParentBlockComponentProps> = ({
  block,
}) => {
  const bgColor =
    block.type === BlockType.Video
      ? "rgba(0, 0, 255, 0.5)"
      : block.type === BlockType.Audio
      ? "rgba(0, 255, 0, 0.5)"
      : block.type === BlockType.Animation
      ? "rgba(128, 0, 128, 0.5)"
      : "rgba(255, 165, 0, 0.5)";

  return (
    <div
      style={{
        position: "absolute",
        left: `${block.starttime * getScale()}px`,
        width: `${block.duration * getScale()}px`,
        height: `${getBlockHeight()}px`,
        backgroundColor: bgColor,
        color: "white",
        borderRadius: "4px",
        padding: "4px",
        boxSizing: "border-box",
        userSelect: "none",
        zIndex: 0,
        opacity: 0.7,
      }}
    >
      <div>{block.type} (Parent)</div>
    </div>
  );
};
