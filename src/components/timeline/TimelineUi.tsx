import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import TimelineComponent, {
  Block,
  BlockType,
  TimelineMode,
  Track,
} from "./Timeline";
import { v4 as uuidv4 } from "uuid";

export interface TimelineState {
  totalTime: number;
  isSplitEnabled: boolean;
  tracks: Track[];
  blocks: Block[];
  focusedBlockId: string | null;
  parentTimelineState?: TimelineState;
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
  const [parentTimelineState, setParentTimelineState] = useState<
    TimelineState | undefined
  >(initialValues.parentTimelineState);

  // 상위 컴포넌트로 상태 동기화
  useEffect(() => {
    const currentState: TimelineState = {
      totalTime,
      isSplitEnabled,
      tracks,
      blocks,
      focusedBlockId,
      mode,
      parentTimelineState,
    };
    setValues(currentState);
  }, [
    totalTime,
    isSplitEnabled,
    tracks,
    blocks,
    focusedBlockId,
    mode,
    parentTimelineState,
    setValues,
  ]);

  const addBlock = () => {
    const newBlock: Block = {
      id: uuidv4(),
      type: BlockType.Video,
      duration: 5,
      starttime: 0,
      trackId: tracks[0]?.id ?? uuidv4(),
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  const deleteBlock = () => {
    if (focusedBlockId === null || mode !== TimelineMode.Select) return;
    setBlocks((prev) => prev.filter((b) => b.id !== focusedBlockId));
    setFocusedBlockId(null);
  };

  const addTrack = () => {
    const newId = uuidv4();
    setTracks((prev) => [
      ...prev,
      { id: newId, label: `Track ${prev.length + 1}` },
    ]);
  };

  const removeTrack = () => {
    if (tracks.length <= 1) return;
    const trackToRemove = tracks[tracks.length - 1];
    const newTracks = tracks.slice(0, -1);
    const firstTrackId = newTracks[0]?.id ?? "0";
    setTracks(newTracks);
    setBlocks((prev) =>
      prev.map((b) =>
        b.trackId === trackToRemove.id ? { ...b, trackId: firstTrackId } : b
      )
    );
  };

  const handleDoubleClick = (blockId: string) => {
    const blockIndex = blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return;

    const block = blocks[blockIndex];
    const currentState: TimelineState = {
      totalTime,
      isSplitEnabled,
      tracks,
      blocks,
      focusedBlockId,
      mode,
      parentTimelineState,
    };

    // subTimeline이 없으면 빈 타임라인 생성
    const subTimeline = block.subTimeline || {
      blocks: [],
      tracks: [{ id: uuidv4(), label: "Sub Track 1" }],
    };

    // 상위 blocks 업데이트
    const updatedBlocks = [...blocks];
    updatedBlocks[blockIndex] = { ...block, subTimeline };

    // 새 상태로 전환
    setTotalTime(120);
    setIsSplitEnabled(false);
    setTracks(subTimeline.tracks);
    setBlocks(subTimeline.blocks);
    setFocusedBlockId(null);
    setMode(TimelineMode.Hand);
    setParentTimelineState(currentState);
  };

  const handleExit = () => {
    if (parentTimelineState) {
      setTotalTime(parentTimelineState.totalTime);
      setIsSplitEnabled(parentTimelineState.isSplitEnabled);
      setTracks(parentTimelineState.tracks);
      setBlocks(parentTimelineState.blocks);
      setFocusedBlockId(parentTimelineState.focusedBlockId);
      setMode(parentTimelineState.mode);
      setParentTimelineState(parentTimelineState.parentTimelineState);
    }
  };

  const handleTotalTimeChange = (value: number) => {
    setTotalTime(value);
  };

  const handleSplitToggle = () => {
    setIsSplitEnabled((prev) => !prev);
  };

  const handleModeChange = () => {
    setMode((prev) =>
      prev === TimelineMode.Select ? TimelineMode.Hand : TimelineMode.Select
    );
  };

  const handleBlocksChange: Dispatch<SetStateAction<Block[]>> = (value) => {
    setBlocks((prev) => (typeof value === "function" ? value(prev) : value));
  };

  const handleFocusChange = (id: string | null) => {
    setFocusedBlockId(id);
  };

  const parentBlockId = parentTimelineState?.blocks.find((b) =>
    b.subTimeline?.blocks.some((sb) => sb.id === focusedBlockId)
  )?.id;

  return (
    <div className="w-full" style={{ padding: "0 60px", overflow: "hidden" }}>
      {parentTimelineState && (
        <>
          {parentBlockId && (
            <ParentBlockInfo
              blockId={parentBlockId}
              blocks={parentTimelineState.blocks}
            />
          )}
          <button onClick={handleExit} style={buttonStyle("#ff9800")}>
            상위 타임라인으로 돌아가기
          </button>
        </>
      )}
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
            style={buttonStyle(isSplitEnabled ? "#ff4444" : "#4444ff")}
          >
            {isSplitEnabled ? "쪼개기 모드 끄기" : "쪼개기 모드 켜기"}
          </button>
          <button onClick={addBlock} style={buttonStyle("#4caf50")}>
            블록 추가
          </button>
          <button
            onClick={deleteBlock}
            disabled={focusedBlockId === null || mode !== TimelineMode.Select}
            style={buttonStyle(
              focusedBlockId === null || mode !== TimelineMode.Select
                ? "#cccccc"
                : "#f44336"
            )}
          >
            블록 삭제
          </button>
          <button
            onClick={handleModeChange}
            style={buttonStyle(
              mode === TimelineMode.Select ? "#2196f3" : "#ff9800"
            )}
          >
            {mode === TimelineMode.Select
              ? "현재: 선택 모드"
              : "현재: 핸드 모드"}
          </button>
          <button onClick={addTrack} style={buttonStyle("#4caf50")}>
            트랙 추가
          </button>
          <button
            onClick={removeTrack}
            disabled={tracks.length <= 1}
            style={buttonStyle(tracks.length <= 1 ? "#cccccc" : "#f44336")}
          >
            트랙 제거
          </button>
        </div>
      </div>
      <TimelineComponent
        totalTime={totalTime}
        isSplitEnabled={isSplitEnabled}
        blocks={blocks}
        setBlocks={handleBlocksChange}
        tracks={tracks}
        focusedBlockId={focusedBlockId}
        setFocusedBlockId={handleFocusChange}
        mode={mode}
        onBlockDoubleClick={handleDoubleClick}
      />
    </div>
  );
};

export default TimelineUi;

const ParentBlockInfo: React.FC<{ blockId: string; blocks: Block[] }> = ({
  blockId,
  blocks,
}) => {
  const parentBlock = blocks.find((b) => b.id === blockId);
  if (!parentBlock) return null;

  return (
    <div
      style={{
        padding: "10px",
        backgroundColor: "#f0f0f0",
        borderRadius: "4px",
        marginBottom: "10px",
      }}
    >
      <h3>상위 블록 정보</h3>
      <p>ID: {parentBlock.id}</p>
      <p>타입: {parentBlock.type}</p>
      <p>시작 시간: {parentBlock.starttime}초</p>
      <p>길이: {parentBlock.duration}초</p>
    </div>
  );
};

const buttonStyle = (bgColor: string) => ({
  padding: "5px 10px",
  backgroundColor: bgColor,
  color: "white",
  borderRadius: "4px",
  cursor: "pointer",
  margin: "0 5px",
});
