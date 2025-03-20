import React, { useState, useRef, useEffect, useCallback } from "react";

const TIMELINE_PADDING = 20;
const scale = 10; // 1초당 10px (렌더)

// 블록 인터페이스
interface Block {
  id: number;
  type: "video" | "audio" | "shape" | "effect";
  duration: number; // 초 단위
  starttime: number; // 초 단위
}

// 타임라인 상단 시간 표시 컴포넌트
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
  boundaries: { min: number; max: number }; // 이동 및 크기 조절 제한 (초 단위)
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
}

// 블록 컴포넌트 (드래그, 리사이즈 직접 구현)
const BlockComponent: React.FC<BlockComponentProps> = ({
  block,
  boundaries,
  updateBlock,
  onDragStart,
}) => {
  const blockRef = useRef<HTMLDivElement>(null);
  const resizeData = useRef<{ startX: number; origDuration: number } | null>(
    null
  );

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
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

  // 리사이즈 시작
  const onResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    resizeData.current = { startX: e.clientX, origDuration: block.duration };
    window.addEventListener("mousemove", onResizing);
    window.addEventListener("mouseup", onResizeMouseUp);
  };

  // 리사이즈 중: 오른쪽에서만 리사이즈하며, 다음 블록과 겹치지 않도록 함
  const onResizing = (e: MouseEvent) => {
    if (!resizeData.current) return;
    const deltaSeconds = (e.clientX - resizeData.current.startX) / scale;
    let newDuration = resizeData.current.origDuration + deltaSeconds;
    // 최소 1초, 최대: boundaries.max - 현재 시작시간
    newDuration = Math.max(1, newDuration);
    newDuration = Math.min(boundaries.max - block.starttime, newDuration);
    updateBlock({ ...block, duration: Math.round(newDuration * 100) / 100 });
  };

  // 리사이즈 종료
  const onResizeMouseUp = () => {
    resizeData.current = null;
    window.removeEventListener("mousemove", onResizing);
    window.removeEventListener("mouseup", onResizeMouseUp);
  };

  const bgColor =
    block.type === "video"
      ? "blue"
      : block.type === "audio"
      ? "green"
      : block.type === "shape"
      ? "purple"
      : "orange";

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
        cursor: "grab",
        userSelect: "none",
        zIndex: 1,
        touchAction: "none", // 모바일 지원 추가
      }}
      onMouseDown={handleDragStart}
      // 터치 이벤트 추가
      onTouchStart={(e) => {
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
      {/* 리사이즈 핸들 (오른쪽) */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: "10px",
          height: "100%",
          backgroundColor: "rgba(255, 0, 0, 0.6)",
          cursor: "ew-resize",
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
}

const BlockRow: React.FC<BlockRowProps> = ({
  type,
  blocks,
  totalTime,
  updateBlock,
  onDragStart,
  isDropTarget,
  dropPosition,
}) => {
  // 행 내 블록들을 시작 시간 순 정렬
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
        // 이전 블록의 끝과 다음 블록의 시작을 기준으로 이동/리사이즈 한계 계산
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
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
};

interface TimelineProps {
  totalTime: number;
}

const Timeline: React.FC<TimelineProps> = ({ totalTime }) => {
  const initialBlocks: Block[] = [
    { id: 1, type: "video", duration: 10, starttime: 0 },
    { id: 2, type: "audio", duration: 5, starttime: 12 },
    { id: 3, type: "shape", duration: 8, starttime: 18 },
    { id: 4, type: "video", duration: 6, starttime: 28 },
  ];
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
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

  // 블록 업데이트 (리사이즈)
  const updateBlock = (updated: Block) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  // 블록 위치 계산 (충돌 방지)
  const calculateBlockPosition = (
    trackType: Block["type"],
    position: number,
    blockId: number,
    blockDuration: number
  ) => {
    // 같은 트랙의 다른 블록들
    const sameTrackBlocks = blocks
      .filter((b) => b.type === trackType && b.id !== blockId)
      .sort((a, b) => a.starttime - b.starttime);

    // 초기 위치
    let newPosition = Math.max(0, position);

    // 다른 블록과 겹치는지 확인
    for (const block of sameTrackBlocks) {
      // 블록의 끝 위치
      const blockEnd = block.starttime + block.duration;

      // 새 위치가 기존 블록의 중간에 있으면
      if (newPosition >= block.starttime && newPosition < blockEnd) {
        // 우선 기존 블록 뒤로 배치
        newPosition = blockEnd;
      }
      // 새 위치와 블록 길이가 기존 블록과 겹치면
      else if (
        newPosition < block.starttime &&
        newPosition + blockDuration > block.starttime
      ) {
        // 기존 블록 앞에 배치 (충분한 공간이 있으면)
        if (block.starttime >= blockDuration) {
          newPosition = block.starttime - blockDuration;
        }
        // 아니면 뒤에 배치
        else {
          newPosition = blockEnd;
        }
      }
    }

    return newPosition;
  };
  // 타임라인 내 상대적 시간 위치를 계산하는 유틸리티 함수
  const getTimePositionFromClientX = (
    clientX: number,
    offsetX: number,
    timelineRect: DOMRect
  ): number => {
    const previewLeftPos = clientX - offsetX; // 미리보기의 left edge
    const relativeX = previewLeftPos - timelineRect.left - TIMELINE_PADDING; // 패딩 보정
    return Math.max(0, relativeX / scale); // 시간 단위로 변환
  };

  // 드래그 시작
  const handleDragStart = (
    blockId: number,
    trackType: Block["type"],
    clientX: number,
    clientY: number,
    blockWidth: number,
    offsetX: number,
    offsetY: number
  ) => {
    setDragInfo({
      blockId,
      originalType: trackType,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      blockWidth: blockWidth,
      offsetX: offsetX,
      offsetY: offsetY,
    });

    // 글로벌 이벤트 리스너 추가
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
            dropTarget.position, // 미리보기의 left edge 기반 위치
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
    [dragInfo, dropTarget, blocks]
  );

  const renderDragPreview = () => {
    if (!dragInfo?.blockId || !timelineRef.current) return null;
    const draggedBlock = blocks.find((b) => b.id === dragInfo.blockId);
    if (!draggedBlock) return null;

    const bgColor =
      draggedBlock.type === "video"
        ? "rgba(0, 0, 255, 0.8)"
        : draggedBlock.type === "audio"
        ? "rgba(18, 148, 85, 0.47)"
        : draggedBlock.type === "shape"
        ? "rgba(128, 0, 128, 0.8)"
        : "rgba(255, 165, 0, 0.8)";

    const leftPos = dragInfo.currentX - dragInfo.offsetX; // 미리보기의 left edge
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

  useEffect(() => {
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
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

  return (
    <div
      ref={timelineRef}
      style={{
        position: "relative",
        overflowX: "auto",
        overflowY: "visible",
        width: "100%",
        padding: `${TIMELINE_PADDING}px`, // 상수 사용
        minHeight: "400px",
      }}
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
          />
        );
      })}
      {renderDragPreview()}
    </div>
  );
};

export default Timeline;
