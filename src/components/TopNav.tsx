import React from 'react';
import { Search, Bell, Settings, Activity, Menu, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isAdminEmail } from '../lib/utils';
import { runSeeder } from '../utils/seedDatabase';

interface TopNavProps {
  onMenuClick?: () => void;
  activeView?: string;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onMenuClick, activeView, theme, onThemeToggle }) => {
  const { user, profile, logout } = useAuth();
  const isAdmin = profile?.role === 'admin' || isAdminEmail(user?.email);
  const isReporterMode = activeView === 'reporter';
  const isOpsMode = activeView === 'ops';
  const isPersonnelMode = activeView === 'personnel';

  return (
    <nav className="h-[60px] shrink-0 bg-[var(--surface)]/80 border-b border-[var(--border)] flex items-center justify-between px-4 lg:px-6 relative z-50 backdrop-blur-2xl transition-colors duration-500">
      <div className="flex items-center gap-3 lg:gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm hidden xs:flex items-center justify-center bg-white shrink-0">
          <img src="/logo.png" alt="Sahaya Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm lg:text-base tracking-tight text-[var(--text-primary)] flex items-center gap-1.5">
              SAHAYA
            </h1>
            <div className="h-3 w-[1px] bg-[var(--border)]" />
            <span className="text-[10px] font-semibold text-[var(--accent)] tracking-widest uppercase">
              {isAdmin && activeView === 'overview' ? 'Response Hub' : (isReporterMode ? 'Help Request' : 'Response Hub')}
            </span>
          </div>
        </div>
      </div>

      {/* Omni-Search */}
      <div className="flex-1 max-w-xl px-4 hidden md:flex items-center justify-center">
        <div className="w-full max-w-md relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search records, personnel, or identifiers..."
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-full py-2 pl-10 pr-12 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-sm"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 rounded text-[10px] font-medium text-[var(--text-secondary)] bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-6">
        {isAdmin && (
          <div className="hidden lg:flex items-center gap-2 border-r border-[var(--border)] pr-4">
            <button onClick={runSeeder} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg text-xs font-bold transition-all border border-blue-200 dark:border-blue-500/20">
              <Activity className="w-3.5 h-3.5" />
              Seed Data
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg text-xs font-bold transition-all border border-rose-200 dark:border-rose-500/20">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              Broadcast
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={onThemeToggle} 
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2 rounded-full hover:bg-[var(--border)]"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors relative p-2 rounded-full hover:bg-[var(--border)]">
            <Bell className="w-4 h-4" />
          </button>
          
          <button onClick={logout} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2 rounded-full hover:bg-[var(--border)]" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3 pl-3 border-l border-[var(--border)] ml-1">
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-[12px] font-semibold text-[var(--text-primary)] leading-none capitalize">{profile?.name || user?.displayName || 'Responder'}</span>
              <span className="text-[10px] text-[var(--text-secondary)] font-medium mt-1">{isAdmin ? 'Administrator' : (profile?.role || 'User')}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border)] overflow-hidden shadow-sm shrink-0">
               <img src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/32/32`} alt="Profile" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
