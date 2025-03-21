import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { BlockType, TimelineMode, TOTAL_TIME } from "../components/timeline/Timeline";
import TimelineUi from "../components/timeline/TimelineUi";

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

interface Block {
  id: string;
  type: BlockType;
  duration: number;
  starttime: number;
  trackId: string;
  subTimelineId?: string; // 서브 타임라인 ID 참조
}

interface Track {
  id: string;
  label: string;
}

export const TimelineWrapper: React.FC = () => {
  const [timelines, setTimelines] = useState<Timeline[]>(() => {
    const tracks = [
      { id: uuidv4(), label: "Track 1" },
      { id: uuidv4(), label: "Track 2" },
      { id: uuidv4(), label: "Track 3" },
      { id: uuidv4(), label: "Track 4" },
    ];
    const firstTrackId = tracks[0].id;
    const firstSubTrackId = uuidv4();
    const subTimelineId = uuidv4();

    return [
      {
        id: "root",
        parentId: null,
        totalTime: TOTAL_TIME,
        isSplitEnabled: false,
        tracks,
        blocks: [
          {
            id: uuidv4(),
            type: BlockType.Video,
            duration: 10,
            starttime: 0,
            trackId: firstTrackId,
            subTimelineId, // 서브 타임라인 ID 참조
          },
          {
            id: uuidv4(),
            type: BlockType.Audio,
            duration: 5,
            starttime: 12,
            trackId: firstTrackId,
          },
        ],
        focusedBlockId: null,
        mode: TimelineMode.Hand,
      },
      {
        id: subTimelineId,
        parentId: "root",
        totalTime: TOTAL_TIME,
        isSplitEnabled: false,
        tracks: [{ id: firstSubTrackId, label: "Track 5" }],
        blocks: [
          {
            id: uuidv4(),
            type: BlockType.Audio,
            duration: 3,
            starttime: 0,
            trackId: firstSubTrackId,
          },
        ],
        focusedBlockId: null,
        mode: TimelineMode.Hand,
      },
    ];
  });
  const [currentTimelineId, setCurrentTimelineId] = useState<string>("root");

  return (
    <TimelineUi
      timelines={timelines}
      setTimelines={setTimelines}
      currentTimelineId={currentTimelineId}
      setCurrentTimelineId={setCurrentTimelineId}
    />
  );
};

export default TimelineWrapper;
