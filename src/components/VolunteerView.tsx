import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToIssues } from '../services/issueService';
import { Issue } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, Clock, MapPin, AlertCircle, ChevronRight, 
  Activity, Users, Zap, Shield, Radar, Target
} from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const VolunteerView: React.FC = () => {
  const { user, profile } = useAuth();
  const [allTasks, setAllTasks] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Issue | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToIssues((allIssues) => {
      setAllTasks(allIssues);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Filter tasks
  const activeMission = allTasks.find(t => t.assignedTo === user?.uid && t.status === 'in-progress');
  const assignedTasks = allTasks.filter(t => t.assignedTo === user?.uid && t.status !== 'in-progress' && t.status !== 'resolved');
  const availableSignals = allTasks.filter(t => !t.assignedTo && t.status === 'reported');

  const handleUpdateStatus = async (issueId: string, newStatus: Issue['status']) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'issues', issueId);
      const updateData: any = { status: newStatus };
      
      // If accepting a task, assign it exclusively to this user
      if (newStatus === 'in-progress') {
        updateData.assignedTo = user.uid;
      }
      
      await updateDoc(docRef, updateData);
      
      // Update user status
      const userRef = doc(db, 'users', user.uid);
      if (newStatus === 'resolved') {
        await updateDoc(userRef, { 
          status: 'standby',
          activeTaskId: null 
        });
      } else if (newStatus === 'in-progress') {
        await updateDoc(userRef, { 
          status: 'active',
          activeTaskId: issueId
        });
      }

      if (selectedTask?.id === issueId) {
        setSelectedTask(prev => prev ? { ...prev, status: newStatus, assignedTo: updateData.assignedTo || prev.assignedTo } : null);
      }
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050B14]">
        <Activity className="w-8 h-8 text-[#0a84ff] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#050B14] flex flex-col overflow-hidden relative">
      {/* Background HUD elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0a84ff]/10 blur-[120px] rounded-full" />
      </div>

      {/* OPERATOR HEADER */}
      <header className="p-6 border-b border-white/5 shrink-0 relative z-10 flex items-center justify-between bg-[#050B14]/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
             <Shield className="w-6 h-6 text-[#0a84ff]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Operator: {profile?.name || user?.displayName?.split(' ')[0] || 'Unknown'}</h1>
            <div className="flex items-center gap-2 mt-0.5">
               <div className={`w-1.5 h-1.5 rounded-full ${activeMission ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                 {activeMission ? 'Mission Active' : 'Standby Mode'}
               </span>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
           <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 text-[10px] font-bold text-white/50 uppercase">
             ID: {user?.uid.slice(0, 8)}
           </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-8 custom-scrollbar relative z-10">
        
        {/* ACTIVE MISSION SECTION */}
        {activeMission && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Target className="w-2.5 h-2.5 text-emerald-500" />
              </div>
              <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Primary Objective</h2>
            </div>
            
            <motion.div 
              layoutId={activeMission.id}
              className="p-6 rounded-[2.5rem] bg-gradient-to-br from-[#0a84ff]/20 to-transparent border border-[#0a84ff]/30 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#0a84ff]/10 blur-[40px] rounded-full" />
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-1">
                   <span className="px-2 py-0.5 rounded bg-[#0a84ff]/20 text-[#0a84ff] text-[8px] font-black uppercase tracking-widest border border-[#0a84ff]/20">
                     Active Deployment
                   </span>
                   <h3 className="text-2xl font-black text-white tracking-tight leading-tight">{activeMission.title}</h3>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                   <Activity className="w-5 h-5 text-white animate-pulse" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                       <MapPin className="w-3 h-3 text-white/40" />
                       <span className="text-[9px] font-bold text-white/40 uppercase">Location</span>
                    </div>
                    <p className="text-sm font-bold text-white">{activeMission.location}</p>
                 </div>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                       <Clock className="w-3 h-3 text-white/40" />
                       <span className="text-[9px] font-bold text-white/40 uppercase">ETA Requirement</span>
                    </div>
                    <p className="text-sm font-bold text-white">{activeMission.eta}</p>
                 </div>
              </div>

              <div className="p-5 bg-black/40 rounded-3xl border border-white/5 mb-8">
                 <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Tactical Briefing</span>
                 </div>
                 <p className="text-xs text-white/70 leading-relaxed italic">
                   "{activeMission.aiRecommendation}"
                 </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                 <button 
                   onClick={() => handleUpdateStatus(activeMission.id, 'resolved')}
                   className="w-full py-4 bg-white text-slate-950 font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                 >
                   Mark Objective Complete
                 </button>
              </div>
            </motion.div>
          </section>
        )}

        {/* ASSIGNED TASKS (NOT STARTED) */}
        {assignedTasks.length > 0 && (
          <section className="space-y-4">
             <div className="flex items-center gap-2 px-1">
              <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Radar className="w-2.5 h-2.5 text-amber-500" />
              </div>
              <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Pending Missions</h2>
            </div>
            <div className="grid gap-3">
              {assignedTasks.map(task => (
                <div key={task.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-colors flex items-center justify-between group">
                   <div>
                      <h4 className="text-sm font-bold text-white mb-1">{task.title}</h4>
                      <div className="flex items-center gap-3 text-[10px] text-white/40">
                         <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {task.location}</span>
                         <span className="flex items-center gap-1 uppercase tracking-widest font-black text-amber-500">{task.priority}</span>
                      </div>
                   </div>
                   <button 
                     onClick={() => handleUpdateStatus(task.id, 'in-progress')}
                     className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest transition-all"
                   >
                     Initiate
                   </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AVAILABLE SIGNALS AREA */}
        <section className="space-y-4">
           <div className="flex items-center gap-2 px-1">
            <div className="w-4 h-4 rounded-full bg-[#0a84ff]/20 flex items-center justify-center">
              <Activity className="w-2.5 h-2.5 text-[#0a84ff]" />
            </div>
            <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Incoming Signals</h2>
          </div>

          <div className="space-y-3">
            {availableSignals.length === 0 ? (
               <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                  <CheckCircle className="w-8 h-8 text-white/10 mx-auto mb-4" />
                  <p className="text-xs font-bold text-white/20 uppercase tracking-widest">Scanning local frequencies...</p>
               </div>
            ) : (
              availableSignals.map((task) => (
                <motion.div
                  layoutId={task.id}
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-[#0a84ff]/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                          task.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-500' :
                          task.priority === 'MED' ? 'bg-amber-500/20 text-amber-500' :
                          'bg-[#0a84ff]/20 text-[#0a84ff]'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-white/30 text-[8px] font-black uppercase tracking-widest">
                          Unassigned
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white tracking-tight">{task.title}</h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      {task.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {task.eta}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* DETAIL MODAL (OVERLAY) */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setSelectedTask(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-[#0a0f1a] border border-white/10 rounded-[3rem] shadow-2xl p-8 relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-64 h-32 bg-[#0a84ff]/10 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="space-y-6 relative z-10">
                <header className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#0a84ff] uppercase tracking-widest">{selectedTask.category}</span>
                    <span className="text-white/20 text-[10px] font-mono">{selectedTask.id}</span>
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tighter leading-tight">{selectedTask.title}</h2>
                  <div className="flex items-center gap-3 text-white/50 text-sm font-medium">
                    <MapPin className="w-4 h-4" />
                    {selectedTask.location}
                  </div>
                </header>

                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                   <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                         <Zap className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Ground Intelligence Brief</span>
                   </div>
                   <p className="text-sm text-white/80 leading-relaxed italic font-medium">
                     "{selectedTask.aiRecommendation}"
                   </p>
                </div>

                {selectedTask.sourceDescriptions && (
                   <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-white/20 uppercase tracking-widest px-1">Raw Feed Metadata</h4>
                      <div className="max-h-32 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                         {selectedTask.sourceDescriptions.map((desc, i) => (
                           <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-xl text-[11px] text-white/60 font-medium italic">
                             "{desc}"
                           </div>
                         ))}
                      </div>
                   </div>
                )}

                <div className="pt-4 grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      handleUpdateStatus(selectedTask.id, 'in-progress');
                      setSelectedTask(null);
                    }}
                    className="py-4 bg-white text-slate-950 font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] transition-transform"
                  >
                    Accept Mission
                  </button>
                  <button 
                    onClick={() => setSelectedTask(null)}
                    className="py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
