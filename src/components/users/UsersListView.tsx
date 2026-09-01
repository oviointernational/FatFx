import React, { useState } from 'react';
import { Search, Users, Link, Filter, CheckCircle, Clock } from 'lucide-react';
import { useUsers } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types/user';
import { UserCard } from './UserCard';
import { UserProfileModal } from './UserProfileModal';
import clsx from 'clsx';

export const UsersListView: React.FC = () => {
  const { users, hasPushWithUser, getConnectionState } = useUsers();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'connected' | 'requests'>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Incoming connection requests
  const pendingRequests = users.filter(u => {
    const conn = currentUser.connections?.[u.id];
    return conn && conn.state === 'PENDING_RECEIVED';
  });

  // Connected / Pushed users
  const connectedUsers = users.filter(u => {
    if (u.id === currentUser.id) return false;
    return hasPushWithUser(u.username) || getConnectionState(u.id) === 'CONNECTED';
  });

  // Filtered list based on search and tab
  const displayedUsers = users.filter(u => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.bio && u.bio.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'connected') {
      return hasPushWithUser(u.username) || getConnectionState(u.id) === 'CONNECTED';
    }
    if (filterTab === 'requests') {
      const conn = currentUser.connections?.[u.id];
      return conn && conn.state === 'PENDING_RECEIVED';
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-fatfx-border bg-white shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900">Trader Network</h1>
            <span className="text-xs bg-fatfx-teal-100 text-fatfx-teal-700 font-semibold px-2 py-0.5 rounded-full">
              {users.length} Traders
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link className="w-3.5 h-3.5 text-fatfx-teal-600" />
            <span>Chain icon = Pushed / Connected</span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search traders by name, @username, or strategy..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-fatfx-border focus:outline-none focus:ring-2 focus:ring-fatfx-teal-400 bg-fatfx-surface-subtle"
            />
          </div>

          <div className="flex gap-1 bg-fatfx-surface-subtle rounded-xl p-1 border border-fatfx-border shrink-0">
            <button
              onClick={() => setFilterTab('all')}
              className={clsx(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-all',
                filterTab === 'all' ? 'bg-white text-fatfx-teal-700 shadow-subtle' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setFilterTab('connected')}
              className={clsx(
                'px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1',
                filterTab === 'connected' ? 'bg-white text-fatfx-teal-700 shadow-subtle' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Link className="w-3 h-3 text-fatfx-teal-600" />
              Connected ({connectedUsers.length})
            </button>
            {pendingRequests.length > 0 && (
              <button
                onClick={() => setFilterTab('requests')}
                className={clsx(
                  'px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1',
                  filterTab === 'requests' ? 'bg-white text-amber-700 shadow-subtle' : 'text-amber-600 hover:text-amber-700'
                )}
              >
                <Clock className="w-3 h-3" />
                Requests ({pendingRequests.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {displayedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Users className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No traders found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedUsers.map(user => (
              <UserCard
                key={user.id}
                user={user}
                onSelectUser={u => setSelectedUser(u)}
              />
            ))}
          </div>
        )}
      </div>

      {/* User Profile Drill-down Modal */}
      <UserProfileModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
};
