import React, { useState } from 'react';
import {
  X, Plus, Trash2, Image, Video, Link as LinkIcon, Send,
  Layers, FileText, CheckCircle, Sparkles, Hash
} from 'lucide-react';
import { PostType, PostStep, PostMedia } from '../../types/feed';
import { useFeed } from '../../context/FeedContext';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose }) => {
  const { addPost } = useFeed();
  const { currentUser } = useAuth();

  const [postType, setPostType] = useState<PostType>('STANDARD');
  const [content, setContent] = useState('');
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaTitleInput, setMediaTitleInput] = useState('');
  const [mediaLinks, setMediaLinks] = useState<PostMedia[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['#Forex', '#FatFx']);

  // Stepper / Multi-textbox state (with '+' button)
  const [steps, setSteps] = useState<PostStep[]>([
    { stepNumber: 1, title: 'Step 1: Market Bias & Liquidity', content: '' },
    { stepNumber: 2, title: 'Step 2: Confluence & Entry Trigger', content: '' },
  ]);

  if (!isOpen) return null;

  // Auto-detect media type from link
  const detectMediaType = (url: string): 'IMAGE' | 'VIDEO' | 'TRADINGVIEW' | 'LINK' => {
    const clean = url.toLowerCase();
    if (clean.includes('youtube.com') || clean.includes('youtu.be') || clean.includes('.mp4') || clean.includes('.webm') || clean.includes('vimeo.com') || clean.includes('loom.com')) {
      return 'VIDEO';
    }
    if (clean.includes('tradingview.com/chart') || clean.includes('tradingview.com/x/')) {
      return 'TRADINGVIEW';
    }
    if (clean.endsWith('.png') || clean.endsWith('.jpg') || clean.endsWith('.jpeg') || clean.endsWith('.webp') || clean.endsWith('.gif') || clean.includes('images.unsplash.com')) {
      return 'IMAGE';
    }
    return 'IMAGE'; // Default image preview
  };

  const handleAddMedia = () => {
    const trimmed = mediaUrlInput.trim();
    if (!trimmed) return;

    const detected = detectMediaType(trimmed);
    setMediaLinks([
      ...mediaLinks,
      {
        url: trimmed,
        type: detected,
        title: mediaTitleInput.trim() || undefined,
      }
    ]);
    setMediaUrlInput('');
    setMediaTitleInput('');
  };

  const handleRemoveMedia = (index: number) => {
    setMediaLinks(mediaLinks.filter((_, i) => i !== index));
  };

  // Add more steps / textboxes with '+' button
  const handleAddStep = () => {
    const nextNumber = steps.length + 1;
    setSteps([
      ...steps,
      {
        stepNumber: nextNumber,
        title: `Step ${nextNumber}: Trade Execution & Risk`,
        content: '',
      }
    ]);
  };

  const handleUpdateStep = (index: number, field: 'title' | 'content' | 'mediaUrl', value: string) => {
    const next = [...steps];
    next[index] = { ...next[index], [field]: value };
    setSteps(next);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) return;
    const next = steps.filter((_, i) => i !== index).map((s, idx) => ({
      ...s,
      stepNumber: idx + 1
    }));
    setSteps(next);
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#+/, '');
    if (!clean) return;
    const formatted = `#${clean}`;
    if (!tags.includes(formatted)) {
      setTags([...tags, formatted]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = () => {
    if (!content.trim() && postType === 'STANDARD') return;

    addPost({
      content: content.trim() || 'Multi-step trade thesis & strategy breakdown:',
      postType,
      steps: postType === 'STEPPER' ? steps : undefined,
      mediaLinks: mediaLinks.length > 0 ? mediaLinks : undefined,
      tags: tags.length > 0 ? tags : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-fatfx-border shadow-lg w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-fatfx-border flex items-center justify-between bg-fatfx-surface-subtle shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-fatfx-teal-50 border border-fatfx-teal-200 flex items-center justify-center text-fatfx-teal-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Create Feed Post</h2>
              <p className="text-[10px] text-slate-500">Share trading setups, market breakdowns & media links</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Post Type Selector (Standard Post vs Stepper with '+' button) */}
        <div className="px-5 pt-3 pb-2 flex gap-2 border-b border-fatfx-border/60 bg-white shrink-0">
          <button
            onClick={() => setPostType('STANDARD')}
            className={clsx(
              'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
              postType === 'STANDARD'
                ? 'bg-fatfx-teal-50 text-fatfx-teal-700 border border-fatfx-teal-200'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            Standard Text Post
          </button>
          <button
            onClick={() => setPostType('STEPPER')}
            className={clsx(
              'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
              postType === 'STEPPER'
                ? 'bg-fatfx-teal-50 text-fatfx-teal-700 border border-fatfx-teal-200'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            Stepper / Multi-Step Post
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* STANDARD POST CONTENT */}
          {postType === 'STANDARD' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                What's on your chart?
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Share your market analysis, key liquidity levels, trade confluences, or lessons..."
                rows={4}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500 resize-none leading-relaxed"
                autoFocus
              />
            </div>
          )}

          {/* STEPPER / MULTI-BOX POST (With '+' button to add more) */}
          {postType === 'STEPPER' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Strategy Overview / Introduction
                </label>
                <input
                  type="text"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="e.g. 3-Step ICT London Open Displacement Strategy"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500"
                />
              </div>

              {/* Dynamic Steps List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Step-by-Step Sections ({steps.length})
                  </span>
                  <button
                    onClick={handleAddStep}
                    className="flex items-center gap-1 text-[11px] font-bold text-fatfx-teal-600 hover:text-fatfx-teal-700 bg-fatfx-teal-50 hover:bg-fatfx-teal-100 border border-fatfx-teal-200 px-2 py-1 rounded-lg transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Step
                  </button>
                </div>

                {steps.map((step, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2 relative">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={step.title}
                        onChange={e => handleUpdateStep(idx, 'title', e.target.value)}
                        placeholder={`Step ${idx + 1} Title`}
                        className="w-full text-xs font-bold text-slate-900 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500"
                      />
                      {steps.length > 1 && (
                        <button
                          onClick={() => handleRemoveStep(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          title="Remove Step"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <textarea
                      value={step.content}
                      onChange={e => handleUpdateStep(idx, 'content', e.target.value)}
                      placeholder={`Explain what happens in Step ${idx + 1}...`}
                      rows={2}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500 resize-none"
                    />

                    <input
                      type="url"
                      value={step.mediaUrl || ''}
                      onChange={e => handleUpdateStep(idx, 'mediaUrl', e.target.value)}
                      placeholder="Optional image/chart URL for this specific step..."
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 bg-white focus:outline-none font-mono"
                    />
                  </div>
                ))}

                {/* Big '+' button below steps */}
                <button
                  onClick={handleAddStep}
                  className="w-full py-2.5 border-2 border-dashed border-fatfx-teal-300 hover:border-fatfx-teal-500 bg-fatfx-teal-50/50 hover:bg-fatfx-teal-50 text-fatfx-teal-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Next Step
                </button>
              </div>
            </div>
          )}

          {/* ATTACH MEDIA & LINKS (Images, Videos, TradingView) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
              Attach Links (Images, Videos, TradingView Charts)
            </label>

            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste image URL (.jpg/.png), YouTube video, or TradingView link..."
                value={mediaUrlInput}
                onChange={e => setMediaUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddMedia()}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500 font-mono"
              />
              <button
                onClick={handleAddMedia}
                disabled={!mediaUrlInput.trim()}
                className="px-3 py-1.5 bg-slate-900 hover:bg-fatfx-teal-600 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
              >
                Attach
              </button>
            </div>

            {/* Attached media pills */}
            {mediaLinks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {mediaLinks.map((m, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200"
                  >
                    {m.type === 'VIDEO' ? (
                      <Video className="w-3 h-3 text-red-500" />
                    ) : m.type === 'IMAGE' ? (
                      <Image className="w-3 h-3 text-fatfx-teal-600" />
                    ) : (
                      <LinkIcon className="w-3 h-3 text-blue-500" />
                    )}
                    <span className="font-mono truncate max-w-[160px]">{m.title || m.url}</span>
                    <button onClick={() => handleRemoveMedia(i)} className="hover:text-red-500 ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* TAGS */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide">
              Tags & Tickers
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. XAUUSD, ICT, Scalping"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-fatfx-teal-500"
              />
              <button
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Add Tag
              </button>
            </div>

            <div className="flex flex-wrap gap-1 pt-1">
              {tags.map(t => (
                <span
                  key={t}
                  className="flex items-center gap-1 text-[10px] bg-fatfx-teal-50 text-fatfx-teal-700 font-semibold px-2 py-0.5 rounded-full border border-fatfx-teal-100"
                >
                  {t}
                  <button onClick={() => handleRemoveTag(t)} className="hover:text-red-500">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-fatfx-border bg-fatfx-surface-subtle flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-slate-200">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-fatfx-teal-100 flex items-center justify-center text-[10px] font-bold text-fatfx-teal-700">
                  {currentUser.username.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-xs font-semibold text-slate-700">Posting as @{currentUser.username}</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!content.trim() && postType === 'STANDARD'}
            className="px-4 py-2 bg-fatfx-teal-600 hover:bg-fatfx-teal-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Publish Post
          </button>
        </div>
      </div>
    </div>
  );
};
