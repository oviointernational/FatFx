import React from 'react';
import { BookOpen, Radio, Rss, Users, Shield, Link, Lock } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useUsers } from '../../context/UserContext';

export type ActiveView = 'journal' | 'signals' | 'feeds' | 'users' | 'admin';

interface SidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileClose,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const { isMenuAllowed } = useUsers();

  const chainCount = Object.values(currentUser?.connections || {}).filter(
    c => c.state === 'CONNECTED' || c.hasPushAccess
  ).length;

  type MenuItem = {
    id: ActiveView;
    label: string;
    icon: React.ElementType;
    badge: number | null;
  };

  const rawMenuItems: MenuItem[] = [
    { id: 'feeds', label: 'Feeds', icon: Rss, badge: null },
    { id: 'journal', label: 'Journal', icon: BookOpen, badge: null },
    { id: 'signals', label: 'Signals', icon: Radio, badge: null },
    { id: 'users', label: 'Users', icon: Users, badge: chainCount > 0 ? chainCount : null },
    ...(isAdmin ? [{ id: 'admin' as ActiveView, label: 'Admin', icon: Shield, badge: null }] : []),
  ];

  // Filter or mark disabled menus
  const menuItems = rawMenuItems.filter(item => isAdmin || isMenuAllowed(item.id));

  const handleViewChange = (view: ActiveView) => {
    if (!isAdmin && !isMenuAllowed(view)) return;
    onViewChange(view);
    onMobileClose();
  };

  const NavContent = () => (
    <nav className="flex flex-col h-full bg-white select-none">
      {/* Menu list starts directly at the top */}
      <div className="flex-1 py-3 px-2 space-y-1.5 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const isAllowed = isMenuAllowed(item.id);

          return (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              disabled={!isAdmin && !isAllowed}
              title={isCollapsed ? item.label : undefined}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative text-left group focus:outline-none',
                isActive
                  ? 'bg-fatfx-teal-50/90 text-fatfx-teal-700 font-semibold'
                  : isAllowed
                  ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  : 'text-slate-300 opacity-60 cursor-not-allowed'
              )}
            >
              <Icon
                className={clsx(
                  'shrink-0 transition-colors duration-150',
                  isCollapsed ? 'w-5 h-5' : 'w-4.5 h-4.5',
                  isActive
                    ? 'text-fatfx-teal-600'
                    : isAllowed
                    ? 'text-slate-500 group-hover:text-slate-800'
                    : 'text-slate-300'
                )}
                strokeWidth={isActive ? 2.2 : 1.8}
              />

              {!isCollapsed && (
                <span className="text-sm flex-1 tracking-tight flex items-center justify-between">
                  <span>{item.label}</span>
                  {!isAllowed && isAdmin && (
                    <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded">
                      Disabled
                    </span>
                  )}
                </span>
              )}

              {/* Chain badge for Users */}
              {item.badge !== null && !isCollapsed && isAllowed && (
                <span
                  className={clsx(
                    'flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                    isActive
                      ? 'bg-fatfx-teal-200/80 text-fatfx-teal-800'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  <Link className="w-2.5 h-2.5" />
                  {item.badge}
                </span>
              )}

              {item.badge !== null && isCollapsed && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-fatfx-teal-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile overlay drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-xs" onClick={onMobileClose} />
          <div className="absolute left-0 top-10 bottom-0 w-60 bg-white shadow-lg border-r border-fatfx-border">
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={clsx(
          'hidden md:flex flex-col bg-white border-r border-fatfx-border transition-all duration-200 ease-in-out shrink-0',
          isCollapsed ? 'w-14' : 'w-[20%] min-w-[170px] max-w-[220px]'
        )}
      >
        <NavContent />
      </aside>
    </>
  );
};
