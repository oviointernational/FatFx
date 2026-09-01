import React from 'react';
import { User, Shield, ChevronDown, PanelLeftClose, PanelLeftOpen, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

interface HeaderProps {
  onLogoClick: () => void;
  onProfileClick: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLogoClick,
  onProfileClick,
  isSidebarCollapsed,
  onToggleSidebar,
}) => {
  const { currentUser, isAdmin } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-10 bg-white border-b border-fatfx-border/70 flex items-center justify-between px-3 md:px-4 shadow-none">
      {/* Left: Sidebar Collapse Toggle + FatFx Logo */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-slate-600" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-slate-600" />
          )}
        </button>

        <button
          onClick={onLogoClick}
          className="flex items-center gap-1.5 focus:outline-none group"
        >
          <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-fatfx-teal-600 transition-colors">
            Fat<span className="text-fatfx-teal-500">Fx</span>
          </span>
        </button>
      </div>

      {/* Right: User Profile or Sign In Button */}
      {currentUser ? (
        <button
          onClick={onProfileClick}
          className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-slate-50 transition-all group focus:outline-none"
        >
          {isAdmin && <Shield className="w-3.5 h-3.5 text-amber-500" />}
          <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-slate-200 group-hover:ring-fatfx-teal-400 transition-all">
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-fatfx-teal-100 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-fatfx-teal-600" />
              </div>
            )}
          </div>
          <span className="hidden sm:block text-xs font-medium text-slate-700 group-hover:text-slate-900 max-w-28 truncate">
            {currentUser.username}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
        </button>
      ) : (
        <button
          onClick={onProfileClick}
          className="flex items-center gap-1.5 px-3 py-1 bg-fatfx-teal-600 hover:bg-fatfx-teal-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Sign In / Register</span>
        </button>
      )}
    </header>
  );
};
