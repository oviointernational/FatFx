import React, { createContext, useContext, useState, useEffect } from 'react';
import { Post, PostType, PostStep, PostMedia } from '../types/feed';
import { SupabaseService } from '../services/supabaseService';
import { useAuth } from './AuthContext';
import { useUsers } from './UserContext';
import { generateUUID } from '../utils/formatters';

interface FeedContextType {
  posts: Post[];
  getPersonalizedFeed: (filterMode: 'ALL' | 'CONNECTED' | 'PRO') => Post[];
  addPost: (postData: {
    content: string;
    postType: PostType;
    steps?: PostStep[];
    mediaLinks?: PostMedia[];
    tags?: string[];
  }) => Promise<void>;
  likePost: (postId: string) => void;
  addComment: (postId: string, content: string) => void;
  deletePost: (postId: string) => void;
  refreshPosts: () => Promise<void>;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const FeedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { hasPushWithUser, getConnectionState } = useUsers();
  const [posts, setPosts] = useState<Post[]>([]);

  const refreshPosts = async () => {
    const remote = await SupabaseService.getPosts();
    if (remote) {
      setPosts(remote);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const remote = await SupabaseService.getPosts();
      if (mounted && remote) setPosts(remote);
    })();
    return () => { mounted = false; };
  }, [currentUser?.id]);

  const getPersonalizedFeed = (filterMode: 'ALL' | 'CONNECTED' | 'PRO'): Post[] => {
    if (!currentUser && filterMode === 'CONNECTED') return [];

    if (filterMode === 'CONNECTED' && currentUser) {
      return posts.filter(p =>
        p.authorId === currentUser.id ||
        hasPushWithUser(p.authorUsername) ||
        getConnectionState(p.authorId) === 'CONNECTED'
      );
    }

    if (filterMode === 'PRO') {
      return posts.filter(p => p.authorRole === 'PRO_TRADER' || p.authorRole === 'ADMIN');
    }

    const connectedUserIds = currentUser ? Object.keys(currentUser.connections || {}) : [];
    const isConnected = (p: Post) =>
      Boolean(currentUser && (
        p.authorId === currentUser.id ||
        connectedUserIds.includes(p.authorId) ||
        hasPushWithUser(p.authorUsername)
      ));

    return [...posts].sort((a, b) => {
      const aC = isConnected(a);
      const bC = isConnected(b);
      if (aC && !bC) return -1;
      if (!aC && bC) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const addPost = async (postData: {
    content: string;
    postType: PostType;
    steps?: PostStep[];
    mediaLinks?: PostMedia[];
    tags?: string[];
  }) => {
    if (!currentUser) return;

    const payload = {
      authorId: currentUser.id,
      authorUsername: currentUser.username,
      authorFullName: currentUser.fullName,
      authorAvatarUrl: currentUser.avatarUrl,
      authorRole: currentUser.role,
      isAuthorVerified: currentUser.isVerified,
      content: postData.content,
      postType: postData.postType,
      steps: postData.steps,
      mediaLinks: postData.mediaLinks,
      tags: postData.tags,
    };

    const remote = await SupabaseService.createPost(payload);
    if (remote) {
      setPosts(prev => [remote, ...prev]);
    } else {
      console.error('[FeedContext] addPost: Supabase insert failed.');
    }
  };

  const likePost = (postId: string) => {
    if (!currentUser) return;
    const target = posts.find(p => p.id === postId);
    if (!target) return;
    const isCurrentlyLiked = target.likes.includes(currentUser.id);

    // Optimistic UI update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const nextLikes = isCurrentlyLiked
          ? p.likes.filter(id => id !== currentUser.id)
          : [...p.likes, currentUser.id];
        return { ...p, likes: nextLikes };
      }
      return p;
    }));

    SupabaseService.togglePostLike(postId, currentUser.id, isCurrentlyLiked);
  };

  const addComment = (postId: string, content: string) => {
    if (!currentUser || !content.trim()) return;

    const newComment = {
      id: generateUUID(),
      postId,
      authorId: currentUser.id,
      authorUsername: currentUser.username,
      authorFullName: currentUser.fullName,
      authorAvatarUrl: currentUser.avatarUrl,
      authorRole: currentUser.role,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
    ));

    SupabaseService.createPostComment(postId, currentUser.id, content.trim());
  };

  const deletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    SupabaseService.deletePost(postId);
  };

  return (
    <FeedContext.Provider
      value={{
        posts,
        getPersonalizedFeed,
        addPost,
        likePost,
        addComment,
        deletePost,
        refreshPosts,
      }}
    >
      {children}
    </FeedContext.Provider>
  );
};

export const useFeed = (): FeedContextType => {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return context;
};
