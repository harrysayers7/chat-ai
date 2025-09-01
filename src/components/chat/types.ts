export interface Turn {
  user?: {
    id: string;
    content: string;
    isError: boolean;
    timestamp?: number;
  };
  assistant?: {
    id: string;
    content: string;
    isError: boolean;
    isLastMessage: boolean;
    parts: any[];
    timestamp?: number;
  };
}

export interface ChatUIProps {
  messages: any[];
  isLoading?: boolean;
  onPoxyToolCall?: (data: any) => void;
}

export interface TurnComponentProps {
  turn: Turn;
  isPinned: boolean;
  isStarred: boolean;
  onTogglePin: (key: string) => void;
  onToggleStar: (key: string) => void;
  defaultOpen?: boolean;
  turnKey: string;
  onPoxyToolCall?: (data: any) => void;
  isSelected?: boolean;
  onToggleSelect?: (key: string) => void;
  showCheckbox?: boolean;
}

export interface FloatingControlsProps {
  filteredTurns: Turn[];
  showOnlyStarred: boolean;
  onToggleStarFilter: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onToggleBulkMode?: () => void;
  isBulkMode?: boolean;
}

export interface PinnedChatsSectionProps {
  turns: Turn[];
  pinned: Record<string, boolean>;
  starred: Record<string, boolean>;
  onTogglePin: (key: string) => void;
  onToggleStar: (key: string) => void;
}

export interface OlderChatsSectionProps {
  filteredTurns: Turn[];
  pinned: Record<string, boolean>;
  starred: Record<string, boolean>;
  onTogglePin: (key: string) => void;
  onToggleStar: (key: string) => void;
  onPoxyToolCall?: (data: any) => void;
  refs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  shouldOpen: (idx: number, key: string) => boolean;
}

export interface CurrentMessageSectionProps {
  turn: Turn;
  isPinned: boolean;
  isStarred: boolean;
  onTogglePin: (key: string) => void;
  onToggleStar: (key: string) => void;
  turnKey: string;
  onPoxyToolCall?: (data: any) => void;
  refs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  idx: number;
}
