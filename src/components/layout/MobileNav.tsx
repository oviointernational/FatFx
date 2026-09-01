import React from 'react';
import { BookOpen, Radio, Rss, Users, Shield, Link } from 'lucide-react';
import { ActiveView } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useUsers } from '../../context/UserContext';
import clsx from 'clsx';

interface MobileNavProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeView, onViewChange }) => {
  const { currentUser, isAdmin } = useAuth();
  const { isMenuAllowed } = useUsers();

  const chainCount = Object.values(currentUser.connections || {}).filter(
    c => c.state === 'CONNECTED' || c.hasPushAccess
  ).length;

  const rawItems = [
    { id: 'journal' as ActiveView, label: 'Journal', icon: BookOpen, badge: null },
    { id: 'signals' as ActiveView, label: 'Signals', icon: Radio, badge: null },
    { id: 'feeds' as ActiveView, label: 'Feeds', icon: Rss, badge: null },
    { id: 'users' as ActiveView, label: 'Users', icon: Users, badge: chainCount > 0 ? chainCount : null },
    ...(isAdmin ? [{ id: 'admin' as ActiveView, label: 'Admin', icon: Shield, badge: null }] : []),
  ];

  const items = rawItems.filter(item => isAdmin || isMenuAllowed(item.id));

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-fatfx-border flex items-center justify-around px-2 py-1 shadow-lg">
      {items.map(item => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={clsx(
              'flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative',
              isActive ? 'text-fatfx-teal-600' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <div className="relative">
              <Icon className={clsx('w-4.5 h-4.5 transition-transform', isActive && 'scale-110 text-fatfx-teal-600')} />
              {item.badge !== null && (
                <span className="absolute -top-1 -right-2 bg-fatfx-teal-500 text-white text-[8px] font-bold px-1 rounded-full flex items-center gap-0.5">
                  <Link className="w-2 h-2" />
                  {item.badge}
                </span>
              )}
            </div>
            <span className={clsx('text-[10px] font-semibold mt-0.5', isActive ? 'text-fatfx-teal-600 font-bold' : 'text-slate-500')}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
