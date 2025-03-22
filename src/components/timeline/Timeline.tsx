import React, { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

// 스타일 관련 상수
export const TOTAL_TIME = 420;
const TIMELINE_PADDING = 20;
const TIME_AXIS_HEIGHT = 30;
const TIME_AXIS_MARGIN_BOTTOM = 10;
const TRACK_HEIGHT = 60;
const TRACK_MARGIN_BOTTOM = 10;
const PARENT_TRACK_HEIGHT = 60;
const PARENT_TRACK_MARGIN_BOTTOM = 10;
const BLOCK_HEIGHT = 50;
const MIN_TIMELINE_HEIGHT = 400;

// 계산 관련 상수
const SCALE = 10;
const SNAP_THRESHOLD = 2;
const MIN_DURATION = 1;

export enum BlockType {
  Video = "video",
  Audio = "audio",
  Animation = "animation",
}

export interface Block {
  id: string;
  type: BlockType;
  duration: number;
  starttime: number;
  trackId: string;
  subTimelineId?: string;
}

export interface Track {
  id: string;
  label: string;
  allowedTypes?: BlockType[];
}

export enum TimelineMode {
  Select = "select",
  Hand = "hand",
}

const TimeAxis: React.FC<{ totalTime: number }> = ({ totalTime }) => {
  const ticks = [];
  for (let t = 0; t <= totalTime; t += 5) {
    ticks.push(t);
  }
  return (
    <div
      style={{
        position: "relative",
        height: `${TIME_AXIS_HEIGHT}px`,
        borderBottom: "1px solid #ccc",
        marginBottom: `${TIME_AXIS_MARGIN_BOTTOM}px`,
      }}
    >
      {ticks.map((t) => (
        <div
          key={t}
          style={{ position: "absolute", left: `${t * SCALE}px`, top: 0 }}
        >
          <div style={{ borderLeft: "1px solid #aaa", height: "10px" }}></div>
          <div style={{ fontSize: "10px" }}>{t}s</div>
        </div>
      ))}
    </div>
  );
};

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

const BlockComponent: React.FC<BlockComponentProps> = ({
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
    if (mode === "select" || isSplitEnabled || !blockRef.current) return;
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

  // 오른쪽 리사이즈
  const onRightResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSplitEnabled || mode === "select") return;
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

  // 왼쪽 리사이즈
  const onLeftResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSplitEnabled || mode === "select") return;
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
      // 왼쪽 리사이즈: starttime 변경, duration 조정
      let newStarttime = resizeData.current.origStarttime + deltaSeconds;
      newStarttime = Math.max(boundaries.min, newStarttime); // 최소 경계
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
      // 오른쪽 리사이즈: duration만 변경
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
    if (splitTime > 0 && splitTime < block.duration) {
      setSplitPreview(splitTime);
    } else {
      setSplitPreview(null);
    }
  };

  const handleMouseLeave = () => {
    if (isSplitEnabled) setSplitPreview(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (isSplitEnabled && splitPreview !== null) {
      onSplitBlock(block.id, splitPreview);
      setSplitPreview(null);
    } else if (mode === "select" && !isSplitEnabled) {
      onFocus(block.id);
    }
  };

  const handleDoubleClickEvent = () => {
    if (onDoubleClick) {
      onDoubleClick(block.id);
    }
  };

  const bgColor =
    block.type === BlockType.Video
      ? "blue"
      : block.type === BlockType.Audio
      ? "green"
      : block.type === BlockType.Animation
      ? "purple"
      : "orange";

  const cursorStyle = isSplitEnabled
    ? "crosshair"
    : mode === "select"
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
      onDoubleClick={handleDoubleClickEvent}
      onTouchStart={(e) => {
        if (mode === "select" || isSplitEnabled || !blockRef.current) return;
        const touch = e.touches[0];
        const rect = blockRef.current.getBoundingClientRect();
        const offsetX = touch.clientX - rect.left;
        const offsetY = touch.clientY - rect.top;
        onDragStart(
          block.id,
          block.trackId,
          touch.clientX,
          touch.clientY,
          rect.width,
          offsetX,
          offsetY
        );
      }}
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
      {/* 왼쪽 리사이즈 핸들 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "10px",
          height: "100%",
          backgroundColor: "rgba(172, 48, 48, 0)",
          cursor:
            isSplitEnabled || mode === "select" ? "not-allowed" : "ew-resize",
        }}
        onMouseDown={onLeftResizeMouseDown}
      ></div>
      {/* 오른쪽 리사이즈 핸들 */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: "10px",
          height: "100%",
          backgroundColor:
            isSplitEnabled || mode === "select"
              ? "rgba(150, 150, 150, 0.6)"
              : "rgba(255, 0, 0, 0.6)",
          cursor:
            isSplitEnabled || mode === "select" ? "not-allowed" : "ew-resize",
        }}
        onMouseDown={onRightResizeMouseDown}
      ></div>
    </div>
  );
};

