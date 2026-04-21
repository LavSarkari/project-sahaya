import React from 'react';
import { motion } from 'motion/react';
import { Shield, Users, Activity, Zap, Heart, ChevronRight, Lock, Map, Network, Cpu, ShieldCheck, Brain, ArrowRightLeft, BarChart3, Layers, Eye, UserCheck, AlertTriangle, Sparkles } from 'lucide-react';
import { getGlobalStats } from '../services/issueService';

interface LandingPageProps {
  onGetStarted: () => void;
  theme: 'light' | 'dark';
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, theme }) => {
  const [stats, setStats] = React.useState({ activeIssues: 0, activeVolunteers: 0 });

  React.useEffect(() => {
    const loadData = async () => {
      const globalStats = await getGlobalStats();
      setStats({
        activeIssues: globalStats.activeIssues,
        activeVolunteers: globalStats.activeVolunteers
      });
    };
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen bg-[var(--bg)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent)]/30 overflow-x-hidden transition-colors duration-500`}>
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[var(--bg)]" />
        <div className={`absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[var(--accent)]/10 blur-[120px] transition-opacity duration-1000 ${theme === 'light' ? 'opacity-40' : 'opacity-100'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#00d2ff]/5 blur-[150px] transition-opacity duration-1000 ${theme === 'light' ? 'opacity-30' : 'opacity-100'}`} />
        <div className={`absolute top-[40%] left-[60%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/5 blur-[120px] transition-opacity duration-1000 ${theme === 'light' ? 'opacity-20' : 'opacity-100'}`} />
        <div className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHYxSDB6TTAgMHY0MGgxVjB6IiBmaWxsPSJyZ2JhKDEyOCwxMjgsMTI4LDAuMDUpIi8+Cjwvc3ZnPg==')] ${theme === 'light' ? 'opacity-30' : 'opacity-60'}`} />
      </div>

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-8 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[var(--surface)]/50 backdrop-blur-2xl rounded-2xl flex items-center justify-center shadow-2xl shadow-[var(--accent)]/10 border border-[var(--border)] overflow-hidden relative group">
            <div className="absolute inset-0 bg-[var(--accent)]/10 blur-[20px] rounded-full scale-50 group-hover:scale-100 transition-transform duration-700" />
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain relative z-10 p-2" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] leading-none">Sahaya</h1>
            <p className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.2em] mt-1">Community Grid</p>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden md:flex items-center gap-8 px-6 py-2 rounded-full bg-[var(--surface)]/40 border border-[var(--border)] backdrop-blur-md">
            <a href="#problem" className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-wider">Problem</a>
            <a href="#features" className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-wider">Capabilities</a>
            <a href="#roles" className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-wider">Roles</a>
          </div>
          <button 
            onClick={onGetStarted}
            className="px-6 py-2.5 bg-[var(--text-primary)] text-[var(--text-inverse)] text-xs font-bold uppercase tracking-wider rounded-full hover:bg-opacity-90 hover:scale-105 transition-all shadow-xl active:scale-95"
          >
            Access Portal
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 pt-16 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Platform Online</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-[80px] font-black tracking-tighter mb-8 leading-[1.05] text-[var(--text-primary)]">
              Smart Resource <br />
              Allocation.
            </h1>
            
            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-lg leading-relaxed mb-4 font-medium">
              A unified coordination platform that aggregates scattered community data from multiple NGOs and field operations - to fix <strong className="text-[var(--text-primary)]">misallocation</strong>, not scarcity.
            </p>
            <p className="text-sm text-[var(--text-secondary)]/80 max-w-lg leading-relaxed mb-10">
              Resources exist. The problem is they're invisible to the people who need them most. Sahaya gives coordinators the visibility to deploy the right help, to the right place, instantly.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-4 bg-[var(--accent)] text-[var(--text-inverse)] font-bold rounded-2xl hover:shadow-[0_15px_30px_-10px_rgba(10,132,255,0.4)] transition-all flex items-center justify-center gap-3 group"
              >
                Launch Dashboard
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a 
                href="#problem"
                className="w-full sm:w-auto px-8 py-4 bg-[var(--surface)]/50 backdrop-blur-md text-[var(--text-primary)] font-bold rounded-2xl hover:bg-[var(--hover)] border border-[var(--border)] transition-all flex items-center justify-center"
              >
                See How It Works
              </a>
            </div>
            
            {/* Live Stats */}
            <div className="mt-12 p-4 rounded-2xl bg-[var(--surface)]/40 border border-[var(--border)] backdrop-blur-xl flex flex-wrap items-center gap-8 max-w-fit shadow-lg transition-colors">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-1">Active Signals</p>
                <div className="text-2xl font-black text-[var(--text-primary)]">{stats.activeIssues.toLocaleString()}</div>
              </div>
              <div className="w-px h-10 bg-[var(--border)] hidden sm:block" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--accent)] font-bold mb-1">Standby Volunteers</p>
                <div className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-2">
                  {stats.activeVolunteers.toLocaleString()}
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
                  </span>
                </div>
              </div>
              <div className="w-px h-10 bg-[var(--border)] hidden sm:block" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">Data Sources</p>
                <div className="text-2xl font-black text-[var(--text-primary)]">6</div>
              </div>
            </div>
          </motion.div>

          {/* Right - Data Silo Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:flex items-center justify-center h-full min-h-[500px]"
          >
            {/* Central Hub */}
            <div className="absolute z-20 flex flex-col items-center justify-center w-28 h-28 bg-[var(--accent)] rounded-[2rem] shadow-2xl shadow-[var(--accent)]/30 border border-[var(--text-inverse)]/20">
               <Brain className="text-[var(--text-inverse)] w-10 h-10 mb-1" />
               <span className="text-[8px] font-black text-[var(--text-inverse)] uppercase tracking-wider">SAHAYA</span>
            </div>

            {/* Data Source Nodes */}
            {[
              { icon: <Heart className="w-4 h-4 text-rose-500" />, label: 'Medical', delay: 0, pos: 'top-6 left-12', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
              { icon: <Zap className="w-4 h-4 text-amber-500" />, label: 'Food', delay: 0.8, pos: 'top-4 right-8', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
              { icon: <Shield className="w-4 h-4 text-emerald-500" />, label: 'NGO Data', delay: 1.6, pos: 'bottom-6 left-6', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
              { icon: <Activity className="w-4 h-4 text-indigo-500" />, label: 'Field', delay: 2.4, pos: 'bottom-8 right-12', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
              { icon: <Users className="w-4 h-4 text-sky-500" />, label: 'Blood', delay: 3.2, pos: 'top-[45%] left-0', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
              { icon: <ShieldCheck className="w-4 h-4 text-purple-500" />, label: 'Disability', delay: 4, pos: 'top-[40%] right-0', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
            ].map((node, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -12, 0],
                  x: [0, 8, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  delay: node.delay,
                  ease: "easeInOut"
                }}
                className={`absolute z-10 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl backdrop-blur-md border shadow-xl ${node.bg} ${node.border} ${node.pos}`}
              >
                {node.icon}
                <span className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{node.label}</span>
              </motion.div>
            ))}

            {/* Orbits */}
            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 500 500">
               <circle cx="250" cy="250" r="90" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="4 4" className="animate-[spin_20s_linear_infinite] text-[var(--accent)]" />
               <circle cx="250" cy="250" r="160" stroke="currentColor" strokeWidth="0.5" fill="none" strokeDasharray="8 8" className="animate-[spin_40s_linear_infinite_reverse] text-[var(--text-secondary)]" />
               <circle cx="250" cy="250" r="210" stroke="currentColor" strokeWidth="0.3" fill="none" className="text-[var(--text-secondary)]" />
            </svg>
            
          </motion.div>
        </div>
      </main>

      {/* THE PROBLEM */}
      <section id="problem" className="relative z-10 py-24 bg-[var(--bg)] transition-colors duration-500">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-16 items-center">
             <motion.div
               initial={{ opacity: 0, x: -30 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
             >
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" /> The Core Problem
                </p>
                <h2 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] tracking-tighter mb-8 leading-tight">
                  It's Not Scarcity. <br/>
                  It's <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500">Misallocation.</span>
                </h2>
                <div className="space-y-6 text-lg text-[var(--text-secondary)] font-medium leading-relaxed">
                  <p>
                    NGOs, social groups, and field teams collect valuable community data every day - food drive surveys, medical camp records, blood donation lists, disability program assessments. But this data is <strong className="text-[var(--text-primary)]">scattered across silos</strong>.
                  </p>
                  <p>
                    No one has the full picture. Volunteers go where they're told, not where they're needed. Resources pile up in one area while another suffers. The problem isn't that resources don't exist - <strong className="text-[var(--text-primary)]">it's that nobody can see them all at once.</strong>
                  </p>
                </div>

                {/* Before/After */}
                <div className="mt-10 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 text-xs font-bold">�-</span>
                    <span className="text-[var(--text-secondary)]">Food Drive data → <span className="text-rose-400">trapped in spreadsheets</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 text-xs font-bold">�-</span>
                    <span className="text-[var(--text-secondary)]">Medical Camp records → <span className="text-rose-400">different NGO database</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 text-xs font-bold">�-</span>
                    <span className="text-[var(--text-secondary)]">Field Reports → <span className="text-rose-400">lost in WhatsApp groups</span></span>
                  </div>
                  <div className="h-4" />
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-xs font-bold">✓</span>
                    <span className="text-[var(--text-primary)] font-semibold">Sahaya → <span className="text-emerald-400">one unified intelligence layer</span></span>
                  </div>
                </div>
             </motion.div>

             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 1, delay: 0.2 }}
               className="relative"
             >
                <div className="rounded-[3rem] border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-transparent p-6 md:p-8 shadow-2xl">
                   <div className="rounded-[2rem] bg-[var(--bg)] border border-[var(--border)] relative overflow-hidden flex flex-col p-6 shadow-2xl backdrop-blur-sm">
                     <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent" />
                     
                     <div className="flex items-center gap-2 mb-5">
                       <Brain className="w-4 h-4 text-[var(--accent)]" />
                       <span className="text-[9px] font-black text-[var(--accent)] uppercase tracking-[0.2em]">Allocation Engine</span>
                     </div>

                     {/* Simulated data flow */}
                     <div className="space-y-3">
                       {[
                         { source: '🍚 Food Drive', org: 'Feeding India', urgency: 'HIGH', color: 'amber' },
                         { source: '🏥 Medical Camp', org: 'Red Cross', urgency: 'CRITICAL', color: 'rose' },
                         { source: '🩸 Blood Drive', org: 'IMA Local', urgency: 'MED', color: 'sky' },
                         { source: '📋 Field Report', org: 'District Admin', urgency: 'HIGH', color: 'emerald' },
                       ].map((item, i) => (
                         <motion.div
                           key={i}
                           initial={{ opacity: 0, x: -10 }}
                           whileInView={{ opacity: 1, x: 0 }}
                           viewport={{ once: true }}
                           transition={{ delay: 0.3 + i * 0.15 }}
                           className="flex items-center gap-3 bg-[var(--surface)] p-3.5 rounded-xl border border-[var(--border)] hover:border-[var(--accent)]/30 transition-all group"
                         >
                           <span className="text-xl">{item.source.split(' ')[0]}</span>
                           <div className="flex-1 min-w-0">
                             <div className="text-xs font-bold text-[var(--text-primary)] truncate">{item.source.split(' ').slice(1).join(' ')}</div>
                             <div className="text-[9px] text-[var(--text-secondary)] font-medium">{item.org}</div>
                           </div>
                           <div className="flex items-center gap-2">
                             <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-${item.color}-500/10 text-${item.color}-500 border-${item.color}-500/20`}>
                               {item.urgency}
                             </span>
                             <ArrowRightLeft className="w-3 h-3 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                           </div>
                         </motion.div>
                       ))}
                     </div>

                     <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-between items-center text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                       <span className="flex items-center gap-1.5">
                         <Layers className="w-3 h-3" /> 4 Sources Aggregated
                       </span>
                       <span className="text-[var(--accent)] flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI PROCESSING</span>
                     </div>
                   </div>
                </div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - Platform Model */}
      <section id="roles" className="relative z-10 py-24 bg-[var(--surface)] border-t border-b border-[var(--border)] transition-colors duration-500">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <p className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest mb-4">Platform Architecture</p>
            <h2 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] tracking-tighter mb-6">
              One Platform. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-emerald-500">Every Stakeholder.</span>
            </h2>
            <p className="text-lg text-[var(--text-secondary)] font-medium">
              Sahaya isn't just for one NGO - it's the central coordination layer that sits above all organizations, giving each stakeholder exactly the access they need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Admin */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-[var(--bg)] border border-[var(--border)] p-8 rounded-[2rem] relative overflow-hidden group hover:border-[var(--accent)]/30 transition-all shadow-sm"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--accent)]/5 blur-[60px] rounded-full group-hover:bg-[var(--accent)]/15 transition-all duration-700" />
              <div className="w-14 h-14 bg-[var(--accent)]/10 text-[var(--accent)] rounded-2xl flex items-center justify-center mb-6 border border-[var(--accent)]/20 relative z-10">
                <Shield className="w-6 h-6" />
              </div>
              <div className="text-[9px] font-black text-[var(--accent)] uppercase tracking-[0.2em] mb-2">Administrator</div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3 relative z-10">Command Center</h3>
              <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed relative z-10 mb-6">
                District coordinators and umbrella NGOs see the complete picture - every crisis, every volunteer, every sector. Run AI audits, execute redeployments, manage the entire network.
              </p>
              <div className="space-y-2">
                {['Strategic Allocation Dashboard', 'Sector Health Matrix', 'AI-Powered Audit', 'One-Click Redeploy', 'Volunteer Vetting'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <div className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                    {f}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Volunteer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-[var(--bg)] border border-[var(--border)] p-8 rounded-[2rem] relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-sm"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 blur-[60px] rounded-full group-hover:bg-emerald-500/15 transition-all duration-700" />
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 relative z-10">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">Volunteer</div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3 relative z-10">Field Portal</h3>
              <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed relative z-10 mb-6">
                Vetted volunteers receive targeted task assignments based on their skills and proximity. Navigate to crisis locations, update status, and coordinate with headquarters in real-time.
              </p>
              <div className="space-y-2">
                {['Skill-Based Task Matching', 'GPS Navigation to Crisis', 'Real-Time Status Updates', 'Task Completion Tracking', 'Performance History'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    {f}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Reporter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-[var(--bg)] border border-[var(--border)] p-8 rounded-[2rem] relative overflow-hidden group hover:border-amber-500/30 transition-all shadow-sm"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 blur-[60px] rounded-full group-hover:bg-amber-500/15 transition-all duration-700" />
              <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/20 relative z-10">
                <Eye className="w-6 h-6" />
              </div>
              <div className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] mb-2">Reporter</div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3 relative z-10">Submit & Track</h3>
              <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed relative z-10 mb-6">
                NGO field workers and the public can report community needs, tag their data source (food drive, medical camp, etc.), and track resolution. Apply to become a volunteer.
              </p>
              <div className="space-y-2">
                {['AI-Analyzed Submissions', '6 Data Source Tags', 'GPS Location Tagging', 'Resolution Tracking', 'Volunteer Application'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <div className="w-1 h-1 rounded-full bg-amber-500" />
                    {f}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* BENTO GRID FEATURES */}
      <section id="features" className="relative z-10 py-24 bg-[var(--bg)] transition-colors duration-500">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          
          <div className="mb-16">
             <h2 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] tracking-tighter">
                Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-[var(--accent)]">Impact.</span>
             </h2>
             <p className="mt-4 text-lg text-[var(--text-secondary)] max-w-2xl font-medium">
               Sahaya fuses deep tech with humanitarian principles. Every feature exists to solve one problem: getting the right resources to the right people, faster.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Box 1 (Large) - Allocation Engine */}
            <div className="col-span-1 md:col-span-2 row-span-2 bg-gradient-to-br from-[var(--surface)] to-transparent border border-[var(--border)] p-8 md:p-12 rounded-[2rem] relative overflow-hidden group shadow-sm transition-colors">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/10 blur-[80px] rounded-full group-hover:bg-[var(--accent)]/20 transition-colors duration-700" />
              <div className="w-14 h-14 bg-[var(--accent)]/10 text-[var(--accent)] rounded-2xl flex items-center justify-center mb-8 border border-[var(--accent)]/20 relative z-10">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-4 relative z-10">Smart Allocation Engine</h3>
              <p className="text-[var(--text-secondary)] text-lg font-medium max-w-md relative z-10 leading-relaxed mb-6">
                Automatically computes sector health, detects misallocations (critical gaps, skill mismatches, surplus zones), and generates N:M optimal volunteer-to-crisis assignments using weighted algorithms.
              </p>
              <div className="flex flex-wrap gap-2 relative z-10">
                {['Sector Matrix', 'Gap Detection', 'Skill Matching', 'Urgency Scoring', 'Heatmap Density'].map(tag => (
                  <span key={tag} className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Box 2 - Heatmap */}
            <div className="col-span-1 bg-[var(--surface)] border border-[var(--border)] p-8 rounded-[2rem] hover:bg-[var(--hover)] transition-colors shadow-sm">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center mb-6 border border-rose-500/20">
                 <Map className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Tactical Heatmap</h3>
              <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed">
                Canvas-rendered demand density overlay on interactive maps. Switch between markers, heatmap, or combined view for complete situational awareness.
              </p>
            </div>

            {/* Box 3 - AI */}
            <div className="col-span-1 bg-[var(--surface)] border border-[var(--border)] p-8 rounded-[2rem] hover:bg-[var(--hover)] transition-colors shadow-sm">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20">
                 <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Gemini AI Intelligence</h3>
              <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed">
                Every report is analyzed by Google Gemini - extracting category, priority, risk level, and confidence. Duplicates are auto-merged. Global audits generate strategic briefs.
              </p>
            </div>

            {/* Box 4 (Wide bottom) - Multi-Source */}
            <div className="col-span-1 md:col-span-3 bg-gradient-to-r from-[var(--accent)]/5 to-indigo-500/5 border border-[var(--accent)]/10 p-8 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-8 shadow-sm">
              <div>
                <div className="w-12 h-12 bg-[var(--surface)] text-[var(--text-primary)] rounded-xl flex items-center justify-center mb-6 border border-[var(--border)]">
                   <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Multi-Source Data Aggregation</h3>
                <p className="text-[var(--text-secondary)] font-medium max-w-xl">
                  Break down data silos. Reports from food drives, medical camps, blood donations, disability programs, and NGO partners all flow into a single intelligence layer - tagged, categorized, and ready for allocation.
                </p>
              </div>
              <button onClick={onGetStarted} className="px-8 py-4 bg-[var(--text-primary)] text-[var(--text-inverse)] font-bold rounded-xl whitespace-nowrap hover:scale-105 transition-transform flex items-center gap-2 shadow-lg">
                Start Coordinating <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-[var(--border)] bg-[var(--surface)] transition-colors duration-500">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
           <div>
             <p className="text-xs font-bold text-[var(--text-secondary)]/50 uppercase tracking-widest">Sahaya v2.0 - Smart Resource Allocation</p>
             <p className="text-[10px] text-[var(--text-secondary)]/30 mt-1">Data-Driven Volunteer Coordination for Social Impact</p>
           </div>
           <div className="flex items-center gap-2 text-[var(--text-secondary)] bg-[var(--bg)] px-4 py-2 rounded-full border border-[var(--border)] shadow-sm">
             <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
             <span className="text-[10px] font-bold uppercase tracking-wider">सहाया - Help</span>
           </div>
        </div>
      </footer>
    </div>
  );
};
