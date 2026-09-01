import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/user';
import { StorageService, DEFAULT_ADMIN_PROFILE } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';

interface AuthContextType {
  currentUser: UserProfile;
  users: UserProfile[];
  isAdmin: boolean;
  isModerator: boolean;
  isProTrader: boolean;
  canPublishSignals: boolean;
  canPushJournals: boolean;
  login: (usernameOrEmail: string) => boolean;
  register: (username: string, fullName: string, email: string, role?: UserRole) => Promise<boolean>;
  switchUser: (userId: string) => void;
  updateCurrentUser: (updates: Partial<UserProfile>) => void;
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => StorageService.getUsers());
  const [currentUserId, setCurrentUserId] = useState<string>(() => StorageService.getCurrentUserId());

  const refreshUsers = async () => {
    const remote = await SupabaseService.getProfiles();
    if (remote && remote.length > 0) {
      setUsers(remote);
      StorageService.saveUsers(remote);
    } else {
      const local = StorageService.getUsers();
      setUsers(local);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  // Active user
  const currentUser = users.find(u => u.id === currentUserId) || users[0] || DEFAULT_ADMIN_PROFILE;

  const isAdmin = currentUser.role === 'ADMIN';
  const isModerator = currentUser.role === 'ADMIN' || currentUser.role === 'MODERATOR';
  const isProTrader = currentUser.role === 'PRO_TRADER' || isModerator;

  const canPublishSignals = currentUser.status !== 'SUSPENDED' && (currentUser.permissions?.canPublishSignals ?? true);
  const canPushJournals = currentUser.status !== 'SUSPENDED' && (currentUser.permissions?.canPushJournals ?? true);

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

  const login = (usernameOrEmail: string): boolean => {
    const query = usernameOrEmail.trim().toLowerCase();
    const found = users.find(u => u.username.toLowerCase() === query || u.email.toLowerCase() === query);
    if (found) {
      switchUser(found.id);
      return true;
    }
    return false;
  };

  const register = async (username: string, fullName: string, email: string, role?: UserRole): Promise<boolean> => {
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
    const existing = users.find(u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === email.toLowerCase());
    if (existing) return false;

    // If first user, make ADMIN, otherwise default role
    const assignedRole = role || (users.length === 0 || (users.length === 1 && users[0].id === DEFAULT_ADMIN_PROFILE.id) ? 'ADMIN' : 'USER');

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
    const updatedUsers = [newUser, ...users.filter(u => u.id !== DEFAULT_ADMIN_PROFILE.id || u.username === 'admin')];
    setUsers(updatedUsers);
    StorageService.saveUsers(updatedUsers);

    StorageService.logActivity(
      cleanUsername,
      'USER_CREATED',
      `New trader account @${cleanUsername} registered (${assignedRole}).`,
      cleanUsername,
      'INFO'
    );

    switchUser(newUser.id);
    return true;
  };

  const updateCurrentUser = (updates: Partial<UserProfile>) => {
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
