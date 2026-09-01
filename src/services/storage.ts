import { JournalEntry, MonthCapitalConfig } from '../types/journal';
import { Signal } from '../types/signal';
import { UserProfile, ActivityLog, SystemAccessConfig } from '../types/user';
import { Post } from '../types/feed';

const STORAGE_KEYS = {
  USERS: 'fatfx_users_v4',
  CURRENT_USER_ID: 'fatfx_current_user_id_v4',
  JOURNALS: 'fatfx_journals_v4',
  SIGNALS: 'fatfx_signals_v4',
  CAPITAL_CONFIGS: 'fatfx_capital_configs_v4',
  ACTIVITY_LOGS: 'fatfx_activity_logs_v4',
  SYSTEM_CONFIG: 'fatfx_system_config_v4',
  POSTS: 'fatfx_posts_v4',
};

// Default initial Master Administrator account if no database profiles exist yet
export const DEFAULT_ADMIN_PROFILE: UserProfile = {
  id: 'usr_admin',
  username: 'admin',
  fullName: 'Administrator',
  email: 'admin@fatfx.io',
  role: 'ADMIN',
  bio: 'FatFx Master Administrator.',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  winRate: 0,
  totalSignalsCount: 0,
  totalJournalsCount: 0,
  isVerified: true,
  status: 'ACTIVE',
  permissions: {
    canPublishSignals: true,
    canPushJournals: true,
    canViewAllJournals: true,
    canModerateSignals: true,
    maxActiveSignals: 999,
  },
  joinedDate: new Date().toISOString().split('T')[0],
  connections: {}
};

export const DEFAULT_SYSTEM_CONFIG: SystemAccessConfig = {
  isJournalEnabled: true,
  isSignalsEnabled: true,
  isFeedsEnabled: true,
  isUsersEnabled: true,
  requireSignalApproval: false,
  allowPublicRegistration: true,
  allowPushSharing: true,
  maintenanceMode: false,
  defaultMonthlyCapital: 10000,
  allowProTraderSignalsOnly: false,
};

export const StorageService = {
  getUsers: (): UserProfile[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([DEFAULT_ADMIN_PROFILE]));
        return [DEFAULT_ADMIN_PROFILE];
      }
      return JSON.parse(data);
    } catch {
      return [DEFAULT_ADMIN_PROFILE];
    }
  },

  saveUsers: (users: UserProfile[]): void => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getCurrentUserId: (): string => {
    try {
      const id = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (!id) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, DEFAULT_ADMIN_PROFILE.id);
        return DEFAULT_ADMIN_PROFILE.id;
      }
      return id;
    } catch {
      return DEFAULT_ADMIN_PROFILE.id;
    }
  },

  setCurrentUserId: (id: string): void => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
  },

  getJournals: (): JournalEntry[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.JOURNALS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveJournals: (journals: JournalEntry[]): void => {
    localStorage.setItem(STORAGE_KEYS.JOURNALS, JSON.stringify(journals));
  },

  getSignals: (): Signal[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SIGNALS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveSignals: (signals: Signal[]): void => {
    localStorage.setItem(STORAGE_KEYS.SIGNALS, JSON.stringify(signals));
  },

  getCapitalConfigs: (): MonthCapitalConfig[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CAPITAL_CONFIGS);
      if (!data) {
        const initial: MonthCapitalConfig[] = Array.from({ length: 12 }, (_, i) => ({
          year: new Date().getFullYear(),
          month: i,
          capital: 10000
        }));
        localStorage.setItem(STORAGE_KEYS.CAPITAL_CONFIGS, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveCapitalConfigs: (configs: MonthCapitalConfig[]): void => {
    localStorage.setItem(STORAGE_KEYS.CAPITAL_CONFIGS, JSON.stringify(configs));
  },

  getActivityLogs: (): ActivityLog[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveActivityLogs: (logs: ActivityLog[]): void => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs));
  },

  logActivity: (
    actorUsername: string,
    action: ActivityLog['action'],
    details: string,
    target?: string,
    severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO'
  ): void => {
    const existing = StorageService.getActivityLogs();
    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actorUsername,
      action,
      target,
      details,
      timestamp: new Date().toISOString(),
      severity
    };
    StorageService.saveActivityLogs([newLog, ...existing]);
  },

  getSystemConfig: (): SystemAccessConfig => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYSTEM_CONFIG);
      return data ? JSON.parse(data) : DEFAULT_SYSTEM_CONFIG;
    } catch {
      return DEFAULT_SYSTEM_CONFIG;
    }
  },

  saveSystemConfig: (config: SystemAccessConfig): void => {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(config));
  },

  getPosts: (): Post[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.POSTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  savePosts: (posts: Post[]): void => {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  },

  addPost: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt' | 'updatedAt'>): Post => {
    const posts = StorageService.getPosts();
    const newPost: Post = {
      ...post,
      id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [newPost, ...posts];
    StorageService.savePosts(updated);
    return newPost;
  },

  likePost: (postId: string, userId: string): boolean => {
    const posts = StorageService.getPosts();
    let isLiked = false;
    const updated = posts.map(p => {
      if (p.id === postId) {
        const hasLiked = p.likes.includes(userId);
        isLiked = !hasLiked;
        const nextLikes = hasLiked
          ? p.likes.filter(id => id !== userId)
          : [...p.likes, userId];
        return { ...p, likes: nextLikes };
      }
      return p;
    });
    StorageService.savePosts(updated);
    return isLiked;
  },

  addComment: (postId: string, comment: { authorId: string; authorUsername: string; authorFullName: string; authorAvatarUrl?: string; authorRole?: string; content: string }): void => {
    const posts = StorageService.getPosts();
    const updated = posts.map(p => {
      if (p.id === postId) {
        const newC: Post['comments'][0] = {
          ...comment,
          id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          postId,
          createdAt: new Date().toISOString()
        };
        return { ...p, comments: [...p.comments, newC] };
      }
      return p;
    });
    StorageService.savePosts(updated);
  },

  deletePost: (postId: string): void => {
    const posts = StorageService.getPosts();
    const updated = posts.filter(p => p.id !== postId);
    StorageService.savePosts(updated);
  },

  resetToDefault: (): void => {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.JOURNALS);
    localStorage.removeItem(STORAGE_KEYS.SIGNALS);
    localStorage.removeItem(STORAGE_KEYS.CAPITAL_CONFIGS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);
    localStorage.removeItem(STORAGE_KEYS.SYSTEM_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.POSTS);
  }
};
