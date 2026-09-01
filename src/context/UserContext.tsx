import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, ConnectionState, UserRole, AccountStatus, UserPermissions, ActivityLog, SystemAccessConfig } from '../types/user';
import { StorageService, DEFAULT_SYSTEM_CONFIG } from '../services/storage';
import { SupabaseService } from '../services/supabaseService';
import { useAuth } from './AuthContext';

interface UserContextType {
  users: UserProfile[];
  activityLogs: ActivityLog[];
  systemConfig: SystemAccessConfig;
  isMenuAllowed: (menuId: 'journal' | 'signals' | 'feeds' | 'users' | 'admin') => boolean;
  hasPushWithUser: (targetUsername: string) => boolean;
  getConnectionState: (targetUserId: string) => ConnectionState;
  sendConnectionRequest: (targetUserId: string) => void;
  acceptConnectionRequest: (targetUserId: string) => void;
  rejectConnectionRequest: (targetUserId: string) => void;
  disconnectUser: (targetUserId: string) => void;
  grantPushAccess: (targetUsername: string) => void;
  // Admin Operations
  adminCreateUser: (userData: { username: string; fullName: string; email: string; role: UserRole; isVerified: boolean }) => Promise<boolean>;
  adminUpdateUserRole: (userId: string, newRole: UserRole) => void;
  adminToggleUserStatus: (userId: string, newStatus: AccountStatus, reason?: string) => void;
  adminToggleVerified: (userId: string) => void;
  adminUpdatePermissions: (userId: string, permissions: Partial<UserPermissions>) => void;
  adminDeleteUser: (userId: string) => void;
  updateSystemConfig: (updates: Partial<SystemAccessConfig>) => void;
  logAdminAction: (action: ActivityLog['action'], details: string, target?: string, severity?: ActivityLog['severity']) => void;
  refreshUserData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, refreshUsers, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>(() => StorageService.getUsers());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => StorageService.getActivityLogs());
  const [systemConfig, setSystemConfig] = useState<SystemAccessConfig>(() => StorageService.getSystemConfig());

  const refreshUserData = async () => {
    // 1. Fetch profiles
    const remoteProfiles = await SupabaseService.getProfiles();
    if (remoteProfiles) {
      setUsers(remoteProfiles);
      StorageService.saveUsers(remoteProfiles);
    } else {
      setUsers(StorageService.getUsers());
    }

    // 2. Fetch config
    const remoteConfig = await SupabaseService.getSystemConfig();
    if (remoteConfig) {
      setSystemConfig(remoteConfig);
      StorageService.saveSystemConfig(remoteConfig);
    } else {
      setSystemConfig(StorageService.getSystemConfig());
    }

    // 3. Fetch activity logs
    const remoteLogs = await SupabaseService.getActivityLogs();
    if (remoteLogs) {
      setActivityLogs(remoteLogs);
      StorageService.saveActivityLogs(remoteLogs);
    } else {
      setActivityLogs(StorageService.getActivityLogs());
    }

    refreshUsers();
  };

  useEffect(() => {
    refreshUserData();
  }, [currentUser]);

  // Check if a menu is globally enabled or accessible by user
  const isMenuAllowed = (menuId: 'journal' | 'signals' | 'feeds' | 'users' | 'admin'): boolean => {
    if (menuId === 'admin') return isAdmin;
    if (isAdmin) return true; // Admins always have access for management

    switch (menuId) {
      case 'journal':
        return systemConfig.isJournalEnabled;
      case 'signals':
        return systemConfig.isSignalsEnabled;
      case 'feeds':
        return systemConfig.isFeedsEnabled;
      case 'users':
        return systemConfig.isUsersEnabled;
      default:
        return true;
    }
  };

  const saveAndSync = (updated: UserProfile[]) => {
    setUsers(updated);
    StorageService.saveUsers(updated);
    refreshUsers();
  };

  // Check if current user has active Push or approved connection with target
  const hasPushWithUser = (targetUsername: string): boolean => {
    if (!targetUsername || targetUsername.toLowerCase() === currentUser.username.toLowerCase()) return false;
    const targetUser = users.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
    if (!targetUser) return false;

    // Check connections
    const myConn = currentUser.connections?.[targetUser.id];
    if (myConn && (myConn.state === 'CONNECTED' || myConn.hasPushAccess)) {
      return true;
    }

    // Check journals
    const journals = StorageService.getJournals();
    return journals.some(j =>
      (j.authorUsername.toLowerCase() === currentUser.username.toLowerCase() && j.pushedTo?.some(p => p.sharedWithUsername.toLowerCase() === targetUsername.toLowerCase())) ||
      (j.authorUsername.toLowerCase() === targetUsername.toLowerCase() && j.pushedTo?.some(p => p.sharedWithUsername.toLowerCase() === currentUser.username.toLowerCase())) ||
      (j.pushedBy?.toLowerCase() === targetUsername.toLowerCase() && j.userId === currentUser.id)
    );
  };

  const getConnectionState = (targetUserId: string): ConnectionState => {
    if (targetUserId === currentUser.id) return 'NONE';
    const conn = currentUser.connections?.[targetUserId];
    return conn ? conn.state : 'NONE';
  };

  const sendConnectionRequest = (targetUserId: string) => {
    const target = users.find(u => u.id === targetUserId);
    if (!target) return;

    const updated = users.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          connections: {
            ...u.connections,
            [targetUserId]: {
              targetUserId,
              targetUsername: target.username,
              state: 'PENDING_SENT' as ConnectionState,
              hasPushAccess: false,
            }
          }
        };
      }
      if (u.id === targetUserId) {
        return {
          ...u,
          connections: {
            ...u.connections,
            [currentUser.id]: {
              targetUserId: currentUser.id,
              targetUsername: currentUser.username,
              state: 'PENDING_RECEIVED' as ConnectionState,
              hasPushAccess: false,
            }
          }
        };
      }
      return u;
    });

    saveAndSync(updated);
    logAdminAction(
      'ACCESS_GRANTED',
      `Sent connection request to @${target.username}`,
      target.username,
      'INFO'
    );
  };

  const acceptConnectionRequest = (targetUserId: string) => {
    const target = users.find(u => u.id === targetUserId);
    if (!target) return;
    const now = new Date().toISOString();

    const updated = users.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          connections: {
            ...u.connections,
            [targetUserId]: {
              targetUserId,
              targetUsername: target.username,
              state: 'CONNECTED' as ConnectionState,
              hasPushAccess: true,
              connectedAt: now
            }
          }
        };
      }
      if (u.id === targetUserId) {
        return {
          ...u,
          connections: {
            ...u.connections,
            [currentUser.id]: {
              targetUserId: currentUser.id,
              targetUsername: currentUser.username,
              state: 'CONNECTED' as ConnectionState,
              hasPushAccess: true,
              connectedAt: now
            }
          }
        };
      }
      return u;
    });

    saveAndSync(updated);
    logAdminAction(
      'ACCESS_GRANTED',
      `Approved connection and Push permissions with @${target.username}`,
      target.username,
      'INFO'
    );
  };

  const rejectConnectionRequest = (targetUserId: string) => {
    const updated = users.map(u => {
      if (u.id === currentUser.id) {
        const nextConns = { ...u.connections };
        delete nextConns[targetUserId];
        return { ...u, connections: nextConns };
      }
      if (u.id === targetUserId) {
        const nextConns = { ...u.connections };
        delete nextConns[currentUser.id];
        return { ...u, connections: nextConns };
      }
      return u;
    });

    saveAndSync(updated);
  };

  const disconnectUser = (targetUserId: string) => {
    rejectConnectionRequest(targetUserId);
  };

  const grantPushAccess = (targetUsername: string) => {
    const target = users.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
    if (!target) return;
    acceptConnectionRequest(target.id);
  };

  // --- ADMIN OPERATIONS ---

  const adminCreateUser = async (userData: { username: string; fullName: string; email: string; role: UserRole; isVerified: boolean }): Promise<boolean> => {
    const cleanUsername = userData.username.trim().toLowerCase().replace(/\s+/g, '_');
    const existing = users.find(u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === userData.email.toLowerCase());
    if (existing) return false;

    const newUser: UserProfile = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: cleanUsername,
      fullName: userData.fullName.trim() || cleanUsername,
      email: userData.email.trim().toLowerCase(),
      role: userData.role,
      bio: `${userData.role} trader account created by Administrator.`,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      totalSignalsCount: 0,
      totalJournalsCount: 0,
      isVerified: userData.isVerified,
      status: 'ACTIVE',
      permissions: {
        canPublishSignals: true,
        canPushJournals: true,
        canViewAllJournals: userData.role === 'ADMIN',
        canModerateSignals: userData.role === 'ADMIN' || userData.role === 'MODERATOR',
        maxActiveSignals: userData.role === 'ADMIN' ? 999 : userData.role === 'PRO_TRADER' ? 20 : 5,
      },
      joinedDate: new Date().toISOString().split('T')[0],
      connections: {}
    };

    await SupabaseService.createProfile(newUser);
    const next = [newUser, ...users];
    saveAndSync(next);

    logAdminAction(
      'USER_CREATED',
      `Admin @${currentUser.username} provisioned new account @${cleanUsername} (${userData.role}).`,
      cleanUsername,
      'INFO'
    );
    return true;
  };

  const adminUpdateUserRole = (userId: string, newRole: UserRole) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;

    const updated = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          role: newRole,
          isVerified: newRole === 'ADMIN' || newRole === 'PRO_TRADER' ? true : u.isVerified,
          permissions: {
            canPublishSignals: u.permissions?.canPublishSignals ?? true,
            canPushJournals: u.permissions?.canPushJournals ?? true,
            canViewAllJournals: newRole === 'ADMIN',
            canModerateSignals: newRole === 'ADMIN' || newRole === 'MODERATOR',
            maxActiveSignals: newRole === 'ADMIN' ? 999 : newRole === 'PRO_TRADER' ? 20 : 5,
          }
        };
      }
      return u;
    });

    saveAndSync(updated);
    SupabaseService.updateProfile(userId, { role: newRole });

    logAdminAction(
      'ROLE_UPDATED',
      `Changed @${target.username} role from ${target.role} to ${newRole}.`,
      target.username,
      newRole === 'ADMIN' ? 'WARNING' : 'INFO'
    );
  };

  const adminToggleUserStatus = (userId: string, newStatus: AccountStatus, reason?: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;

    const updated = users.map(u => (u.id === userId ? { ...u, status: newStatus, banReason: reason } : u));
    saveAndSync(updated);
    SupabaseService.updateProfile(userId, { status: newStatus, banReason: reason });

    const action = newStatus === 'SUSPENDED' ? 'USER_BANNED' : 'USER_UNBANNED';
    const severity = newStatus === 'SUSPENDED' ? 'CRITICAL' : 'INFO';
    const details = newStatus === 'SUSPENDED'
      ? `Account @${target.username} suspended. Reason: ${reason || 'Violation of terms'}`
      : `Account @${target.username} reinstated to ACTIVE status.`;

    logAdminAction(action, details, target.username, severity);
  };

  const adminToggleVerified = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;

    const nextVerified = !target.isVerified;
    const updated = users.map(u => (u.id === userId ? { ...u, isVerified: nextVerified } : u));
    saveAndSync(updated);
    SupabaseService.updateProfile(userId, { isVerified: nextVerified });

    logAdminAction(
      'PERMISSIONS_UPDATED',
      `${nextVerified ? 'Granted' : 'Revoked'} verified trader badge for @${target.username}.`,
      target.username,
      'INFO'
    );
  };

  const adminUpdatePermissions = (userId: string, permissions: Partial<UserPermissions>) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;

    const updated = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          permissions: {
            canPublishSignals: permissions.canPublishSignals ?? u.permissions?.canPublishSignals ?? true,
            canPushJournals: permissions.canPushJournals ?? u.permissions?.canPushJournals ?? true,
            canViewAllJournals: permissions.canViewAllJournals ?? u.permissions?.canViewAllJournals ?? false,
            canModerateSignals: permissions.canModerateSignals ?? u.permissions?.canModerateSignals ?? false,
            maxActiveSignals: permissions.maxActiveSignals ?? u.permissions?.maxActiveSignals ?? 5,
          }
        };
      }
      return u;
    });

    saveAndSync(updated);
    SupabaseService.updateProfile(userId, { permissions: permissions as UserPermissions });

    logAdminAction(
      'PERMISSIONS_UPDATED',
      `Customized access permissions for @${target.username}.`,
      target.username,
      'INFO'
    );
  };

  const adminDeleteUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target || target.id === currentUser.id) return;

    const updated = users.filter(u => u.id !== userId);
    saveAndSync(updated);
    SupabaseService.deleteProfile(userId);

    logAdminAction(
      'USER_BANNED',
      `Permanently deleted user record for @${target.username}.`,
      target.username,
      'CRITICAL'
    );
  };

  const updateSystemConfig = (updates: Partial<SystemAccessConfig>) => {
    const next = { ...systemConfig, ...updates };
    setSystemConfig(next);
    StorageService.saveSystemConfig(next);
    SupabaseService.updateSystemConfig(next);

    logAdminAction(
      'CONFIG_UPDATED',
      `Updated platform access controls & menu visibility settings.`,
      'System Settings',
      'WARNING'
    );
  };

  const logAdminAction = (
    action: ActivityLog['action'],
    details: string,
    target?: string,
    severity: ActivityLog['severity'] = 'INFO'
  ) => {
    StorageService.logActivity(currentUser.username, action, details, target, severity);
    SupabaseService.createActivityLog({
      actorUsername: currentUser.username,
      action,
      target,
      details,
      severity
    });
    setActivityLogs(StorageService.getActivityLogs());
  };

  return (
    <UserContext.Provider
      value={{
        users,
        activityLogs,
        systemConfig,
        isMenuAllowed,
        hasPushWithUser,
        getConnectionState,
        sendConnectionRequest,
        acceptConnectionRequest,
        rejectConnectionRequest,
        disconnectUser,
        grantPushAccess,
        adminCreateUser,
        adminUpdateUserRole,
        adminToggleUserStatus,
        adminToggleVerified,
        adminUpdatePermissions,
        adminDeleteUser,
        updateSystemConfig,
        logAdminAction,
        refreshUserData
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
};
