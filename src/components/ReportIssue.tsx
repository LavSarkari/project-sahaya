import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Send, AlertCircle, CheckCircle2, Loader2, Users, Activity, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { analyzeSignal, StructuredSignal } from '../services/aiService';
import { submitReport } from '../services/issueService';
import { getNearestArea } from '../lib/utils';
import { AREAS } from '../constants';

import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Issue } from '../types';
import type { DataSource } from '../types';

export const ReportIssue: React.FC = () => {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [peopleAffected, setPeopleAffected] = useState<string>('');
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<StructuredSignal | null>(null);
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [recentReports, setRecentReports] = useState<Issue[]>([]);
  const [dataSource, setDataSource] = useState<DataSource>('field_report');
  const [sourceOrg, setSourceOrg] = useState('');

  useEffect(() => {
    if (!user) return;
    // In this unified mock/demo systems we show reports in the system
    // for simplicity we query by area or just latest
    const q = query(collection(db, 'issues'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecentReports(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Issue).slice(0, 5));
    });
    return unsubscribe;
  }, [user]);

  const handleGetLocation = () => {
    setError(null);
    setFetchingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setFetchingLocation(false);
        },
        (err) => {
          console.error("Error getting location:", err);
          setFetchingLocation(false);
          let message = "Could not fetch location. ";
          if (err.code === 1) message += "Permission denied. Please allow location access.";
          else if (err.code === 2) message += "Position unavailable.";
          else message += "Please ensure GPS is enabled.";
          setError(message);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setFetchingLocation(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!description || !location) {
      setError("Please provide a description and capture your location.");
      return;
    }

    setIsSubmitting(true);
    try {
      const analysis = await analyzeSignal(description);
      
      if (analysis.isSpamOrFake) {
        setError(`Signal Rejected: ${analysis.rejectionReason}`);
        setIsSubmitting(false);
        return;
      }

      setAiAnalysis(analysis);
      setStep('review');
    } catch (err) {
      console.error(err);
      setError("Failed to analyze signal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!aiAnalysis || !location) return;
    
    setIsSubmitting(true);
    try {
      const areaId = getNearestArea(location.lat, location.lng);
      const areaName = AREAS.find(a => a.id === areaId)?.name || 'Unknown Zone';

      await submitReport({
        title: aiAnalysis.title,
        location: `${areaName} (Field Capture)`,
        areaId,
        peopleAffected: peopleAffected ? parseInt(peopleAffected) : 1,
        priority: aiAnalysis.priority,
        category: aiAnalysis.category,
        status: 'reported',
        aiRecommendation: aiAnalysis.aiRecommendation,
        confidence: aiAnalysis.confidence,
        riskMessage: aiAnalysis.riskMessage,
        coordinates: location,
        timestamp: new Date().toISOString(),
        rawDescription: description,
        dataSource: dataSource,
        sourceOrg: sourceOrg || undefined
      });
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Transmission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--bg)] min-h-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-sm"
        >
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-sans font-bold text-[var(--text-primary)] tracking-tight">Report Submitted</h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              Your signal has been transmitted to Project Sahaya Mission Control. Emergency units are being coordinated.
            </p>
          </div>
          <button 
            onClick={() => {
              setIsSuccess(false);
              setDescription('');
              setPeopleAffected('');
              setLocation(null);
              setImage(null);
            }}
            className="w-full py-4 bg-emerald-500 text-slate-950 rounded-xl font-bold uppercase tracking-[0.2em] text-xs hover:bg-emerald-400 transition-all active:scale-95"
          >
            Submit Another Report
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[var(--bg)] overflow-y-auto custom-scrollbar h-full">
      <div className="min-h-full lg:flex lg:items-center lg:justify-center p-4 lg:p-8">
        <div className="max-w-xl w-full mx-auto space-y-8 py-8">
        <header className="space-y-2 px-2">
          <div className="flex items-center gap-2 mb-4">
             <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Send className="w-4 h-4 text-slate-950" />
             </div>
             <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.3em]">Field Reporter v1.0</span>
          </div>
          <h1 className="text-3xl font-sans font-bold text-[var(--text-primary)] tracking-tight">
            {step === 'input' ? 'Report Issue' : 'Review Signal'}
          </h1>
          <p className="text-[var(--text-secondary)] text-sm tracking-tight leading-relaxed">
            {step === 'input' 
              ? 'Help us understand the situation on the ground. Your report saves lives.' 
              : 'Our AI has structured your input. Verify and transmit to Command.'}
          </p>
        </header>

        <AnimatePresence mode="wait">
          {step === 'input' ? (
            <motion.form 
              key="input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleAnalyze} 
              className="space-y-6"
            >
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3 text-rose-500 text-xs font-bold uppercase tracking-widest"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Description Section */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-2">Description <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <textarea 
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the problem (e.g. food shortage, water issue, medical help needed)..."
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30 focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--hover)] transition-all min-h-[160px] resize-none text-[15px] leading-relaxed shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location Section */}
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-2">Location <span className="text-rose-500">*</span></label>
                  <button 
                    type="button"
                    onClick={handleGetLocation}
                    disabled={fetchingLocation}
                    className={`w-full h-[120px] rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all ${
                      location 
                        ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]' 
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--hover)] hover:border-[var(--text-secondary)]/30 shadow-sm'
                    }`}
                  >
                    {fetchingLocation ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <MapPin className={`w-6 h-6 ${location ? 'text-[var(--accent)]' : ''}`} />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-widest px-4 text-center">
                      {location ? `Location Captured (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})` : 'Use Current Location'}
                    </span>
                  </button>
                </div>

                {/* Image Section */}
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-2">Visual Proof</label>
                  <div className="relative h-[120px]">
                    {!image ? (
                      <label className="w-full h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex flex-col items-center justify-center gap-3 text-[var(--text-secondary)] hover:bg-[var(--hover)] hover:border-[var(--text-secondary)]/30 cursor-pointer transition-all shadow-sm">
                        <Camera className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Upload Image</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    ) : (
                      <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/20 group">
                        <img src={image} alt="Report preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button 
                          type="button"
                          onClick={() => setImage(null)}
                          className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-widest transition-opacity"
                        >
                          Remove Photo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* People Affected Section */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-2">People Affected</label>
                <div className="relative flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden focus-within:border-[var(--accent)] transition-all shadow-inner">
                  <div className="pl-4 pr-2 text-[var(--text-secondary)]/40">
                    <Users className="w-4 h-4" />
                  </div>
                  <input 
                    type="number"
                    value={peopleAffected}
                    onChange={(e) => setPeopleAffected(e.target.value)}
                    placeholder="Number of individuals needing help (optional)"
                    className="w-full py-4 pr-4 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30 focus:outline-none text-[15px]"
                  />
                </div>
              </div>

              {/* Data Source Section */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-2 flex items-center gap-1.5">
                  <Tag className="w-3 h-3" /> Data Source
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { value: 'field_report', label: '📋 Field Report', color: 'teal' },
                    { value: 'food_drive', label: '🍚 Food Drive', color: 'amber' },
                    { value: 'medical_camp', label: '🏥 Medical Camp', color: 'rose' },
                    { value: 'blood_donation', label: '🩸 Blood Drive', color: 'red' },
                    { value: 'disability_program', label: '♿ Disability Prog', color: 'purple' },
                    { value: 'ngo_partner', label: '🤝 NGO Partner', color: 'blue' },
                  ].map(src => (
                    <button
                      key={src.value}
                      type="button"
                      onClick={() => setDataSource(src.value as DataSource)}
                      className={`px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border text-center ${
                        dataSource === src.value
                          ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]'
                          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--hover)]'
                      }`}
                    >
                      {src.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Org (optional) */}
              {dataSource === 'ngo_partner' && (
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-2">Organization Name</label>
                  <input
                    type="text"
                    value={sourceOrg}
                    onChange={(e) => setSourceOrg(e.target.value)}
                    placeholder="e.g. Red Cross, Doctors Without Borders..."
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-3.5 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30 focus:outline-none focus:border-[var(--accent)] transition-all text-sm"
                  />
                </div>
              )}

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-emerald-500 disabled:bg-emerald-500/50 text-slate-950 rounded-2xl font-bold uppercase tracking-[0.3em] text-[13px] shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing with Gemini AI...
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4" />
                      Process Signal
                    </>
                  )}
                </button>
              </div>

              {/* Recent Signals List */}
              <div className="pt-8 space-y-4">
                <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.3em] px-2 flex items-center justify-between">
                  <span>Recent Active Signals</span>
                  <div className="flex items-center gap-1.5 text-emerald-500/50">
                    <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
                    Live Transmission
                  </div>
                </div>
                <div className="space-y-3">
                  {recentReports.map((report) => (
                    <div key={report.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4">
                      <div className="space-y-1 overflow-hidden">
                        <h4 className="text-[11px] font-bold text-[var(--text-primary)] truncate">{report.title}</h4>
                        <div className="flex items-center gap-2 text-[9px] text-[var(--text-secondary)] font-mono">
                          <span className="uppercase">{report.areaId}</span>
                          <span>•</span>
                          <span>{new Date(report.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest ${
                        report.status === 'resolved' ? 'text-emerald-500 bg-emerald-500/10' :
                        report.status === 'assigned' || report.status === 'in-progress' ? 'text-blue-400 bg-blue-400/10' :
                        'text-slate-500 bg-white/5'
                      }`}>
                        {report.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.form>
          ) : (
            <motion.div 
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {aiAnalysis && (
                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          aiAnalysis.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-500' :
                          aiAnalysis.priority === 'MED' ? 'bg-amber-500/20 text-amber-500' :
                          'bg-emerald-500/20 text-emerald-500'
                        }`}>
                          {aiAnalysis.priority} Priority
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[8px] font-bold uppercase tracking-wider">
                          {aiAnalysis.category}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{aiAnalysis.title}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">AI Confidence</div>
                      <div className="text-xl font-mono font-bold text-emerald-500">{(aiAnalysis.confidence * 100).toFixed(0)}%</div>
                    </div>
                  </div>


                  <div className="space-y-4">
                    <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-rose-500">
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Critical Risk</span>
                      </div>
                      <p className="text-sm text-[var(--text-primary)] leading-relaxed">"{aiAnalysis.riskMessage}"</p>
                    </div>
                  </div>


                  <div className="pt-4 flex gap-3">
                    <button 
                      onClick={() => setStep('input')}
                      className="flex-1 py-4 bg-white/5 text-slate-400 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Edit Raw Input
                    </button>
                    <button 
                      onClick={handleFinalSubmit}
                      disabled={isSubmitting}
                      className="flex-[2] py-4 bg-emerald-500 text-slate-950 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Transmit Signal
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
  );
};
