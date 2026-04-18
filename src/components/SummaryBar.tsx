import React, { useState, useEffect } from 'react';
import { Issue } from '../types';
import { generateSummary } from '../lib/ai';
import { Brain, Activity, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SummaryBarProps {
  issues: Issue[];
}

export const SummaryBar: React.FC<SummaryBarProps> = ({ issues }) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      const result = await generateSummary(issues);
      setSummary(result);
      setLoading(false);
    };

    if (issues.length > 0) {
      fetchSummary();
    }
  }, [issues]);

  return (
    <div className="bg-emerald-500/[0.03] border-b border-white/5 px-4 lg:px-6 py-1.5 flex items-center justify-between relative overflow-hidden shrink-0">
      <div className="flex items-center gap-4 relative z-10 w-full overflow-hidden">
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center justify-center w-6 h-6 bg-emerald-500/10 rounded-sm border border-emerald-500/20">
            {loading ? (
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
            ) : (
              <Radio className="w-3 h-3 text-emerald-500" />
            )}
          </div>
          <div className="hidden sm:block">
            <div className="text-[7.5px] font-bold text-slate-600 uppercase tracking-[0.2em] leading-none mb-0.5">Status Report</div>
            <div className="text-[9px] font-mono text-emerald-500/60 uppercase leading-none">Alpha-7</div>
          </div>
        </div>

        <div className="h-4 w-px bg-white/5 mx-2 shrink-0 hidden sm:block" />

        <div className="flex-1 min-w-0 flex items-center gap-3">
          <Brain className="w-3.5 h-3.5 text-slate-700 shrink-0" />
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-4 w-full"
              >
                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden max-w-md">
                   <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="h-full w-1/3 bg-emerald-500/20"
                   />
                </div>
                <span className="text-[9px] text-slate-600 font-mono animate-pulse uppercase tracking-widest">Scanning Log...</span>
              </motion.div>
            ) : (
              <motion.p 
                key="summary"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[11px] text-slate-300 font-sans font-medium leading-relaxed truncate lg:whitespace-normal max-w-5xl tracking-tight"
              >
                {summary}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        
        {!loading && (
          <div className="shrink-0 flex items-center gap-2 text-[8px] font-bold text-emerald-500 uppercase tracking-[0.25em] hidden md:flex border border-emerald-500/10 px-2 py-1 rounded-sm bg-emerald-500/5">
            Decrypted
          </div>
        )}
      </div>

      {/* Hardware scanline effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
    </div>
  );
};
