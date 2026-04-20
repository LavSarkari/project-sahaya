import React from 'react';
import { Issue } from '../types';
import { Users, MapPin, Filter, MoreHorizontal, Activity, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IssueFeedProps {
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (issue: Issue) => void;
  areaName: string;
}

export const IssueFeed: React.FC<IssueFeedProps> = ({ issues, selectedIssueId, onSelectIssue, areaName }) => {
  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg)]">
      <header className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Viewing: <span className="text-[var(--text-primary)] font-semibold capitalize">{areaName}</span>
            </h3>
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
            <Activity className="w-3 h-3" />
            {issues.length} Active Requests
          </div>
        </div>
        <button className="p-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all shadow-sm">
          <Filter className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {issues.map((issue, idx) => (
            <motion.div
              layout
              key={issue.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              onClick={() => onSelectIssue(issue)}
              className={`group cursor-pointer p-4 rounded-[20px] transition-all duration-200 ease-out relative flex flex-col gap-3 border ${
                selectedIssueId === issue.id 
                  ? 'bg-[var(--hover)] border-[var(--accent)] shadow-sm ring-1 ring-[var(--accent)]/30' 
                  : 'bg-[var(--surface)] border-[var(--border)] shadow-sm hover:bg-[var(--hover)] hover:border-[var(--text-secondary)]/20'
              }`}
            >
              {/* Card Meta */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase border flex items-center gap-1.5 ${
                    issue.priority === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' :
                    issue.priority === 'MED' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                    'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                  }`}>
                    {issue.priority === 'HIGH' ? 'Critical' : issue.priority === 'MED' ? 'Urgent' : 'Normal'}
                    <span className="w-px h-2.5 bg-current opacity-20" />
                    <span className="flex items-center gap-1 opacity-90">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        issue.confidence >= 0.9 ? 'bg-emerald-500' :
                        issue.confidence >= 0.8 ? 'bg-amber-500' :
                        'bg-rose-500'
                      }`} />
                      {(issue.confidence * 100).toFixed(0)}% confident
                    </span>
                  </div>
                  {issue.signalCount && issue.signalCount > 1 && (
                    <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide">
                      <Activity className="w-3 h-3" />
                      {issue.signalCount} People reported
                    </div>
                  )}
                  {issue.dataSource && issue.dataSource !== 'field_report' && (
                    <div className="flex items-center gap-1 bg-violet-50 text-violet-600 border border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide">
                      <Tag className="w-2.5 h-2.5" />
                      {issue.dataSource.replace('_', ' ')}
                    </div>
                  )}
                  <div className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">
                    ID: {issue.id.substring(0, 4)}
                  </div>
                </div>
                {issue.status && issue.status !== 'reported' && (
                  <div className={`text-[10px] font-bold capitalize px-2.5 py-1 rounded-full border ${
                    issue.status === 'assigned' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                    issue.status === 'in-progress' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' :
                    'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                  }`}>
                    {issue.status.replace('-', ' ')}
                  </div>
                )}
                <MoreHorizontal className="w-4 h-4 text-[var(--text-secondary)] opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Title */}
              <h4 className={`text-base font-bold leading-tight ${selectedIssueId === issue.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                {issue.title}
              </h4>

              {/* Data Row */}
              <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 mt-1">
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium">
                  <MapPin className="w-3.5 h-3.5 opacity-70" />
                  <span className="truncate max-w-[180px] capitalize">{issue.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-semibold">
                  <Users className="w-3.5 h-3.5 opacity-70" />
                  <span>{issue.peopleAffected} Affected</span>
                </div>
              </div>

              {/* Decorative side markers */}
              <div className={`absolute left-0 top-4 bottom-4 w-[3px] rounded-full transition-all duration-200 ${selectedIssueId === issue.id ? 'bg-[var(--accent)] opacity-100' : 'bg-[var(--accent)] opacity-0 group-hover:opacity-40'}`} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
