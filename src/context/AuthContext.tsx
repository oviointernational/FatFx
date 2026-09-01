import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/user';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { generateUUID } from '../utils/formatters';

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  isAdmin: boolean;
  isModerator: boolean;
  isProTrader: boolean;
  canPublishSignals: boolean;
  canPushJournals: boolean;
  login: (usernameOrEmail: string, password?: string) => Promise<AuthResult>;
  register: (username: string, fullName: string, email: string, password?: string, role?: UserRole) => Promise<AuthResult>;
  logout: () => void;
  switchUser: (userId: string) => void;
  updateCurrentUser: (updates: Partial<UserProfile>) => Promise<boolean>;
  refreshUsers: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => StorageService.getCurrentUserId());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUsers = async () => {
    const remote = await SupabaseService.getProfiles();
    if (remote) {
      setUsers(remote);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      const remote = await SupabaseService.getProfiles();
      if (isMounted && remote) {
        setUsers(remote);
      }
      if (isMounted) {
        setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Find active authenticated user directly from the live database profiles
  const currentUser = users.find(u => u.id === currentUserId) || null;

  const isAdmin = currentUser?.role === 'ADMIN';
  const isModerator = currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR';
  const isProTrader = currentUser?.role === 'PRO_TRADER' || isModerator;

  const canPublishSignals = Boolean(currentUser && currentUser.status !== 'SUSPENDED' && (currentUser.permissions?.canPublishSignals ?? true));
  const canPushJournals = Boolean(currentUser && currentUser.status !== 'SUSPENDED' && (currentUser.permissions?.canPushJournals ?? true));

  const switchUser = (userId: string) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUserId(userId);
      StorageService.setCurrentUserId(userId);
      SupabaseService.createActivityLog({
        actorUsername: found.username,
        action: 'ACCESS_GRANTED',
        target: found.username,
        details: `User session switched to @${found.username}`,
        severity: 'INFO'
      });
    }
  };

  const login = async (usernameOrEmail: string, password?: string): Promise<AuthResult> => {
    const query = usernameOrEmail.trim().toLowerCase();

    // Fetch latest profiles directly from Supabase
    const liveProfiles = await SupabaseService.getProfiles();
    const currentList = liveProfiles || users;
    if (liveProfiles) {
      setUsers(liveProfiles);
    }

    const found = currentList.find(u => u.username.toLowerCase() === query || u.email.toLowerCase() === query);
    if (!found) {
      return { success: false, error: 'User account not found in database. Please register.' };
    }

    // Verify password against Supabase
    if (found.passwordHash || found.password) {
      const expected = found.passwordHash || found.password;
      if (password && password === expected) {
        setCurrentUserId(found.id);
        StorageService.setCurrentUserId(found.id);
        return { success: true };
      }
      return { success: false, error: 'Invalid password. Please check your credentials.' };
    }

    // Direct login
    setCurrentUserId(found.id);
    StorageService.setCurrentUserId(found.id);
    return { success: true };
  };

  const logout = () => {
    setCurrentUserId(null);
    StorageService.setCurrentUserId(null);
  };

  const register = async (username: string, fullName: string, email: string, password?: string, role?: UserRole): Promise<AuthResult> => {
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
    const cleanEmail = email.trim().toLowerCase();

    // Verify uniqueness against live Supabase
    const liveProfiles = await SupabaseService.getProfiles();
    const currentList = liveProfiles || users;

    const existing = currentList.find(u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'Username or email already registered in Supabase database.' };
    }

    // First registered account in database becomes ADMIN
    const assignedRole = role || (currentList.length === 0 ? 'ADMIN' : 'USER');

    const newUser: UserProfile = {
      id: generateUUID(),
      username: cleanUsername,
      fullName: fullName.trim() || cleanUsername,
      email: cleanEmail,
      role: assignedRole,
      bio: 'Forex trader on FatFx.',
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      totalSignalsCount: 0,
      totalJournalsCount: 0,
      isVerified: assignedRole === 'PRO_TRADER' || assignedRole === 'ADMIN',
      status: 'ACTIVE',
      password: password || undefined,
      passwordHash: password || undefined,
      permissions: {
        canPublishSignals: true,
        canPushJournals: true,
        canViewAllJournals: assignedRole === 'ADMIN',
        canModerateSignals: assignedRole === 'ADMIN' || assignedRole === 'MODERATOR',
        maxActiveSignals: assignedRole === 'ADMIN' ? 999 : assignedRole === 'PRO_TRADER' ? 15 : 5,
      },
      joinedDate: new Date().toISOString().split('T')[0],
      connections: {}
    };

    // DIRECT SUPABASE INSERT
    const createRes = await SupabaseService.createProfile(newUser);
    if (!createRes) {
      return {
        success: false,
        error: 'Failed to write to Supabase database. Ensure supabase_schema.sql has been executed in Supabase SQL Editor.'
      };
    }

    // Re-fetch clean list from Supabase
    await refreshUsers();

    SupabaseService.createActivityLog({
      actorUsername: cleanUsername,
      action: 'USER_CREATED',
      target: cleanUsername,
      details: `New trader account @${cleanUsername} registered (${assignedRole}) in Supabase database.`,
      severity: 'INFO'
    });

    setCurrentUserId(newUser.id);
    StorageService.setCurrentUserId(newUser.id);
    return { success: true };
  };

  const updateCurrentUser = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!currentUser) return false;
    const ok = await SupabaseService.updateProfile(currentUser.id, updates);
    if (ok) {
      await refreshUsers();
    }
    return ok;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAdmin,
        isModerator,
        isProTrader,
        canPublishSignals,
        canPushJournals,
        login,
        register,
        logout,
        switchUser,
        updateCurrentUser,
        refreshUsers,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
