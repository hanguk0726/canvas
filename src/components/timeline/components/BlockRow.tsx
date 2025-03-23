import React, { useRef } from "react";
import { Block, Track, TimelineMode } from "../types";
import { TRACK_HEIGHT, TRACK_MARGIN_BOTTOM } from "../constants";
import { BlockComponent } from "./BlockComponent";
import { getScale } from "../ScaleManager";

interface BlockRowProps {
  track: Track;
  blocks: Block[];
  totalTime: number;
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
  isDropTarget: boolean;
  dropPosition: number | null;
  onSplitBlock: (blockId: string, splitTime: number) => void;
  isSplitEnabled: boolean;
  focusedBlockId: string | null;
  onFocus: (blockId: string) => void;
  mode: TimelineMode;
  onDoubleClick?: (blockId: string) => void;
}

export const BlockRow: React.FC<BlockRowProps> = ({
  track,
  blocks,
  totalTime,
  updateBlock,
  onDragStart,
  isDropTarget,
  dropPosition,
  onSplitBlock,
  isSplitEnabled,
  focusedBlockId,
  onFocus,
  mode,
  onDoubleClick,
}) => {
  const sortedBlocks = [...blocks].sort((a, b) => a.starttime - b.starttime);
  const rowRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={rowRef}
      style={{
        position: "relative",
        height: `${TRACK_HEIGHT}px`,
        borderBottom: "1px solid #ddd",
        marginBottom: `${TRACK_MARGIN_BOTTOM}px`,
        backgroundColor: isDropTarget ? "rgba(0, 255, 0, 0.1)" : "transparent",
        transition: "background-color 0.2s",
        width: `${totalTime * getScale()}px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "-60px",
          top: "15px",
          width: "50px",
          textAlign: "right",
          fontSize: "12px",
        }}
      >
        {track.label}
      </div>
      {sortedBlocks.map((block, index) => {
        const prevEnd =
          index === 0
            ? 0
            : sortedBlocks[index - 1].starttime +
              sortedBlocks[index - 1].duration;
        const nextStart =
          index === sortedBlocks.length - 1
            ? totalTime
            : sortedBlocks[index + 1].starttime;
        const boundaries = { min: prevEnd, max: nextStart };
        return (
          <BlockComponent
            key={block.id}
            block={block}
            boundaries={boundaries}
            updateBlock={updateBlock}
            onDragStart={onDragStart}
            onSplitBlock={onSplitBlock}
            isSplitEnabled={isSplitEnabled}
            isFocused={block.id === focusedBlockId}
            onFocus={onFocus}
            mode={mode}
            onDoubleClick={onDoubleClick}
          />
        );
      })}
    </div>
  );
};
