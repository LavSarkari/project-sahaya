import React from 'react';
import { Area, Issue } from '../types';
import { AREAS } from '../constants';
import { MapPin, LayoutGrid, Users2, FileText, ChevronRight, Circle, Database, Sparkles, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { seedData } from '../services/issueService';
import { isAdminEmail } from '../lib/utils';

interface SidebarProps {
  selectedAreaId: string | null;
  onSelectArea: (id: string | null) => void;
  activeView: 'dashboard' | 'personnel' | 'reports' | 'reporter' | 'ops';
  onViewChange: (view: 'dashboard' | 'personnel' | 'reports' | 'reporter' | 'ops') => void;
  isOpen: boolean;
  onClose: () => void;
  issues: Issue[];
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  selectedAreaId, 
  onSelectArea, 
  activeView, 
  onViewChange,
  isOpen,
  onClose,
  issues
}) => {
  const { profile, user } = useAuth();
  const isAdmin = profile?.role === 'admin' || isAdminEmail(user?.email);

  const [seeding, setSeeding] = React.useState(false);

  // Dynamic Area Calculation
  const dynamicAreas = React.useMemo(() => {
    return AREAS.map(area => {
      const areaIssues = issues.filter(i => i.areaId === area.id && i.status !== 'resolved');
      const highCount = areaIssues.filter(i => i.priority === 'HIGH').length;
      const medCount = areaIssues.filter(i => i.priority === 'MED').length;
      
      let status: 'red' | 'yellow' | 'green' = 'green';
      if (highCount > 0) status = 'red';
      else if (medCount > 0) status = 'yellow';

      return {
        ...area,
        activeIssues: areaIssues.length,
        status
      };
    });
  }, [issues]);

  const handleSeed = async () => {
    if (confirm('This will populate the database with initial mock data. Continue?')) {
      setSeeding(true);
      await seedData();
      setSeeding(false);
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
        w-64 border-r border-brand-border flex flex-col h-full bg-slate-950 lg:bg-slate-950/20
        transition-transform duration-300 transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      {/* Navigation section */}
      <div className="p-3 space-y-1">
        {profile?.role === 'admin' && (
          <>
            <button
              onClick={() => onViewChange('dashboard')}
              className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeView === 'dashboard' ? 'bg-brand-hover text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Admin Dashboard
            </button>
            <button
              onClick={() => onViewChange('personnel')}
              className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeView === 'personnel' ? 'bg-brand-hover text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Users2 className="w-4 h-4" />
              Manage Personnel
            </button>
            <button
              onClick={() => onViewChange('reports')}
              className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeView === 'reports' ? 'bg-brand-hover text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4" />
              Mission Analytics
            </button>
          </>
        )}

        {profile?.role === 'volunteer' && (
          <button
            onClick={() => onViewChange('ops')}
            className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeView === 'ops' ? 'bg-brand-hover text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Field Operations
          </button>
        )}

        {profile?.role === 'reporter' && (
          <button
            onClick={() => onViewChange('reporter')}
            className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeView === 'reporter' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Send className="w-4 h-4" />
            Submit Signal
          </button>
        )}
      </div>

      <div className="h-px bg-brand-border mx-4 my-1 opacity-50" />

      {/* Admin Actions */}
      {isAdmin && (
        <div className="px-4 py-1">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest text-emerald-500 hover:bg-emerald-500/10 border border-emerald-500/20 transition-all disabled:opacity-50"
          >
            <Database className={`w-3 h-3 ${seeding ? 'animate-bounce' : ''}`} />
            {seeding ? 'Seeding...' : 'Seed Database'}
          </button>
        </div>
      )}

      {/* Sectors section */}
      <div className="p-3 flex flex-col flex-1 overflow-hidden">
        <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
          <MapPin className="w-3 h-3" />
          Sector Overview
        </h2>
        
        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar -mx-2 px-2">
          <button 
            onClick={() => onSelectArea(null)}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all mb-1 flex items-center gap-2 ${
              !selectedAreaId ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <Circle className={`w-1.5 h-1.5 ${!selectedAreaId ? 'fill-current' : ''}`} />
            Global Feed
          </button>

          {dynamicAreas.map((area) => (
            <div
              key={area.id}
              onClick={() => onSelectArea(area.id)}
              className={`cursor-pointer p-2.5 rounded-lg flex items-center justify-between transition-all group ${
                selectedAreaId === area.id 
                  ? 'bg-slate-800/50 border border-white/10' 
                  : 'border border-transparent hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  area.status === 'red' ? 'bg-rose-500 animate-pulse' :
                  area.status === 'yellow' ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`} />
                <div>
                  <div className={`text-xs font-semibold ${selectedAreaId === area.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {area.name}
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono tracking-tight">Active: {area.activeIssues}</div>
                </div>
              </div>
              {selectedAreaId === area.id && <ChevronRight className="w-3 h-3 text-slate-500" />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-slate-900/40 border-t border-brand-border mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-emerald-500/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-emerald-500">SH</span>
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">System Status</div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] text-slate-500 uppercase font-medium">Active Monitoring</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};
