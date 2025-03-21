import React, { useState } from "react";
import { BlockType } from "../components/timeline/Timeline";
import TimelineUi, { TimelineMode, TimelineState } from "../components/timeline/TimelineUi";
import { v4 as uuidv4 } from "uuid"; // You'll need to install uuid: npm install uuid

// Example usage component
const TimelineWrapper: React.FC = () => {
  const [timelineState, setTimelineState] = useState<TimelineState>({
    totalTime: 120,
    isSplitEnabled: false,
    tracks: [
      { id: uuidv4(), label: "Track 1" },
      { id: uuidv4(), label: "Track 2" },
      { id: uuidv4(), label: "Track 3" },
      { id: uuidv4(), label: "Track 4" },
    ],
    blocks: [
      {
        id: uuidv4(),
        type: BlockType.Video,
        duration: 10,
        starttime: 0,
        trackId: "",
      },
      {
        id: uuidv4(),
        type: BlockType.Audio,
        duration: 5,
        starttime: 12,
        trackId: "",
      },
      {
        id: uuidv4(),
        type: BlockType.Video,
        duration: 8,
        starttime: 18,
        trackId: "",
      },
      {
        id: uuidv4(),
        type: BlockType.Video,
        duration: 6,
        starttime: 28,
        trackId: "",
      },
    ],
    focusedBlockId: null,
    mode: TimelineMode.Hand,
  });

  // Initialize block trackIds to first track
  React.useEffect(() => {
    setTimelineState((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) => ({
        ...block,
        trackId: prev.tracks[0].id,
      })),
    }));
  }, []);

  return (
    <TimelineUi initialValues={timelineState} setValues={setTimelineState} />
  );
};


