import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToIssues } from '../services/issueService';
import { Issue } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Clock, MapPin, AlertCircle, ChevronRight, Activity } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const VolunteerView: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Issue | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToIssues((allIssues) => {
      // For this unified flow, volunteers see tasks assigned to them 
      // or open tasks they can pick up (for the demo, we show tasks assigned to UID)
      const myTasks = allIssues.filter(issue => issue.assignedTo === user.uid || issue.status === 'reported');
      setTasks(myTasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpdateStatus = async (issueId: string, newStatus: Issue['status']) => {
    if (!user) return;
    try {
      // Update issue document
      const docRef = doc(db, 'issues', issueId);
      await updateDoc(docRef, { status: newStatus });
      
      // Update or clear volunteer status based on task state
      const userRef = doc(db, 'users', user.uid);
      if (newStatus === 'resolved') {
        await updateDoc(userRef, { 
          status: 'standby',
          activeTaskId: null 
        });
      } else if (newStatus === 'in-progress') {
        await updateDoc(userRef, { 
          status: 'active' 
        });
      }

      if (selectedTask?.id === issueId) {
        setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <Activity className="w-8 h-8 text-amber-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-white/5 shrink-0">
        <h1 className="text-2xl font-bold text-white tracking-tight">Mission Briefing</h1>
        <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mt-1">Active Ground Operations</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 custom-scrollbar">
        {tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
              <CheckCircle className="w-8 h-8 text-slate-700" />
            </div>
            <p className="text-slate-500 text-sm italic">All objectives completed. Standby for new signals.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <motion.div
              layoutId={task.id}
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                selectedTask?.id === task.id 
                  ? 'bg-white/10 border-amber-500/50' 
                  : 'bg-slate-900/40 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      task.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-500' :
                      task.priority === 'MED' ? 'bg-amber-500/20 text-amber-500' :
                      'bg-emerald-500/20 text-emerald-500'
                    }`}>
                      {task.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded bg-white/5 text-slate-400 text-[8px] font-bold uppercase tracking-wider`}>
                      {task.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight">{task.title}</h3>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {task.location}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {task.eta}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-x-0 bottom-0 z-50 bg-slate-900 border-t border-white/10 rounded-t-[2.5rem] shadow-2xl p-8 pb-12 max-h-[80vh] overflow-y-auto lg:max-w-xl lg:mx-auto"
          >
            <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-8" onClick={() => setSelectedTask(null)} />
            
            <div className="space-y-6">
              <header className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em]">{selectedTask.category}</span>
                  <span className="text-slate-500 text-[10px] font-mono">{selectedTask.id}</span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{selectedTask.title}</h2>
                <div className="flex items-center gap-3 text-slate-400 text-sm">
                  <MapPin className="w-4 h-4" />
                  {selectedTask.location}
                </div>
              </header>

              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                  <span>Command Intelligence</span>
                  <span className="font-mono text-[7px] opacity-40">Ver 3.0</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed italic">"{selectedTask.aiRecommendation}"</p>
              </div>

              {selectedTask.sourceDescriptions && selectedTask.sourceDescriptions.length > 0 && (
                <div className="space-y-3">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ground Intelligence (Combined)</div>
                  <div className="space-y-2">
                     {selectedTask.sourceDescriptions.map((desc, i) => (
                       <div key={i} className="p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                          <p className="text-[11px] text-slate-400 leading-relaxed italic">"{desc}"</p>
                       </div>
                     ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Update Operational Status</div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleUpdateStatus(selectedTask.id, 'in-progress')}
                    className={`py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                      selectedTask.status === 'in-progress' 
                        ? 'bg-amber-500 text-slate-950 px-4' 
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    Set In Progress
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedTask.id, 'resolved')}
                    className={`py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                      selectedTask.status === 'resolved' 
                        ? 'bg-emerald-500 text-slate-950 px-4' 
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setSelectedTask(null)}
                className="w-full py-4 text-slate-500 text-[11px] font-bold uppercase tracking-widest hover:text-white transition-colors"
              >
                Continue Operations
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
