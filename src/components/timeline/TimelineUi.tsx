import React, { useState } from "react";
import { Block } from "./Timeline";

const TimelienUi: React.FC = () => {
  const [totalTime, setTotalTime] = useState(120);
  const [isSplitEnabled, setIsSplitEnabled] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([
    { id: 1, type: "video", duration: 10, starttime: 0, trackId: 0 },
    { id: 2, type: "audio", duration: 5, starttime: 12, trackId: 1 },
    { id: 3, type: "shape", duration: 8, starttime: 18, trackId: 2 },
    { id: 4, type: "video", duration: 6, starttime: 28, trackId: 0 },
  ]);
  const [tracks, setTracks] = useState([
    { id: 0, label: "Track 1" },
    { id: 1, label: "Track 2" },
    { id: 2, label: "Track 3" },
    { id: 3, label: "Track 4" },
  ]);
  const [focusedBlockId, setFocusedBlockId] = useState<number | null>(null);
  const [mode, setMode] = useState<"select" | "hand">("hand");

  const addBlock = () => {
    const newId = blocks.length ? Math.max(...blocks.map((b) => b.id)) + 1 : 1;
    const newBlock: Block = {
      id: newId,
      type: "video",
      duration: 5,
      starttime: 0,
      trackId: tracks[0]?.id ?? 0, // Default to first track, or 0 if no tracks
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  const deleteBlock = () => {
    if (focusedBlockId === null || mode !== "hand") return;
    setBlocks((prev) => prev.filter((b) => b.id !== focusedBlockId));
    setFocusedBlockId(null);
  };

  const addTrack = () => {
    const newId = tracks.length ? Math.max(...tracks.map((t) => t.id)) + 1 : 0;
    setTracks((prev) => [...prev, { id: newId, label: `Track ${newId + 1}` }]);
  };

  const removeTrack = () => {
    if (tracks.length <= 1) return; // Keep at least one track
    const trackToRemove = tracks[tracks.length - 1]; // Remove the last track
    setTracks((prev) => prev.slice(0, -1));

    // Reassign blocks from the removed track to the first remaining track
    const firstTrackId = tracks[0]?.id ?? 0;
    setBlocks((prev) =>
      prev.map((b) =>
        b.trackId === trackToRemove.id ? { ...b, trackId: firstTrackId } : b
      )
    );
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
            disabled={focusedBlockId === null || mode !== "select"}
            style={{
              padding: "5px 10px",
              backgroundColor:
                focusedBlockId === null || mode !== "select"
                  ? "#cccccc"
                  : "#f44336",
              color: "white",
              borderRadius: "4px",
              cursor:
                focusedBlockId === null || mode !== "select"
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            블록 삭제
          </button>
          <button
            onClick={() => setMode(mode === "select" ? "hand" : "select")}
            style={{
              padding: "5px 10px",
              backgroundColor: mode === "select" ? "#2196f3" : "#ff9800",
              color: "white",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {mode === "select" ? "현재: 선택 모드" : "현재: 핸드 모드"}
          </button>
          <button
            onClick={addTrack}
            style={{
              padding: "5px 10px",
              backgroundColor: "#4caf50",
              color: "white",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            트랙 추가
          </button>
          <button
            onClick={removeTrack}
            disabled={tracks.length <= 1}
            style={{
              padding: "5px 10px",
              backgroundColor: tracks.length <= 1 ? "#cccccc" : "#f44336",
              color: "white",
              borderRadius: "4px",
              cursor: tracks.length <= 1 ? "not-allowed" : "pointer",
            }}
          >
            트랙 제거
          </button>
        </div>
      </div>
      <Timeline
        totalTime={totalTime}
        isSplitEnabled={isSplitEnabled}
        blocks={blocks}
        setBlocks={setBlocks}
        tracks={tracks}
        focusedBlockId={focusedBlockId}
        setFocusedBlockId={setFocusedBlockId}
        mode={mode}
      />
    </div>
  );
};

export default TimelienUi;
