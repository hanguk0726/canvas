import React, { useRef, useState } from "react";
import { Block, BlockType, TimelineMode } from "../types";
import { SCALE, MIN_DURATION, BLOCK_HEIGHT } from "../constants";

interface BlockComponentProps {
  block: Block;
  boundaries: { min: number; max: number };
  updateBlock: (updated: Block) => void;
  onDragStart: (
    blockId: string,
    trackId: string,
    clientX: number,
    clientY: number,
    blockWidth: number,
    offsetX: number,
    offsetY: number
  ) => void;
  onSplitBlock: (blockId: string, splitTime: number) => void;
  isSplitEnabled: boolean;
  isFocused: boolean;
  onFocus: (blockId: string) => void;
  mode: TimelineMode;
  onDoubleClick?: (blockId: string) => void;
}

export const BlockComponent: React.FC<BlockComponentProps> = ({
  block,
  boundaries,
  updateBlock,
  onDragStart,
  onSplitBlock,
  isSplitEnabled,
  isFocused,
  onFocus,
  mode,
  onDoubleClick,
}) => {
  const blockRef = useRef<HTMLDivElement>(null);
  const resizeData = useRef<{
    startX: number;
    origDuration: number;
    origStarttime: number;
    isLeft: boolean;
  } | null>(null);
  const [splitPreview, setSplitPreview] = useState<number | null>(null);

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === TimelineMode.Select || isSplitEnabled || !blockRef.current)
      return;
    e.preventDefault();
    e.stopPropagation();
    const rect = blockRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    onDragStart(
      block.id,
      block.trackId,
      e.clientX,
      e.clientY,
      rect.width,
      offsetX,
      offsetY
    );
  };

  const onRightResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSplitEnabled || mode === TimelineMode.Select) return;
    e.preventDefault();
    e.stopPropagation();
    resizeData.current = {
      startX: e.clientX,
      origDuration: block.duration,
      origStarttime: block.starttime,
      isLeft: false,
    };
    window.addEventListener("mousemove", onResizing);
    window.addEventListener("mouseup", onResizeMouseUp);
  };

  const onLeftResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSplitEnabled || mode === TimelineMode.Select) return;
    e.preventDefault();
    e.stopPropagation();
    resizeData.current = {
      startX: e.clientX,
      origDuration: block.duration,
      origStarttime: block.starttime,
      isLeft: true,
    };
    window.addEventListener("mousemove", onResizing);
    window.addEventListener("mouseup", onResizeMouseUp);
  };

  const onResizing = (e: MouseEvent) => {
    if (!resizeData.current) return;
    const deltaSeconds = (e.clientX - resizeData.current.startX) / SCALE;

    if (resizeData.current.isLeft) {
      let newStarttime = resizeData.current.origStarttime + deltaSeconds;
      newStarttime = Math.max(boundaries.min, newStarttime);
      const newDuration =
        resizeData.current.origDuration +
        (resizeData.current.origStarttime - newStarttime);
      if (newDuration >= MIN_DURATION) {
        updateBlock({
          ...block,
          starttime: Math.round(newStarttime * 100) / 100,
          duration: Math.round(newDuration * 100) / 100,
        });
      }
    } else {
      let newDuration = resizeData.current.origDuration + deltaSeconds;
      newDuration = Math.max(MIN_DURATION, newDuration);
      newDuration = Math.min(boundaries.max - block.starttime, newDuration);
      updateBlock({ ...block, duration: Math.round(newDuration * 100) / 100 });
    }
  };

  const onResizeMouseUp = () => {
    resizeData.current = null;
    window.removeEventListener("mousemove", onResizing);
    window.removeEventListener("mouseup", onResizeMouseUp);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSplitEnabled || !blockRef.current) return;
    const rect = blockRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const splitTime = Math.round((relativeX / SCALE) * 10) / 10;
    if (splitTime > 0 && splitTime < block.duration) setSplitPreview(splitTime);
    else setSplitPreview(null);
  };

  const handleMouseLeave = () => {
    if (isSplitEnabled) setSplitPreview(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (isSplitEnabled && splitPreview !== null) {
      onSplitBlock(block.id, splitPreview);
      setSplitPreview(null);
    } else if (mode === TimelineMode.Select && !isSplitEnabled) {
      onFocus(block.id);
    }
  };

  const bgColor =
    block.type === BlockType.Video
      ? "blue"
      : block.type === BlockType.Audio
      ? "green"
      : "purple";
  const cursorStyle = isSplitEnabled
    ? "crosshair"
    : mode === TimelineMode.Select
    ? "pointer"
    : "grab";

  return (
    <div
      ref={blockRef}
      style={{
        position: "absolute",
        left: `${block.starttime * SCALE}px`,
        width: `${block.duration * SCALE}px`,
        height: `${BLOCK_HEIGHT}px`,
        backgroundColor: bgColor,
        color: "white",
        borderRadius: "4px",
        padding: "4px",
        boxSizing: "border-box",
        cursor: cursorStyle,
        userSelect: "none",
        zIndex: 1,
        touchAction: "none",
        border: isFocused ? "2px solid yellow" : "none",
      }}
      onMouseDown={handleDragStart}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onDoubleClick={() => onDoubleClick?.(block.id)}
    >
      <div>{block.type}</div>
      {isSplitEnabled && splitPreview !== null && (
        <div
          style={{
            position: "absolute",
            left: `${splitPreview * SCALE}px`,
            width: "2px",
            height: "100%",
            backgroundColor: "red",
            zIndex: 10,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "10px",
          height: "100%",
          backgroundColor:
            isSplitEnabled || mode === TimelineMode.Select
              ? "rgba(150, 150, 150, 0.6)"
              : "rgba(255, 0, 0, 0.6)",
          cursor:
            isSplitEnabled || mode === TimelineMode.Select
              ? "not-allowed"
              : "ew-resize",
        }}
        onMouseDown={onLeftResizeMouseDown}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: "10px",
          height: "100%",
          backgroundColor:
            isSplitEnabled || mode === TimelineMode.Select
              ? "rgba(150, 150, 150, 0.6)"
              : "rgba(255, 0, 0, 0.6)",
          cursor:
            isSplitEnabled || mode === TimelineMode.Select
              ? "not-allowed"
              : "ew-resize",
        }}
        onMouseDown={onRightResizeMouseDown}
      />
    </div>
  );
};
