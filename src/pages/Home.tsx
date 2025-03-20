import React, { useState } from "react";
import Timeline, { Block } from "../components/timeline/Timeline";

const Home: React.FC = () => {
  const [totalTime, setTotalTime] = useState(120);
  const [isSplitEnabled, setIsSplitEnabled] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([
    { id: 1, type: "video", duration: 10, starttime: 0 },
    { id: 2, type: "audio", duration: 5, starttime: 12 },
    { id: 3, type: "shape", duration: 8, starttime: 18 },
    { id: 4, type: "video", duration: 6, starttime: 28 },
  ]);
  const [focusedBlockId, setFocusedBlockId] = useState<number | null>(null);

  // 블록 추가
  const addBlock = () => {
    const newId = blocks.length ? Math.max(...blocks.map((b) => b.id)) + 1 : 1;
    const newBlock: Block = {
      id: newId,
      type: "video", // 기본 타입, 필요 시 선택 UI 추가 가능
      duration: 5, // 기본 길이
      starttime: 0, // 기본 시작 시간
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  // 블록 삭제
  const deleteBlock = () => {
    if (focusedBlockId === null) return;
    setBlocks((prev) => prev.filter((b) => b.id !== focusedBlockId));
    setFocusedBlockId(null); // 삭제 후 포커스 해제
  };

  return (
    <div className="w-full" style={{ padding: "0 60px", overflow: "hidden" }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <span>전체 타임라인 시간 (초):</span>
          <input
            type="number"
            value={totalTime}
            onChange={(e) => setTotalTime(Number(e.target.value))}
            style={{ width: "80px" }}
          />
          <button
            onClick={() => setIsSplitEnabled((prev) => !prev)}
            style={{
              padding: "5px 10px",
              backgroundColor: isSplitEnabled ? "#ff4444" : "#4444ff",
              color: "white",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {isSplitEnabled ? "쪼개기 모드 끄기" : "쪼개기 모드 켜기"}
          </button>
          <button
            onClick={addBlock}
            style={{
              padding: "5px 10px",
              backgroundColor: "#4caf50",
              color: "white",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            블록 추가
          </button>
          <button
            onClick={deleteBlock}
            disabled={focusedBlockId === null}
            style={{
              padding: "5px 10px",
              backgroundColor: focusedBlockId === null ? "#cccccc" : "#f44336",
              color: "white",
              borderRadius: "4px",
              cursor: focusedBlockId === null ? "not-allowed" : "pointer",
            }}
          >
            블록 삭제
          </button>
        </div>
      </div>
      <Timeline
        totalTime={totalTime}
        isSplitEnabled={isSplitEnabled}
        blocks={blocks}
        setBlocks={setBlocks}
        focusedBlockId={focusedBlockId}
        setFocusedBlockId={setFocusedBlockId}
      />
    </div>
  );
};

export default Home;
