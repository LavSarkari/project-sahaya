import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Send, ShieldAlert, LogIn, Activity, FileText, CheckCircle2, AlertCircle, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { VolunteerApplication } from '../types';

export const LoginPage: React.FC = () => {
  const { login, user, profile } = useAuth();
  const [view, setView] = useState<'welcome' | 'apply'>('welcome');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applied, setApplied] = useState(false);

  // Application form state
  const [appData, setAppData] = useState({
    bio: '',
    idProofText: '',
    selectedSkills: [] as string[]
  });

  const ALL_SKILLS = ['medical', 'logistics', 'search and rescue', 'communications', 'food distribution'];

  const toggleSkill = (skill: string) => {
    setAppData(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skill) 
        ? prev.selectedSkills.filter(s => s !== skill) 
        : [...prev.selectedSkills, skill]
    }));
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    await login();
    setIsLoggingIn(false);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      await handleLogin();
      return;
    }

    setIsSubmitting(true);
    try {
      const application: VolunteerApplication = {
        id: user.uid,
        name: user.displayName || 'Anonymous Applicant',
        email: user.email || '',
        skills: appData.selectedSkills,
        bio: appData.bio,
        idProofText: appData.idProofText,
        status: 'pending',
        timestamp: new Date().toISOString()
      };

      await setDoc(doc(db, 'volunteer_applications', user.uid), application);
      await updateDoc(doc(db, 'users', user.uid), { applicationStatus: 'pending' });
      setApplied(true);
    } catch (err) {
      console.error('Application error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profile?.applicationStatus === 'pending' || applied) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-slate-900 border border-white/5 rounded-[40px] p-12 text-center space-y-8 shadow-3xl"
        >
          <div className="w-24 h-24 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto relative">
            <Activity className="w-10 h-10 text-amber-500" />
            <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-ping" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white tracking-tighter">Vetting in Progress</h2>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">Your credentials have been securely transmitted to the Sahaya Command Vetting office. You will be notified once authorization is granted.</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-white/5 hover:bg-white/10 text-white py-5 rounded-2xl font-bold transition-all text-[11px] uppercase tracking-widest border border-white/5"
          >
            Continue as Registered Guest
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col lg:flex-row text-slate-200 overflow-y-auto">
      {/* Visual Left Side (Desktop Only) */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.1)_0%,transparent_50%)]" />
        <div className="grid-pattern opacity-10 absolute inset-0" />
        
        <div className="relative z-10 p-20 max-w-xl">
           <motion.div
             initial={{ opacity: 0, x: -50 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.8 }}
           >
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-10 shadow-2xl">
                <Send className="w-8 h-8 text-slate-950 fill-current" />
              </div>
              <h1 className="text-7xl font-black text-white leading-[0.9] tracking-tighter mb-8 italic-small">
                AUTHORIZE <br /> ACCESS.
              </h1>
              <p className="text-xl text-slate-500 font-medium leading-relaxed">
                Enter the Sahaya Command node to track signals, coordinate relief, or volunteer for active ground operations.
              </p>
           </motion.div>
        </div>
        
        <div className="absolute bottom-10 left-10 flex gap-4">
           {['AES-256', 'SSL-ENCRYPTED', 'SIGNAL-PROTECT'].map(label => (
             <span key={label} className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-3 py-1 border border-white/5 rounded-full">{label}</span>
           ))}
        </div>
      </div>

      {/* Interaction Right Side */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-slate-950 border-l border-white/5 relative">
        <div className="absolute top-8 right-8 lg:hidden">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
            <Send className="w-6 h-6 text-slate-950" />
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-12 relative z-10"
        >
          <AnimatePresence mode="wait">
            {view === 'welcome' ? (
              <motion.div 
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Select Protocol</h2>
                  <p className="text-slate-500 text-sm font-medium">Choose your operational level to continue.</p>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className="w-full group relative flex items-center justify-between bg-white text-slate-950 p-7 rounded-[24px] font-bold transition-all hover:bg-slate-100 active:scale-[0.98] shadow-2xl"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center">
                        <ShieldAlert className="w-6 h-6 text-rose-500" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-black uppercase tracking-tight">Signal Reporter</div>
                        <div className="text-[10px] text-slate-500 font-medium tracking-wide">Public node. Report field observations.</div>
                      </div>
                    </div>
                    <LogIn className={`w-5 h-5 text-slate-300 group-hover:text-slate-950 transition-colors ${isLoggingIn ? 'animate-spin' : ''}`} />
                  </button>

                  <button 
                    onClick={() => setView('apply')}
                    className="w-full group relative flex items-center justify-between bg-slate-900 border border-white/5 text-white p-7 rounded-[24px] font-bold transition-all hover:bg-slate-800 hover:border-white/10 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                        <Activity className="w-6 h-6 text-amber-500" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-black uppercase tracking-tight">Volunteer Specialist</div>
                        <div className="text-[10px] text-slate-500 font-medium tracking-wide">Privileged access. Vetting protocol req.</div>
                      </div>
                    </div>
                    <FileText className="w-5 h-5 text-slate-600 group-hover:text-amber-500 transition-colors" />
                  </button>
                </div>

                <div className="pt-8 flex items-center justify-center gap-6 border-t border-white/5">
                  <button 
                    onClick={() => login('admin')}
                    className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] hover:text-emerald-500 transition-colors"
                  >
                    Admin Hub Access
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="apply"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-8 bg-slate-900 p-10 rounded-[40px] border border-white/5 shadow-3xl"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white tracking-tighter">VETTING PROTOCOL</h2>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-none">Authorization Required</p>
                  </div>
                  <button 
                    onClick={() => setView('welcome')}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 text-[10px] font-bold uppercase tracking-widest transition-all"
                  >
                    Close
                  </button>
                </div>

                <form onSubmit={handleApply} className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Field Specializations</label>
                      <div className="flex flex-wrap gap-2">
                        {ALL_SKILLS.map(skill => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={`px-4 py-2.5 rounded-xl border text-[10px] font-bold uppercase transition-all tracking-wider ${
                              appData.selectedSkills.includes(skill)
                                ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                                : 'bg-slate-950 border-white/5 text-slate-500 hover:border-white/10'
                            }`}
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Professional Experience</label>
                        <textarea 
                          required
                          value={appData.bio}
                          onChange={e => setAppData(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder="Describe your humanitarian response background..."
                          className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-slate-200 placeholder:text-slate-800 focus:border-emerald-500 transition-all outline-none resize-none h-24"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Authorization Proof</label>
                        <input 
                          required
                          type="text"
                          value={appData.idProofText}
                          onChange={e => setAppData(prev => ({ ...prev, idProofText: e.target.value }))}
                          placeholder="Govt ID / Medical Lic. Reference No."
                          className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs text-slate-200 placeholder:text-slate-800 focus:border-emerald-500 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-500 text-slate-950 py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-400 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl"
                  >
                    {isSubmitting ? <Activity className="w-5 h-5 animate-spin" /> : 'Transmit Authorization Request'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center pt-8">
            <p className="text-slate-600 text-[10px] uppercase tracking-[0.3em] font-black">
              Sahaya Command Interface • Node ID: S-4
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

