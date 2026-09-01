export type UserRole = 'USER' | 'PRO_TRADER' | 'MODERATOR' | 'ADMIN';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export type ConnectionState = 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'CONNECTED';

export interface UserPermissions {
  canPublishSignals: boolean;
  canPushJournals: boolean;
  canViewAllJournals: boolean;
  canModerateSignals: boolean;
  maxActiveSignals: number;
}

export interface UserConnection {
  targetUserId: string;
  targetUsername: string;
  state: ConnectionState;
  hasPushAccess: boolean;
  connectedAt?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  bio?: string;
  winRate?: number;
  totalSignalsCount: number;
  totalJournalsCount: number;
  isVerified?: boolean;
  status: AccountStatus;
  banReason?: string;
  permissions?: UserPermissions;
  joinedDate: string;
  lastActiveDate?: string;
  password?: string;
  passwordHash?: string;
  connections: Record<string, UserConnection>;
  hasPushedWithCurrentUser?: boolean;
}

export interface ActivityLog {
  id: string;
  actorUsername: string;
  action: 'USER_CREATED' | 'ROLE_UPDATED' | 'USER_BANNED' | 'USER_UNBANNED' | 'PERMISSIONS_UPDATED' | 'SIGNAL_APPROVED' | 'SIGNAL_DELETED' | 'JOURNAL_AUDITED' | 'CONFIG_UPDATED' | 'ACCESS_GRANTED';
  target?: string;
  details: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface SystemAccessConfig {
  // Dynamic Menu Controls
  isJournalEnabled: boolean;
  isSignalsEnabled: boolean;
  isFeedsEnabled: boolean;
  isUsersEnabled: boolean;
  // Platform Flags
  requireSignalApproval: boolean;
  allowPublicRegistration: boolean;
  allowPushSharing: boolean;
  maintenanceMode: boolean;
  defaultMonthlyCapital: number;
  allowProTraderSignalsOnly: boolean;
}

export interface AuthSession {
  currentUser: UserProfile;
  token?: string;
}
