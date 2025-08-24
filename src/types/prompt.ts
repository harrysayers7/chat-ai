export interface Prompt {
  id: string;
  name: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
  isPublic: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

export interface CreatePromptRequest {
  name: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface UpdatePromptRequest {
  name?: string;
  content?: string;
  description?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface PromptCategory {
  id: string;
  name: string;
  color?: string;
  userId: string;
}

export interface PromptSearchFilters {
  query?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
}
