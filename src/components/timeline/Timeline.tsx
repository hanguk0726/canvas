import React, { useState, useRef, useEffect, useCallback } from "react";

const TIMELINE_PADDING = 20;
const scale = 10;
const snapThreshold = 2;

export interface Block {
  id: number;
  type: "video" | "audio" | "shape" | "effect";
  duration: number;
  starttime: number;
  trackId: number;
}

interface Track {
  id: number;
  label: string;
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
        height: "30px",
        borderBottom: "1px solid #ccc",
        marginBottom: "10px",
      }}
    >
      {ticks.map((t) => (
        <div
          key={t}
          style={{ position: "absolute", left: `${t * scale}px`, top: 0 }}
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
    blockId: number,
    trackId: number,
    clientX: number,
    clientY: number,
    blockWidth: number,
    offsetX: number,
    offsetY: number
  ) => void;
  onSplitBlock: (blockId: number, splitTime: number) => void;
  isSplitEnabled: boolean;
  isFocused: boolean;
  onFocus: (blockId: number) => void;
  mode: "select" | "hand";
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
}) => {
  const blockRef = useRef<HTMLDivElement>(null);
  const resizeData = useRef<{ startX: number; origDuration: number } | null>(
    null
  );
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

  const onResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSplitEnabled || mode === "select") return;
    e.preventDefault();
    e.stopPropagation();
    resizeData.current = { startX: e.clientX, origDuration: block.duration };
    window.addEventListener("mousemove", onResizing);
    window.addEventListener("mouseup", onResizeMouseUp);
  };

  const onResizing = (e: MouseEvent) => {
    if (!resizeData.current) return;
    const deltaSeconds = (e.clientX - resizeData.current.startX) / scale;
    let newDuration = resizeData.current.origDuration + deltaSeconds;
    newDuration = Math.max(1, newDuration);
    newDuration = Math.min(boundaries.max - block.starttime, newDuration);
    updateBlock({ ...block, duration: Math.round(newDuration * 100) / 100 });
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
    const splitTime = Math.round((relativeX / scale) * 10) / 10;
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

  const bgColor =
    block.type === "video"
      ? "blue"
      : block.type === "audio"
      ? "green"
      : block.type === "shape"
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
        left: `${block.starttime * scale}px`,
        width: `${block.duration * scale}px`,
        height: "50px",
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
            left: `${splitPreview * scale}px`,
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
        onMouseDown={onResizeMouseDown}
      ></div>
    </div>
  );
};

interface BlockRowProps {
  track: Track;
  blocks: Block[];
  totalTime: number;
  updateBlock: (updated: Block) => void;
  onDragStart: (
    blockId: number,
    trackId: number,
    clientX: number,
    clientY: number,
    blockWidth: number,
    offsetX: number,
    offsetY: number
  ) => void;
  isDropTarget: boolean;
  dropPosition: number | null;
  onSplitBlock: (blockId: number, splitTime: number) => void;
  isSplitEnabled: boolean;
  focusedBlockId: number | null;
  onFocus: (blockId: number) => void;
  mode: "select" | "hand";
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
}) => {
  const sortedBlocks = [...blocks].sort((a, b) => a.starttime - b.starttime);
  const rowRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={rowRef}
      style={{
        position: "relative",
        height: "60px",
        borderBottom: "1px solid #ddd",
        marginBottom: "10px",
        backgroundColor: isDropTarget ? "rgba(0, 255, 0, 0.1)" : "transparent",
        transition: "background-color 0.2s",
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
          />
        );
      })}
      {isDropTarget && dropPosition !== null && (
        <div
          style={{
            position: "absolute",
            left: `${dropPosition * scale}px`,
            height: "50px",
            width: "2px",
            backgroundColor: "green",
            zIndex: "10",
          }}
        />
      )}
    </div>
  );
};

