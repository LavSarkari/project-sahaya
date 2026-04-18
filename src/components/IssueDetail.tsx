import React, { useState, useEffect } from 'react';
import { Brain, ShieldAlert, Clock, Map, Navigation, Info, ExternalLink, MapPin, CheckCircle2, Activity, Filter, Wrench, Sparkles, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { Issue } from '../types';
import { generateRecommendation } from '../lib/ai';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';

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
  const [skillFilter, setSkillFilter] = useState<string>('all');

  useEffect(() => {
    const fetchRec = async () => {
      if (!issue) return;
      setLoading(true);
      const recommendation = await generateRecommendation(issue);
      setAiRec(recommendation);
      setLoading(false);
    };

    fetchRec();
  }, [issue]);

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

  const filteredVolunteers = (skillFilter === 'all' 
    ? volunteers 
    : volunteers.filter(v => v.skills?.includes(skillFilter)))
    .sort((a, b) => {
      const targetSkill = issue ? CATEGORY_SKILL_MAP[issue.category] : '';
      if (!targetSkill) return 0;
      const aMatches = a.skills?.includes(targetSkill) ? 1 : 0;
      const bMatches = b.skills?.includes(targetSkill) ? 1 : 0;
      return bMatches - aMatches;
    });

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
    // ... same empty state
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900/10 h-full p-12">
        <div className="text-center max-w-xs space-y-4">
          <div className="w-10 h-10 rounded border border-white/5 flex items-center justify-center mx-auto bg-slate-900/40">
            <Info className="w-4 h-4 text-slate-700" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Awaiting Signal</h3>
            <p className="text-[10px] text-slate-700 font-sans uppercase">Select an incident from the log to initialize telemetry</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/20 relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-7 custom-scrollbar">
        {/* Header Section */}
        <section className="relative">
          <div className="flex items-center gap-2.5 mb-2.5">
            <span className="text-[8px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 border border-white/5 uppercase">
              ID: {issue.id}
            </span>
            {issue.priority === 'HIGH' && (
              <span className="text-[7.5px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 border border-rose-500/20 uppercase tracking-tighter">
                CRITICAL SIGNAL
              </span>
            )}
          </div>
          
          <h2 className="text-xl font-sans font-bold text-white leading-tight mb-3 pr-10 tracking-tight">
            {issue.title}
          </h2>
          
          <div className="flex items-center gap-2.5 text-slate-400 text-[9px] font-bold uppercase tracking-wide">
            <MapPin className="w-3 h-3 text-emerald-500" />
            <span className="text-slate-300">{issue.location}</span>
            <div className="w-0.5 h-0.5 rounded-full bg-slate-700" />
            <span className="font-mono text-slate-500">{issue.areaId.toUpperCase()}</span>
          </div>
        </section>

        {/* AI Analysis Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <h3 className="text-[8.5px] font-bold text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <Brain className="w-2.5 h-2.5 text-emerald-500" />
              Strategic Coordination
            </h3>
            <div className="text-[7.5px] font-mono text-emerald-500/40 uppercase tracking-widest">Ver: 3.0-FLASH</div>
          </div>
          
          <div className={`p-4 rounded border transition-all duration-700 ${
            loading ? 'bg-slate-900/40 border-white/5' : 'bg-emerald-500/[0.02] border-emerald-500/10'
          }`}>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 py-1"
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-3 h-3 text-emerald-500 animate-spin" />
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Synthesizing...</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-1.5 w-full bg-white/5 rounded animate-pulse" />
                    <div className="h-1.5 w-3/4 bg-white/5 rounded animate-pulse" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {aiRec || issue.aiRecommendation}
                  </p>
                  
                  <div className="mt-5 grid grid-cols-2 gap-px bg-white/5 border border-white/5 overflow-hidden">
                    <div className="bg-slate-950/40 p-3">
                      <div className="text-[7.5px] text-slate-600 uppercase mb-1.5 font-bold tracking-widest">Projected ETA</div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-white">
                        <Clock className="w-2.5 h-2.5 text-emerald-500" />
                        {issue.eta}
                      </div>
                    </div>
                    <div className="bg-slate-950/40 p-3">
                      <div className="text-[7.5px] text-slate-600 uppercase mb-1.5 font-bold tracking-widest">Impact Factor</div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-white">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                        {issue.peopleAffected.toString().padStart(2, '0')} SOULS
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Risk Assessment */}
        <section className="space-y-2.5">
          <div className="p-3 border-l-2 border-rose-500/30 bg-rose-500/[0.03]">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldAlert className="w-2.5 h-2.5 text-rose-500" />
              <span className="text-[7.5px] font-bold text-rose-500 uppercase tracking-widest">Intelligence Report</span>
            </div>
            <p className="text-[11px] text-rose-100/60 leading-relaxed italic">
              "{issue.riskMessage}"
            </p>
          </div>
        </section>

        {/* Multi-Signal Verification Log */}
        {issue.sourceDescriptions && issue.sourceDescriptions.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
              <h3 className="text-[8.5px] font-bold text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
                <Activity className="w-2.5 h-2.5 text-indigo-500" />
                Signal Pipeline Log ({issue.signalCount || 1} Sources)
              </h3>
            </div>
            <div className="space-y-2">
              {issue.sourceDescriptions.map((desc, i) => (
                <div key={i} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[7px] font-mono text-slate-500 uppercase">Input Node #{i + 1}</span>
                    <span className="text-[7px] font-mono text-slate-700 uppercase">Verified</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{desc}</p>
                </div>
              ))}
              {issue.signalCount && issue.signalCount > 1 && (
                <div className="pt-2 px-1">
                   <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest leading-relaxed">
                     ⚡ System Confidence grew by {( (issue.signalCount - 1) * 8 )}% due to cross-verification.
                   </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Telemetry Grid */}
        <section className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 border border-white/5 bg-slate-900/10">
              <div className="text-[7.5px] text-slate-600 uppercase mb-1.5 font-bold tracking-widest">Latitude</div>
              <div className="font-mono text-[10px] text-slate-300">{issue.coordinates.lat.toFixed(6)}</div>
            </div>
            <div className="p-3 border border-white/5 bg-slate-900/10">
              <div className="text-[7.5px] text-slate-600 uppercase mb-1.5 font-bold tracking-widest">Longitude</div>
              <div className="font-mono text-[10px] text-slate-300">{issue.coordinates.lng.toFixed(6)}</div>
            </div>
          </div>
        </section>
      </div>

      <div className="px-4 py-3.5 bg-slate-950 border-t border-white/5 space-y-3">
        {profile?.role === 'admin' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between pl-1">
              <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Assign Specialized Support</div>
              <div className="flex items-center gap-2">
                <Filter className="w-2.5 h-2.5 text-slate-700" />
                <select 
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="bg-transparent text-[8px] font-bold text-slate-400 uppercase tracking-widest outline-none border-b border-white/5 pb-0.5 focus:border-emerald-500/50 transition-all cursor-pointer"
                >
                  <option value="all">Every Specialization</option>
                  {ALL_SKILLS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {filteredVolunteers.length === 0 ? (
                <div className="text-[10px] text-slate-600 italic p-3 border border-white/5 rounded flex items-center justify-center gap-2">
                  <Activity className="w-3 h-3 opacity-30" />
                  No personnel detected with this specialization
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                    {filteredVolunteers.map(v => {
                    const targetSkill = issue ? CATEGORY_SKILL_MAP[issue.category] : '';
                    const isRecommended = targetSkill && v.skills?.includes(targetSkill);

                    return (
                      <button
                        key={v.uid}
                        disabled={isDeploying || issue.assignedTo === v.uid}
                        onClick={() => handleDeploy(v.uid)}
                        className={`w-full py-3 px-4 rounded-xl flex items-center justify-between transition-all border ${
                          issue.assignedTo === v.uid 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 pointer-events-none' 
                            : isRecommended
                              ? 'bg-indigo-500/5 border-indigo-500/20 text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/30'
                              : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] uppercase shrink-0 border font-bold transition-all ${
                            isRecommended ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-slate-800 border-white/5'
                          }`}>{v.name.charAt(0)}</div>
                          <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                            <div className="flex items-center gap-1.5 w-full">
                              <span className="text-[11px] font-bold tracking-tight truncate text-left">{v.name}</span>
                              {isRecommended && (
                                <div className="flex items-center gap-0.5 px-1 py-0.5 bg-indigo-500/20 rounded-[2px] border border-indigo-500/30">
                                  <Sparkles className="w-2 h-2 text-indigo-400" />
                                  <span className="text-[6px] font-black text-indigo-400 uppercase tracking-tighter">Matched</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {v.skills?.map(skill => (
                                <span key={skill} className={`text-[6px] font-black uppercase tracking-tighter px-1 py-0.5 rounded-[1px] border ${
                                  skill === targetSkill 
                                    ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' 
                                    : 'bg-white/5 text-slate-500 border-white/5'
                                }`}>
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        {issue.assignedTo === v.uid ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : isRecommended ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[7px] font-bold text-indigo-400 uppercase tracking-widest hidden sm:inline">Priority Match</span>
                            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                          </div>
                        ) : (
                          <Navigation className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <button className="w-full bg-slate-800 text-slate-400 font-bold py-3 rounded-xl text-[9px] tracking-[0.25em] cursor-not-allowed uppercase">
            Awaiting Command Assignment
          </button>
        )}
      </div>
    </div>
  );
};
