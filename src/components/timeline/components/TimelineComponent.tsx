import React, { useRef, useEffect } from "react";
import { BlockType, Block, TimelineMode, Track } from "../types";
import {
  TIMELINE_PADDING,
  MIN_TIMELINE_HEIGHT,
  TRACK_HEIGHT,
  TRACK_MARGIN_BOTTOM,
  TIME_AXIS_HEIGHT,
  TIME_AXIS_MARGIN_BOTTOM,
  PARENT_TRACK_HEIGHT,
  PARENT_TRACK_MARGIN_BOTTOM,
  BLOCK_HEIGHT,
} from "../constants";
import { TimeAxis } from "./TimeAxis";
import { BlockRow } from "./BlockRow";
import { ParentBlockComponent } from "./ParentBlockComponent";
import { useDragAndDrop } from "../hooks/dragAndDrop";
import { v4 as uuidv4 } from "uuid";
import { getScale } from "../ScaleManager";

export interface TimelineProps {
  totalTime: number;
  isSplitEnabled: boolean;
  blocks: Block[];
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  focusedBlockId: string | null;
  setFocusedBlockId: (id: string | null) => void;
  mode: TimelineMode;
  onBlockDoubleClick?: (blockId: string) => void;
  parentBlock?: Block;
}

const TimelineComponent: React.FC<TimelineProps> = ({
  totalTime,
  isSplitEnabled,
  blocks,
  setBlocks,
  tracks,
  focusedBlockId,
  setFocusedBlockId,
  mode,
  onBlockDoubleClick,
  parentBlock,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const {
    dragInfo,
    dropTarget,
    snapGuidePosition,
    handleDragStart,
    handleDragging,
    handleDragEnd,
  } = useDragAndDrop(blocks, tracks, parentBlock, timelineRef, setBlocks);

  const updateBlock = (updated: Block) =>
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));

  const handleSplitBlock = (blockId: string, splitTime: number) => {
    setBlocks((prev) => {
      const blockIndex = prev.findIndex((b) => b.id === blockId);
      if (
        blockIndex === -1 ||
        splitTime <= 0 ||
        splitTime >= prev[blockIndex].duration
      )
        return prev;

      const block = prev[blockIndex];
      const firstBlock: Block = { ...block, duration: splitTime };
      const secondBlock: Block = {
        ...block,
        id: uuidv4(),
        starttime: block.starttime + splitTime,
        duration: block.duration - splitTime,
      };
      return [
        ...prev.slice(0, blockIndex),
        firstBlock,
        secondBlock,
        ...prev.slice(blockIndex + 1),
      ];
    });
  };

  useEffect(() => {
    if (dragInfo) {
      window.addEventListener("mousemove", handleDragging);
      window.addEventListener("mouseup", handleDragEnd);
      return () => {
        window.removeEventListener("mousemove", handleDragging);
        window.removeEventListener("mouseup", handleDragEnd);
      };
    }
  }, [dragInfo, handleDragging, handleDragEnd]);

  const renderDragPreview = () => {
    if (!dragInfo || !timelineRef.current) return null;

    const draggedBlock = blocks.find((b) => b.id === dragInfo.blockId);
    if (!draggedBlock) return null;

    const timelineRect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const totalTrackHeight = TRACK_HEIGHT + TRACK_MARGIN_BOTTOM;
    const totalTimeAxisHeight = TIME_AXIS_HEIGHT + TIME_AXIS_MARGIN_BOTTOM;
    const totalParentTrackHeight = parentBlock
      ? PARENT_TRACK_HEIGHT + PARENT_TRACK_MARGIN_BOTTOM
      : 0;

    const dropTrackIndex = dropTarget?.trackId
      ? tracks.findIndex((t) => t.id === dropTarget.trackId)
      : -1;
    const dropTrackTop =
      dropTrackIndex >= 0
        ? timelineRect.top +
          TIMELINE_PADDING +
          totalTimeAxisHeight +
          totalParentTrackHeight +
          dropTrackIndex * totalTrackHeight
        : dragInfo.currentY - dragInfo.offsetY;

    const leftPos =
      dropTarget?.position != null
        ? timelineRect.left +
          TIMELINE_PADDING +
          dropTarget.position * getScale() -
          scrollLeft
        : dragInfo.currentX - dragInfo.offsetX;

    const bgColor =
      draggedBlock.type === BlockType.Video
        ? "rgba(0, 0, 255, 0.8)"
        : draggedBlock.type === BlockType.Audio
        ? "rgba(21, 131, 21, 0.8)"
        : "rgba(128, 0, 128, 0.8)";

    return (
      <div
        style={{
          position: "fixed",
          left: `${leftPos}px`,
          top: `${dropTrackTop}px`,
          width: `${draggedBlock.duration * getScale()}px`,
          height: `${BLOCK_HEIGHT}px`,
          backgroundColor: bgColor,
          borderRadius: "4px",
          padding: "4px",
          boxSizing: "border-box",
          pointerEvents: "none",
          zIndex: 1000,
          opacity: 0.9,
          boxShadow: "0 0 10px rgba(0,0,0,0.5)",
          color: "white",
          fontWeight: "bold",
          textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
        }}
      >
        {draggedBlock.type}
      </div>
    );
  };

  const focusedBlock = blocks.find((b) => b.id === focusedBlockId);
  const handleBlockChange = (field: keyof Block, value: string | number) => {
    if (!focusedBlock) return;
    const updatedBlock = { ...focusedBlock, [field]: value };
    setBlocks((prev) =>
      prev.map((b) => (b.id === focusedBlock.id ? updatedBlock : b))
    );
  };

  return (
    <div>
      <div
        ref={timelineRef}
        style={{
          position: "relative",
          overflowX: "auto",
          overflowY: "visible",
          width: "100%",
          padding: `${TIMELINE_PADDING}px`,
          minHeight: `${MIN_TIMELINE_HEIGHT}px`,
        }}
        onClick={(e) => {
          if (
            mode === "select" &&
            !isSplitEnabled &&
            !(e.target as HTMLElement).closest(".block-component")
          )
            setFocusedBlockId(null);
        }}
      >
        <TimeAxis totalTime={totalTime} />
        {parentBlock && (
          <div
            style={{
              position: "relative",
              height: `${PARENT_TRACK_HEIGHT}px`,
              borderBottom: "1px dashed #aaa",
              marginBottom: `${PARENT_TRACK_MARGIN_BOTTOM}px`,
              backgroundColor: "rgba(0, 0, 0, 0.05)",
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
                color: "#666",
              }}
            >
              Parent
            </div>
            <ParentBlockComponent block={parentBlock} />
          </div>
        )}
        {tracks.map((track) => (
          <BlockRow
            key={track.id}
            track={track}
            blocks={blocks.filter((b) => b.trackId === track.id)}
            totalTime={totalTime}
            updateBlock={updateBlock}
            onDragStart={handleDragStart}
            isDropTarget={dropTarget?.trackId === track.id}
            dropPosition={
              dropTarget?.trackId === track.id ? dropTarget.position : null
            }
            onSplitBlock={handleSplitBlock}
            isSplitEnabled={isSplitEnabled}
            focusedBlockId={focusedBlockId}
            onFocus={setFocusedBlockId}
            mode={mode}
            onDoubleClick={onBlockDoubleClick}
          />
        ))}
        {snapGuidePosition !== null && (
          <div
            style={{
              position: "absolute",
              left: `${snapGuidePosition * getScale() + TIMELINE_PADDING}px`,
              top: 0,
              height: "100%",
              width: "2px",
              backgroundColor: "red",
              zIndex: 5,
            }}
          />
        )}
        {renderDragPreview()}
      </div>
      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          border: "1px solid #ddd",
          borderRadius: "4px",
          backgroundColor: "#f9f9f9",
        }}
      >
        {focusedBlock ? (
          <div>
            <h3>선택된 블록 정보</h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <label>
                ID:{" "}
                <input
                  type="text"
                  value={focusedBlock.id}
                  disabled
                  style={{ marginLeft: "10px", width: "200px" }}
                />
              </label>
              <label>
                타입:
                <select
                  value={focusedBlock.type}
                  onChange={(e) =>
                    handleBlockChange("type", e.target.value as BlockType)
                  }
                  style={{ marginLeft: "10px", width: "200px" }}
                >
                  <option value={BlockType.Video}>Video</option>
                  <option value={BlockType.Audio}>Audio</option>
                  <option value={BlockType.Animation}>Animation</option>
                </select>
              </label>
              <label>
                트랙:
                <select
                  value={focusedBlock.trackId}
                  onChange={(e) => handleBlockChange("trackId", e.target.value)}
                  style={{ marginLeft: "10px", width: "200px" }}
                >
                  {tracks.map((track) => (
                    <option key={track.id} value={track.id}>
                      {track.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                시작 시간:{" "}
                <input
                  type="number"
                  value={focusedBlock.starttime}
                  onChange={(e) =>
                    handleBlockChange("starttime", Number(e.target.value))
                  }
                  step="0.1"
                  style={{ marginLeft: "10px", width: "200px" }}
                />
              </label>
              <label>
                길이:{" "}
                <input
                  type="number"
                  value={focusedBlock.duration}
                  onChange={(e) =>
                    handleBlockChange("duration", Number(e.target.value))
                  }
                  step="0.1"
                  min="1"
                  style={{ marginLeft: "10px", width: "200px" }}
                />
              </label>
              <label>
                끝 시간:
                <input
                  type="number"
                  value={(
                    focusedBlock.starttime + focusedBlock.duration
                  ).toFixed(1)}
                  onChange={(e) => {
                    const newEndTime = Number(e.target.value);
                    const newDuration = newEndTime - focusedBlock.starttime;
                    if (newDuration >= 1)
                      handleBlockChange("duration", newDuration);
                  }}
                  step="0.1"
                  style={{ marginLeft: "10px", width: "200px" }}
                />
              </label>
            </div>
          </div>
        ) : (
          <p>핸드 모드에서 블록을 클릭하여 선택하세요.</p>
        )}
      </div>
    </div>
  );
};

export default TimelineComponent;
