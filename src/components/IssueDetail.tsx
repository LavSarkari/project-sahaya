import React, { useState, useEffect } from 'react';
import { Brain, ShieldAlert, Clock, Map, Navigation, Info, ExternalLink, MapPin, CheckCircle2, Activity, Filter, Wrench, Sparkles, UserCheck, X, FileText, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { Issue } from '../types';
import { generateRecommendation, analyzeTacticalDepth, matchVolunteerToTask } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { IssueComments } from './IssueComments';

const ALL_SKILLS = ['medical', 'logistics', 'search and rescue', 'communications', 'food distribution'];

const CATEGORY_SKILL_MAP: Record<string, string> = {
  'MEDICAL': 'medical',
  'FOOD': 'food distribution',
  'WATER': 'logistics',
  'SHELTER': 'logistics',
  'SECURITY': 'search and rescue'
};

interface IssueDetailProps {
  issue: Issue | null;
}

export const IssueDetail: React.FC<IssueDetailProps> = ({ issue }) => {
  const { profile } = useAuth();
  const [aiRec, setAiRec] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [volunteers, setVolunteers] = useState<{uid: string, name: string, skills?: string[]}[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showAllVolunteers, setShowAllVolunteers] = useState(false);
  const [smartMatches, setSmartMatches] = useState<any[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [viewingPersonnel, setViewingPersonnel] = useState<any | null>(null);

  useEffect(() => {
    const fetchRec = async () => {
      if (!issue) return;
      setLoading(true);
      const recommendation = await generateRecommendation(issue);
      setAiRec(recommendation);
      setLoading(false);
    };

    const timer = setTimeout(() => {
       fetchRec();
    }, 400); // 400ms debounce for basic recommendation

    return () => clearTimeout(timer);
  }, [issue?.id]);

  useEffect(() => {
    const fetchVolunteers = async () => {
      if (profile?.role !== 'admin') return;
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'volunteer'));
        const snap = await getDocs(q);
        setVolunteers(snap.docs.map(doc => {
          const data = doc.data();
          return {
            uid: doc.id,
            name: data.name,
            skills: data.skills || []
          };
        }));
      } catch (err) {
        console.error('Fetch volunteers failed:', err);
      }
    };
    fetchVolunteers();
  }, [profile]);

  // NEW: Run Smart Matching for the specific issue when volunteers are loaded
  useEffect(() => {
    if (profile?.role === 'admin' && issue && volunteers.length > 0) {
      const runMatching = async () => {
        setIsMatching(true);
        // Only match volunteers who are on standby
        const standbyVolunteers = volunteers.filter(v => {
           // We need to fetch the full user profile status to know if they are standby
           // For now, we'll assume they are standby if they are in the list, 
           // but traditionally we'd filter by status. 
           // Since the component currently gets all volunteers, we'll match all for best insights.
           return true; 
        });

        if (standbyVolunteers.length > 0) {
          const results = await matchVolunteerToTask(issue, standbyVolunteers);
          setSmartMatches(results.matches || []);
        }
        setIsMatching(false);
      };

      const timer = setTimeout(() => {
        runMatching();
      }, 600); // 600ms debounce for heavy matching logic

      return () => clearTimeout(timer);
    }
  }, [issue?.id, volunteers.length, profile?.uid]);

  const targetSkill = issue ? CATEGORY_SKILL_MAP[issue.category] : '';
  const recommendedVolunteers = targetSkill ? volunteers.filter(v => v.skills?.includes(targetSkill) || v.uid === issue?.assignedTo) : volunteers.filter(v => v.uid === issue?.assignedTo);
  const assignedVolunteer = volunteers.find(v => v.uid === issue?.assignedTo);

  const handleDeploy = async (volunteerId: string) => {
    if (!issue) return;
    setIsDeploying(true);
    try {
      // Update issue document
      const issueRef = doc(db, 'issues', issue.id);
      await updateDoc(issueRef, {
        assignedTo: volunteerId,
        status: 'assigned'
      });

      // Update volunteer document
      const userRef = doc(db, 'users', volunteerId);
      await updateDoc(userRef, {
        status: 'en-route',
        activeTaskId: issue.id
      });
      
      // Optionally show success
    } catch (err) {
      console.error('Deployment failed:', err);
    } finally {
      setIsDeploying(false);
    }
  };

  if (!issue) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg)] h-full p-12">
        <div className="text-center max-w-xs space-y-4">
          <div className="w-10 h-10 rounded-xl border border-[var(--border)] flex items-center justify-center mx-auto bg-[var(--surface)]">
            <Info className="w-5 h-5 text-[var(--text-secondary)]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">No Request Selected</h3>
            <p className="text-xs text-[var(--text-secondary)] font-medium">Select an incident from the list to view details and assign support.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg)] relative overflow-hidden min-h-0">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-7 custom-scrollbar pb-24">
        {/* Header Section */}
        <section className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--surface)] px-2 py-0.5 border border-[var(--border)] rounded uppercase tracking-wider">
              ID: {issue.id}
            </span>
            {issue.priority === 'HIGH' && (
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 border border-rose-200 dark:border-rose-500/20 rounded uppercase tracking-wider">
                CRITICAL
              </span>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-[var(--text-primary)] leading-tight mb-3 tracking-tight">
            {issue.title}
          </h2>
          
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs font-semibold">
            <MapPin className="w-4 h-4 text-emerald-500" />
            <span className="text-[var(--text-primary)]">{issue.location}</span>
            <div className="w-1 h-1 rounded-full bg-[var(--border)]" />
            <span className="opacity-70">{issue.areaId.toUpperCase()}</span>
          </div>
        </section>

        {/* AI Analysis Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
              <Brain className="w-4 h-4 text-[var(--accent)]" />
              AI Analysis
            </h3>
            <div className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider opacity-60">Gemini Powered</div>
          </div>
          
          <div className={`p-4 rounded-[16px] border transition-all duration-700 ${
            loading ? 'bg-[var(--surface)] border-[var(--border)]' : 'bg-[var(--surface)] border-[var(--border)] shadow-sm'
          }`}>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[var(--accent)] animate-spin" />
                    <span className="text-xs font-bold text-[var(--accent)]">Analyzing...</span>
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="h-2 w-full bg-[var(--border)] rounded animate-pulse" />
                    <div className="h-2 w-3/4 bg-[var(--border)] rounded animate-pulse" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed font-medium">
                    {aiRec || issue.aiRecommendation}
                  </p>
                  
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3">
                      <div className="text-[10px] text-[var(--text-secondary)] uppercase mb-1 font-bold tracking-wider">Estimated Time</div>
                      <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                        <Clock className="w-4 h-4 text-[var(--accent)]" />
                        {issue.eta}
                      </div>
                    </div>
                    <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3">
                      <div className="text-[10px] text-[var(--text-secondary)] uppercase mb-1 font-bold tracking-wider">People Affected</div>
                      <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                        <Activity className="w-4 h-4 text-[var(--accent)]" />
                        {issue.peopleAffected} People
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Deep Analysis Action */}
        {(profile?.role === 'admin' || profile?.role === 'volunteer') && (
          <section className="space-y-3">
             <button
               onClick={async () => {
                 if (!issue) return;
                 setLoading(true);
                 const depth = await analyzeTacticalDepth(issue);
                 setAiRec(depth);
                 setLoading(false);
               }}
               disabled={loading}
               className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--surface)] hover:bg-[var(--hover)] border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--accent)] transition-all shadow-sm"
             >
               <Sparkles className="w-4 h-4" />
               Generate Detailed Plan
             </button>
          </section>
        )}

        {/* Risk Assessment */}

        <section className="space-y-3">
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Risk Note</span>
            </div>
            <p className="text-sm text-rose-800 dark:text-rose-200 leading-relaxed font-medium">
              {issue.riskMessage}
            </p>
          </div>
        </section>

        {/* Multi-Signal Verification Log */}
        {issue.sourceDescriptions && issue.sourceDescriptions.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                Sourced Reports ({issue.signalCount || 1})
              </h3>
            </div>
            <div className="space-y-2">
              {issue.sourceDescriptions.map((desc, i) => (
                <div key={i} className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Report #{i + 1}</span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Verified</span>
                  </div>
                  <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed">{desc}</p>
                </div>
              ))}
              {issue.signalCount && issue.signalCount > 1 && (
                <div className="pt-2 px-1">
                   <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider leading-relaxed">
                     ⚡ Verified by {issue.signalCount} different sources.
                   </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Coordinates */}
        <section className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              <div className="text-[10px] text-[var(--text-secondary)] uppercase mb-1 font-bold tracking-wider">Latitude</div>
              <div className="font-mono text-xs font-semibold text-[var(--text-primary)]">{issue.coordinates.lat.toFixed(6)}</div>
            </div>
            <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              <div className="text-[10px] text-[var(--text-secondary)] uppercase mb-1 font-bold tracking-wider">Longitude</div>
              <div className="font-mono text-xs font-semibold text-[var(--text-primary)]">{issue.coordinates.lng.toFixed(6)}</div>
            </div>
          </div>
        </section>

        {/* Tactical Log Sub-module */}
        <section className="space-y-3 pt-2">
            <IssueComments issueId={issue.id} />
        </section>
      </div>

      <div className="px-4 py-4 bg-[var(--surface)] border-t border-[var(--border)] shadow-lg space-y-3 relative z-10 shrink-0">
        {profile?.role === 'admin' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between pl-1">
              <div className="text-xs font-bold text-[var(--text-primary)] tracking-wide">
                Assign Volunteer
              </div>
              {assignedVolunteer && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 rounded border border-emerald-200 dark:border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Assigned</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {recommendedVolunteers.length === 0 ? (
                <div className="text-xs text-[var(--text-secondary)] font-medium p-4 border border-[var(--border)] rounded-xl flex items-center justify-center gap-2 bg-[var(--bg)]">
                  <Activity className="w-4 h-4 opacity-50" />
                  No direct skill matches available.
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                    {recommendedVolunteers.map(v => {
                    const isRecommended = targetSkill && v.skills?.includes(targetSkill);
                    const match = smartMatches.find(m => m.userId === v.uid);
                    const isTopMatch = match && match.score >= 0.8;

                    return (
                      <div key={v.uid} className="space-y-1">
                        <div
                          className={`w-full py-3 px-4 rounded-xl flex items-center justify-between transition-all border shadow-sm cursor-default ${
                            issue.assignedTo === v.uid 
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                              : isTopMatch
                                ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-500/30 text-[var(--text-primary)] hover:border-amber-500 shadow-md'
                                : 'bg-[var(--bg)] border-[#0a84ff]/30 text-[var(--text-primary)] hover:border-[#0a84ff]'
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden flex-1" onClick={() => setViewingPersonnel(v)}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs uppercase shrink-0 border font-bold transition-all ${
                              issue.assignedTo === v.uid 
                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                                : isTopMatch
                                  ? 'bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400'
                                  : 'bg-[#0a84ff]/10 border-[#0a84ff]/30 text-[#0a84ff]'
                            }`}>{v.name.charAt(0)}</div>
                            <div className="flex flex-col items-start gap-1 overflow-hidden">
                              <div className="flex items-center gap-2 w-full">
                                <span className="text-sm font-semibold tracking-tight truncate text-left hover:text-[var(--accent)] transition-colors">{v.name}</span>
                                {match && (
                                  <div className={`flex items-center gap-1 px-1.5 py-0.5 ${isTopMatch ? 'bg-amber-500 text-white' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'} rounded border ${isTopMatch ? 'border-amber-600' : 'border-amber-500/20'}`}>
                                    {isTopMatch && <Sparkles className="w-2.5 h-2.5" />}
                                    <span className="text-[8px] font-black uppercase tracking-wider">{(match.score * 100).toFixed(0)}% Match</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {v.skills?.map(skill => (
                                  <span key={skill} className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                    skill === targetSkill 
                                      ? 'bg-[#0a84ff]/10 text-[#0a84ff] border-[#0a84ff]/20' 
                                      : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]'
                                  }`}>
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          {issue.assignedTo === v.uid ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeploy(v.uid);
                              }}
                              disabled={isDeploying}
                              className="flex flex-col items-end gap-1 hover:scale-110 transition-transform p-1"
                            >
                              {match && (
                                <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tighter">{match.estimatedDeploymentTime} ETA</span>
                              )}
                              <UserCheck className={`w-5 h-5 ${isTopMatch ? 'text-amber-500' : 'text-[#0a84ff]'}`} />
                            </button>
                          )}
                        </div>
                        {match && (
                          <div 
                            className="px-4 py-1.5 bg-amber-500/5 border-l-2 border-amber-500/30 ml-4 rounded-r-lg cursor-help"
                            onClick={() => setViewingPersonnel(v)}
                          >
                            <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-relaxed italic">
                              "{match.reasoning}"
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowAllVolunteers(true)}
              className="w-full py-3 bg-[var(--bg)] hover:bg-[var(--hover)] border border-[var(--border)] text-[var(--text-secondary)] font-bold rounded-xl text-xs transition-colors shadow-sm"
            >
              View All Personnel
            </button>
          </div>
        ) : (
          <button className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] font-bold py-4 rounded-xl text-[10px] tracking-widest cursor-not-allowed uppercase shadow-sm">
            Waiting for admin assignment
          </button>
        )}
      </div>

      {/* All Volunteers Modal */}
      <AnimatePresence>
        {showAllVolunteers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">All Volunteers</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">Categorized by specialization</p>
                </div>
                <button
                  onClick={() => setShowAllVolunteers(false)}
                  className="w-8 h-8 rounded-full bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar space-y-6">
                {ALL_SKILLS.map(skill => {
                  const chunk = volunteers.filter(v => v.skills?.includes(skill));
                  if (chunk.length === 0) return null;

                  return (
                    <div key={skill} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-px bg-[var(--border)] flex-1" />
                        <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-full">
                          {skill}
                        </span>
                        <div className="h-px bg-[var(--border)] flex-1" />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {chunk.map(v => {
                          const match = smartMatches.find(m => m.userId === v.uid);
                          const isTopMatch = match && match.score >= 0.8;

                          return (
                            <div key={v.uid} className="space-y-1">
                              <button
                                disabled={isDeploying || issue.assignedTo === v.uid}
                                onClick={() => {
                                  handleDeploy(v.uid);
                                  setShowAllVolunteers(false);
                                }}
                                className={`w-full p-3 rounded-xl flex items-center justify-between transition-all border ${
                                  issue.assignedTo === v.uid 
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 pointer-events-none' 
                                    : isTopMatch
                                      ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-500/30 text-[var(--text-primary)] hover:border-amber-500'
                                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--hover)] hover:border-[var(--text-secondary)]'
                                }`}
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs uppercase shrink-0 border font-bold ${
                                    issue.assignedTo === v.uid 
                                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                                      : isTopMatch
                                        ? 'bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400'
                                        : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-secondary)]'
                                  }`}>{v.name.charAt(0)}</div>
                                  <div className="flex flex-col items-start overflow-hidden">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold truncate">{v.name}</span>
                                      {match && (
                                        <span className={`text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded border ${isTopMatch ? 'bg-amber-500 text-white border-amber-600' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'}`}>
                                          {(match.score * 100).toFixed(0)}%
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{v.skills?.length || 0} Skills</span>
                                  </div>
                                </div>
                                {issue.assignedTo === v.uid ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  <div className="flex flex-col items-end gap-0.5">
                                    {match && (
                                       <span className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tighter">{match.estimatedDeploymentTime} ETA</span>
                                    )}
                                    <Navigation className={`w-4 h-4 ${isTopMatch ? 'text-amber-500' : 'text-[var(--text-secondary)]'} opacity-50`} />
                                  </div>
                                )}
                              </button>
                              {match && isTopMatch && (
                                <div className="px-3 py-1 bg-amber-500/5 border-l border-amber-500/20 ml-4 rounded-r-lg">
                                  <p className="text-[9px] text-[var(--text-secondary)] font-medium leading-relaxed italic truncate">
                                    {match.reasoning}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    <AnimatePresence>
        {viewingPersonnel && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setViewingPersonnel(null)}
               className="absolute inset-0 bg-black/60 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-lg bg-[var(--bg)] border border-[var(--border)] rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
             >
                {/* Modal Header */}
                <div className="p-6 border-b border-[var(--border)] bg-[var(--surface)] relative">
                   <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-2xl flex items-center justify-center text-2xl font-bold text-[var(--accent)]">
                        {viewingPersonnel.name.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">{viewingPersonnel.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded border border-[var(--accent)]/20">Volunteer</span>
                           <span className="text-[10px] text-[var(--text-secondary)] font-medium">{viewingPersonnel.email}</span>
                        </div>
                      </div>
                   </div>
                   <button 
                     onClick={() => setViewingPersonnel(null)}
                     className="absolute top-6 right-6 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                   >
                      <X className="w-5 h-5" />
                   </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                   <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                         <FileText className="w-3.5 h-3.5" /> Background Brief
                      </h4>
                      <div className="p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm">
                         <p className="text-sm text-[var(--text-primary)] leading-relaxed italic">
                            "{viewingPersonnel.bio || 'Detailed bio trace not available for this specialist.'}"
                         </p>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                         <ShieldCheck className="w-3.5 h-3.5" /> Verified Skills
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                         {viewingPersonnel.skills?.map(skill => (
                           <span key={skill} className="px-3 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[11px] font-bold text-[var(--text-primary)] capitalize">
                             {skill}
                           </span>
                         ))}
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Contact</h4>
                        <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-primary)]">
                           {viewingPersonnel.phone || 'N/A'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Availability</h4>
                        <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-bold text-emerald-500 uppercase">
                           {viewingPersonnel.availability || 'Immediate'}
                        </div>
                      </div>
                   </div>
                </div>

                <div className="p-6 bg-[var(--surface)] border-t border-[var(--border)] flex gap-3">
                   <button 
                     onClick={() => setViewingPersonnel(null)}
                     className="flex-1 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                   >
                     Close Info
                   </button>
                   {issue.assignedTo !== viewingPersonnel.uid && (
                     <button 
                       onClick={() => {
                          handleDeploy(viewingPersonnel.uid);
                          setViewingPersonnel(null);
                       }}
                       className="flex-[2] py-3 bg-[var(--accent)] text-white rounded-xl text-xs font-bold shadow-lg hover:opacity-90 transition-opacity"
                     >
                       Confirm Deployment
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
