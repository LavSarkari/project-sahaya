import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, ShieldAlert, Award, Wrench, CheckCircle2, 
  Phone, Clock, MapPin, CreditCard, Users as UsersIcon, 
  ChevronDown, FileText, Activity 
} from 'lucide-react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { VolunteerApplication as IVolunteerApplication } from '../types';

interface VolunteerApplicationProps {
  onCancel?: () => void;
  onAuthRequired?: () => void;
  isDashboard?: boolean;
}

export const VolunteerApplication: React.FC<VolunteerApplicationProps> = ({ 
  onCancel, 
  onAuthRequired,
  isDashboard = false
}) => {
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applied, setApplied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (onAuthRequired) onAuthRequired();
      return;
    }

    setIsSubmitting(true);
    try {
      const application: IVolunteerApplication = {
        id: user.uid,
        name: user.displayName || profile?.name || 'Anonymous Applicant',
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

  // Status View (Pending or Success)
  if (profile?.applicationStatus === 'pending' || applied) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
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
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-medium">
              Thank you for stepping up to help. Our team is currently reviewing your application and will get back to you shortly.
            </p>
          </div>
          {onCancel && (
            <button 
              onClick={onCancel}
              className="w-full bg-[var(--border)] hover:bg-[var(--hover)] text-[var(--text-primary)] py-4 rounded-2xl font-semibold transition-all text-sm"
            >
              Continue as Guest
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col min-h-full ${isDashboard ? 'bg-[var(--bg)]' : 'bg-transparent py-10'}`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className={`w-full mx-auto flex flex-col relative overflow-hidden flex-1 ${
          isDashboard 
            ? 'max-w-4xl px-4 sm:px-8 py-8 sm:py-12 h-screen' 
            : 'max-w-5xl bg-[var(--surface)]/80 backdrop-blur-2xl rounded-[32px] sm:rounded-[48px] border border-[var(--border)] shadow-2xl max-h-[90vh] sm:max-h-[85vh]'
        }`}
      >
        {!isDashboard && <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />}
        
        {/* HEADER */}
        <div className={`relative z-10 shrink-0 ${isDashboard ? 'mb-10 px-4' : 'p-5 sm:p-10 border-b border-[var(--border)]/50'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-1 sm:mb-2 text-left">
                 <Award className="w-3 h-3" /> Professional Network
              </div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tighter text-[var(--text-primary)]">Volunteer Application</h2>
              <p className="text-[var(--text-secondary)] text-[11px] sm:text-sm font-medium">Step up to help your community coordinate and recover.</p>
            </div>
            {onCancel && (
              <button 
                onClick={onCancel}
                className="self-center sm:self-start px-4 py-2 bg-[var(--surface)] hover:bg-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[10px] sm:text-xs font-bold transition-all shadow-sm flex items-center gap-2 border border-[var(--border)]"
              >
                ← {isDashboard ? 'Back to Dashboard' : 'Back'}
              </button>
            )}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar ${isDashboard ? 'px-4 sm:px-4' : 'p-8 sm:px-12 py-10'} space-y-10`}>
        {!user && (
          <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-[28px] flex items-center gap-4 group">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-[var(--text-primary)]">Authentication Required</p>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                You must <button onClick={onAuthRequired} className="text-blue-500 hover:underline font-bold">sign in</button> before submitting your application.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleApply} className="space-y-10 pb-8">
          {/* Capabilities Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <Wrench className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Operational Capabilities</h3>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {ALL_SKILLS.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-4 py-2.5 rounded-2xl border text-xs font-bold capitalize transition-all duration-300 flex items-center gap-2 ${
                    appData.selectedSkills.includes(skill)
                      ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-[0_0_20px_-5px_var(--accent)] scale-[1.05]'
                      : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]/40 hover:bg-[var(--hover)]'
                  }`}
                >
                  {appData.selectedSkills.includes(skill) && <CheckCircle2 className="w-3 h-3" />}
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Identification & Contact Group */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors" />
                <input 
                  required
                  type="tel"
                  value={appData.phone}
                  onChange={e => setAppData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 234 567 890"
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 pl-12 text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/5 outline-none transition-all shadow-inner"
                />
              </div>
            </div>
            <div className="space-y-2 col-span-2 md:col-span-1 text-left">
              <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">Availability</label>
              <div className="relative group text-left" id="availability-dropdown">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full bg-[var(--surface)] border rounded-2xl p-4 pl-12 text-sm font-semibold text-[var(--text-primary)] text-left transition-all shadow-sm flex items-center justify-between ${
                    isDropdownOpen ? 'border-[var(--accent)] ring-4 ring-[var(--accent)]/5' : 'border-[var(--border)] group-hover:border-[var(--text-secondary)]/40'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Clock className={`w-4 h-4 transition-colors ${isDropdownOpen ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`} />
                    <span className="capitalize">{appData.availability.replace('-', ' ')} Availability</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-[24px] shadow-2xl z-[100] overflow-hidden backdrop-blur-3xl"
                    >
                      {[
                        { value: 'immediate', label: 'Immediate Availability' },
                        { value: 'scheduled', label: 'Scheduled Availability' },
                        { value: 'on-call', label: 'On-Call Only' }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setAppData(prev => ({ ...prev, availability: opt.value as any }));
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full p-4 text-sm font-bold text-left transition-all hover:bg-[var(--accent)] hover:text-white flex items-center justify-between ${
                            appData.availability === opt.value ? 'bg-[var(--accent)]/5 text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          {opt.label}
                          {appData.availability === opt.value && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Location & Context Section */}
          <div className="space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">Deployment Radius / Area</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors" />
                <input 
                  required
                  type="text"
                  value={appData.address}
                  onChange={e => setAppData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Where are you located?"
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 pl-12 text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/5 outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2 text-left">
               <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">Experience Summary</label>
               <textarea 
                 required
                 value={appData.bio}
                 onChange={e => setAppData(prev => ({ ...prev, bio: e.target.value }))}
                 placeholder="Briefly describe your relevant background or skills..."
                 className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-5 text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/5 outline-none transition-all resize-none h-32 shadow-inner"
               />
            </div>
          </div>

          {/* Verification & Risk Group */}
          <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-[var(--border)]">
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">Identification Number</label>
              <div className="relative group">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors" />
                <input 
                  required
                  type="text"
                  value={appData.idProofText}
                  onChange={e => setAppData(prev => ({ ...prev, idProofText: e.target.value }))}
                  placeholder="Govt ID Number"
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 pl-12 text-sm font-semibold text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-all shadow-inner"
                />
              </div>
            </div>
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">Emergency Contact</label>
              <div className="relative group">
                <UsersIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors" />
                <input 
                  type="text"
                  value={appData.emergencyContact}
                  onChange={e => setAppData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  placeholder="Name & Relationship"
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 pl-12 text-sm font-semibold text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !user}
            className="w-full group relative bg-[var(--text-primary)] text-[var(--text-inverse)] py-5 rounded-[28px] font-black text-sm uppercase tracking-widest hover:opacity-95 active:scale-[0.98] disabled:opacity-30 transition-all flex items-center justify-center gap-4 shadow-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            {isSubmitting ? (
              <Activity className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Submit Verification File
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
    </div>
  );
};
