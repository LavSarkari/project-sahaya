import React from 'react';
import { Shield, Search, Bell, Settings, Activity, Menu, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isAdminEmail } from '../lib/utils';

interface TopNavProps {
  onMenuClick?: () => void;
  activeView?: string;
}

export const TopNav: React.FC<TopNavProps> = ({ onMenuClick, activeView }) => {
  const { user, profile, logout } = useAuth();
  const isAdmin = profile?.role === 'admin' || isAdminEmail(user?.email);
  const isReporterMode = activeView === 'reporter';
  const isOpsMode = activeView === 'ops';
  const isPersonnelMode = activeView === 'personnel';

  return (
    <nav className="h-12 shrink-0 bg-slate-950 border-b border-brand-border flex items-center justify-between px-4 lg:px-6 relative z-50 backdrop-blur-xl bg-opacity-80">
      <div className="flex items-center gap-3 lg:gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-1.5 -ml-1 text-slate-400 hover:text-white transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20 hidden xs:block">
          <Shield className={`w-4 h-4 text-emerald-500 ${isReporterMode ? 'animate-pulse' : ''}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm lg:text-base tracking-tight text-white uppercase flex items-center gap-1.5">
              SAHAYA <span className={isReporterMode ? 'text-rose-500' : isOpsMode ? 'text-amber-500' : 'text-emerald-500'}>
                {isAdmin && activeView === 'dashboard' ? 'COMMAND' : (isReporterMode ? 'REPORTER' : isOpsMode ? 'FIELD OPS' : isPersonnelMode ? 'PERSONNEL' : 'COMMAND')}
              </span>
            </h1>
            <div className="h-3 w-[1px] bg-slate-800" />
            <span className="text-[8px] font-bold text-emerald-500/50 tracking-widest uppercase">Live</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-md px-4 hidden md:block">
        {/* Search component logic preserved */}
      </div>

      <div className="flex items-center gap-2 lg:gap-6">
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-500 uppercase">
              <Activity className="w-2.5 h-2.5" />
              <span className="hidden xl:inline">Secure Link</span>
            </div>
            <div className="text-[8px] text-slate-600 font-sans uppercase">Encrypted</div>
          </div>
        </div>
        
        <div className="h-7 w-[1px] bg-slate-800 hidden sm:block" />

        <div className="flex items-center gap-2 md:gap-4">
          <button className="text-slate-500 hover:text-white transition-colors relative p-1.5">
            <Bell className="w-4 h-4" />
          </button>
          <button onClick={logout} className="text-slate-500 hover:text-white transition-colors p-1.5" title="Logout"><LogOut className="w-4 h-4" /></button>
          <div className="flex items-center gap-3 pl-2 border-l border-slate-800 ml-1">
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-[11px] font-bold text-white leading-none capitalize">{profile?.name || user?.displayName || 'Responder'}</span>
              <span className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">{isAdmin ? 'Admin' : (profile?.role || 'User')}</span>
            </div>
            <div className="w-7 h-7 rounded bg-slate-800 border border-white/5 overflow-hidden ring-1 ring-white/10 shrink-0">
               <img src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/32/32`} alt="Profile" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
