import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { BlockType, TimelineMode } from "../components/timeline/Timeline";
import TimelineUi, { TimelineState } from "../components/timeline/TimelineUi";

export const TimelineWrapper: React.FC = () => {
  const [timelineState, setTimelineState] = useState<TimelineState>(() => {
    const tracks = [
      { id: uuidv4(), label: "Track 1" },
      { id: uuidv4(), label: "Track 2" },
      { id: uuidv4(), label: "Track 3" },
      { id: uuidv4(), label: "Track 4" },
    ];
    const firstTrackId = tracks[0].id;
    const firstSubTrackId = uuidv4();

    const subTimeline = {
      blocks: [
        {
          id: uuidv4(),
          type: BlockType.Audio,
          duration: 3,
          starttime: 0,
          trackId: firstSubTrackId,
        },
      ],
      tracks: [{ id: firstSubTrackId, label: "Track 5" }],
    };

    return {
      totalTime: 120,
      isSplitEnabled: false,
      tracks,
      blocks: [
        {
          id: uuidv4(),
          type: BlockType.Video,
          duration: 10,
          starttime: 0,
          trackId: firstTrackId,
          subTimeline, // 서브 타임라인 추가
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
    };
  });

  return (
    <TimelineUi initialValues={timelineState} setValues={setTimelineState} />
  );
};

export default TimelineWrapper;
