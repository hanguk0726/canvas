import React, { useState, useEffect } from "react";
import { BlockType, TimelineMode } from "../components/timeline/Timeline";
import TimelineUi, {
  TimelineState,
} from "../components/timeline/TimelineUi";
import { v4 as uuidv4 } from "uuid";

export const TimelineWrapper: React.FC = () => {
  const [timelineState, setTimelineState] = useState<TimelineState>(() => {
    // Generate tracks with UUIDs
    const tracks = [
      { id: uuidv4(), label: "Track 1" },
      { id: uuidv4(), label: "Track 2" },
      { id: uuidv4(), label: "Track 3" },
      { id: uuidv4(), label: "Track 4" },
    ];

    // Assign the first track's ID to all initial blocks
    const firstTrackId = tracks[0].id;

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
          trackId: firstTrackId, // Assign valid trackId
        },
        {
          id: uuidv4(),
          type: BlockType.Audio,
          duration: 5,
          starttime: 12,
          trackId: firstTrackId, // Assign valid trackId
        },
        {
          id: uuidv4(),
          type: BlockType.Video,
          duration: 8,
          starttime: 18,
          trackId: firstTrackId, // Assign valid trackId
        },
        {
          id: uuidv4(),
          type: BlockType.Video,
          duration: 6,
          starttime: 28,
          trackId: firstTrackId, // Assign valid trackId
        },
      ],
      focusedBlockId: null,
      mode: TimelineMode.Hand,
    };
  });

  // Optional: If you want to distribute blocks across tracks, you can use useEffect
  useEffect(() => {
    setTimelineState((prev) => {
      const updatedBlocks = prev.blocks.map((block, index) => ({
        ...block,
        trackId: prev.tracks[index % prev.tracks.length].id, // Distribute across tracks
      }));
      return { ...prev, blocks: updatedBlocks };
    });
  }, []); // Runs once on mount

  return (
    <TimelineUi initialValues={timelineState} setValues={setTimelineState} />
  );
};

export default TimelineWrapper;