const ParentBlockComponent: React.FC<{ block: Block }> = ({ block }) => {
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
        left: `${block.starttime * SCALE}px`,
        width: `${block.duration * SCALE}px`,
        height: `${BLOCK_HEIGHT}px`,
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

const BlockRow: React.FC<BlockRowProps> = ({
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
        width: `${totalTime * SCALE}px`,
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

export interface TimelineProps {
  totalTime: number;
  isSplitEnabled: boolean;
  blocks: Block[];
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
  tracks: Track[];
  focusedBlockId: string | null;
  setFocusedBlockId: (id: string | null) => void;
  mode: TimelineMode;
  onBlockDoubleClick?: (blockId: string) => void;
  parentBlock?: Block;
}

const Timeline: React.FC<TimelineProps> = ({
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
  const [dragInfo, setDragInfo] = useState<{
    blockId: string;
    originalTrackId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    blockWidth: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    trackId: string;
    position: number;
  } | null>(null);
  const [snapGuidePosition, setSnapGuidePosition] = useState<number | null>(
    null
  );
  const timelineRef = useRef<HTMLDivElement>(null);

  const updateBlock = (updated: Block) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const calculateBlockPosition = (
    trackId: string,
    position: number,
    blockId: string,
    blockDuration: number
  ) => {
    const sameTrackBlocks = blocks
      .filter((b) => b.trackId === trackId && b.id !== blockId)
      .sort((a, b) => a.starttime - b.starttime);
    let newPosition = Math.max(0, position);

    for (const block of sameTrackBlocks) {
      const blockEnd = block.starttime + block.duration;
      if (newPosition >= block.starttime && newPosition < blockEnd) {
        newPosition = blockEnd;
      } else if (
        newPosition < block.starttime &&
        newPosition + blockDuration > block.starttime
      ) {
        if (block.starttime >= blockDuration) {
          newPosition = block.starttime - blockDuration;
        } else {
          newPosition = blockEnd;
        }
      }
    }
    return newPosition;
  };

  const getTimePositionFromClientX = (
    clientX: number,
    offsetX: number,
    timelineRect: DOMRect,
    scrollLeft: number
  ): number => {
    const previewLeftPos = clientX - offsetX;
    const relativeX =
      previewLeftPos - timelineRect.left - TIMELINE_PADDING + scrollLeft;
    return Math.max(0, relativeX / SCALE);
  };

  const handleSplitBlock = (blockId: string, splitTime: number) => {
    setBlocks((prev) => {
      const blockIndex = prev.findIndex((b) => b.id === blockId);
      if (blockIndex === -1) return prev;

      const block = prev[blockIndex];
      if (splitTime <= 0 || splitTime >= block.duration) return prev;

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

  const handleDragStart = (
    blockId: string,
    trackId: string,
    clientX: number,
    clientY: number,
    blockWidth: number,
    offsetX: number,
    offsetY: number
  ) => {
    const draggedBlock = blocks.find((b) => b.id === blockId);
    if (!draggedBlock) return;

    setDragInfo({
      blockId,
      originalTrackId: trackId,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      blockWidth: draggedBlock.duration * SCALE,
      offsetX,
      offsetY,
    });
  };

  const handleDragging = useCallback(
    (e: MouseEvent) => {
      if (!dragInfo || !timelineRef.current) return;

      setDragInfo((prev) =>
        prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null
      );

      const timelineRect = timelineRef.current.getBoundingClientRect();
      const scrollLeft = timelineRef.current.scrollLeft;
      const relativeY = e.clientY - timelineRect.top;
      const timePosition = getTimePositionFromClientX(
        e.clientX,
        dragInfo.offsetX,
        timelineRect,
        scrollLeft
      );

      const totalTrackHeight = TRACK_HEIGHT + TRACK_MARGIN_BOTTOM;
      const totalTimeAxisHeight = TIME_AXIS_HEIGHT + TIME_AXIS_MARGIN_BOTTOM;
      const totalParentTrackHeight = parentBlock
        ? PARENT_TRACK_HEIGHT + PARENT_TRACK_MARGIN_BOTTOM
        : 0;
      const offsetY = totalTimeAxisHeight + totalParentTrackHeight;

      const trackIndex = Math.floor((relativeY - offsetY) / totalTrackHeight);
      const targetTrackId =
        trackIndex >= 0 && trackIndex < tracks.length
          ? tracks[trackIndex].id
          : null;

      const draggedBlock = blocks.find((b) => b.id === dragInfo.blockId);
      if (!draggedBlock || targetTrackId === null) {
        setDropTarget(null);
        setSnapGuidePosition(null);
        return;
      }

      // 트랙 제약 조건 확인
      const targetTrack = tracks.find((t) => t.id === targetTrackId);
      if (
        targetTrack?.allowedTypes &&
        !targetTrack.allowedTypes.includes(draggedBlock.type)
      ) {
        setDropTarget(null); // 허용되지 않으면 드롭 타겟 설정 안 함
        setSnapGuidePosition(null);
        return;
      }

      const allBlocks = blocks.filter((b) => b.id !== dragInfo.blockId);

      let newPosition = timePosition;
      let snapPosition: number | null = null;
      const potentialStart = timePosition;
      const potentialEnd = potentialStart + draggedBlock.duration;

      // (이하 스냅 로직 동일)
      if (parentBlock) {
        const parentStart = parentBlock.starttime;
        const parentEnd = parentBlock.starttime + parentBlock.duration;

        const distanceToParentStart = Math.abs(potentialStart - parentStart);
        if (distanceToParentStart < SNAP_THRESHOLD) {
          newPosition = parentStart;
          snapPosition = parentStart;
        }

        const distanceToParentEnd = Math.abs(potentialStart - parentEnd);
        if (distanceToParentEnd < SNAP_THRESHOLD && !snapPosition) {
          newPosition = parentEnd;
          snapPosition = parentEnd;
        }

        const distanceEndToParentStart = Math.abs(potentialEnd - parentStart);
        if (distanceEndToParentStart < SNAP_THRESHOLD && !snapPosition) {
          newPosition = parentStart - draggedBlock.duration;
          snapPosition = parentStart;
        }

        const distanceEndToParentEnd = Math.abs(potentialEnd - parentEnd);
        if (distanceEndToParentEnd < SNAP_THRESHOLD && !snapPosition) {
          newPosition = parentEnd - draggedBlock.duration;
          snapPosition = parentEnd;
        }
      }

      if (!snapPosition) {
        for (const block of allBlocks) {
          const blockStart = block.starttime;
          const blockEnd = block.starttime + block.duration;

          const distanceToStart = Math.abs(potentialStart - blockStart);
          if (distanceToStart < SNAP_THRESHOLD) {
            newPosition = blockStart;
            snapPosition = blockStart;
            break;
          }

          const distanceToEnd = Math.abs(potentialStart - blockEnd);
          if (distanceToEnd < SNAP_THRESHOLD) {
            newPosition = blockEnd;
            snapPosition = blockEnd;
            break;
          }

          const distanceEndToStart = Math.abs(potentialEnd - blockStart);
          if (distanceEndToStart < SNAP_THRESHOLD) {
            newPosition = blockStart - draggedBlock.duration;
            snapPosition = blockStart;
            break;
          }

          const distanceEndToEnd = Math.abs(potentialEnd - blockEnd);
          if (distanceEndToEnd < SNAP_THRESHOLD) {
            newPosition = blockEnd - draggedBlock.duration;
            snapPosition = blockEnd;
            break;
          }
        }
      }

      newPosition = calculateBlockPosition(
        targetTrackId,
        newPosition,
        dragInfo.blockId,
        draggedBlock.duration
      );

      setDropTarget({
        trackId: targetTrackId,
        position: Math.round(newPosition * 10) / 10,
      });
      setSnapGuidePosition(snapPosition);
    },
    [dragInfo, blocks, tracks, parentBlock]
  );

  const handleDragEnd = useCallback(
    (e: MouseEvent) => {
      if (!dragInfo || !dropTarget || dropTarget.trackId === null) {
        setDragInfo(null);
        setDropTarget(null);
        setSnapGuidePosition(null);
        return;
      }

      const draggedBlock = blocks.find((b) => b.id === dragInfo.blockId);
      if (!draggedBlock) {
        setDragInfo(null);
        setDropTarget(null);
        setSnapGuidePosition(null);
        return;
      }

      const newPosition = calculateBlockPosition(
        dropTarget.trackId,
        dropTarget.position,
        dragInfo.blockId,
        draggedBlock.duration
      );
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === dragInfo.blockId
            ? { ...b, starttime: newPosition, trackId: dropTarget.trackId }
            : b
        )
      );

      setDragInfo(null);
      setDropTarget(null);
      setSnapGuidePosition(null);
    },
    [dragInfo, dropTarget, blocks, setBlocks]
  );

  const renderDragPreview = () => {
    if (!dragInfo || !timelineRef.current) return null;

    const draggedBlock = blocks.find((b) => b.id === dragInfo.blockId);
    if (!draggedBlock) return null;

    const bgColor =
      draggedBlock.type === BlockType.Video
        ? "rgba(0, 0, 255, 0.8)"
        : draggedBlock.type === BlockType.Audio
        ? "rgba(21, 131, 21, 0.8)"
        : draggedBlock.type === BlockType.Animation
        ? "rgba(128, 0, 128, 0.8)"
        : "rgba(255, 165, 0, 0.8)";

    const timelineRect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const totalTrackHeight = TRACK_HEIGHT + TRACK_MARGIN_BOTTOM;
    const totalTimeAxisHeight = TIME_AXIS_HEIGHT + TIME_AXIS_MARGIN_BOTTOM;
    const totalParentTrackHeight = parentBlock
      ? PARENT_TRACK_HEIGHT + PARENT_TRACK_MARGIN_BOTTOM
      : 0;

    const dropTrackIndex =
      dropTarget?.trackId != null
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
      dropTarget?.trackId != null && dropTarget?.position != null
        ? timelineRect.left +
          TIMELINE_PADDING +
          dropTarget.position * SCALE -
          scrollLeft
        : dragInfo.currentX - dragInfo.offsetX - scrollLeft;

    return (
      <div
        style={{
          position: "fixed",
          left: `${leftPos}px`,
          top: `${dropTrackTop}px`,
          width: `${draggedBlock.duration * SCALE}px`,
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleDragging(e);
    const handleMouseUp = (e: MouseEvent) => handleDragEnd(e);

    if (dragInfo) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragInfo, handleDragging, handleDragEnd]);

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
          if (mode === "select" && !isSplitEnabled) {
            const target = e.target as HTMLElement;
            if (!target.closest(".block-component")) {
              setFocusedBlockId(null);
            }
          }
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
        {tracks.map((track) => {
          const trackBlocks = blocks.filter((b) => b.trackId === track.id);
          return (
            <BlockRow
              key={track.id}
              track={track}
              blocks={trackBlocks}
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
          );
        })}
        {snapGuidePosition !== null && (
          <div
            style={{
              position: "absolute",
              left: `${snapGuidePosition * SCALE + TIMELINE_PADDING}px`,
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
                ID:
                <input
                  type="text"
                  value={focusedBlock.id}
                  disabled // ID는 수정 불가
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
                시작 시간:
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
                길이:
                <input
                  type="number"
                  value={focusedBlock.duration}
                  onChange={(e) =>
                    handleBlockChange("duration", Number(e.target.value))
                  }
                  step="0.1"
                  min={MIN_DURATION}
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
                    if (newDuration >= MIN_DURATION) {
                      handleBlockChange("duration", newDuration);
                    }
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

export default Timeline;
