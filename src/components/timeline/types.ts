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

export interface TimelineProps {
  totalTime: number;
  isSplitEnabled: boolean;
  blocks: Block[];
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  focusedBlockId: string | null;
  setFocusedBlockId: (id: string | null) => void;
  mode: TimelineMode;
  onBlockDoubleClick?: (blockId: string) => void;
  parentBlock?: Block;
}