interface TimelineProps {
  totalTime: number;
  isSplitEnabled: boolean;
  blocks: Block[];
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
  tracks: Track[];
  focusedBlockId: number | null;
  setFocusedBlockId: (id: number | null) => void;
  mode: "select" | "hand";
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
}) => {
  const [dragInfo, setDragInfo] = useState<{
    blockId: number;
    originalTrackId: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    blockWidth: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    trackId: number;
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
    trackId: number,
    position: number,
    blockId: number,
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
    timelineRect: DOMRect
  ): number => {
    const previewLeftPos = clientX - offsetX;
    const relativeX = previewLeftPos - timelineRect.left - TIMELINE_PADDING;
    return Math.max(0, relativeX / scale);
  };

  const handleSplitBlock = (blockId: number, splitTime: number) => {
    setBlocks((prev) => {
      const blockIndex = prev.findIndex((b) => b.id === blockId);
      if (blockIndex === -1) return prev;

      const block = prev[blockIndex];
      if (splitTime <= 0 || splitTime >= block.duration) return prev;

      const firstBlock: Block = {
        ...block,
        duration: splitTime,
      };
      const secondBlock: Block = {
        ...block,
        id: Math.max(...prev.map((b) => b.id)) + 1,
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
    blockId: number,
    trackId: number,
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
      blockWidth: draggedBlock.duration * scale,
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
     const relativeY = e.clientY - timelineRect.top;
     const timePosition = getTimePositionFromClientX(
       e.clientX,
       dragInfo.offsetX,
       timelineRect
     );

     const trackHeight = 70;
     const trackIndex = Math.floor((relativeY - 40) / trackHeight);
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

     const allBlocks = blocks.filter((b) => b.id !== dragInfo.blockId); // All blocks except the dragged one

     let newPosition = timePosition;
     let snapPosition: number | null = null;
     const potentialStart = timePosition;
     const potentialEnd = potentialStart + draggedBlock.duration;

     // Check snapping to all blocks (across tracks) for both start and end edges
     for (const block of allBlocks) {
       const blockStart = block.starttime;
       const blockEnd = block.starttime + block.duration;

       // Snap to left edge (starttime) of any block
       const distanceToStart = Math.abs(potentialStart - blockStart);
       if (distanceToStart < snapThreshold) {
         newPosition = blockStart;
         snapPosition = blockStart;
         break;
       }

       // Snap to right edge (end) of any block
       const distanceToEnd = Math.abs(potentialStart - blockEnd);
       if (distanceToEnd < snapThreshold) {
         newPosition = blockEnd;
         snapPosition = blockEnd;
         break;
       }

       // Snap the end of the dragged block to the start of another block
       const distanceEndToStart = Math.abs(potentialEnd - blockStart);
       if (distanceEndToStart < snapThreshold) {
         newPosition = blockStart - draggedBlock.duration;
         snapPosition = blockStart;
         break;
       }

       // Snap the end of the dragged block to the end of another block
       const distanceEndToEnd = Math.abs(potentialEnd - blockEnd);
       if (distanceEndToEnd < snapThreshold) {
         newPosition = blockEnd - draggedBlock.duration;
         snapPosition = blockEnd;
         break;
       }
     }

     // Ensure the position respects overlaps within the target track
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
   [dragInfo, blocks, tracks]
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
      draggedBlock.type === "video"
        ? "rgba(0, 0, 255, 0.8)"
        : draggedBlock.type === "audio"
        ? "rgba(0, 255, 0, 0.8)"
        : draggedBlock.type === "shape"
        ? "rgba(128, 0, 128, 0.8)"
        : "rgba(255, 165, 0, 0.8)";

    const timelineRect = timelineRef.current.getBoundingClientRect();
    const trackHeight = 70; // Height of each track (60px) + margin (10px)
    const timeAxisHeight = 40; // Height of TimeAxis (30px) + margin (10px)

    // Calculate top position based on target track or mouse position
    const dropTrackIndex =
      dropTarget?.trackId != null
        ? tracks.findIndex((t) => t.id === dropTarget.trackId)
        : -1;
    const dropTrackTop =
      dropTrackIndex >= 0
        ? timelineRect.top +
          TIMELINE_PADDING +
          timeAxisHeight +
          dropTrackIndex * trackHeight
        : dragInfo.currentY - dragInfo.offsetY;

    const leftPos =
      dropTarget?.trackId != null && dropTarget?.position != null
        ? timelineRect.left + TIMELINE_PADDING + dropTarget.position * scale
        : dragInfo.currentX - dragInfo.offsetX;

    return (
      <div
        style={{
          position: "fixed",
          left: `${leftPos}px`,
          top: `${dropTrackTop}px`,
          width: `${draggedBlock.duration * scale}px`,
          height: "50px",
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

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === "select" && !isSplitEnabled) {
      const target = e.target as HTMLElement;
      if (!target.closest(".block-component")) {
        setFocusedBlockId(null);
      }
    }
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
          minHeight: "400px",
        }}
        onClick={handleTimelineClick}
      >
        <TimeAxis totalTime={totalTime} />
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
            />
          );
        })}
        {snapGuidePosition !== null && (
          <div
            style={{
              position: "absolute",
              left: `${snapGuidePosition * scale + TIMELINE_PADDING}px`,
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
            <p>ID: {focusedBlock.id}</p>
            <p>타입: {focusedBlock.type}</p>
            <p>
              트랙:{" "}
              {tracks.find((t) => t.id === focusedBlock.trackId)?.label ||
                "Unknown"}
            </p>
            <p>시작 시간: {focusedBlock.starttime}초</p>
            <p>길이: {focusedBlock.duration}초</p>
            <p>
              끝 시간:{" "}
              {(focusedBlock.starttime + focusedBlock.duration).toFixed(1)}초
            </p>
          </div>
        ) : (
          <p>핸드 모드에서 블록을 클릭하여 선택하세요.</p>
        )}
      </div>
    </div>
  );
};

export default Timeline;
