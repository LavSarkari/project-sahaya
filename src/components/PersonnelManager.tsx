import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { VolunteerApplication, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Users2, Clock, CheckCircle2, XCircle, FileText, Activity, ShieldCheck, Mail, AlertCircle, Wrench, Plus, UserPlus } from 'lucide-react';

export const PersonnelManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'applications' | 'specialists' | 'reporters'>('applications');
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [specialists, setSpecialists] = useState<UserProfile[]>([]);
  const [reporters, setReporters] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManualAdd, setShowManualAdd] = useState(false);

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

    return () => {
      unsubscribeApp();
      unsubscribeSpec();
      unsubscribeRep();
    };
  }, []);

  const handleApprove = async (app: VolunteerApplication) => {
    try {
      // 1. Update user role
      const userRef = doc(db, 'users', app.id);
      await updateDoc(userRef, {
        role: 'volunteer',
        skills: app.skills,
        bio: app.bio,
        applicationStatus: 'approved'
      });

      // 2. Delete application
      await deleteDoc(doc(db, 'volunteer_applications', app.id));
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleReject = async (appId: string) => {
    try {
      await updateDoc(doc(db, 'users', appId), { applicationStatus: 'rejected' });
      await deleteDoc(doc(db, 'volunteer_applications', appId));
    } catch (err) {
      console.error('Rejection failed:', err);
    }
  };

  const handleDemote = async (userId: string) => {
    if (confirm('Revoke volunteer access for this personnel?')) {
      await updateDoc(doc(db, 'users', userId), { role: 'reporter', applicationStatus: 'none' });
    }
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-white/5 bg-slate-900/40 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Personnel Coordination</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Humanitarian Asset Lifecycle Management</p>
          </div>
          <button 
            onClick={() => setShowManualAdd(true)}
            className="flex items-center gap-2 bg-emerald-500 px-4 py-2 rounded-xl text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10"
          >
            <UserPlus className="w-4 h-4" />
            Manual Enrollment
          </button>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
              activeTab === 'applications' ? 'text-emerald-500 border-emerald-500' : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            Vetting Queue
            {applications.length > 0 && (
              <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full ml-1">
                {applications.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('specialists')}
            className={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
              activeTab === 'specialists' ? 'text-emerald-500 border-emerald-500' : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Active Specialists
            <span className="text-slate-600 ml-1">({specialists.length})</span>
          </button>
          <button 
            onClick={() => setActiveTab('reporters')}
            className={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
              activeTab === 'reporters' ? 'text-emerald-500 border-emerald-500' : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 opacity-50" />
            Reporter Registry
            <span className="text-slate-600 ml-1">({reporters.length})</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-950/20">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Activity className="w-8 h-8 text-emerald-500 animate-pulse" />
          </div>
        ) : activeTab === 'applications' ? (
          <div className="space-y-4 max-w-4xl">
            {applications.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                <FileText className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                <p className="text-slate-500 text-sm font-medium italic">Vetting queue is empty. Standby for new transmissions.</p>
              </div>
            ) : (
              applications.map(app => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={app.id} 
                  className="bg-slate-900/60 border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all group"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                             <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Pending Vetting</span>
                          </div>
                          <h3 className="text-xl font-bold text-white tracking-tight">{app.name}</h3>
                          <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                            <Mail className="w-3.5 h-3.5" />
                            {app.email}
                          </div>
                        </div>
                        <div className="text-right">
                           <div className="text-[9px] font-mono text-slate-600 uppercase mb-1">Application ID</div>
                           <div className="text-[10px] font-mono text-slate-500">{app.id.slice(0, 12)}...</div>
                        </div>
                      </div>

                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                         <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                           <Activity className="w-3 h-3 text-indigo-400" />
                           Personnel Credentials
                         </div>
                         <p className="text-xs text-slate-300 leading-relaxed italic">"{app.bio}"</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                         {app.skills.map(skill => (
                           <span key={skill} className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[10px] text-indigo-400 font-bold uppercase tracking-tight">
                             {skill}
                           </span>
                         ))}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-600 font-medium pt-2">
                         <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                         ID Proof Verified: <span className="text-slate-400 font-mono italic">{app.idProofText}</span>
                      </div>
                    </div>

                    <div className="lg:w-48 flex lg:flex-col gap-2 shrink-0">
                      <button 
                        onClick={() => handleApprove(app)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-4 lg:p-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/5 group"
                      >
                        <CheckCircle2 className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Approve Access</span>
                      </button>
                      <button 
                        onClick={() => handleReject(app.id)}
                        className="lg:flex-1 bg-white/5 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/20 text-slate-500 hover:text-rose-500 p-4 lg:p-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all"
                      >
                        <XCircle className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Reject</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : activeTab === 'specialists' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {specialists.map(spec => (
              <motion.div 
                layoutId={spec.uid}
                key={spec.uid} 
                className="bg-slate-900/60 border border-white/5 rounded-3xl p-5 hover:border-white/10 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                         <Activity className="w-5 h-5 text-indigo-400" />
                       </div>
                       <div>
                         <h3 className="font-bold text-white tracking-tight">{spec.name}</h3>
                         <p className="text-[10px] font-mono text-slate-600 truncate max-w-[120px]">{spec.email}</p>
                       </div>
                    </div>
                    <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-bold text-emerald-500 uppercase tracking-widest">
                      Active Asset
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {spec.skills?.map(skill => (
                      <span key={skill} className="px-1.5 py-0.5 bg-white/5 rounded text-[8px] text-slate-400 font-bold uppercase tracking-tight">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5">
                  <button 
                    onClick={() => handleDemote(spec.uid)}
                    className="w-full text-center text-[10px] font-bold text-slate-600 hover:text-rose-500 transition-colors uppercase tracking-widest"
                  >
                    Demote to Reporter
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {reporters.map(rep => (
              <motion.div 
                layoutId={rep.uid}
                key={rep.uid} 
                className="bg-slate-900/60 border border-white/5 rounded-3xl p-5 hover:border-white/10 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center">
                         <Users2 className="w-5 h-5 text-slate-500" />
                       </div>
                       <div>
                         <h3 className="font-bold text-white tracking-tight">{rep.name}</h3>
                         <p className="text-[10px] font-mono text-slate-600 truncate max-w-[120px]">{rep.email}</p>
                       </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 leading-normal">
                    Signed in as Reporter. No specialized credentials registered.
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5">
                  <button 
                    onClick={async () => {
                      if (confirm(`Directly promote ${rep.name} to Volunteer?`)) {
                        await updateDoc(doc(db, 'users', rep.uid), { role: 'volunteer' });
                      }
                    }}
                    className="w-full text-center text-[10px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest"
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
               className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-3xl p-8 space-y-6"
             >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Direct Asset Enrollment</h2>
                  <p className="text-slate-500 text-xs">Administrators can manually authorize personnel by entering their unique identity UID.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-[10px] text-amber-200 leading-normal font-medium">To manually enroll, the user must first sign in as a Reporter to establish their system ID (UID). Enter that UID here to upgrade their clearance.</p>
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const uid = formData.get('uid') as string;
                      if (!uid) return;
                      try {
                        await updateDoc(doc(db, 'users', uid), { role: 'volunteer' });
                        setShowManualAdd(false);
                        alert('Personnel clearance upgraded successfully.');
                      } catch (err) {
                        alert('Verification failed. System ID not found.');
                      }
                    }}
                    className="space-y-4"
                  >
                    <input 
                      name="uid"
                      required
                      placeholder="Enter Personnel System ID (UID)..."
                      className="w-full bg-slate-950 border border-white/5 rounded-xl p-4 text-xs font-mono text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/30 transition-all"
                    />
                    <div className="flex gap-3">
                       <button 
                        type="button"
                        onClick={() => setShowManualAdd(false)}
                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-400 uppercase tracking-widest transition-all"
                       >
                         Abort
                       </button>
                       <button 
                        type="submit"
                        className="flex-[2] py-4 bg-emerald-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                       >
                         Enroll Personnel
                       </button>
                    </div>
                  </form>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
