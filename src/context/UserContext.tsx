import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, ConnectionState, UserRole, AccountStatus, UserPermissions, ActivityLog, SystemAccessConfig } from '../types/user';
import { SupabaseService } from '../services/supabaseService';
import { StorageService } from '../services/storage';
import { generateUUID } from '../utils/formatters';
import { useAuth } from './AuthContext';

const DEFAULT_SYSTEM_CONFIG: SystemAccessConfig = {
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
  adminCreateUser: (userData: { username: string; fullName: string; email: string; role: UserRole; isVerified: boolean; password?: string }) => Promise<boolean>;
  adminUpdateUserRole: (userId: string, newRole: UserRole) => void;
  adminToggleUserStatus: (userId: string, newStatus: AccountStatus, reason?: string) => void;
  adminToggleVerified: (userId: string) => void;
  adminUpdatePermissions: (userId: string, permissions: Partial<UserPermissions>) => void;
  adminDeleteUser: (userId: string) => void;
  updateSystemConfig: (updates: Partial<SystemAccessConfig>) => void;
  logAdminAction: (action: ActivityLog['action'], details: string, target?: string, severity?: ActivityLog['severity']) => void;
  refreshUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, users: authUsers, isAdmin, refreshUsers } = useAuth();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemAccessConfig>(DEFAULT_SYSTEM_CONFIG);

  // Users come from AuthContext (already fetched from Supabase)
  const users = authUsers;

  const refreshUserData = async () => {
    await refreshUsers();

    const remoteConfig = await SupabaseService.getSystemConfig();
    if (remoteConfig) {
      setSystemConfig(remoteConfig);
    }

    if (isAdmin) {
      const remoteLogs = await SupabaseService.getActivityLogs();
      if (remoteLogs) {
        setActivityLogs(remoteLogs);
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const remoteConfig = await SupabaseService.getSystemConfig();
      if (mounted && remoteConfig) setSystemConfig(remoteConfig);

      if (mounted && isAdmin) {
        const remoteLogs = await SupabaseService.getActivityLogs();
        if (mounted && remoteLogs) setActivityLogs(remoteLogs);
      }
    })();
    return () => { mounted = false; };
  }, [currentUser?.id, isAdmin]);

  const isMenuAllowed = (menuId: 'journal' | 'signals' | 'feeds' | 'users' | 'admin'): boolean => {
    if (menuId === 'admin') return isAdmin;
    if (isAdmin) return true;
    switch (menuId) {
      case 'journal': return systemConfig.isJournalEnabled;
      case 'signals': return systemConfig.isSignalsEnabled;
      case 'feeds': return systemConfig.isFeedsEnabled;
      case 'users': return systemConfig.isUsersEnabled;
      default: return true;
    }
  };

  const hasPushWithUser = (targetUsername: string): boolean => {
    if (!currentUser || !targetUsername) return false;
    if (targetUsername.toLowerCase() === currentUser.username.toLowerCase()) return false;
    const targetUser = users.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
    if (!targetUser) return false;
    const myConn = currentUser.connections?.[targetUser.id];
    return myConn?.state === 'CONNECTED' && myConn?.hasPushAccess === true;
  };

  const getConnectionState = (targetUserId: string): ConnectionState => {
    if (!currentUser) return 'NONE';
    const conn = currentUser.connections?.[targetUserId];
    if (!conn) return 'NONE';
    return conn.state as ConnectionState;
  };

  const logAdminAction = (
    action: ActivityLog['action'],
    details: string,
    target?: string,
    severity: ActivityLog['severity'] = 'INFO'
  ) => {
    if (!currentUser) return;
    SupabaseService.createActivityLog({
      actorUsername: currentUser.username,
      action,
      target,
      details,
      severity,
    });
  };

  const sendConnectionRequest = (targetUserId: string) => {
    if (!currentUser) return;
    SupabaseService.sendConnectionRequest(currentUser.id, targetUserId).then(() => refreshUsers());
    logAdminAction('PERMISSIONS_UPDATED', `Sent connection request to user ${targetUserId}`, targetUserId, 'INFO');
  };

  const acceptConnectionRequest = (targetUserId: string) => {
    if (!currentUser) return;
    SupabaseService.acceptConnectionRequest(currentUser.id, targetUserId).then(() => refreshUsers());
  };

  const rejectConnectionRequest = (targetUserId: string) => {
    if (!currentUser) return;
    SupabaseService.deleteConnection(currentUser.id, targetUserId).then(() => refreshUsers());
  };

  const disconnectUser = (targetUserId: string) => {
    if (!currentUser) return;
    SupabaseService.deleteConnection(currentUser.id, targetUserId).then(() => refreshUsers());
  };

  const grantPushAccess = (targetUsername: string) => {
    const target = users.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
    if (!target) return;
    acceptConnectionRequest(target.id);
  };

  // --- ADMIN OPERATIONS ---

  const adminCreateUser = async (userData: { username: string; fullName: string; email: string; role: UserRole; isVerified: boolean; password?: string }): Promise<boolean> => {
    const cleanUsername = userData.username.trim().toLowerCase().replace(/\s+/g, '_');
    const existing = users.find(u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === userData.email.toLowerCase());
    if (existing) return false;

    const newUser: UserProfile = {
      id: generateUUID(),
      username: cleanUsername,
      fullName: userData.fullName.trim() || cleanUsername,
      email: userData.email.trim().toLowerCase(),
      role: userData.role,
      bio: `${userData.role} trader account created by Administrator.`,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      totalSignalsCount: 0,
      totalJournalsCount: 0,
      isVerified: userData.isVerified,
      password: userData.password || 'FatFxTrader123!',
      passwordHash: userData.password || 'FatFxTrader123!',
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

    const ok = await SupabaseService.createProfile(newUser);
    if (ok) {
      await refreshUsers();
      logAdminAction('USER_CREATED', `Admin provisioned new account @${cleanUsername} (${userData.role}).`, cleanUsername, 'INFO');
    }
    return ok;
  };

  const adminUpdateUserRole = (userId: string, newRole: UserRole) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    SupabaseService.updateProfile(userId, { role: newRole }).then(() => refreshUsers());
    logAdminAction('ROLE_UPDATED', `Changed @${target.username} role from ${target.role} to ${newRole}.`, target.username, newRole === 'ADMIN' ? 'WARNING' : 'INFO');
  };

  const adminToggleUserStatus = (userId: string, newStatus: AccountStatus, reason?: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    SupabaseService.updateProfile(userId, { status: newStatus, banReason: reason }).then(() => refreshUsers());
    const details = newStatus === 'SUSPENDED'
      ? `Account @${target.username} suspended. Reason: ${reason || 'Violation of terms'}`
      : `Account @${target.username} reinstated to ACTIVE status.`;
    logAdminAction(newStatus === 'SUSPENDED' ? 'USER_BANNED' : 'USER_UNBANNED', details, target.username, newStatus === 'SUSPENDED' ? 'CRITICAL' : 'INFO');
  };

  const adminToggleVerified = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const nextVerified = !target.isVerified;
    SupabaseService.updateProfile(userId, { isVerified: nextVerified }).then(() => refreshUsers());
    logAdminAction('PERMISSIONS_UPDATED', `${nextVerified ? 'Granted' : 'Revoked'} verified badge for @${target.username}.`, target.username, 'INFO');
  };

  const adminUpdatePermissions = (userId: string, permissions: Partial<UserPermissions>) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    SupabaseService.updateProfile(userId, { permissions: { ...target.permissions, ...permissions } as UserPermissions }).then(() => refreshUsers());
    logAdminAction('PERMISSIONS_UPDATED', `Updated permissions for @${target.username}.`, target.username, 'INFO');
  };

  const adminDeleteUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    SupabaseService.deleteProfile(userId).then(() => refreshUsers());
    logAdminAction('USER_BANNED', `Deleted account @${target.username}.`, target.username, 'CRITICAL');
  };

  const updateSystemConfig = (updates: Partial<SystemAccessConfig>) => {
    const next = { ...systemConfig, ...updates };
    setSystemConfig(next);
    SupabaseService.updateSystemConfig(updates);
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
        refreshUserData,
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
