import React from "react";
import TimelineComponent, {
  Block,
  BlockType,
  TimelineMode,
  Track,
} from "./Timeline";
import { v4 as uuidv4 } from "uuid";

interface Timeline {
  id: string;
  parentId: string | null;
  totalTime: number;
  isSplitEnabled: boolean;
  tracks: Track[];
  blocks: Block[];
  focusedBlockId: string | null;
  mode: TimelineMode;
}

interface TimelineUiProps {
  timelines: Timeline[];
  setTimelines: React.Dispatch<React.SetStateAction<Timeline[]>>;
  currentTimelineId: string;
  setCurrentTimelineId: React.Dispatch<React.SetStateAction<string>>;
}

export const TimelineUi: React.FC<TimelineUiProps> = ({
  timelines,
  setTimelines,
  currentTimelineId,
  setCurrentTimelineId,
}) => {
  const currentTimeline = timelines.find((t) => t.id === currentTimelineId)!;
  const parentTimeline = timelines.find(
    (t) => t.id === currentTimeline.parentId
  );
  const parentBlockId = parentTimeline?.blocks.find(
    (b) => b.subTimelineId === currentTimelineId
  )?.id;

  const addBlock = () => {
    const newBlock: Block = {
      id: uuidv4(),
      type: BlockType.Video,
      duration: 5,
      starttime: 0,
      trackId: currentTimeline.tracks[0]?.id ?? uuidv4(),
    };
    setTimelines((prev) =>
      prev.map((t) =>
        t.id === currentTimelineId
          ? { ...t, blocks: [...t.blocks, newBlock] }
          : t
      )
    );
  };

  const deleteBlock = () => {
    if (
      currentTimeline.focusedBlockId === null ||
      currentTimeline.mode !== TimelineMode.Select
    )
      return;
    setTimelines((prev) =>
      prev.map((t) =>
        t.id === currentTimelineId
          ? {
              ...t,
              blocks: t.blocks.filter(
                (b) => b.id !== currentTimeline.focusedBlockId
              ),
              focusedBlockId: null,
            }
          : t
      )
    );
  };

  const addTrack = () => {
    const newId = uuidv4();
    setTimelines((prev) =>
      prev.map((t) =>
        t.id === currentTimelineId
          ? {
              ...t,
              tracks: [
                ...t.tracks,
                { id: newId, label: `Track ${t.tracks.length + 1}` },
              ],
            }
          : t
      )
    );
  };

  const removeTrack = () => {
    if (currentTimeline.tracks.length <= 1) return;
    const trackToRemove =
      currentTimeline.tracks[currentTimeline.tracks.length - 1];
    const newTracks = currentTimeline.tracks.slice(0, -1);
    const firstTrackId = newTracks[0]?.id ?? "0";
    setTimelines((prev) =>
      prev.map((t) =>
        t.id === currentTimelineId
          ? {
              ...t,
              tracks: newTracks,
              blocks: t.blocks.map((b) =>
                b.trackId === trackToRemove.id
                  ? { ...b, trackId: firstTrackId }
                  : b
              ),
            }
          : t
      )
    );
  };

  const handleDoubleClick = (blockId: string) => {
    const block = currentTimeline.blocks.find((b) => b.id === blockId);
    if (!block) return;

    const subTimelineId = block.subTimelineId || uuidv4();
    if (!block.subTimelineId) {
      setTimelines((prev) => [
        ...prev,
        {
          id: subTimelineId,
          parentId: currentTimelineId,
          totalTime: 120,
          isSplitEnabled: false,
          tracks: [{ id: uuidv4(), label: "Sub Track 1" }],
          blocks: [],
          focusedBlockId: null,
          mode: TimelineMode.Hand,
        },
        ...prev.map((t) =>
          t.id === currentTimelineId
            ? {
                ...t,
                blocks: t.blocks.map((b) =>
                  b.id === blockId ? { ...b, subTimelineId } : b
                ),
              }
            : t
        ),
      ]);
    }
    setCurrentTimelineId(subTimelineId);
  };

  const handleExit = () => {
    if (parentTimeline) {
      setCurrentTimelineId(parentTimeline.id);
    }
  };

  const handleTotalTimeChange = (value: number) => {
    setTimelines((prev) =>
      prev.map((t) =>
        t.id === currentTimelineId ? { ...t, totalTime: value } : t
      )
    );
  };

  const handleSplitToggle = () => {
    setTimelines((prev) =>
      prev.map((t) =>
        t.id === currentTimelineId
          ? { ...t, isSplitEnabled: !t.isSplitEnabled }
          : t
      )
    );
  };

  const handleModeChange = () => {
    setTimelines((prev) =>
      prev.map((t) =>
        t.id === currentTimelineId
          ? {
              ...t,
              mode:
                t.mode === TimelineMode.Select
                  ? TimelineMode.Hand
                  : TimelineMode.Select,
            }
          : t
      )
    );
  };

  const handleBlocksChange: React.Dispatch<React.SetStateAction<Block[]>> = (
    value
  ) => {
    setTimelines((prev) =>
      prev.map((t) =>
        t.id === currentTimelineId
          ? {
              ...t,
              blocks: typeof value === "function" ? value(t.blocks) : value,
            }
          : t
      )
    );
  };

  const handleFocusChange = (id: string | null) => {
    setTimelines((prev) =>
      prev.map((t) =>
        t.id === currentTimelineId ? { ...t, focusedBlockId: id } : t
      )
    );
  };

  return (
    <div className="w-full" style={{ padding: "0 60px", overflow: "hidden" }}>
      {parentTimeline && (
        <div style={{ marginBottom: "20px" }}>
          {parentBlockId && (
            <ParentBlockInfo
              blockId={parentBlockId}
              blocks={parentTimeline.blocks}
            />
          )}
          <button onClick={handleExit} style={buttonStyle("#ff9800")}>
            상위 타임라인으로 돌아가기
          </button>
        </div>
      )}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <span>전체 타임라인 시간 (초):</span>
          <input
            type="number"
            value={currentTimeline.totalTime}
            onChange={(e) => handleTotalTimeChange(Number(e.target.value))}
            style={{ width: "80px" }}
          />
          <button
            onClick={handleSplitToggle}
            style={buttonStyle(
              currentTimeline.isSplitEnabled ? "#ff4444" : "#4444ff"
            )}
          >
            {currentTimeline.isSplitEnabled
              ? "쪼개기 모드 끄기"
              : "쪼개기 모드 켜기"}
          </button>
          <button onClick={addBlock} style={buttonStyle("#4caf50")}>
            블록 추가
          </button>
          <button
            onClick={deleteBlock}
            disabled={
              currentTimeline.focusedBlockId === null ||
              currentTimeline.mode !== TimelineMode.Select
            }
            style={buttonStyle(
              currentTimeline.focusedBlockId === null ||
                currentTimeline.mode !== TimelineMode.Select
                ? "#cccccc"
                : "#f44336"
            )}
          >
            블록 삭제
          </button>
          <button
            onClick={handleModeChange}
            style={buttonStyle(
              currentTimeline.mode === TimelineMode.Select
                ? "#2196f3"
                : "#ff9800"
            )}
          >
            {currentTimeline.mode === TimelineMode.Select
              ? "현재: 선택 모드"
              : "현재: 핸드 모드"}
          </button>
          <button onClick={addTrack} style={buttonStyle("#4caf50")}>
            트랙 추가
          </button>
          <button
            onClick={removeTrack}
            disabled={currentTimeline.tracks.length <= 1}
            style={buttonStyle(
              currentTimeline.tracks.length <= 1 ? "#cccccc" : "#f44336"
            )}
          >
            트랙 제거
          </button>
        </div>
      </div>
      <TimelineComponent
        totalTime={currentTimeline.totalTime}
        isSplitEnabled={currentTimeline.isSplitEnabled}
        blocks={currentTimeline.blocks}
        setBlocks={handleBlocksChange}
        tracks={currentTimeline.tracks}
        focusedBlockId={currentTimeline.focusedBlockId}
        setFocusedBlockId={handleFocusChange}
        mode={currentTimeline.mode}
        onBlockDoubleClick={handleDoubleClick}
        parentBlock={
          parentBlockId && parentTimeline
            ? parentTimeline.blocks.find((b) => b.id === parentBlockId)
            : undefined
        }
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
