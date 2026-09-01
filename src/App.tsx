import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserProvider, useUsers } from './context/UserContext';
import { JournalProvider } from './context/JournalContext';
import { SignalProvider } from './context/SignalContext';
import { FeedProvider } from './context/FeedContext';
import { Header } from './components/layout/Header';
import { Sidebar, ActiveView } from './components/layout/Sidebar';
import { AuthModal } from './components/layout/AuthModal';
import { MobileNav } from './components/layout/MobileNav';
import { JournalView } from './components/journal/JournalView';
import { SignalListView } from './components/signal/SignalListView';
import { FeedsView } from './components/feed/FeedsView';
import { UsersListView } from './components/users/UsersListView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Lock, ShieldAlert } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { isAdmin } = useAuth();
  const { isMenuAllowed } = useUsers();

  const [activeView, setActiveView] = useState<ActiveView>('feeds');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Return to homepage anytime FatFx is clicked
  const handleLogoClick = () => {
    setActiveView('feeds');
    setIsMobileOpen(false);
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsMobileOpen(prev => !prev);
    } else {
      setIsCollapsed(prev => !prev);
    }
  };

  const isCurrentViewAllowed = isMenuAllowed(activeView);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-fatfx-bg text-slate-800">
      {/* 40px Header with collapse toggle and FatFx logo */}
      <Header
        onLogoClick={handleLogoClick}
        onProfileClick={() => setIsAuthOpen(true)}
        isSidebarCollapsed={isCollapsed}
        onToggleSidebar={toggleSidebar}
      />

      {/* Main Body: Left Sidebar (20% desktop) & Right Main Container (80% desktop) */}
      <div className="flex flex-1 pt-10 pb-12 md:pb-0 overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar
          activeView={activeView}
          onViewChange={view => {
            setActiveView(view);
            setIsMobileOpen(false);
          }}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
        />

        {/* Right Main Container (80%) */}
        <main className="flex-1 overflow-hidden flex flex-col bg-[#FBFDFD] relative">
          <div className="flex-1 overflow-hidden relative">
            {!isAdmin && !isCurrentViewAllowed ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-fatfx-bg">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-3">
                  <Lock className="w-6 h-6 text-amber-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900 mb-1">Module Temporarily Disabled</h2>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  Access to this section and all associated activities have been paused by the system administrator. Please check back shortly.
                </p>
              </div>
            ) : (
              <>
                {activeView === 'journal' && <JournalView />}
                {activeView === 'signals' && <SignalListView />}
                {activeView === 'feeds' && <FeedsView />}
                {activeView === 'users' && <UsersListView />}
                {activeView === 'admin' && <AdminDashboard />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Quick Navigation */}
      <MobileNav
        activeView={activeView}
        onViewChange={view => {
          setActiveView(view);
          setIsMobileOpen(false);
        }}
      />

      {/* Profile / Registration / Login Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <JournalProvider>
          <SignalProvider>
            <FeedProvider>
              <MainLayout />
            </FeedProvider>
          </SignalProvider>
        </JournalProvider>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
