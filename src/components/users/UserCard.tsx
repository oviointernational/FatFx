import React from 'react';
import { User, Link, Send, Check, Clock, UserPlus, Shield, Award } from 'lucide-react';
import { UserProfile, ConnectionState } from '../../types/user';
import { useUsers } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

interface UserCardProps {
  user: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onPushToUser?: (username: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onSelectUser, onPushToUser }) => {
  const { hasPushWithUser, getConnectionState, sendConnectionRequest, acceptConnectionRequest } = useUsers();
  const { currentUser } = useAuth();

  const isMe = user.id === currentUser?.id;
  const hasPush = hasPushWithUser(user.username);
  const connState: ConnectionState = getConnectionState(user.id);

  return (
    <div
      onClick={() => onSelectUser(user)}
      className={clsx(
        'bg-white rounded-2xl border p-4 shadow-subtle hover:shadow-futuristic transition-all duration-200 cursor-pointer flex flex-col justify-between relative group',
        hasPush ? 'border-fatfx-teal-300 ring-1 ring-fatfx-teal-200/50' : 'border-fatfx-border hover:border-slate-300'
      )}
    >
      {/* Top row: Avatar + Chain Badge + Role */}
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-fatfx-teal-200 group-hover:ring-fatfx-teal-400 transition-all">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-fatfx-teal-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-fatfx-teal-600" />
                  </div>
                )}
              </div>
              {user.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-fatfx-teal-500 text-white rounded-full p-0.5 shadow-sm" title="Verified Trader">
                  <Award className="w-3 h-3" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-slate-900 group-hover:text-fatfx-teal-600 transition-colors">
                  {user.fullName}
                </p>
                {user.role === 'ADMIN' && (
                  <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Shield className="w-2.5 h-2.5" /> Admin
                  </span>
                )}
                {user.role === 'PRO_TRADER' && (
                  <span className="bg-fatfx-teal-100 text-fatfx-teal-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">@{user.username}</p>
            </div>
          </div>

          {/* Chain Icon (Active Push Connection) */}
          {hasPush && (
            <div
              className="flex items-center gap-1 bg-fatfx-teal-50 text-fatfx-teal-600 border border-fatfx-teal-200 px-2 py-1 rounded-full text-xs font-semibold shadow-sm"
              title="Push Connected — You have active Push access with this trader"
            >
              <Link className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden sm:inline">Pushed</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
            {user.bio}
          </p>
        )}

        {/* Counters */}
        <div className="grid grid-cols-2 gap-2 mb-3 bg-fatfx-surface-subtle p-2.5 rounded-xl border border-fatfx-border/60">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Signals</p>
            <p className="text-sm font-bold text-slate-900 font-mono">{user.totalSignalsCount}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Journals</p>
            <p className="text-sm font-bold text-slate-900 font-mono">{user.totalJournalsCount}</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-2 border-t border-fatfx-border flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
        {isMe ? (
          <span className="text-xs text-slate-400 font-medium py-1 px-2">Your Profile</span>
        ) : (
          <>
            {connState === 'CONNECTED' ? (
              <div className="flex items-center gap-1.5 text-xs text-fatfx-win-text font-semibold bg-fatfx-win-bg px-3 py-1.5 rounded-xl border border-fatfx-win-border">
                <Check className="w-3.5 h-3.5" />
                Connected
              </div>
            ) : connState === 'PENDING_SENT' ? (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                <Clock className="w-3.5 h-3.5" />
                Request Pending
              </div>
            ) : connState === 'PENDING_RECEIVED' ? (
              <button
                onClick={() => acceptConnectionRequest(user.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-fatfx-teal-500 text-white text-xs font-semibold rounded-xl hover:bg-fatfx-teal-600 transition-all shadow-glow-teal"
              >
                <Check className="w-3.5 h-3.5" />
                Accept Request
              </button>
            ) : (
              <button
                onClick={() => sendConnectionRequest(user.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-fatfx-teal-600 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Connect
              </button>
            )}

            {onPushToUser && (
              <button
                onClick={() => onPushToUser(user.username)}
                className="flex items-center gap-1 text-xs font-medium text-fatfx-teal-700 bg-fatfx-teal-50 hover:bg-fatfx-teal-100 border border-fatfx-teal-200 px-2.5 py-1.5 rounded-xl transition-all"
                title="Push a journal entry to this user"
              >
                <Send className="w-3 h-3" />
                Push
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
