import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { subscribeToIssues } from '../services/issueService';
import { 
  Issue, UserProfile, Category, SectorHealth, MisallocationAlert, OptimalAssignment 
} from '../types';
import { 
  computeSectorMatrix, detectMisallocations, computeOptimalAssignments, 
  computeAllocationStats 
} from '../services/allocationService';
import { auditGlobalAllocation } from '../services/aiService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, AlertTriangle, ArrowRightLeft, Shield, Activity, Target,
  Users, Zap, TrendingUp, ChevronRight, CheckCircle2, XCircle,
  MapPin, Sparkles, RefreshCw, ToggleLeft, ToggleRight, Clock,
  Heart, Package, Droplets, ShieldCheck, BarChart3
} from 'lucide-react';

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  'MEDICAL': <Heart className="w-3.5 h-3.5" />,
  'FOOD': <Package className="w-3.5 h-3.5" />,
  'WATER': <Droplets className="w-3.5 h-3.5" />,
  'SHELTER': <Users className="w-3.5 h-3.5" />,
  'SECURITY': <Shield className="w-3.5 h-3.5" />,
};

const STATUS_COLORS = {
  critical: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-500', dot: 'bg-rose-500' },
  strained: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-500', dot: 'bg-amber-500' },
  balanced: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-500', dot: 'bg-emerald-500' },
  surplus: { bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-500', dot: 'bg-sky-500' },
};

export const StrategicAllocation: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [volunteers, setVolunteers] = useState<UserProfile[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [isDeploying, setIsDeploying] = useState<string | null>(null);
  const [autopilot, setAutopilot] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Real-time data subscriptions
  useEffect(() => {
    const unsubIssues = subscribeToIssues((data) => setIssues(data));
    const qVol = query(collection(db, 'users'), where('role', '==', 'volunteer'));
    const unsubVol = onSnapshot(qVol, (snap) => {
      setVolunteers(snap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile)));
    });
    return () => { unsubIssues(); unsubVol(); };
  }, []);

  // Compute allocation matrix
  const sectorMatrix = useMemo(() => computeSectorMatrix(issues, volunteers), [issues, volunteers]);
  const alerts = useMemo(() => detectMisallocations(sectorMatrix, volunteers), [sectorMatrix, volunteers]);
  const optimalAssignments = useMemo(() => computeOptimalAssignments(issues, volunteers), [issues, volunteers]);
  const stats = useMemo(() => computeAllocationStats(issues, volunteers, sectorMatrix), [issues, volunteers, sectorMatrix]);

  // AI Strategic Summary
  const runAudit = useCallback(async () => {
    if (sectorMatrix.length === 0) return;
    setIsAuditing(true);
    
    const sectorSummary = sectorMatrix.map(s => 
      `${s.sectorName}: Status=${s.overallStatus}, Urgency=${s.urgencyScore}, Volunteers=${s.volunteerIds.length}`
    ).join('\n');

    const alertsSummary = alerts.length > 0 
      ? alerts.slice(0, 5).map(a => `[${a.type}] ${a.suggestion}`).join('\n')
      : 'No misallocations detected.';

    const summary = await auditGlobalAllocation(sectorSummary, alertsSummary);
    setAiSummary(summary);
    setIsAuditing(false);
    setLastRefresh(new Date());
  }, [sectorMatrix, alerts]);

  useEffect(() => {
    if (issues.length > 0 && volunteers.length > 0) {
      const timer = setTimeout(runAudit, 1200);
      return () => clearTimeout(timer);
    }
  }, [issues.length, volunteers.length]);

  // Deploy volunteer to issue
  const handleDeploy = async (assignment: OptimalAssignment) => {
    setIsDeploying(assignment.issueId);
    try {
      await updateDoc(doc(db, 'issues', assignment.issueId), {
        assignedTo: assignment.volunteerId,
        status: 'assigned'
      });
      await updateDoc(doc(db, 'users', assignment.volunteerId), {
        status: 'en-route',
        activeTaskId: assignment.issueId
      });
    } catch (err) {
      console.error('Deploy failed:', err);
    }
    setIsDeploying(null);
  };

  // Deploy all optimal assignments at once
  const handleDeployAll = async () => {
    for (const assignment of optimalAssignments) {
      await handleDeploy(assignment);
    }
  };

  const criticalAlerts = alerts.filter(a => a.type === 'CRITICAL_GAP');
  const otherAlerts = alerts.filter(a => a.type !== 'CRITICAL_GAP');

  return (
    <div className="flex-1 bg-[var(--bg)] overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
        
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-[var(--accent)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)]">Allocation Intelligence v2.0</span>
            </div>
            <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">Strategic Allocation</h1>
            <p className="text-[var(--text-secondary)] font-medium max-w-lg">
              Real-time supply-demand analysis across all sectors. Detect misallocations, optimize assignments, and redeploy resources intelligently.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={runAudit} 
              disabled={isAuditing}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              {isAuditing ? 'Auditing...' : 'Refresh Audit'}
            </button>
            <button
              onClick={() => setAutopilot(!autopilot)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                autopilot 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)]'
              }`}
            >
              {autopilot ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {autopilot ? 'Autopilot ON' : 'Manual Mode'}
            </button>
          </div>
        </header>

        {/* KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Active Issues', value: stats.totalActive, icon: <Activity className="w-4 h-4" />, color: 'text-[var(--accent)]' },
            { label: 'Unassigned', value: stats.unassignedCount, icon: <AlertTriangle className="w-4 h-4" />, color: stats.unassignedCount > 0 ? 'text-rose-500' : 'text-emerald-500' },
            { label: 'Standby', value: stats.standbyVolunteers, icon: <Users className="w-4 h-4" />, color: 'text-amber-500' },
            { label: 'Deployed', value: stats.deployedVolunteers, icon: <Zap className="w-4 h-4" />, color: 'text-emerald-500' },
            { label: 'Critical Sectors', value: stats.criticalSectors, icon: <Target className="w-4 h-4" />, color: stats.criticalSectors > 0 ? 'text-rose-500' : 'text-emerald-500' },
            { label: 'People Affected', value: stats.totalAffected > 999 ? `${(stats.totalAffected / 1000).toFixed(1)}K` : stats.totalAffected, icon: <Heart className="w-4 h-4" />, color: 'text-rose-400' },
            { label: 'Efficiency', value: `${stats.allocationEfficiency}%`, icon: <TrendingUp className="w-4 h-4" />, color: stats.allocationEfficiency >= 80 ? 'text-emerald-500' : stats.allocationEfficiency >= 50 ? 'text-amber-500' : 'text-rose-500' },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 space-y-2"
            >
              <div className={`${kpi.color}`}>{kpi.icon}</div>
              <div className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{kpi.value}</div>
              <div className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{kpi.label}</div>
            </motion.div>
          ))}
        </div>

        {/* AI Strategic Summary */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-[var(--accent)]/5 via-transparent to-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-3xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent)]/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.2em]">AI Strategic Assessment</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-bold text-[var(--text-secondary)]">
                <Clock className="w-3 h-3" />
                {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed font-medium">
              {isAuditing ? (
                <span className="flex items-center gap-2 text-[var(--accent)]">
                  <Activity className="w-4 h-4 animate-spin" /> Running global allocation audit...
                </span>
              ) : (
                aiSummary || 'Waiting for data to perform strategic assessment...'
              )}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Panel A: Sector Health Matrix */}
          <div className="xl:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
                Sector Health
              </h2>
              <span className="text-[9px] font-bold text-[var(--text-secondary)]">{sectorMatrix.length} sectors</span>
            </div>

            <div className="space-y-3">
              {sectorMatrix.map((sector, i) => {
                const colors = STATUS_COLORS[sector.overallStatus];
                const totalDemand = (Object.values(sector.demands) as { count: number; totalAffected: number; highPriority: number }[]).reduce((s, d) => s + d.count, 0);
                return (
                  <motion.div
                    key={sector.sectorId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`p-4 rounded-2xl border ${colors.border} ${colors.bg} space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${colors.dot} ${sector.overallStatus === 'critical' ? 'animate-pulse' : ''}`} />
                        <span className="text-sm font-bold text-[var(--text-primary)]">{sector.sectorName}</span>
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${colors.border} ${colors.text}`}>
                        {sector.overallStatus}
                      </span>
                    </div>
                    
                    {/* Demand bars */}
                    <div className="space-y-1.5">
                      {(['MEDICAL', 'FOOD', 'WATER', 'SHELTER', 'SECURITY'] as Category[]).map(cat => {
                        const d = sector.demands[cat];
                        if (d.count === 0) return null;
                        return (
                          <div key={cat} className="flex items-center gap-2">
                            <div className="w-5 flex justify-center opacity-60">{CATEGORY_ICONS[cat]}</div>
                            <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${d.highPriority > 0 ? 'bg-rose-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(100, d.count * 25)}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-bold text-[var(--text-secondary)] w-4 text-right">{d.count}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
                      <span className="text-[9px] font-bold text-[var(--text-secondary)]">
                        {totalDemand} issues • {sector.volunteerIds.length} volunteers
                      </span>
                      <span className="text-[9px] font-mono font-bold text-[var(--text-secondary)]">
                        URG: {sector.urgencyScore}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {sectorMatrix.length === 0 && (
                <div className="p-12 text-center border-2 border-dashed border-[var(--border)] rounded-3xl">
                  <BarChart3 className="w-8 h-8 text-[var(--text-secondary)] opacity-20 mx-auto mb-3" />
                  <p className="text-xs font-bold text-[var(--text-secondary)] opacity-50">No sector data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Panel B: Misallocation Alerts */}
          <div className="xl:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Misallocation Alerts
              </h2>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                criticalAlerts.length > 0 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              }`}>
                {criticalAlerts.length > 0 ? `${criticalAlerts.length} critical` : 'Clear'}
              </span>
            </div>

            <div className="space-y-3">
              {criticalAlerts.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                      </div>
                      <div>
                        <div className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Critical Gap</div>
                        <div className="text-xs font-bold text-[var(--text-primary)]">{alert.sectorName} — {alert.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-rose-500">{alert.urgencyScore}</div>
                      <div className="text-[7px] font-bold text-[var(--text-secondary)] uppercase">Urgency</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--text-primary)] font-medium leading-relaxed">{alert.suggestion}</p>
                  
                  {alert.suggestedVolunteerId && (
                    <button
                      onClick={async () => {
                        setIsDeploying(alert.id);
                        // Find the unassigned issue in this sector+category
                        const targetIssue = issues.find(i => 
                          i.areaId === alert.sector && 
                          i.category === alert.category && 
                          !i.assignedTo && 
                          i.status === 'reported'
                        );
                        if (targetIssue && alert.suggestedVolunteerId) {
                          await updateDoc(doc(db, 'issues', targetIssue.id), { assignedTo: alert.suggestedVolunteerId, status: 'assigned' });
                          await updateDoc(doc(db, 'users', alert.suggestedVolunteerId), { status: 'en-route', activeTaskId: targetIssue.id });
                        }
                        setIsDeploying(null);
                      }}
                      disabled={isDeploying === alert.id}
                      className="w-full py-2.5 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
                    >
                      {isDeploying === alert.id ? <Activity className="w-3 h-3 animate-spin" /> : <ArrowRightLeft className="w-3 h-3" />}
                      Redeploy Now
                    </button>
                  )}
                </motion.div>
              ))}

              {otherAlerts.slice(0, 4).map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className={`p-3 rounded-xl border space-y-1 ${
                    alert.type === 'SKILL_MISMATCH' ? 'border-amber-500/20 bg-amber-500/5' :
                    alert.type === 'SURPLUS' ? 'border-sky-500/20 bg-sky-500/5' :
                    'border-[var(--border)] bg-[var(--surface)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                      alert.type === 'SKILL_MISMATCH' ? 'bg-amber-500/20 text-amber-500' :
                      alert.type === 'SURPLUS' ? 'bg-sky-500/20 text-sky-500' :
                      'bg-[var(--hover)] text-[var(--text-secondary)]'
                    }`}>{alert.type.replace('_', ' ')}</span>
                    <span className="text-[9px] font-bold text-[var(--text-secondary)]">{alert.sectorName}</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-relaxed">{alert.suggestion}</p>
                </motion.div>
              ))}

              {alerts.length === 0 && (
                <div className="p-12 text-center border-2 border-dashed border-emerald-500/20 rounded-3xl bg-emerald-500/5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-40 mx-auto mb-3" />
                  <p className="text-xs font-bold text-emerald-500">All resources optimally allocated</p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">No misallocations detected across sectors</p>
                </div>
              )}
            </div>
          </div>

          {/* Panel C: Optimal Assignments */}
          <div className="xl:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                Optimal Assignments
              </h2>
              {optimalAssignments.length > 0 && (
                <button
                  onClick={handleDeployAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
                >
                  <Zap className="w-3 h-3" />
                  Deploy All ({optimalAssignments.length})
                </button>
              )}
            </div>

            <div className="space-y-3">
              {optimalAssignments.map((assignment, i) => (
                <motion.div
                  key={`${assignment.issueId}-${assignment.volunteerId}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3 hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[var(--text-primary)] truncate">{assignment.issueTitle}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <ArrowRightLeft className="w-3 h-3 text-[var(--accent)] shrink-0" />
                        <span className="text-[10px] font-bold text-[var(--accent)] truncate">{assignment.volunteerName}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className={`text-lg font-black ${assignment.score >= 0.7 ? 'text-emerald-500' : assignment.score >= 0.4 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {(assignment.score * 100).toFixed(0)}%
                      </div>
                      <div className="text-[7px] font-bold text-[var(--text-secondary)] uppercase">Match</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[9px] font-bold text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" />
                      {assignment.estimatedDistance.toFixed(1)}km
                    </span>
                    {assignment.skillMatch && (
                      <span className="flex items-center gap-1 text-emerald-500">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Skill Match
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-[var(--text-secondary)] italic leading-relaxed">"{assignment.reasoning}"</p>

                  <button
                    onClick={() => handleDeploy(assignment)}
                    disabled={isDeploying === assignment.issueId}
                    className="w-full py-2.5 bg-[var(--text-primary)] text-[var(--text-inverse)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    {isDeploying === assignment.issueId ? (
                      <Activity className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    Approve & Deploy
                  </button>
                </motion.div>
              ))}

              {optimalAssignments.length === 0 && (
                <div className="p-12 text-center border-2 border-dashed border-[var(--border)] rounded-3xl">
                  <Target className="w-8 h-8 text-[var(--text-secondary)] opacity-20 mx-auto mb-3" />
                  <p className="text-xs font-bold text-[var(--text-secondary)] opacity-50">No pending assignments</p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">All issues are assigned or no standby volunteers</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
