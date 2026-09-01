import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/user';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';

interface AuthContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  isAdmin: boolean;
  isModerator: boolean;
  isProTrader: boolean;
  canPublishSignals: boolean;
  canPushJournals: boolean;
  login: (usernameOrEmail: string, password?: string) => Promise<boolean>;
  register: (username: string, fullName: string, email: string, password?: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  switchUser: (userId: string) => void;
  updateCurrentUser: (updates: Partial<UserProfile>) => void;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => StorageService.getUsers());
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => StorageService.getCurrentUserId());

  const refreshUsers = async () => {
    const remote = await SupabaseService.getProfiles();
    if (remote && remote.length > 0) {
      setUsers(remote);
      StorageService.saveUsers(remote);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  // Find active authenticated user
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
      StorageService.logActivity(
        found.username,
        'ACCESS_GRANTED',
        `User session switched to @${found.username}`,
        found.username,
        'INFO'
      );
    }
  };

  const login = async (usernameOrEmail: string, password?: string): Promise<boolean> => {
    const query = usernameOrEmail.trim().toLowerCase();
    let currentUsersList = users;

    // Refresh if empty
    if (currentUsersList.length === 0) {
      const remote = await SupabaseService.getProfiles();
      if (remote && remote.length > 0) {
        currentUsersList = remote;
        setUsers(remote);
        StorageService.saveUsers(remote);
      }
    }

    const found = currentUsersList.find(u => u.username.toLowerCase() === query || u.email.toLowerCase() === query);
    if (!found) {
      return false;
    }

    // Verify password if user has password set
    if (found.password || found.passwordHash) {
      const expectedPassword = found.password || found.passwordHash;
      if (password && password === expectedPassword) {
        setCurrentUserId(found.id);
        StorageService.setCurrentUserId(found.id);
        return true;
      }
      return false;
    }

    // Allow login if no password was set on legacy profile
    setCurrentUserId(found.id);
    StorageService.setCurrentUserId(found.id);
    return true;
  };

  const logout = () => {
    setCurrentUserId(null);
    StorageService.setCurrentUserId(null);
  };

  const register = async (username: string, fullName: string, email: string, password?: string, role?: UserRole): Promise<boolean> => {
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
    const existing = users.find(u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === email.toLowerCase());
    if (existing) return false;

    // If first user, make ADMIN, otherwise default role
    const assignedRole = role || (users.length === 0 ? 'ADMIN' : 'USER');

    const newUser: UserProfile = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: cleanUsername,
      fullName: fullName.trim() || cleanUsername,
      email: email.trim().toLowerCase(),
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

    // Save remote & local
    await SupabaseService.createProfile(newUser);
    const updatedUsers = [newUser, ...users];
    setUsers(updatedUsers);
    StorageService.saveUsers(updatedUsers);

    StorageService.logActivity(
      cleanUsername,
      'USER_CREATED',
      `New trader account @${cleanUsername} registered (${assignedRole}).`,
      cleanUsername,
      'INFO'
    );

    setCurrentUserId(newUser.id);
    StorageService.setCurrentUserId(newUser.id);
    return true;
  };

  const updateCurrentUser = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, ...updates };
      }
      return u;
    });
    setUsers(updatedUsers);
    StorageService.saveUsers(updatedUsers);
    SupabaseService.updateProfile(currentUser.id, updates);
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
        refreshUsers
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
