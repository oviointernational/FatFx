export type PostType = 'STANDARD' | 'STEPPER' | 'THREAD';

export interface PostMedia {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'TRADINGVIEW' | 'LINK';
  title?: string;
}

export interface PostStep {
  stepNumber: number;
  title?: string;
  content: string;
  mediaUrl?: string;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  authorFullName: string;
  authorAvatarUrl?: string;
  authorRole?: string;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorUsername: string;
  authorFullName: string;
  authorAvatarUrl?: string;
  authorRole: 'USER' | 'PRO_TRADER' | 'MODERATOR' | 'ADMIN';
  isAuthorVerified?: boolean;
  content: string;
  postType: PostType;
  steps?: PostStep[]; // For stepper or multi-box posts with '+' button
  mediaLinks?: PostMedia[];
  tags?: string[]; // e.g. ['#XAUUSD', '#ICT', '#LondonOpen']
  likes: string[]; // array of userIds who liked
  comments: PostComment[];
  createdAt: string;
  updatedAt: string;
}
