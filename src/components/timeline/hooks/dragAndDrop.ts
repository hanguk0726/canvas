import { useState, useCallback } from "react";
import { Block, Track } from "../types";
import {
  getScale,
  SNAP_THRESHOLD,
  TIMELINE_PADDING,
  TRACK_HEIGHT,
  TRACK_MARGIN_BOTTOM,
  TIME_AXIS_HEIGHT,
  TIME_AXIS_MARGIN_BOTTOM,
  PARENT_TRACK_HEIGHT,
  PARENT_TRACK_MARGIN_BOTTOM,
} from "../constants";

interface DragInfo {
  blockId: string;
  originalTrackId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  blockWidth: number;
  offsetX: number;
  offsetY: number;
}

export const useDragAndDrop = (
  blocks: Block[],
  tracks: Track[],
  parentBlock: Block | undefined,
  timelineRef: React.RefObject<HTMLDivElement>,
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>
) => {
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    trackId: string;
    position: number;
  } | null>(null);
  const [snapGuidePosition, setSnapGuidePosition] = useState<number | null>(
    null
  );

  const calculateBlockPosition = (
    trackId: string,
    position: number,
    blockId: string,
    blockDuration: number
  ) => {
    const sameTrackBlocks = blocks
      .filter((b) => b.trackId === trackId && b.id !== blockId)
      .sort((a, b) => a.starttime - b.starttime);
    let newPosition = Math.max(0, position);

    for (const block of sameTrackBlocks) {
      const blockEnd = block.starttime + block.duration;
      if (newPosition >= block.starttime && newPosition < blockEnd) {
        newPosition = blockEnd;
      } else if (
        newPosition < block.starttime &&
        newPosition + blockDuration > block.starttime
      ) {
        newPosition =
          block.starttime >= blockDuration
            ? block.starttime - blockDuration
            : blockEnd;
      }
    }
    return newPosition;
  };

  const getTimePositionFromClientX = (
    clientX: number,
    offsetX: number,
    timelineRect: DOMRect,
    scrollLeft: number
  ) => {
    const previewLeftPos = clientX - offsetX;
    const relativeX =
      previewLeftPos - timelineRect.left - TIMELINE_PADDING + scrollLeft;
    return Math.max(0, relativeX / getScale());
  };

  const handleDragStart = (
    blockId: string,
    trackId: string,
    clientX: number,
    clientY: number,
    blockWidth: number,
    offsetX: number,
    offsetY: number
  ) => {
    const draggedBlock = blocks.find((b) => b.id === blockId);
    if (!draggedBlock) return;

    setDragInfo({
      blockId,
      originalTrackId: trackId,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      blockWidth,
      offsetX,
      offsetY,
    });
  };

  const handleDragging = useCallback(
    (e: MouseEvent) => {
      if (!dragInfo || !timelineRef.current) return;

      setDragInfo((prev) =>
        prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null
      );

      const timelineRect = timelineRef.current.getBoundingClientRect();
      const scrollLeft = timelineRef.current.scrollLeft;
      const relativeY = e.clientY - timelineRect.top;
      const timePosition = getTimePositionFromClientX(
        e.clientX,
        dragInfo.offsetX,
        timelineRect,
        scrollLeft
      );

      const totalTrackHeight = TRACK_HEIGHT + TRACK_MARGIN_BOTTOM;
      const totalTimeAxisHeight = TIME_AXIS_HEIGHT + TIME_AXIS_MARGIN_BOTTOM;
      const totalParentTrackHeight = parentBlock
        ? PARENT_TRACK_HEIGHT + PARENT_TRACK_MARGIN_BOTTOM
        : 0;
      const offsetY = totalTimeAxisHeight + totalParentTrackHeight;

      const trackIndex = Math.floor((relativeY - offsetY) / totalTrackHeight);
      const targetTrackId =
        trackIndex >= 0 && trackIndex < tracks.length
          ? tracks[trackIndex].id
          : null;

      const draggedBlock = blocks.find((b) => b.id === dragInfo.blockId);
      if (!draggedBlock || !targetTrackId) {
        setDropTarget(null);
        setSnapGuidePosition(null);
        return;
      }

      const targetTrack = tracks.find((t) => t.id === targetTrackId);
      // 수정: allowedTypes가 비어 있으면 모든 타입 허용
      if (
        targetTrack?.allowedTypes &&
        targetTrack.allowedTypes.length > 0 &&
        !targetTrack.allowedTypes.includes(draggedBlock.type)
      ) {
        setDropTarget(null);
        setSnapGuidePosition(null);
        return;
      }

      let newPosition = timePosition;
      let snapPosition: number | null = null;
      const potentialStart = timePosition;
      const potentialEnd = potentialStart + draggedBlock.duration;

      if (parentBlock) {
        const parentStart = parentBlock.starttime;
        const parentEnd = parentBlock.starttime + parentBlock.duration;
        if (Math.abs(potentialStart - parentStart) < SNAP_THRESHOLD) {
          newPosition = parentStart;
          snapPosition = parentStart;
        } else if (Math.abs(potentialStart - parentEnd) < SNAP_THRESHOLD) {
          newPosition = parentEnd;
          snapPosition = parentEnd;
        } else if (Math.abs(potentialEnd - parentStart) < SNAP_THRESHOLD) {
          newPosition = parentStart - draggedBlock.duration;
          snapPosition = parentStart;
        } else if (Math.abs(potentialEnd - parentEnd) < SNAP_THRESHOLD) {
          newPosition = parentEnd - draggedBlock.duration;
          snapPosition = parentEnd;
        }
      }

      if (!snapPosition) {
        const allBlocks = blocks.filter((b) => b.id !== dragInfo.blockId);
        for (const block of allBlocks) {
          const blockStart = block.starttime;
          const blockEnd = block.starttime + block.duration;
          if (Math.abs(potentialStart - blockStart) < SNAP_THRESHOLD) {
            newPosition = blockStart;
            snapPosition = blockStart;
            break;
          } else if (Math.abs(potentialStart - blockEnd) < SNAP_THRESHOLD) {
            newPosition = blockEnd;
            snapPosition = blockEnd;
            break;
          } else if (Math.abs(potentialEnd - blockStart) < SNAP_THRESHOLD) {
            newPosition = blockStart - draggedBlock.duration;
            snapPosition = blockStart;
            break;
          } else if (Math.abs(potentialEnd - blockEnd) < SNAP_THRESHOLD) {
            newPosition = blockEnd - draggedBlock.duration;
            snapPosition = blockEnd;
            break;
          }
        }
      }

      newPosition = calculateBlockPosition(
        targetTrackId,
        newPosition,
        dragInfo.blockId,
        draggedBlock.duration
      );
      setDropTarget({
        trackId: targetTrackId,
        position: Math.round(newPosition * 10) / 10,
      });
      setSnapGuidePosition(snapPosition);
    },
    [dragInfo, blocks, tracks, parentBlock, timelineRef]
  );

  const handleDragEnd = useCallback(() => {
    if (!dragInfo || !dropTarget || !dropTarget.trackId) {
      setDragInfo(null);
      setDropTarget(null);
      setSnapGuidePosition(null);
      return;
    }

    const draggedBlock = blocks.find((b) => b.id === dragInfo.blockId);
    if (!draggedBlock) return;

    const newPosition = calculateBlockPosition(
      dropTarget.trackId,
      dropTarget.position,
      dragInfo.blockId,
      draggedBlock.duration
    );
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === dragInfo.blockId
          ? { ...b, starttime: newPosition, trackId: dropTarget.trackId }
          : b
      )
    );

    setDragInfo(null);
    setDropTarget(null);
    setSnapGuidePosition(null);
  }, [dragInfo, dropTarget, blocks, setBlocks]);

  return {
    dragInfo,
    dropTarget,
    snapGuidePosition,
    handleDragStart,
    handleDragging,
    handleDragEnd,
  };
};
