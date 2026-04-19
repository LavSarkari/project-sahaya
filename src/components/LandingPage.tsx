import React from 'react';
import { motion, useAnimation, useInView } from 'motion/react';
import { Shield, Users, Activity, Zap, Heart, ChevronRight, Lock, Map, Network, Cpu, ShieldCheck, Sun, Moon } from 'lucide-react';
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
        {/* Soft elegant radial glowing orbs */}
        <div className={`absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[var(--accent)]/10 blur-[120px] transition-opacity duration-1000 ${theme === 'light' ? 'opacity-40' : 'opacity-100'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#00d2ff]/5 blur-[150px] transition-opacity duration-1000 ${theme === 'light' ? 'opacity-30' : 'opacity-100'}`} />
        <div className={`absolute top-[40%] left-[60%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/5 blur-[120px] transition-opacity duration-1000 ${theme === 'light' ? 'opacity-20' : 'opacity-100'}`} />
        
        {/* Grid pattern */}
        <div className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHYxSDB6TTAgMHY0MGgxVDB6IiBmaWxsPSJyZ2JhKDEyOCwxMjgsMTI4LDAuMDUpIi8+Cjwvc3ZnPg==')] ${theme === 'light' ? 'opacity-30' : 'opacity-60'}`} />
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
            <a href="#features" className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-wider">Capabilities</a>
            <a href="#impact" className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-wider">Mission</a>
            <a href="#security" className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-wider">Security</a>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onGetStarted}
              className="px-6 py-2.5 bg-[var(--text-primary)] text-[var(--text-inverse)] text-xs font-bold uppercase tracking-wider rounded-full hover:bg-opacity-90 hover:scale-105 transition-all shadow-xl active:scale-95"
            >
              Access Portal
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 pt-16 pb-32">
        {/* HEAR SECTION */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Network Online</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-[80px] font-black tracking-tighter mb-8 leading-[1.05] text-[var(--text-primary)]">
              Intelligent <br />
              Aid Coordination.
            </h1>
            
            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-lg leading-relaxed mb-10 font-medium">
              We bridge the gap between people in need and available volunteers through high-speed, compassionate, AI-driven coordination.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-4 bg-[var(--accent)] text-[var(--text-inverse)] font-bold rounded-2xl hover:shadow-[0_15px_30px_-10px_rgba(10,132,255,0.4)] transition-all flex items-center justify-center gap-3 group"
              >
                Launch Dashboard
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-4 bg-[var(--surface)]/50 backdrop-blur-md text-[var(--text-primary)] font-bold rounded-2xl hover:bg-[var(--hover)] border border-[var(--border)] transition-all flex items-center justify-center"
              >
                Learn How It Works
              </button>
            </div>
            
            {/* Live Stats Glass Bar */}
            <div className="mt-12 p-4 rounded-2xl bg-[var(--surface)]/40 border border-[var(--border)] backdrop-blur-xl flex flex-wrap items-center gap-8 max-w-fit shadow-lg transition-colors">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-1">Active Signals</p>
                <div className="text-2xl font-black text-[var(--text-primary)]">{stats.activeIssues.toLocaleString()}</div>
              </div>
              <div className="w-px h-10 bg-[var(--border)] hidden sm:block" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--accent)] font-bold mb-1">Standby Personnel</p>
                <div className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-2">
                  {stats.activeVolunteers.toLocaleString()}
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Animation (Nodes) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:flex items-center justify-center h-full min-h-[500px]"
          >
            {/* Central Node */}
            <div className="absolute z-20 flex flex-col items-center justify-center w-24 h-24 bg-[var(--accent)] rounded-[2rem] shadow-2xl shadow-[var(--accent)]/30 border border-[var(--text-inverse)]/20">
               <Heart className="text-[var(--text-inverse)] w-10 h-10 fill-[var(--text-inverse)]/20" />
            </div>

            {/* Orbiting Satellite Nodes */}
            {[
              { icon: <Shield className="w-5 h-5 text-emerald-500" />, delay: 0, pos: 'top-10 left-10', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
              { icon: <Zap className="w-5 h-5 text-amber-500" />, delay: 1, pos: 'bottom-10 right-10', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
              { icon: <Activity className="w-5 h-5 text-rose-500" />, delay: 2, pos: 'bottom-20 left-16', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
              { icon: <Users className="w-5 h-5 text-indigo-500" />, delay: 3, pos: 'top-16 right-16', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
            ].map((node, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -15, 0],
                  x: [0, 10, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  delay: node.delay,
                  ease: "easeInOut"
                }}
                className={`absolute z-10 w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-md border shadow-xl ${node.bg} ${node.border} ${node.pos}`}
              >
                {node.icon}
              </motion.div>
            ))}

            {/* Connecting lines SVG simulation (static background element) */}
            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 500 500">
               <circle cx="250" cy="250" r="100" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="4 4" className="animate-[spin_20s_linear_infinite] text-[var(--accent)]" />
               <circle cx="250" cy="250" r="180" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-[var(--text-secondary)]" />
               <path d="M 250 250 L 120 120" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" className="text-[var(--text-secondary)]" />
               <path d="M 250 250 L 380 380" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" className="text-[var(--text-secondary)]" />
            </svg>
            
          </motion.div>
        </div>
      </main>

      {/* MISSION SECTION */}
      <section id="impact" className="relative z-10 py-24 bg-[var(--bg)] transition-colors duration-500">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-16 items-center">
             <motion.div
               initial={{ opacity: 0, x: -30 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
             >
                <p className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest mb-4">Smart Resource Allocation</p>
                <h2 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] tracking-tighter mb-8 leading-tight">
                  Data-Driven Volunteer Coordination for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[#00d2ff]">Social Impact.</span>
                </h2>
                <div className="space-y-6 text-lg text-[var(--text-secondary)] font-medium leading-relaxed">
                  <p>
                    Local social groups and NGOs collect a lot of important information about community needs through paper surveys and field reports. However, this valuable data is often scattered across different places, making it hard to see the biggest problems clearly.
                  </p>
                  <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] mt-8 relative overflow-hidden group shadow-sm transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full group-hover:bg-emerald-500/20 transition-all duration-700" />
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Objective</h3>
                    <p className="text-[var(--text-secondary)] text-base leading-relaxed relative z-10">
                      Design a powerful system that gathers scattered community information to clearly show the most urgent local needs. Build a smart way to quickly match and connect available volunteers with the specific tasks and areas where they are needed most.
                    </p>
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
                <div className="aspect-square rounded-[3rem] border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-transparent flex items-center justify-center p-6 md:p-8 shadow-2xl">
                   <div className="w-full h-full rounded-[2rem] bg-[var(--bg)] border border-[var(--border)] relative overflow-hidden flex flex-col p-6 shadow-2xl backdrop-blur-sm">
                     <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent" />
                     <div className="flex-1 flex flex-col gap-4 justify-center">
                       {[1, 2, 3].map(i => (
                         <div key={i} className="bg-[var(--surface)] h-16 w-full rounded-xl border border-[var(--border)] flex items-center px-4 hover:border-[var(--accent)]/30 hover:bg-[var(--hover)] transition-all cursor-pointer shadow-sm">
                            <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mr-4 shrink-0">
                              <Users className="w-4 h-4 text-[var(--accent)]" />
                            </div>
                            <div className="flex-1">
                               <div className="h-2 w-24 bg-[var(--text-secondary)]/20 rounded-full mb-2" />
                               <div className="h-2 w-16 bg-[var(--text-secondary)]/10 rounded-full" />
                            </div>
                            <div className="w-6 h-6 border gap-1 border-emerald-500/30 rounded-full flex items-center justify-center shrink-0">
                               <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            </div>
                         </div>
                       ))}
                     </div>
                     <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-between items-center text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                       <span>Telemetry Parsed</span>
                       <span className="text-[var(--accent)] flex items-center gap-1"><Zap className="w-3 h-3" /> SYNCHRONIZED</span>
                     </div>
                   </div>
                </div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* BENTO GRID FEATURES SECTION */}
      <section id="features" className="relative z-10 py-24 bg-[var(--surface)] border-t border-[var(--border)] transition-colors duration-500">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          
          <div className="mb-16">
             <h2 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] tracking-tighter">
                Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-[var(--accent)]">Impact.</span>
             </h2>
             <p className="mt-4 text-lg text-[var(--text-secondary)] max-w-2xl font-medium">
               Sahaya fuses deep tech with humanitarian principles. We use advanced routing and intelligence to put the right resources in the right place, immediately.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Box 1 (Large) - AI Matching */}
            <div className="col-span-1 md:col-span-2 row-span-2 bg-gradient-to-br from-[var(--bg)] to-transparent border border-[var(--border)] p-8 md:p-12 rounded-[2rem] relative overflow-hidden group shadow-sm transition-colors">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/10 blur-[80px] rounded-full group-hover:bg-[var(--accent)]/20 transition-colors duration-700" />
              <div className="w-14 h-14 bg-[var(--accent)]/10 text-[var(--accent)] rounded-2xl flex items-center justify-center mb-8 border border-[var(--accent)]/20 relative z-10">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-4 relative z-10">Gemini Intelligence AI</h3>
              <p className="text-[var(--text-secondary)] text-lg font-medium max-w-md relative z-10 leading-relaxed">
                Sahaya automatically analyzes incoming signals and instantly matches them with the closest, most capable volunteers using Google Gemini's advanced contextual modeling.
              </p>
            </div>

            {/* Box 2 - Real-time Map */}
            <div className="col-span-1 bg-[var(--bg)] border border-[var(--border)] p-8 rounded-[2rem] hover:bg-[var(--hover)] transition-colors shadow-sm">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20">
                 <Map className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Tactical Map View</h3>
              <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed">
                A live, interactive coordinate grid providing operators with total situational awareness of regional crises simultaneously.
              </p>
            </div>

            {/* Box 3 - Security */}
            <div className="col-span-1 bg-[var(--bg)] border border-[var(--border)] p-8 rounded-[2rem] hover:bg-[var(--hover)] transition-colors shadow-sm">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mb-6 border border-amber-500/20">
                 <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Zero-Trust Verification</h3>
              <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed">
                Volunteers undergo stringent vetting prior to deployment, ensuring that operations on the ground remain secure.
              </p>
            </div>

            {/* Box 4 (Wide bottom) - Rapid Deploy */}
            <div className="col-span-1 md:col-span-3 bg-gradient-to-r from-[var(--accent)]/5 to-indigo-500/5 border border-[var(--accent)]/10 p-8 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-8 shadow-sm">
              <div>
                <div className="w-12 h-12 bg-[var(--surface)] text-[var(--text-primary)] rounded-xl flex items-center justify-center mb-6 border border-[var(--border)]">
                   <Network className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">High-Speed Personnel Deployment</h3>
                <p className="text-[var(--text-secondary)] font-medium max-w-xl">
                  Mobilize your response teams in seconds. Our dispatch protocol bypasses tedious bureaucracy, sending coordinates directly to the field operators' mobile devices.
                </p>
              </div>
              <button onClick={onGetStarted} className="px-8 py-4 bg-[var(--text-primary)] text-[var(--text-inverse)] font-bold rounded-xl whitespace-nowrap hover:scale-105 transition-transform flex items-center gap-2 shadow-lg">
                Join the Network <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-[var(--border)] bg-[var(--bg)] transition-colors duration-500">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between">
           <p className="text-xs font-bold text-[var(--text-secondary)]/50 uppercase tracking-widest">Sahaya Phase 1.0</p>
           <div className="flex items-center gap-2 text-[var(--text-secondary)] bg-[var(--surface)] px-4 py-2 rounded-full border border-[var(--border)] shadow-sm">
             <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
             <span className="text-[10px] font-bold uppercase tracking-wider">Compassion Engine</span>
           </div>
        </div>
      </footer>
    </div>
  );
};

