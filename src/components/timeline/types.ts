export enum BlockType {
  Video = "video",
  Audio = "audio",
  Animation = "animation",
}

export interface Block {
  id: string;
  type: BlockType;
  duration: number;
  starttime: number;
  trackId: string;
  subTimelineId?: string;
}

export interface Track {
  id: string;
  label: string;
  allowedTypes?: BlockType[];
}

export enum TimelineMode {
  Select = "select",
  Hand = "hand",
}


export interface Timeline {
  id: string;
  parentId: string | null;
  totalTime: number;
  isSplitEnabled: boolean;
  tracks: Track[];
  blocks: Block[];
  focusedBlockId: string | null;
  mode: TimelineMode;
}