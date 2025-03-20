import React, { useState, useRef } from "react";

const scale = 10; // 1초당 10px

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
}

// 블록 컴포넌트 (드래그, 리사이즈 직접 구현)
const BlockComponent: React.FC<BlockComponentProps> = ({
  block,
  boundaries,
  updateBlock,
}) => {
  const blockRef = useRef<HTMLDivElement>(null);
  const dragData = useRef<{ startX: number; origStart: number } | null>(null);
  const resizeData = useRef<{ startX: number; origDuration: number } | null>(
    null
  );

  // 드래그 시작
  const onDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    dragData.current = { startX: e.clientX, origStart: block.starttime };
    window.addEventListener("mousemove", onDragging);
    window.addEventListener("mouseup", onDragMouseUp);
  };

  // 드래그 중
  const onDragging = (e: MouseEvent) => {
    if (!dragData.current) return;
    const deltaSeconds = (e.clientX - dragData.current.startX) / scale;
    let newStart = dragData.current.origStart + deltaSeconds;
    // 충돌 방지: 현재 행의 최소/최대 제한 적용
    newStart = Math.max(boundaries.min, newStart);
    newStart = Math.min(boundaries.max - block.duration, newStart);
    updateBlock({ ...block, starttime: Math.round(newStart * 100) / 100 });
  };

  // 드래그 종료
  const onDragMouseUp = () => {
    dragData.current = null;
    window.removeEventListener("mousemove", onDragging);
    window.removeEventListener("mouseup", onDragMouseUp);
  };

  // 리사이즈 시작
  const onResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    resizeData.current = { startX: e.clientX, origDuration: block.duration };
    window.addEventListener("mousemove", onResizing);
    window.addEventListener("mouseup", onResizeMouseUp);
  };

  // 리사이즈 중: 오른쪽 에서만 리사이즈하며, 다음 블록과 겹치지 않도록 함
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
      }}
      onMouseDown={onDragMouseDown}
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
          backgroundColor: "red",
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
}

const BlockRow: React.FC<BlockRowProps> = ({
  type,
  blocks,
  totalTime,
  updateBlock,
}) => {
  // 행 내 블록들을 시작 시간 순 정렬
  const sortedBlocks = [...blocks].sort((a, b) => a.starttime - b.starttime);

  return (
    <div
      style={{
        position: "relative",
        height: "60px",
        borderBottom: "1px solid #ddd",
        marginBottom: "10px",
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
          />
        );
      })}
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

  // 특정 블록 업데이트 (드래그나 리사이즈로 변경된 값 적용)
  const updateBlock = (updated: Block) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const blockTypes: Block["type"][] = ["video", "audio", "shape", "effect"];

  return (
    <div
      style={{
        position: "relative",
        overflowX: "auto",
        width: "100%",
        padding: "20px",
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
          />
        );
      })}
    </div>
  );
};

export default Timeline;
