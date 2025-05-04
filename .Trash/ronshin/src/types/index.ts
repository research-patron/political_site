// ユーザー関連の型定義
export type UserRole = 'free' | 'premium' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  lastLogin: Date;
  membershipStartDate?: Date;
  savedNewspapers: number;
  generationCount: number;
}

// 論文関連の型定義
export interface Paper {
  id: string;
  userId: string;
  title: string;
  authors: string[];
  publishInfo: {
    journal?: string;
    year?: number;
    doi?: string;
  };
  uploadedAt: Date;
  filePath: string;
  metadata: {
    abstract?: string;
    keywords?: string[];
  };
  aiAnalysis?: {
    summary: string;
    keyPoints: string[];
    topicCategories: string[];
  };
}

// 新聞関連の型定義
export type TemplateType = 'standard' | 'focus' | 'multiColumn';

export interface Newspaper {
  id: string;
  creatorId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  template: TemplateType;
  visibility: 'private' | 'group' | 'public';
  papers: string[]; // Paper IDs
  content: {
    headerTitle: string;
    mainArticle: {
      title: string;
      content: string;
      imageUrl?: string;
    };
    subArticles: Array<{
      title: string;
      content: string;
      imageUrl?: string;
    }>;
    sidebar?: {
      topics: string[];
      quickInfo: string[];
    };
  };
  groupId?: string;
}

// グループ関連の型定義
export interface Group {
  id: string;
  name: string;
  creatorId: string;
  createdAt: Date;
  members: Array<{
    userId: string;
    role: 'admin' | 'member';
  }>;
  sharedNewspapers: string[]; // Newspaper IDs
}
