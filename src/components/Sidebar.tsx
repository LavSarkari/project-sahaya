import React from 'react';
import { Area, Issue } from '../types';
import { MapPin, LayoutGrid, Users2, FileText, ChevronRight, Circle, Sparkles, Send, AlertTriangle, Users, Droplets, Shield, Heart, Package, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { isAdminEmail } from '../lib/utils';

interface SidebarProps {
  selectedAreaId: string | null;
  onSelectArea: (id: string | null) => void;
  activeView: 'overview' | 'team' | 'reports' | 'reporter' | 'tasks';
  onViewChange: (view: 'overview' | 'team' | 'reports' | 'reporter' | 'tasks') => void;
  isOpen: boolean;
  onClose: () => void;
  issues: Issue[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  selectedAreaId, 
  onSelectArea, 
  activeView, 
  onViewChange,
  isOpen,
  onClose,
  issues,
  collapsed = false,
  onToggleCollapse
}) => {
  const { profile, user } = useAuth();
  const isAdmin = profile?.role === 'admin' || isAdminEmail(user?.email);

  // Live stats from real issue data
  const stats = React.useMemo(() => {
    const active = issues.filter(i => i.status !== 'resolved');
    const high = active.filter(i => i.priority === 'HIGH').length;
    const med = active.filter(i => i.priority === 'MED').length;
    const low = active.filter(i => i.priority === 'LOW').length;
    const totalAffected = active.reduce((sum, i) => sum + (i.peopleAffected || 0), 0);
    
    // Group by category
    const categories: Record<string, number> = {};
    active.forEach(i => { categories[i.category] = (categories[i.category] || 0) + 1; });

    return { total: active.length, high, med, low, totalAffected, categories };
  }, [issues]);

  // Dynamic regions computed from actual issues
  const regions = React.useMemo(() => {
    const regionMap: Record<string, { count: number; highCount: number; areaId: string }> = {};
    
    issues.filter(i => i.status !== 'resolved').forEach(issue => {
      // Extract state/region from location string (last part after comma)
      const parts = issue.location.split(',').map(s => s.trim());
      const regionName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
      
      if (!regionMap[regionName]) {
        regionMap[regionName] = { count: 0, highCount: 0, areaId: issue.areaId };
      }
      regionMap[regionName].count++;
      if (issue.priority === 'HIGH') regionMap[regionName].highCount++;
    });

    return Object.entries(regionMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [issues]);

  const categoryIcon = (cat: string) => {
    switch(cat) {
      case 'MEDICAL': return <Heart className="w-3 h-3" />;
      case 'FOOD': return <Package className="w-3 h-3" />;
      case 'WATER': return <Droplets className="w-3 h-3" />;
      case 'SHELTER': return <Users className="w-3 h-3" />;
      case 'SECURITY': return <Shield className="w-3 h-3" />;
      default: return <Circle className="w-3 h-3" />;
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[150] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[200] lg:z-10
        ${collapsed ? 'w-[68px]' : 'w-64'} border-r border-[var(--border)] flex flex-col h-full bg-[var(--surface)]
        transition-all duration-300 ease-in-out transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      {/* Navigation section */}
      <div className={`${collapsed ? 'p-2 space-y-1' : 'p-3 space-y-1'}`}>
        {profile?.role === 'admin' && (
          <>
            <button
              onClick={() => onViewChange('overview')}
              title="Overview"
              className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeView === 'overview' ? 'bg-[var(--text-primary)] text-[var(--text-inverse)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)]'
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              {!collapsed && 'Overview'}
            </button>
            <button
              onClick={() => onViewChange('team')}
              title="Team Directory"
              className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeView === 'team' ? 'bg-[var(--text-primary)] text-[var(--text-inverse)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)]'
              }`}
            >
              <Users2 className="w-4 h-4 shrink-0" />
              {!collapsed && 'Team Directory'}
            </button>
            <button
              onClick={() => onViewChange('reports')}
              title="Reports"
              className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeView === 'reports' ? 'bg-[var(--text-primary)] text-[var(--text-inverse)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)]'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              {!collapsed && 'Reports'}
            </button>
          </>
        )}

        {profile?.role === 'volunteer' && (
          <button
            onClick={() => onViewChange('tasks')}
            title="Field Tasks"
            className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeView === 'tasks' ? 'bg-[var(--text-primary)] text-[var(--text-inverse)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)]'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            {!collapsed && 'Field Tasks'}
          </button>
        )}

        {profile?.role === 'reporter' && (
          <button
            onClick={() => onViewChange('reporter')}
            title="Request Help"
            className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeView === 'reporter' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)] border border-transparent'
            }`}
          >
            <Send className="w-4 h-4 shrink-0" />
            {!collapsed && 'Request Help'}
          </button>
        )}
      </div>

      <div className="h-px bg-[var(--border)] mx-4 my-1 opacity-50" />

      {/* Live Stats Panel */}
      {profile?.role !== 'reporter' && !collapsed && (
        <div className="px-3 py-3 space-y-3">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[var(--bg)] rounded-xl p-3 border border-[var(--border)]">
              <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Active</div>
              <div className="text-xl font-black text-[var(--text-primary)] leading-tight mt-1">{stats.total}</div>
            </div>
            <div className="bg-[var(--bg)] rounded-xl p-3 border border-[var(--border)]">
              <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Affected</div>
              <div className="text-xl font-black text-[var(--text-primary)] leading-tight mt-1">{stats.totalAffected > 999 ? `${(stats.totalAffected / 1000).toFixed(1)}K` : stats.totalAffected}</div>
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className="flex gap-1.5">
            <div className="flex-1 flex flex-col items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg py-1.5 px-1 border border-rose-200 dark:border-rose-500/20 transition-all text-center">
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span className="text-xs font-black">{stats.high}</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 pt-0.5">Critical</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg py-1.5 px-1 border border-amber-200 dark:border-amber-500/20 transition-all text-center">
              <span className="text-xs font-black">{stats.med}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 pt-0.5">Urgent</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg py-1.5 px-1 border border-emerald-200 dark:border-emerald-500/20 transition-all text-center">
              <span className="text-xs font-black">{stats.low}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 pt-0.5">Low</span>
            </div>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(stats.categories).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2 py-1">
                {categoryIcon(cat)}
                <span className="text-[10px] font-semibold text-[var(--text-secondary)]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-px bg-[var(--border)] mx-4 opacity-50" />

      {/* Dynamic Regions from live data */}
      {profile?.role !== 'reporter' && !collapsed && (
        <div className="p-3 flex flex-col flex-1 overflow-hidden">
          <h2 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            Active Regions
          </h2>
          
          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar -mx-2 px-2">
            <button 
              onClick={() => onSelectArea(null)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all mb-2 flex items-center gap-2 ${
                !selectedAreaId ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)]'
              }`}
            >
              <Circle className={`w-2 h-2 ${!selectedAreaId ? 'fill-current' : ''}`} />
              All Regions
            </button>
  
            {regions.map((region) => (
              <div
                key={region.name}
                onClick={() => onSelectArea(region.areaId)}
                className={`cursor-pointer p-2.5 rounded-xl flex items-center justify-between transition-all group mb-0.5 ${
                  selectedAreaId === region.areaId 
                    ? 'bg-[var(--bg)] border border-[var(--border)] shadow-sm' 
                    : 'border border-transparent hover:bg-[var(--hover)]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    region.highCount > 0 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`} />
                  <div className="min-w-0">
                    <div className={`text-xs font-semibold leading-tight truncate ${selectedAreaId === region.areaId ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                      {region.name}
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)] font-medium mt-0.5">
                      {region.count} {region.count === 1 ? 'issue' : 'issues'}
                      {region.highCount > 0 && <span className="text-rose-500 ml-1">• {region.highCount} critical</span>}
                    </div>
                  </div>
                </div>
                {selectedAreaId === region.areaId && <ChevronRight className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />}
              </div>
            ))}

            {regions.length === 0 && (
              <div className="text-xs text-[var(--text-secondary)] text-center py-6 opacity-60">
                No active issues
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`p-3 border-t border-[var(--border)] mt-auto bg-[var(--surface)] flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && <SystemStatusDisplay />}
        {collapsed && <div className="w-2 h-2 rounded-full bg-emerald-500 m-2" title="Systems Operational" />}
        {onToggleCollapse && (
          <button 
            onClick={onToggleCollapse} 
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)] transition-colors hidden lg:block"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

    </aside>
    </>
  );
};

const SystemStatusDisplay: React.FC = () => {
  const [status, setStatus] = React.useState<'online' | 'degraded' | 'offline'>('online');

  React.useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        setStatus(res.ok ? 'online' : 'degraded');
      } catch { setStatus('offline'); }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${
        status === 'online' ? 'bg-emerald-500' :
        status === 'degraded' ? 'bg-amber-500' : 'bg-rose-500'
      }`} />
      <span className="text-[11px] text-[var(--text-secondary)] font-medium">
        {status === 'online' ? 'Systems Operational' : 
         status === 'degraded' ? 'Degraded Performance' : 'Offline'}
      </span>
    </div>
  );
};

