import React, { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";

// 블록 인터페이스
interface Block {
  id: number;
  type: "video" | "audio" | "shape" | "effect";
  duration: number; // 초 단위
  starttime: number; // 초 단위
}

const scale = 10; // 1초당 10px

// 타임라인 상단 시간 표시 컴포넌트
const TimeAxis: React.FC<{ maxTime: number }> = ({ maxTime }) => {
  const ticks = [];
  for (let t = 0; t <= maxTime; t += 5) {
    // 5초 간격 눈금
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
          style={{
            position: "absolute",
            left: `${t * scale}px`,
            top: 0,
          }}
        >
          <div style={{ borderLeft: "1px solid #aaa", height: "10px" }}></div>
          <div style={{ fontSize: "10px" }}>{t}s</div>
        </div>
      ))}
    </div>
  );
};

// 개별 블록 컴포넌트 (분할, 리사이즈, 드래그 미리보기 효과 포함)
interface BlockComponentProps {
  block: Block;
  updateBlock: (updatedBlock: Block) => void;
  splitBlock: (blockId: number, splitTime: number) => void;
}
const BlockComponent: React.FC<BlockComponentProps> = ({
  block,
  updateBlock,
  splitBlock,
}) => {
  // 블록 리사이즈 핸들러
  const handleResize = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = block.duration * scale;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      const newDuration = Math.max(1, Math.round(newWidth / scale));
      updateBlock({ ...block, duration: newDuration });
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // 블록 분할 핸들러 (사용자 입력 기반)
  const handleSplit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const input = prompt(
      "분할할 시간을 입력하세요 (초 단위, 예: 3):",
      `${Math.floor(block.duration / 2)}`
    );
    if (!input) return;
    const splitTime = parseInt(input, 10);
    if (isNaN(splitTime) || splitTime <= 0 || splitTime >= block.duration) {
      alert("유효하지 않은 분할 시간입니다.");
      return;
    }
    splitBlock(block.id, splitTime);
  };

  // 블록 타입에 따른 배경색 설정
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
      }}
    >
      <div>{block.type}</div>
      <button onClick={handleSplit} style={{ fontSize: "10px" }}>
        분할
      </button>
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
        onMouseDown={handleResize}
      ></div>
    </div>
  );
};

// 블록 타입별 행(Row) 컴포넌트
interface BlockRowProps {
  type: "video" | "audio" | "shape" | "color";
  blocks: Block[];
  updateBlock: (updatedBlock: Block) => void;
  splitBlock: (blockId: number, splitTime: number) => void;
}
const BlockRow: React.FC<BlockRowProps> = ({
  type,
  blocks,
  updateBlock,
  splitBlock,
}) => {
  return (
    <div
      style={{
        position: "relative",
        height: "60px",
        borderBottom: "1px solid #ddd",
        marginBottom: "10px",
      }}
    >
      {/* 왼쪽에 타입 레이블 */}
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
      <Droppable droppableId={`droppable-${type}`} direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{ position: "relative", height: "100%" }}
          >
            {blocks.map((block, index) => (
              <Draggable
                key={block.id}
                draggableId={block.id.toString()}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                      opacity: snapshot.isDragging ? 0.7 : 1, // 드래그시 미리보기 효과
                    }}
                  >
                    <BlockComponent
                      block={block}
                      updateBlock={updateBlock}
                      splitBlock={splitBlock}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

// 전체 타임라인 컴포넌트
const Timeline: React.FC = () => {
  // 초기 블록 데이터 (예시)
  const initialBlocks: Block[] = [
    { id: 1, type: "video", duration: 10, starttime: 0 },
    { id: 2, type: "audio", duration: 5, starttime: 2 },
    { id: 3, type: "shape", duration: 8, starttime: 4 },
    { id: 4, type: "video", duration: 6, starttime: 1 },
  ];
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);

  const blockTypes: Array<"video" | "audio" | "shape" | "color"> = [
    "video",
    "audio",
    "shape",
    "color",
  ];

  // 드래그 종료시 처리 (같은 행 내 재정렬 및 행 간 이동 시 타입 업데이트)
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const sourceType = result.source.droppableId.replace("droppable-", "");
    const destType = result.destination.droppableId.replace("droppable-", "");

    // 다른 행으로 이동한 경우 타입 업데이트
    if (sourceType !== destType) {
      setBlocks((prevBlocks) => {
        const updated = [...prevBlocks];
        const movingBlockIndex = updated.findIndex(
          (b) => b.id.toString() === result.draggableId
        );
        if (movingBlockIndex === -1) return prevBlocks;
        updated[movingBlockIndex].type = destType as Block["type"];
        return updated;
      });
    }
    // 같은 행 내에서 재정렬
    setBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      // 해당 타입 블록만 필터링
      const filtered = newBlocks.filter((b) => b.type === destType);
      const others = newBlocks.filter((b) => b.type !== destType);
      const sourceIndex = result.source.index;
      const destIndex = result.destination!!.index; ///fixme
      const [removed] = filtered.splice(sourceIndex, 1);
      filtered.splice(destIndex, 0, removed);
      // 재정렬 후 starttime 업데이트 (예: 순서에 따라 60초 간격)
      filtered.forEach((b, i) => {
        b.starttime = i * 60;
      });
      return [...others, ...filtered];
    });
  };

  // 전체 타임라인의 최대 시간 계산 (타임축 범위 결정)
  const maxTime = blocks.reduce(
    (max, block) => Math.max(max, block.starttime + block.duration),
    60
  );

  // 블록 업데이트 함수
  const updateBlock = (updatedBlock: Block) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === updatedBlock.id ? updatedBlock : b))
    );
  };

  // 블록 분할 함수
  const splitBlock = (blockId: number, splitTime: number) => {
    setBlocks((prev) => {
      const block = prev.find((b) => b.id === blockId);
      if (!block) return prev;
      if (splitTime <= 0 || splitTime >= block.duration) return prev;
      const firstBlock: Block = {
        ...block,
        id: Date.now(),
        duration: splitTime,
      };
      const secondBlock: Block = {
        ...block,
        id: Date.now() + 1,
        starttime: block.starttime + splitTime,
        duration: block.duration - splitTime,
      };
      // 기존 블록 제거 후 새 블록 추가
      return prev
        .filter((b) => b.id !== blockId)
        .concat([firstBlock, secondBlock]);
    });
  };

  return (
    <div
      style={{
        position: "relative",
        overflowX: "auto",
        width: "100%",
        padding: "20px",
      }}
    >
      <TimeAxis maxTime={maxTime} />
      <DragDropContext onDragEnd={onDragEnd}>
        {blockTypes.map((type) => {
          const typeBlocks = blocks.filter((b) => b.type === type);
          return (
            <BlockRow
              key={type}
              type={type}
              blocks={typeBlocks}
              updateBlock={updateBlock}
              splitBlock={splitBlock}
            />
          );
        })}
      </DragDropContext>
    </div>
  );
};

export default Timeline;
