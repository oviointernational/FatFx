import React, { useState } from 'react';
import {
  Heart, MessageSquare, Share2, Trash2, Award, Shield, ExternalLink,
  ChevronRight, ChevronLeft, Layers, Send, Play, Image, Video as VideoIcon
} from 'lucide-react';
import { Post } from '../../types/feed';
import { useFeed } from '../../context/FeedContext';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

interface PostCardProps {
  post: Post;
  onSelectUser?: (username: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onSelectUser }) => {
  const { likePost, addComment, deletePost } = useFeed();
  const { currentUser, isAdmin } = useAuth();

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [copied, setCopied] = useState(false);

  const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;
  const canDelete = currentUser ? (post.authorId === currentUser.id || isAdmin) : false;

  const handleLike = () => {
    likePost(post.id);
  };

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    addComment(post.id, commentInput.trim());
    setCommentInput('');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to render embedded video (YouTube or HTML5)
  const renderVideo = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('v=')) {
        videoId = url.split('v=')[1]?.split('&')[0] || '';
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      }
      if (videoId) {
        return (
          <div className="aspect-video w-full rounded-xl overflow-hidden my-2 border border-slate-200 shadow-xs">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
    }

    return (
      <div className="rounded-xl overflow-hidden my-2 border border-slate-200 bg-black">
        <video src={url} controls className="w-full max-h-96 object-contain" />
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-fatfx-border p-4 sm:p-5 shadow-subtle hover:shadow-futuristic transition-all">
      {/* Author Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-slate-200 bg-slate-100">
              {post.authorAvatarUrl ? (
                <img src={post.authorAvatarUrl} alt={post.authorFullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-fatfx-teal-100 flex items-center justify-center font-bold text-xs text-fatfx-teal-700">
                  {post.authorUsername.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            {post.isAuthorVerified && (
              <div className="absolute -bottom-1 -right-1 bg-fatfx-teal-600 text-white rounded-full p-0.5" title="Verified Trader">
                <Award className="w-2.5 h-2.5" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm text-slate-900">{post.authorFullName}</span>
              <span className="text-xs text-slate-500 font-mono">@{post.authorUsername}</span>

              {post.authorRole === 'PRO_TRADER' && (
                <span className="bg-fatfx-teal-100 text-fatfx-teal-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                  PRO
                </span>
              )}
              {post.authorRole === 'ADMIN' && (
                <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                  <Shield className="w-2.5 h-2.5" /> Admin
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Delete button */}
        {canDelete && (
          <button
            onClick={() => {
              if (window.confirm('Delete this post?')) {
                deletePost(post.id);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors"
            title="Delete post"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Content */}
      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line mb-3">
        {post.content}
      </p>

      {/* STEPPER / MULTI-STEP RENDERER */}
      {(() => {
        const steps = post.steps;
        if (post.postType !== 'STEPPER' || !steps || steps.length === 0) return null;
        return (
          <div className="my-3 bg-fatfx-surface-subtle p-3.5 rounded-xl border border-fatfx-border space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-fatfx-teal-600" />
                <span className="text-xs font-bold text-slate-900">
                  Step-by-Step Breakdown ({activeStepIndex + 1} of {steps.length})
                </span>
              </div>

              {/* Stepper navigation dots / buttons */}
              <div className="flex items-center gap-1">
                <button
                  disabled={activeStepIndex === 0}
                  onClick={() => setActiveStepIndex(prev => Math.max(0, prev - 1))}
                  className="p-1 rounded-md hover:bg-white text-slate-600 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={activeStepIndex === steps.length - 1}
                  onClick={() => setActiveStepIndex(prev => Math.min(steps.length - 1, prev + 1))}
                  className="p-1 rounded-md hover:bg-white text-slate-600 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Active Step Content */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-fatfx-teal-700">
                {steps[activeStepIndex]?.title || `Step ${activeStepIndex + 1}`}
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {steps[activeStepIndex]?.content}
              </p>

              {steps[activeStepIndex]?.mediaUrl && (
                <div className="rounded-lg overflow-hidden border border-slate-200 mt-2 max-h-64">
                  <img
                    src={steps[activeStepIndex]?.mediaUrl}
                    alt={`Step ${activeStepIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Step Pill Indicators */}
            <div className="flex gap-1.5 pt-1">
              {steps.map((step, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => setActiveStepIndex(sIdx)}
                  className={clsx(
                    'flex-1 py-1 px-2 rounded-md text-[10px] font-bold transition-all text-center truncate',
                    activeStepIndex === sIdx
                      ? 'bg-fatfx-teal-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  )}
                >
                  {sIdx + 1}. {step.title ? step.title.split(':')[1] || step.title : `Step ${sIdx + 1}`}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* MEDIA LINKS RENDERER (Images, Videos, Charts) */}
      {post.mediaLinks && post.mediaLinks.length > 0 && (
        <div className="my-3 space-y-2">
          {post.mediaLinks.map((media, mIdx) => (
            <div key={mIdx}>
              {media.type === 'VIDEO' ? (
                renderVideo(media.url)
              ) : media.type === 'IMAGE' ? (
                <div className="rounded-xl overflow-hidden border border-slate-200 max-h-96 group relative bg-slate-50">
                  <img
                    src={media.url}
                    alt={media.title || 'Attached chart image'}
                    className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-200"
                  />
                  {media.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xs p-2 text-[11px] text-white font-medium">
                      {media.title}
                    </div>
                  )}
                </div>
              ) : (
                <a
                  href={media.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-fatfx-teal-50 border border-slate-200 hover:border-fatfx-teal-200 rounded-xl text-xs font-semibold text-fatfx-teal-700 transition-all"
                >
                  <span className="truncate">{media.title || media.url}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map((t, idx) => (
            <span
              key={idx}
              className="text-[10px] font-semibold text-fatfx-teal-700 bg-fatfx-teal-50 px-2 py-0.5 rounded-full border border-fatfx-teal-100/80"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Engagement Actions Bar */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={clsx(
              'flex items-center gap-1.5 transition-colors font-semibold',
              isLiked ? 'text-red-500' : 'hover:text-red-500 text-slate-600'
            )}
          >
            <Heart className={clsx('w-4 h-4', isLiked && 'fill-current text-red-500')} />
            <span>{post.likes.length}</span>
          </button>

          {/* Comments Toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 hover:text-fatfx-teal-600 transition-colors font-semibold text-slate-600"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.comments.length}</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1 hover:text-slate-900 transition-colors text-xs"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copied ? 'Link Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* EXPANDED COMMENTS SECTION */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
          {/* Existing comments */}
          {post.comments.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {post.comments.map(c => (
                <div key={c.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{c.authorFullName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">@{c.authorUsername}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Comment input box */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Write a comment / discussion..."
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddComment()}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500 bg-slate-50"
            />
            <button
              onClick={handleAddComment}
              disabled={!commentInput.trim()}
              className="px-3 py-1.5 bg-fatfx-teal-600 hover:bg-fatfx-teal-700 disabled:opacity-40 text-white rounded-xl transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
