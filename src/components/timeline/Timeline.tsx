import React, { useState, useRef, useEffect, useCallback } from "react";

const TIMELINE_PADDING = 20;
const scale = 10;

export interface Block {
  id: number;
  type: "video" | "audio" | "shape" | "effect";
  duration: number;
  starttime: number;
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
    trackType: Block["type"],
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
    if (mode === "hand" || isSplitEnabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (blockRef.current) {
      const rect = blockRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      onDragStart(
        block.id,
        block.type,
        e.clientX,
        e.clientY,
        rect.width,
        offsetX,
        offsetY
      );
    }
  };

  const onResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSplitEnabled || mode === "hand") return;
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
    e.stopPropagation(); // 이벤트 버블링 방지
    if (isSplitEnabled && splitPreview) {
      onSplitBlock(block.id, splitPreview);
      setSplitPreview(null);
    } else if (mode === "hand" && !isSplitEnabled) {
      onFocus(block.id); // 블록 클릭 시 포커스 설정
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
        if (mode === "hand" || isSplitEnabled) return;
        const touch = e.touches[0];
        if (blockRef.current) {
          const rect = blockRef.current.getBoundingClientRect();
          const offsetX = touch.clientX - rect.left;
          const offsetY = touch.clientY - rect.top;
          onDragStart(
            block.id,
            block.type,
            touch.clientX,
            touch.clientY,
            rect.width,
            offsetX,
            offsetY
          );
        }
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
            isSplitEnabled || mode === "hand"
              ? "rgba(150, 150, 150, 0.6)"
              : "rgba(255, 0, 0, 0.6)",
          cursor:
            isSplitEnabled || mode === "hand" ? "not-allowed" : "ew-resize",
        }}
        onMouseDown={onResizeMouseDown}
      ></div>
    </div>
  );
};

interface BlockRowProps {
  type: Block["type"];
  blocks: Block[];
  totalTime: number;
  updateBlock: (updated: Block) => void;
  onDragStart: (
    blockId: number,
    trackType: Block["type"],
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
  type,
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
        {type}
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
  focusedBlockId: number | null;
  setFocusedBlockId: (id: number | null) => void;
  mode: "select" | "hand";
}

const Timeline: React.FC<TimelineProps> = ({
  totalTime,
  isSplitEnabled,
  blocks,
  setBlocks,
  focusedBlockId,
  setFocusedBlockId,
  mode,
}) => {
  const [dragInfo, setDragInfo] = useState<{
    blockId: number | null;
    originalType: Block["type"] | null;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    blockWidth: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    trackType: Block["type"] | null;
    position: number;
  } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const updateBlock = (updated: Block) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const calculateBlockPosition = (
    trackType: Block["type"],
    position: number,
    blockId: number,
    blockDuration: number
  ) => {
    const sameTrackBlocks = blocks
      .filter((b) => b.type === trackType && b.id !== blockId)
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
    trackType: Block["type"],
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
      originalType: trackType,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      blockWidth: draggedBlock.duration * scale,
      offsetX,
      offsetY,
    });

    window.addEventListener("mousemove", handleDragging);
    window.addEventListener("mouseup", handleDragEnd);
  };

  const handleDragging = useCallback(
    (e: MouseEvent) => {
      if (!dragInfo || !dragInfo.blockId || !timelineRef.current) return;

      setDragInfo((prev) => ({
        ...prev!,
        currentX: e.clientX,
        currentY: e.clientY,
      }));

      const timelineRect = timelineRef.current.getBoundingClientRect();
      const relativeY = e.clientY - timelineRect.top;
      const timePosition = getTimePositionFromClientX(
        e.clientX,
        dragInfo.offsetX,
        timelineRect
      );

      const trackHeight = 70;
      const trackIndex = Math.floor((relativeY - 40) / trackHeight);
      const blockTypes: Block["type"][] = ["video", "audio", "shape", "effect"];
      const targetTrackType =
        trackIndex >= 0 && trackIndex < blockTypes.length
          ? blockTypes[trackIndex]
          : null;

      const draggedBlock = blocks.find((b) => b.id === dragInfo.blockId);
      if (
        targetTrackType &&
        draggedBlock &&
        targetTrackType === draggedBlock.type
      ) {
        setDropTarget({
          trackType: targetTrackType,
          position: Math.round(timePosition * 10) / 10,
        });
      } else {
        setDropTarget(null);
      }
    },
    [dragInfo, blocks]
  );

  const handleDragEnd = useCallback(
    (e: MouseEvent) => {
      if (dragInfo?.blockId && dropTarget?.trackType) {
        const draggedBlock = blocks.find((b) => b.id === dragInfo.blockId);
        if (draggedBlock && draggedBlock.type === dropTarget.trackType) {
          const newPosition = calculateBlockPosition(
            dropTarget.trackType,
            dropTarget.position,
            dragInfo.blockId,
            draggedBlock.duration
          );
          setBlocks((prev) =>
            prev.map((b) =>
              b.id === dragInfo.blockId ? { ...b, starttime: newPosition } : b
            )
          );
        }
      }
      setDragInfo(null);
      setDropTarget(null);
      window.removeEventListener("mousemove", handleDragging);
      window.removeEventListener("mouseup", handleDragEnd);
    },
    [dragInfo, dropTarget, blocks, setBlocks]
  );

  const renderDragPreview = () => {
    if (!dragInfo?.blockId || !timelineRef.current) return null;
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

    const leftPos = dragInfo.currentX - dragInfo.offsetX;
    const topPos = dragInfo.currentY - dragInfo.offsetY;

    return (
      <div
        style={{
          position: "fixed",
          left: leftPos,
          top: topPos,
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

  const blockTypes: Block["type"][] = ["video", "audio", "shape", "effect"];

  // 타임라인 클릭 시 처리
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === "hand" && !isSplitEnabled) {
      const target = e.target as HTMLElement;
      // 클릭 대상이 블록이 아닌 경우 포커스 해제
      if (!target.closest(".block-component")) {
        setFocusedBlockId(null);
      }
    }
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleDragging);
      window.removeEventListener("mouseup", handleDragEnd);
    };
  }, []);

  useEffect(() => {
    if (dragInfo) {
      window.addEventListener("mousemove", handleDragging);
      window.addEventListener("mouseup", handleDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleDragging);
      window.removeEventListener("mouseup", handleDragEnd);
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
        onClick={handleTimelineClick} // 타임라인 클릭 이벤트
      >
        <TimeAxis totalTime={totalTime} />
        {blockTypes.map((type) => {
          const typeBlocks = blocks.filter((b) => b.type === type);
          return (
            <BlockRow
              key={type}
              type={type}
              blocks={typeBlocks}
              totalTime={totalTime}
              updateBlock={updateBlock}
              onDragStart={handleDragStart}
              isDropTarget={dropTarget?.trackType === type}
              dropPosition={
                dropTarget?.trackType === type ? dropTarget.position : null
              }
              onSplitBlock={handleSplitBlock}
              isSplitEnabled={isSplitEnabled}
              focusedBlockId={focusedBlockId}
              onFocus={setFocusedBlockId}
              mode={mode}
            />
          );
        })}
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
