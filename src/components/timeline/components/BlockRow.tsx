// src/timeline/components/BlockRow.tsx
import React, { useRef } from "react";
import Select from "react-select";
import { Block, Track, BlockType, TimelineMode } from "../types";
import {
  TRACK_HEIGHT,
  TRACK_MARGIN_BOTTOM,
  SCALE,
  TOTAL_TIME,
} from "../constants";
import { BlockComponent } from "./BlockComponent";

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
  updateTrackTypes: (
    trackId: string,
    selectedTypes: BlockType[] | null
  ) => void;
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
  updateTrackTypes,
}) => {
  const sortedBlocks = [...blocks].sort((a, b) => a.starttime - b.starttime);
  const rowRef = useRef<HTMLDivElement>(null);

  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: BlockType.Video, label: "Video" },
    { value: BlockType.Audio, label: "Audio" },
    { value: BlockType.Animation, label: "Animation" },
  ];

  const selectedValues =
    track.allowedTypes && track.allowedTypes.length > 0
      ? typeOptions.filter((opt) =>
          track.allowedTypes!.includes(opt.value as BlockType)
        )
      : [typeOptions[0]];

  const handleTypeChange = (selected: any) => {
    if (selected.some((opt: any) => opt.value === "all")) {
      updateTrackTypes(track.id, null);
    } else {
      const newTypes = selected.map((opt: any) => opt.value) as BlockType[];
      updateTrackTypes(track.id, newTypes);
    }
  };

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
        width: `${totalTime * SCALE}px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "-200px",
          top: "10px",
          width: "190px",
          display: "flex",
          alignItems: "center",
          gap: "5px",
        }}
      >
        <span style={{ fontSize: "12px" }}>{track.label}</span>
        <Select
          isMulti
          options={typeOptions}
          value={selectedValues}
          onChange={handleTypeChange}
          placeholder="Select allowed types"
          styles={{
            control: (base) => ({
              ...base,
              width: "120px",
              minHeight: "25px",
              fontSize: "12px",
            }),
            menu: (base) => ({ ...base, width: "150px" }),
          }}
        />
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
