import React from 'react';
import { Issue } from '../types';
import { Users, MapPin, Filter, MoreHorizontal, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IssueFeedProps {
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (issue: Issue) => void;
  areaName: string;
}

export const IssueFeed: React.FC<IssueFeedProps> = ({ issues, selectedIssueId, onSelectIssue, areaName }) => {
  return (
    <div className="w-full h-full flex flex-col bg-slate-950/40">
      <header className="px-4 py-2.5 border-b border-white/5 bg-slate-900/10 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Sector: <span className="text-slate-300 font-sans tracking-tight">{areaName}</span>
            </h3>
          </div>
          <div className="text-[8px] text-slate-600 font-mono flex items-center gap-1.5">
            <Activity className="w-2.5 h-2.5" />
            LIVE FEED: {issues.length.toString().padStart(2, '0')} SIGNALS
          </div>
        </div>
        <button className="p-1 rounded bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all">
          <Filter className="w-3 h-3" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {issues.map((issue, idx) => (
            <motion.div
              layout
              key={issue.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              onClick={() => onSelectIssue(issue)}
              className={`group cursor-pointer p-3 rounded-xl border transition-all duration-400 relative overflow-hidden flex flex-col gap-2 ${
                selectedIssueId === issue.id 
                  ? 'bg-brand-surface border-emerald-500/30 mission-control-glow' 
                  : 'bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-900/60'
              }`}
            >
              {/* Card Meta */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className={`px-1.5 py-0.5 rounded-[2px] text-[7px] font-bold tracking-widest uppercase border flex items-center gap-1.5 ${
                    issue.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    issue.priority === 'MED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {issue.priority === 'HIGH' ? 'Critical' : issue.priority === 'MED' ? 'High' : 'Normal'}
                    <span className="w-px h-2 bg-current opacity-20" />
                    <span className="flex items-center gap-1 opacity-80">
                      <div className={`w-1 h-1 rounded-full ${
                        issue.confidence >= 0.9 ? 'bg-emerald-400' :
                        issue.confidence >= 0.8 ? 'bg-amber-400' :
                        'bg-rose-400'
                      }`} />
                      {(issue.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  {issue.signalCount && issue.signalCount > 1 && (
                    <div className="flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded-[2px] text-[7px] font-bold uppercase tracking-widest">
                      <Activity className="w-2.5 h-2.5" />
                      {issue.signalCount} SOURCES
                    </div>
                  )}
                  <div className="text-[7px] font-mono text-slate-600 uppercase">
                    Ref: {issue.id}
                  </div>
                </div>
                {issue.status && issue.status !== 'reported' && (
                  <div className={`text-[6.5px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-full border ${
                    issue.status === 'assigned' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                    issue.status === 'in-progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {issue.status}
                  </div>
                )}
                <MoreHorizontal className="w-3 h-3 text-slate-700 group-hover:text-slate-500 transition-colors" />
              </div>

              {/* Title */}
              <h4 className={`text-xs font-sans font-semibold leading-snug tracking-tight ${selectedIssueId === issue.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                {issue.title}
              </h4>

              {/* Data Row */}
              <div className="flex items-center justify-between border-t border-white/5 pt-2">
                <div className="flex items-center gap-1.5 text-[8px] text-slate-500 font-sans">
                  <MapPin className="w-2.5 h-2.5 text-slate-600" />
                  <span className="truncate max-w-[120px] uppercase tracking-wide">{issue.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-300 font-mono">
                  <Users className="w-2.5 h-2.5 text-slate-600" />
                  <span>{issue.peopleAffected.toString().padStart(2, '0')}</span>
                </div>
              </div>

              {/* Decorative side markers */}
              <div className={`absolute top-0 right-0 w-0.5 h-full transition-all duration-500 ${selectedIssueId === issue.id ? 'bg-emerald-500' : 'bg-transparent group-hover:bg-white/10'}`} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
