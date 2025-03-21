import React, { useState, Dispatch, SetStateAction } from "react";
import TimelineComponenet, {
  Block,
  BlockType,
  TimelineMode,
  Track,
} from "./Timeline";
import { v4 as uuidv4 } from "uuid"; // You'll need to install uuid: npm install uuid

// Define interfaces for the component props
export interface TimelineState {
  totalTime: number;
  isSplitEnabled: boolean;
  tracks: Track[];
  blocks: Block[];
  focusedBlockId: string | null;
  mode: TimelineMode;
}

export interface TimelineUiProps {
  initialValues: TimelineState;
  setValues: Dispatch<SetStateAction<TimelineState>>;
}

export const TimelineUi: React.FC<TimelineUiProps> = ({
  initialValues,
  setValues,
}) => {
  const [totalTime, setTotalTime] = useState(initialValues.totalTime);
  const [isSplitEnabled, setIsSplitEnabled] = useState(
    initialValues.isSplitEnabled
  );
  const [tracks, setTracks] = useState<Track[]>(initialValues.tracks);
  const [blocks, setBlocks] = useState<Block[]>(initialValues.blocks);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(
    initialValues.focusedBlockId
  );
  const [mode, setMode] = useState<TimelineMode>(initialValues.mode);

  // Sync state changes back to parent
  const updateValues = (updates: Partial<TimelineState>) => {
    setValues((prev) => ({ ...prev, ...updates }));
  };

  const addBlock = () => {
    const newBlock: Block = {
      id: uuidv4(),
      type: BlockType.Video,
      duration: 5,
      starttime: 0,
      trackId: tracks[0]?.id ?? uuidv4(),
    };
    setBlocks((prev) => {
      const newBlocks = [...prev, newBlock];
      updateValues({ blocks: newBlocks });
      return newBlocks;
    });
  };

  const deleteBlock = () => {
    if (focusedBlockId === null || mode !== "select") return;
    setBlocks((prev) => {
      const newBlocks = prev.filter((b) => b.id !== focusedBlockId);
      updateValues({ blocks: newBlocks, focusedBlockId: null });
      return newBlocks;
    });
    setFocusedBlockId(null);
  };

  const addTrack = () => {
    const newId = uuidv4();
    setTracks((prev) => {
      const newTracks = [
        ...prev,
        { id: newId, label: `Track ${prev.length + 1}` },
      ];
      updateValues({ tracks: newTracks });
      return newTracks;
    });
  };

  const removeTrack = () => {
    if (tracks.length <= 1) return;
    const trackToRemove = tracks[tracks.length - 1];
    setTracks((prev) => {
      const newTracks = prev.slice(0, -1);
      const firstTrackId = newTracks[0]?.id ?? "0";
      setBlocks((prevBlocks) => {
        const newBlocks = prevBlocks.map((b) =>
          b.trackId === trackToRemove.id ? { ...b, trackId: firstTrackId } : b
        );
        updateValues({ tracks: newTracks, blocks: newBlocks });
        return newBlocks;
      });
      return newTracks;
    });
  };

  const handleTotalTimeChange = (value: number) => {
    setTotalTime(value);
    updateValues({ totalTime: value });
  };

  const handleSplitToggle = () => {
    setIsSplitEnabled((prev) => {
      const newValue = !prev;
      updateValues({ isSplitEnabled: newValue });
      return newValue;
    });
  };

  const handleModeChange = () => {
    setMode((prev) => {
      const newMode =
        prev === TimelineMode.Select ? TimelineMode.Hand : TimelineMode.Select;
      updateValues({ mode: newMode });
      return newMode;
    });
  };

  const handleBlocksChange: Dispatch<SetStateAction<Block[]>> = (value) => {
    setBlocks((prev) => {
      const newBlocks = typeof value === "function" ? value(prev) : value;
      updateValues({ blocks: newBlocks });
      return newBlocks;
    });
  };

  const handleFocusChange = (id: string | null) => {
    setFocusedBlockId(id);
    updateValues({ focusedBlockId: id });
  };

  return (
    <div className="w-full" style={{ padding: "0 60px", overflow: "hidden" }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <span>전체 타임라인 시간 (초):</span>
          <input
            type="number"
            value={totalTime}
            onChange={(e) => handleTotalTimeChange(Number(e.target.value))}
            style={{ width: "80px" }}
          />
          <button
            onClick={handleSplitToggle}
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
            onClick={handleModeChange}
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
      <TimelineComponenet
        totalTime={totalTime}
        isSplitEnabled={isSplitEnabled}
        blocks={blocks}
        setBlocks={handleBlocksChange}
        tracks={tracks}
        focusedBlockId={focusedBlockId}
        setFocusedBlockId={handleFocusChange}
        mode={mode}
      />
    </div>
  );
};

export default TimelineUi;
