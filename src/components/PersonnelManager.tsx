import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { enrollPersonnelManually, approveApplication, revokeVolunteerAccess, rejectApplication } from '../services/userService';
import { VolunteerApplication, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Users2, Clock, CheckCircle2, XCircle, FileText, Activity, ShieldCheck, Mail, AlertCircle, Wrench, Plus, UserPlus, MapPin, Sparkles } from 'lucide-react';
import { subscribeToIssues } from '../services/issueService';
import { matchVolunteerToTask } from '../services/aiService';
import { Issue } from '../types';
export const PersonnelManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'applications' | 'specialists' | 'reporters'>('applications');
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [specialists, setSpecialists] = useState<UserProfile[]>([]);
  const [reporters, setReporters] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [unassignedIssues, setUnassignedIssues] = useState<Issue[]>([]);
  const [smartMatches, setSmartMatches] = useState<any[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<UserProfile | null>(null);


  useEffect(() => {
    // Listen for applications
    const qApp = query(collection(db, 'volunteer_applications'), where('status', '==', 'pending'));
    const unsubscribeApp = onSnapshot(qApp, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as VolunteerApplication));
      setApplications(apps);
      setLoading(false);
    }, (error) => {
      console.error('PersonnelManager Applications error:', error);
      setLoading(false);
    });

    // Listen for existing specialists (volunteers)
    const qSpec = query(collection(db, 'users'), where('role', '==', 'volunteer'));
    const unsubscribeSpec = onSnapshot(qSpec, (snapshot) => {
      const specs = snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
      setSpecialists(specs);
    }, (error) => {
      console.error('PersonnelManager Specialists error:', error);
    });

    // Listen for reporters (potential volunteers)
    const qRep = query(collection(db, 'users'), where('role', '==', 'reporter'));
    const unsubscribeRep = onSnapshot(qRep, (snapshot) => {
      const reps = snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
      setReporters(reps);
    }, (error) => {
      console.error('PersonnelManager Reporters error:', error);
    });

      unsubscribeRep();

      // NEW: Restore unassigned issues listener
      const unsubscribeIssues = subscribeToIssues((allIssues) => {
        const open = allIssues.filter(i => i.status === 'reported' || i.status === 'in-progress');
        setUnassignedIssues(open);
      });

      return () => {
        unsubscribeApp();
        unsubscribeSpec();
        unsubscribeRep();
        unsubscribeIssues();
      };

  }, []);

  // Run Smart Matching whenever a relevant state changes (with 800ms debounce)
  useEffect(() => {
    if (activeTab === 'specialists' && unassignedIssues.length > 0 && specialists.length > 0) {
      const runMatching = async () => {
        setIsMatching(true);
        // Match for the most urgent (first) unassigned issue
        const topIssue = unassignedIssues[0];
        const standbyVolunteers = specialists.filter(s => s.status === 'standby');
        
        if (standbyVolunteers.length > 0) {
          const results = await matchVolunteerToTask(topIssue, standbyVolunteers);
          setSmartMatches(results.matches || []);
        } else {
          setSmartMatches([]);
        }
        setIsMatching(false);
      };

      const timer = setTimeout(() => {
        runMatching();
      }, 800);

      return () => clearTimeout(timer);
    } else {
      setSmartMatches([]);
    }
  }, [activeTab, unassignedIssues.length, specialists.length]);


  const handleApprove = async (app: VolunteerApplication) => {
    try {
      await approveApplication(app);
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };


  const handleReject = async (appId: string) => {
    try {
      await rejectApplication(appId);
    } catch (err) {
      console.error('Rejection failed:', err);
    }
  };


  const handleDemote = async (userId: string) => {
    if (confirm('Revoke volunteer access for this personnel?')) {
      await revokeVolunteerAccess(userId);
    }
  };


  return (
    <div className="flex-1 bg-[var(--bg)] flex flex-col overflow-hidden">
      <div className="p-6 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Team Directory</h1>
            <p className="text-[var(--text-secondary)] text-xs font-semibold mt-1">Manage community volunteers</p>
          </div>
          <button 
            onClick={() => setShowManualAdd(true)}
            className="flex items-center gap-2 bg-[var(--text-primary)] px-4 py-2 rounded-xl text-[var(--text-inverse)] text-xs font-bold hover:opacity-90 transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Manually Add
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'applications' ? 'text-[var(--accent)] border-[var(--accent)]' : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
            }`}
          >
            <Clock className="w-4 h-4" />
            Applications
            {applications.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                {applications.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('specialists')}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'specialists' ? 'text-[var(--accent)] border-[var(--accent)]' : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Active Volunteers
            <span className="opacity-70 ml-1">({specialists.length})</span>
          </button>
          <button 
            onClick={() => setActiveTab('reporters')}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'reporters' ? 'text-[var(--accent)] border-[var(--accent)]' : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
            }`}
          >
            <Users2 className="w-4 h-4 opacity-70" />
            Community Members
            <span className="opacity-70 ml-1">({reporters.length})</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-[var(--bg)]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Activity className="w-8 h-8 text-[var(--accent)] animate-spin opacity-50" />
          </div>
        ) : activeTab === 'applications' ? (
          <div className="space-y-4 max-w-4xl">
            {applications.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-3xl">
                <FileText className="w-12 h-12 text-[var(--border)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)] text-sm font-medium">No pending applications right now.</p>
              </div>
            ) : (
              applications.map(app => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={app.id} 
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                             <div className="w-2 h-2 rounded-full bg-amber-500" />
                             <span className="text-xs font-bold text-amber-500">Under Review</span>
                          </div>
                          <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{app.name}</h3>
                          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm mt-1">
                            <Mail className="w-4 h-4" />
                            {app.email}
                          </div>
                        </div>
                        <div className="text-right">
                           <div className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase mb-1">Application ID</div>
                           <div className="text-[11px] font-mono text-[var(--text-secondary)] opacity-70">{app.id.slice(0, 12)}...</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl space-y-3">
                          <div className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-2">
                             <Activity className="w-4 h-4 text-indigo-500" />
                             Skills & Background
                          </div>
                          <p className="text-sm text-[var(--text-primary)] leading-relaxed">{app.bio}</p>
                          <div className="flex flex-wrap gap-2 pt-2">
                             {app.skills.map(skill => (
                               <span key={skill} className="px-3 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-xs font-semibold capitalize">
                                 {skill}
                               </span>
                             ))}
                          </div>
                        </div>

                        <div className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl space-y-3">
                           <div className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-2">
                             <MapPin className="w-4 h-4 text-emerald-500" />
                             Contact Info
                           </div>
                           <div className="space-y-2">
                             <div className="flex items-center gap-2">
                               <span className="text-xs text-[var(--text-secondary)] font-medium">Phone:</span>
                               <span className="text-xs text-[var(--text-primary)] font-medium">{app.phone}</span>
                             </div>
                             <div className="flex items-start gap-2">
                               <span className="text-xs text-[var(--text-secondary)] font-medium">Address:</span>
                               <span className="text-xs text-[var(--text-primary)] font-medium leading-tight">{app.address}</span>
                             </div>
                             <div className="flex items-center gap-2">
                               <span className="text-xs text-[var(--text-secondary)] font-medium">Availability:</span>
                               <span className={`text-xs font-semibold capitalize ${app.availability === 'immediate' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                 {app.availability}
                               </span>
                             </div>
                           </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium">
                            <ShieldCheck className="w-4 h-4 opacity-70" />
                            ID: <span className="font-semibold">{app.idProofText}</span>
                          </div>
                          {app.emergencyContact && (
                            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium">
                              <AlertCircle className="w-4 h-4 text-rose-500 opacity-80" />
                              Emergency: <span className="font-semibold">{app.emergencyContact}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs font-medium text-[var(--text-secondary)] opacity-80">
                          {new Date(app.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>


                    <div className="lg:w-40 flex lg:flex-col gap-3 shrink-0">
                      <button 
                        onClick={() => handleApprove(app)}
                        className="flex-1 bg-[var(--accent)] hover:opacity-90 text-[var(--text-inverse)] p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all shadow-md group"
                      >
                        <CheckCircle2 className="w-6 h-6" />
                        <span className="text-xs font-bold">Approve</span>
                      </button>
                      <button 
                        onClick={() => handleReject(app.id)}
                        className="lg:flex-1 bg-[var(--bg)] border border-[var(--border)] hover:bg-[var(--hover)] hover:text-rose-500 text-[var(--text-secondary)] p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all shadow-sm"
                      >
                        <XCircle className="w-6 h-6" />
                        <span className="text-xs font-bold">Reject</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : activeTab === 'specialists' ? (
          <div className="space-y-8">
            {/* General Specialist Pool */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-[var(--text-secondary)] px-1">All Volunteers</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {specialists.map(spec => {
                  const match = smartMatches.find(m => m.userId === spec.uid);
                  const isTopMatch = match && match.score >= 0.8;

                  return (
                    <motion.div 
                      layoutId={spec.uid}
                      key={spec.uid} 
                      onClick={() => setSelectedPersonnel(spec)}
                      className={`bg-[var(--surface)] border ${isTopMatch ? 'border-amber-500/30 bg-amber-500/5' : 'border-[var(--border)]'} rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:border-[var(--accent)]`}
                    >
                      {isTopMatch && (
                        <div className="absolute top-0 right-0 pt-2 pr-3">
                           <div className="flex items-center gap-1 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">
                             Smart Match
                           </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 ${isTopMatch ? 'bg-amber-500/20' : 'bg-[var(--bg)]'} border border-[var(--border)] rounded-2xl flex items-center justify-center`}>
                               {isTopMatch ? <Sparkles className="w-5 h-5 text-amber-500" /> : <Activity className="w-5 h-5 text-[var(--accent)]" />}
                             </div>
                             <div>
                               <h3 className="font-bold text-[var(--text-primary)] tracking-tight">{spec.name}</h3>
                               <p className="text-xs font-medium text-[var(--text-secondary)] truncate max-w-[120px]">{spec.email}</p>
                             </div>
                          </div>
                          {!isTopMatch && (
                            <div className={`px-2.5 py-1 rounded-xl text-[10px] font-bold capitalize tracking-wide ${
                              spec.status === 'standby' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                            }`}>
                              {spec.status}
                            </div>
                          )}
                        </div>

                        {match && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight">
                                  <Clock className="w-3 h-3" />
                                  {match.estimatedDeploymentTime} ETA
                               </div>
                               <div className="text-[14px] font-black text-amber-600 dark:text-amber-400">
                                  {(match.score * 100).toFixed(0)}%
                               </div>
                            </div>
                            <p className="text-[11px] text-[var(--text-primary)] font-medium leading-snug italic opacity-80">
                               "{match.reasoning}"
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5">
                          {spec.skills?.map(skill => (
                            <span key={skill} className="px-2 py-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-secondary)] font-semibold capitalize">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-5 mt-5 border-t border-[var(--border)]">
                        <button 
                          onClick={() => handleDemote(spec.uid)}
                          className="w-full text-center text-[11px] font-bold text-[var(--text-secondary)] hover:text-rose-500 transition-colors uppercase tracking-widest"
                        >
                          Revoke Access
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {reporters.map(rep => (
              <motion.div 
                layoutId={rep.uid}
                key={rep.uid} 
                onClick={() => setSelectedPersonnel(rep)}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer hover:border-[var(--accent)]"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-[var(--bg)] border border-[var(--border)] rounded-2xl flex items-center justify-center">
                         <Users2 className="w-5 h-5 text-[var(--text-secondary)]" />
                       </div>
                       <div>
                         <h3 className="font-bold text-[var(--text-primary)] tracking-tight">{rep.name}</h3>
                         <p className="text-xs font-medium text-[var(--text-secondary)] truncate max-w-[120px]">{rep.email}</p>
                       </div>
                    </div>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                    Registered as a community member. Not currently authorized as a field volunteer.
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-[var(--border)]">
                  <button 
                    onClick={async () => {
                      if (confirm(`Promote ${rep.name} to Volunteer status?`)) {
                        await enrollPersonnelManually(rep.uid);
                      }
                    }}
                    className="w-full text-center text-xs font-bold text-[var(--text-primary)] hover:opacity-80 transition-opacity shadow-sm bg-[var(--hover)] py-2.5 rounded-[12px]"
                  >
                    Promote to Volunteer
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Add Modal */}
      <AnimatePresence>
        {showManualAdd && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowManualAdd(false)}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-[32px] shadow-lg p-8 space-y-6"
             >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <UserPlus className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Add Volunteer Manually</h2>
                  <p className="text-[var(--text-secondary)] text-sm font-medium">As an admin, you can grant direct access to a trusted community member.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium">To securely add a volunteer, they must first sign into Sahaya to establish an internal ID. Drop their ID below to promote them.</p>
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const uid = formData.get('uid') as string;
                      if (!uid) return;
                      const res = await enrollPersonnelManually(uid);
                      if (res.success) {
                        setShowManualAdd(false);
                      }
                      alert(res.message);
                    }}
                    className="space-y-4"
                  >
                    <input 
                      name="uid"
                      required
                      placeholder="Paste User ID here..."
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-[16px] p-4 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all shadow-sm"
                    />
                    <div className="flex gap-3 pt-2">
                       <button 
                        type="button"
                        onClick={() => setShowManualAdd(false)}
                        className="flex-[1] py-4 bg-[var(--bg)] border border-[var(--border)] hover:bg-[var(--hover)] rounded-2xl text-xs font-bold text-[var(--text-secondary)] transition-all"
                       >
                         Cancel
                       </button>
                       <button 
                        type="submit"
                        className="flex-[2] py-4 bg-[var(--text-primary)] text-[var(--text-inverse)] rounded-2xl text-xs font-bold hover:opacity-90 transition-all shadow-md"
                       >
                         Add Volunteer
                       </button>
                    </div>
                  </form>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    <AnimatePresence>
        {selectedPersonnel && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedPersonnel(null)}
               className="absolute inset-0 bg-black/60 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-2xl bg-[var(--bg)] border border-[var(--border)] rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
             >
                {/* Modal Header */}
                <div className="p-8 border-b border-[var(--border)] bg-[var(--surface)] relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-6">
                      <button 
                        onClick={() => setSelectedPersonnel(null)}
                        className="w-10 h-10 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                      >
                         <Users2 className="w-5 h-5" />
                      </button>
                   </div>
                   
                   <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-[var(--accent)]/10 border-2 border-[var(--accent)]/20 rounded-3xl flex items-center justify-center text-3xl font-bold text-[var(--accent)]">
                        {selectedPersonnel.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                           <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{selectedPersonnel.name}</h2>
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                             selectedPersonnel.role === 'volunteer' ? 'bg-emerald-50 text-emerald-600 border-emerald-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-500/20'
                           }`}>
                             {selectedPersonnel.role}
                           </span>
                        </div>
                        <p className="text-[var(--text-secondary)] font-medium flex items-center gap-2">
                           <Mail className="w-4 h-4 opacity-60" />
                           {selectedPersonnel.email}
                        </p>
                      </div>
                   </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                   {/* Strategic Bio */}
                   <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                         <FileText className="w-4 h-4 text-indigo-500" />
                         Background Intelligence
                      </h4>
                      <p className="text-base text-[var(--text-primary)] leading-relaxed font-normal bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] italic shadow-inner">
                         "{selectedPersonnel.bio || 'This personnel was added manually. Complete bio trace not available.'}"
                      </p>
                   </div>

                   {/* Skills & Capability */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                           <ShieldCheck className="w-4 h-4 text-emerald-500" />
                           Verified Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                           {selectedPersonnel.skills?.length ? selectedPersonnel.skills.map(skill => (
                             <span key={skill} className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-primary)] capitalize shadow-sm">
                               {skill}
                             </span>
                           )) : (
                             <span className="text-xs text-[var(--text-secondary)] font-medium italic">No specific skills tagged.</span>
                           )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                           <Activity className="w-4 h-4 text-rose-500" />
                           Current Operational Status
                        </h4>
                        <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl space-y-3">
                           <div className="flex items-center justify-between">
                              <span className="text-xs text-[var(--text-secondary)] font-semibold">Active Status</span>
                              <span className={`text-xs font-black uppercase ${selectedPersonnel.status === 'standby' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                 {selectedPersonnel.status || 'Offline'}
                              </span>
                           </div>
                           <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                              <span className="text-xs text-[var(--text-secondary)] font-semibold">Live Coordinates</span>
                              <span className="text-[10px] font-mono font-bold text-[var(--text-primary)]">
                                 {selectedPersonnel.coordinates ? `${selectedPersonnel.coordinates.lat.toFixed(4)}, ${selectedPersonnel.coordinates.lng.toFixed(4)}` : 'UNKNOWN'}
                              </span>
                           </div>
                        </div>
                      </div>
                   </div>

                   {/* Contact & Location */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                           <Mail className="w-4 h-4 text-sky-500" />
                           Communication Channels
                        </h4>
                        <div className="space-y-3">
                           <div className="flex items-center justify-between p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm">
                              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Phone Trace</span>
                              <span className="text-xs font-bold text-[var(--text-primary)]">{selectedPersonnel.phone || 'NO RECORD'}</span>
                           </div>
                           <div className="flex items-center justify-between p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm">
                              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Availability</span>
                              <span className="text-xs font-bold text-emerald-500 uppercase">{selectedPersonnel.availability || 'Standard'}</span>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                           <MapPin className="w-4 h-4 text-emerald-500" />
                           Deployment Origin
                        </h4>
                        <div className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
                           <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed">
                              {selectedPersonnel.address || 'Address encryption enabled. General area verified.'}
                           </p>
                        </div>
                      </div>
                   </div>
                </div>

                {/* Modal Actions */}
                <div className="p-8 bg-[var(--surface)] border-t border-[var(--border)] flex gap-4">
                   <button 
                     onClick={() => setSelectedPersonnel(null)}
                     className="flex-1 py-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                   >
                     Close Intelligence Brief
                   </button>
                   {selectedPersonnel.role === 'volunteer' ? (
                     <button 
                       onClick={() => {
                          handleDemote(selectedPersonnel.uid);
                          setSelectedPersonnel(null);
                       }}
                       className="flex-1 py-4 bg-rose-500 text-white rounded-2xl text-xs font-bold hover:bg-rose-600 transition-all shadow-lg"
                     >
                       Revoke Command Access
                     </button>
                   ) : (
                     <button 
                       onClick={async () => {
                          await enrollPersonnelManually(selectedPersonnel.uid);
                          setSelectedPersonnel(null);
                       }}
                       className="flex-1 py-4 bg-[var(--accent)] text-white rounded-2xl text-xs font-bold hover:opacity-90 transition-all shadow-lg"
                     >
                       Promote to Volunteer
                     </button>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
