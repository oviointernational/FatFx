import React, { useState } from 'react';
import { Plus, Filter, Rss, Users, Award, Sparkles } from 'lucide-react';
import { useFeed } from '../../context/FeedContext';
import { useAuth } from '../../context/AuthContext';
import { PostCard } from './PostCard';
import { CreatePostModal } from './CreatePostModal';
import clsx from 'clsx';

export const FeedsView: React.FC = () => {
  const { getPersonalizedFeed } = useFeed();
  const { currentUser } = useAuth();

  const [filterMode, setFilterMode] = useState<'ALL' | 'CONNECTED' | 'PRO'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const posts = getPersonalizedFeed(filterMode);

  return (
    <div className="flex flex-col h-full bg-[#FBFDFD] overflow-y-auto">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-fatfx-border/60 bg-white shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Feeds</h1>
            <span className="text-xs bg-fatfx-teal-50 text-fatfx-teal-700 border border-fatfx-teal-200 font-semibold px-2 py-0.5 rounded-full">
              Live Network
            </span>
          </div>

          {/* + Add Post Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-fatfx-teal-600 hover:bg-fatfx-teal-700 text-white text-xs font-semibold rounded-lg transition-colors focus:outline-none shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add post</span>
          </button>
        </div>

        {/* Filter Pills: All / Connected / Pro Traders */}
        <div className="flex gap-1.5 bg-slate-100/70 p-1 rounded-xl border border-slate-200/80 w-fit">
          <button
            onClick={() => setFilterMode('ALL')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
              filterMode === 'ALL'
                ? 'bg-white text-fatfx-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Rss className="w-3.5 h-3.5" />
            All Feeds
          </button>

          <button
            onClick={() => setFilterMode('CONNECTED')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
              filterMode === 'CONNECTED'
                ? 'bg-white text-fatfx-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Users className="w-3.5 h-3.5" />
            Connected Traders
          </button>

          <button
            onClick={() => setFilterMode('PRO')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
              filterMode === 'PRO'
                ? 'bg-white text-fatfx-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Award className="w-3.5 h-3.5" />
            Pro Traders Only
          </button>
        </div>
      </div>

      {/* Main Feed Timeline */}
      <div className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-4">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center bg-white rounded-2xl border border-fatfx-border p-8">
            <div className="w-14 h-14 rounded-2xl bg-fatfx-surface-subtle flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-800">No posts in this feed yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Be the first to share your trading analysis or trade setup</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-fatfx-teal-600 hover:bg-fatfx-teal-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create First Post
            </button>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};
