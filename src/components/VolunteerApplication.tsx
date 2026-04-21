import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, ShieldAlert, Award, Wrench, CheckCircle2, 
  Phone, Clock, MapPin, CreditCard, Users as UsersIcon, 
  ChevronDown, FileText, Activity, Camera, Home, User
} from 'lucide-react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { VolunteerApplication as IVolunteerApplication } from '../types';
import { uploadVerificationDocument } from '../services/storageService';
import { verifyFaceImage } from '../services/aiService';

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
  const [loadingText, setLoadingText] = useState('');
  const [applied, setApplied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Verification States
  const [showOtpMock, setShowOtpMock] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

  const [appData, setAppData] = useState({
    bio: '',
    idProofText: '',
    phone: '',
    homeAddress: '',
    serviceArea: '',
    workingHours: '',
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

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (onAuthRequired) onAuthRequired();
      return;
    }
    
    if (!profileFile || !idFile) {
      setError("Please upload both a Profile Picture and a valid Govt ID Proof.");
      return;
    }

    if (!showOtpMock) {
      // Trigger OTP mock first
      setShowOtpMock(true);
      setTimeout(() => setOtpSent(true), 1000);
      return;
    }

    if (otpCode !== '1234') {
      setError("Invalid verification code. (Hint: use 1234)");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      // 1. Verify Face using AI
      setLoadingText("AI verifying profile picture...");
      const base64Data = profilePreview?.split(',')[1];
      if (!base64Data) throw new Error("Could not process image");
      
      const faceCheck = await verifyFaceImage(base64Data, profileFile.type);
      if (!faceCheck.isHumanFace) {
        throw new Error(`Profile rejected: ${faceCheck.notes}`);
      }

      // 2. Upload Documents to Storage
      setLoadingText("Uploading secure documents...");
      const profilePicUrl = await uploadVerificationDocument(profileFile, user.uid, 'profile_pic');
      const idProofUrl = await uploadVerificationDocument(idFile, user.uid, 'id_proof');

      // 3. Save Application
      setLoadingText("Finalizing application...");
      const application: IVolunteerApplication = {
        id: user.uid,
        name: user.displayName || profile?.name || 'Anonymous Applicant',
        email: user.email || '',
        skills: appData.selectedSkills,
        bio: appData.bio,
        idProofText: appData.idProofText,
        idProofUrl,
        profilePicUrl,
        phone: appData.phone,
        homeAddress: appData.homeAddress,
        serviceArea: appData.serviceArea,
        workingHours: appData.workingHours,
        availability: appData.availability,
        emergencyContact: appData.emergencyContact,
        status: 'pending',
        timestamp: new Date().toISOString(),
        aiVerification: {
          isHumanFace: faceCheck.isHumanFace,
          notes: faceCheck.notes
        }
      };

      await setDoc(doc(db, 'volunteer_applications', user.uid), application);
      await updateDoc(doc(db, 'users', user.uid), { applicationStatus: 'pending' });
      setApplied(true);
    } catch (err: any) {
      console.error('Application error:', err);
      setError(err.message || 'An error occurred during verification.');
    } finally {
      setIsSubmitting(false);
      setLoadingText('');
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
              Thank you for stepping up to help. Our team and AI verify systems are currently reviewing your application and will get back to you shortly.
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
                 <Award className="w-3 h-3" /> Secure Verification
              </div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tighter text-[var(--text-primary)]">Volunteer Application</h2>
              <p className="text-[var(--text-secondary)] text-[11px] sm:text-sm font-medium">Verify your identity to join the rapid response network.</p>
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

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold flex items-center gap-3">
             <ShieldAlert className="w-5 h-5" />
             {error}
          </div>
        )}

        <form onSubmit={handleApply} className="space-y-10 pb-8">
          
          {/* Identity & PFP Section */}
          <div className="flex flex-col md:flex-row gap-8 items-start border-b border-[var(--border)] pb-10">
            <div className="shrink-0 flex flex-col items-center gap-4 w-full md:w-auto">
               <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 rounded-full border-2 border-dashed border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--hover)] transition-all cursor-pointer flex flex-col items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] relative overflow-hidden group"
               >
                 {profilePreview ? (
                   <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                   <>
                     <User className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                     <span className="text-[10px] font-bold uppercase tracking-wider">Upload PFP</span>
                   </>
                 )}
               </div>
               <p className="text-[10px] text-[var(--text-secondary)] text-center max-w-[140px]">Must be a clear photo of your face for AI verification.</p>
               <input type="file" ref={fileInputRef} onChange={handleProfilePicChange} accept="image/*" className="hidden" />
            </div>
            <div className="flex-1 space-y-6 w-full">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors" />
                  <input 
                    required
                    type="tel"
                    value={appData.phone}
                    onChange={e => setAppData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 234 567 890"
                    disabled={showOtpMock}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 pl-12 text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30 focus:border-[var(--accent)] outline-none transition-all shadow-inner disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">Govt ID Number</label>
                  <div className="relative group">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors" />
                    <input 
                      required
                      type="text"
                      value={appData.idProofText}
                      onChange={e => setAppData(prev => ({ ...prev, idProofText: e.target.value }))}
                      placeholder="ID Number"
                      className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 pl-12 text-sm font-semibold text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">Upload ID Copy</label>
                  <button 
                    type="button"
                    onClick={() => idInputRef.current?.click()}
                    className={`w-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] rounded-2xl p-4 text-sm font-semibold transition-all shadow-inner flex items-center justify-center gap-2 ${idFile ? 'text-emerald-500 border-emerald-500/50' : 'text-[var(--text-primary)]'}`}
                  >
                    <FileText className="w-4 h-4" />
                    {idFile ? 'Scanned ID Attached' : 'Select File'}
                  </button>
                  <input type="file" ref={idInputRef} onChange={e => { if(e.target.files) setIdFile(e.target.files[0]) }} accept="image/*,.pdf" className="hidden" />
                </div>
              </div>
            </div>
          </div>

          {/* Location & Context Section */}
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">Full Home Address</label>
                <div className="relative group">
                  <Home className="absolute left-4 top-4 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors" />
                  <textarea 
                    required
                    value={appData.homeAddress}
                    onChange={e => setAppData(prev => ({ ...prev, homeAddress: e.target.value }))}
                    placeholder="Your permanent address..."
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 pl-12 text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30 focus:border-[var(--accent)] outline-none transition-all shadow-inner resize-none h-24"
                  />
                </div>
              </div>
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">Service Area & Radius</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-4 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors" />
                  <textarea 
                    required
                    value={appData.serviceArea}
                    onChange={e => setAppData(prev => ({ ...prev, serviceArea: e.target.value }))}
                    placeholder="E.g., North District, within 10km radius"
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 pl-12 text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30 focus:border-[var(--accent)] outline-none transition-all shadow-inner resize-none h-24"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="sm:w-1/2 space-y-2 text-left">
                <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">Working Hours</label>
                <div className="relative group">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors" />
                  <input 
                    required
                    type="text"
                    value={appData.workingHours}
                    onChange={e => setAppData(prev => ({ ...prev, workingHours: e.target.value }))}
                    placeholder="E.g., 9AM - 5PM, Weekends"
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 pl-12 text-sm font-semibold text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-all shadow-inner"
                  />
                </div>
              </div>
              <div className="sm:w-1/2 space-y-2 text-left">
                 <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">Overall Availability</label>
                 <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 text-sm font-semibold text-[var(--text-primary)] text-left flex items-center justify-between shadow-sm hover:border-[var(--accent)]"
                  >
                    <span className="capitalize">{appData.availability.replace('-', ' ')}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute z-50 mt-2 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden">
                      {['immediate', 'scheduled', 'on-call'].map(opt => (
                        <div 
                          key={opt}
                          onClick={() => { setAppData(p => ({...p, availability: opt as any})); setIsDropdownOpen(false); }}
                          className="px-4 py-3 text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-white cursor-pointer capitalize"
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            <div className="space-y-2 text-left">
               <label className="text-xs font-bold text-[var(--text-secondary)] ml-1">Experience Summary</label>
               <textarea 
                 required
                 value={appData.bio}
                 onChange={e => setAppData(prev => ({ ...prev, bio: e.target.value }))}
                 placeholder="Briefly describe your relevant background or skills..."
                 className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-5 text-sm font-semibold text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-all resize-none h-24 shadow-inner"
               />
            </div>
          </div>

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

          {showOtpMock && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-6 bg-[var(--surface)] border border-[var(--accent)]/30 rounded-[28px] space-y-4"
            >
              <h3 className="text-sm font-bold flex items-center gap-2 text-[var(--text-primary)]">
                <ShieldAlert className="w-4 h-4 text-[var(--accent)]" /> 
                Phone Verification
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">We've sent an SMS containing a verification code to {appData.phone}. Enter it below.</p>
              <div className="flex gap-4">
                <input 
                   type="text" 
                   maxLength={4}
                   value={otpCode}
                   onChange={e => setOtpCode(e.target.value)}
                   placeholder="1234"
                   className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-center tracking-widest font-black focus:border-[var(--accent)] outline-none"
                />
              </div>
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={isSubmitting || !user || !idFile || !profileFile}
            className="w-full group relative bg-[var(--text-primary)] text-[var(--text-inverse)] py-5 rounded-[28px] font-black text-sm uppercase tracking-widest hover:opacity-95 active:scale-[0.98] disabled:opacity-30 transition-all flex items-center justify-center gap-4 shadow-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            {isSubmitting ? (
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 animate-spin" />
                <span>{loadingText}</span>
              </div>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                {showOtpMock ? 'Verify & Upload Application' : 'Proceed to Verification'}
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
    </div>
  );
};
