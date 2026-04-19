import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Send, ShieldAlert, LogIn, Activity, FileText, CheckCircle2, AlertCircle, Wrench, Heart } from 'lucide-react';
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
    phone: '',
    address: '',
    availability: 'immediate' as 'immediate' | 'scheduled' | 'on-call',
    emergencyContact: '',
    selectedSkills: [] as string[]
  });

  const ALL_SKILLS = ['medical', 'logistics', 'search and rescue', 'communications', 'food distribution', 'social work', 'translation', 'counseling'];


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
        phone: appData.phone,
        address: appData.address,
        availability: appData.availability,
        emergencyContact: appData.emergencyContact,
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
      <div className="fixed inset-0 bg-[var(--bg)] flex items-center justify-center p-6 text-[var(--text-primary)]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[var(--surface)] border border-[var(--border)] rounded-[40px] p-12 text-center space-y-8 shadow-sm"
        >
          <div className="w-24 h-24 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full flex items-center justify-center mx-auto relative shadow-sm">
            <Heart className="w-10 h-10" />
            <div className="absolute inset-0 rounded-full bg-[var(--accent)]/20 animate-ping opacity-50" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Application Under Review</h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-medium">Thank you for stepping up to help. Our team is currently reviewing your application and will get back to you shortly.</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-[var(--border)] hover:bg-[var(--hover)] text-[var(--text-primary)] py-4 rounded-2xl font-semibold transition-all text-sm"
          >
            Continue as Guest
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[var(--bg)] flex flex-col lg:flex-row text-[var(--text-primary)] overflow-y-auto">
      {/* Visual Left Side (Desktop Only) */}
      <div className="hidden lg:flex flex-1 relative bg-[var(--surface)] overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(2,132,199,0.05)_0%,transparent_50%)]" />
        
        <div className="relative z-10 p-20 max-w-xl text-center">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8 }}
             className="flex flex-col items-center"
           >
              <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-8 shadow-lg overflow-hidden border border-[var(--border)]">
                <img src="/logo.png" alt="Sahaya Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight mb-6">
                Welcome to Sahaya
              </h1>
              <p className="text-lg text-[var(--text-secondary)] font-medium leading-relaxed max-w-md">
                A community-driven platform to request help and coordinate humanitarian response seamlessly.
              </p>
           </motion.div>
        </div>
        
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6 text-[var(--text-secondary)]">
           <span className="text-xs font-semibold px-4 py-1.5 bg-[var(--bg)] rounded-full border border-[var(--border)] shadow-sm">Community First</span>
           <span className="text-xs font-semibold px-4 py-1.5 bg-[var(--bg)] rounded-full border border-[var(--border)] shadow-sm">Secure platform</span>
        </div>
      </div>

      {/* Interaction Right Side */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute top-8 right-8 lg:hidden">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border border-[var(--border)]">
            <img src="/logo.png" alt="Sahaya" className="w-full h-full object-cover" />
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-12 relative z-10"
        >
          <AnimatePresence mode="wait">
            {view === 'welcome' ? (
              <motion.div 
                key="welcome"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                <div className="space-y-3 lg:text-left text-center">
                  <h2 className="text-3xl font-bold tracking-tight">Get Started</h2>
                  <p className="text-[var(--text-secondary)] text-sm font-medium">How would you like to use Sahaya today?</p>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className="w-full group relative flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] p-6 rounded-[24px] transition-all hover:shadow-md hover:bg-[var(--hover)] active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                        <Send className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="text-left">
                        <div className="text-[15px] font-bold text-[var(--text-primary)]">Request Help</div>
                        <div className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">Report issues and request assistance</div>
                      </div>
                    </div>
                    <LogIn className={`w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors ${isLoggingIn ? 'animate-spin' : ''}`} />
                  </button>

                  <button 
                    onClick={() => setView('apply')}
                    className="w-full group relative flex items-center justify-between bg-[var(--text-primary)] border border-transparent text-[var(--text-inverse)] p-6 rounded-[24px] transition-all hover:opacity-90 active:scale-[0.98] shadow-sm"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="text-[15px] font-bold">Join as Volunteer</div>
                        <div className="text-xs text-[var(--text-inverse)]/80 font-medium mt-0.5">Help your community in times of need</div>
                      </div>
                    </div>
                    <FileText className="w-5 h-5 text-[var(--text-inverse)]/70 group-hover:text-white transition-colors" />
                  </button>
                </div>

                <div className="pt-8 flex items-center justify-center gap-6">
                  <button 
                    onClick={() => login('admin')}
                    className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Administrator Log In
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="apply"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8 bg-[var(--surface)] p-8 sm:p-10 rounded-[36px] border border-[var(--border)] shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Volunteer Application</h2>
                    <p className="text-xs font-semibold text-[var(--accent)] tracking-wide">Join the Network</p>
                  </div>
                  <button 
                    onClick={() => setView('welcome')}
                    className="p-2 bg-[var(--border)] hover:bg-[var(--hover)] rounded-xl text-[var(--text-secondary)] text-xs font-bold transition-all"
                  >
                    Back
                  </button>
                </div>

                <form onSubmit={handleApply} className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-bold text-[var(--text-secondary)] mb-3 block">How can you help?</label>
                      <div className="flex flex-wrap gap-2">
                        {ALL_SKILLS.map(skill => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={`px-3 py-2 rounded-xl border text-xs font-semibold capitalize transition-all ${
                              appData.selectedSkills.includes(skill)
                                ? 'bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--text-inverse)] shadow-sm'
                                : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]/50'
                            }`}
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[var(--text-secondary)] block">Phone Number</label>
                          <input 
                            required
                            type="tel"
                            value={appData.phone}
                            onChange={e => setAppData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+1 234 567 890"
                            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3.5 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:border-[var(--accent)] outline-none transition-all shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[var(--text-secondary)] block">Availability</label>
                          <select 
                            value={appData.availability}
                            onChange={e => setAppData(prev => ({ ...prev, availability: e.target.value as any }))}
                            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3.5 text-sm font-medium text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-all appearance-none shadow-sm"
                          >
                            <option value="immediate">Immediate</option>
                            <option value="scheduled">Scheduled Availability</option>
                            <option value="on-call">On-Call Only</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-secondary)] block">General Area</label>
                        <input 
                          required
                          type="text"
                          value={appData.address}
                          onChange={e => setAppData(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Where are you located?"
                          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3.5 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:border-[var(--accent)] outline-none transition-all shadow-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-secondary)] block">Experience summary</label>
                        <textarea 
                          required
                          value={appData.bio}
                          onChange={e => setAppData(prev => ({ ...prev, bio: e.target.value }))}
                          placeholder="Tell us a little about your background..."
                          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3.5 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:border-[var(--accent)] outline-none transition-all resize-none h-24 shadow-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[var(--text-secondary)] block">ID Document</label>
                          <input 
                            required
                            type="text"
                            value={appData.idProofText}
                            onChange={e => setAppData(prev => ({ ...prev, idProofText: e.target.value }))}
                            placeholder="Govt ID Number"
                            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3.5 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:border-[var(--accent)] outline-none transition-all shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[var(--text-secondary)] block">Emergency Contact</label>
                          <input 
                            type="text"
                            value={appData.emergencyContact}
                            onChange={e => setAppData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                            placeholder="Name & Phone"
                            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3.5 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:border-[var(--accent)] outline-none transition-all shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[var(--text-primary)] text-[var(--text-inverse)] py-4 rounded-[20px] font-bold text-sm hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-md"
                  >
                    {isSubmitting ? <Activity className="w-5 h-5 animate-spin" /> : 'Submit Application'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-center pt-8">
            <p className="text-[var(--text-secondary)] text-[10px] font-semibold tracking-wide">
              Sahaya Foundation
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

