import React from 'react';
import { motion } from 'motion/react';
import { Shield, Users, Activity, Zap, Globe, Heart, ChevronRight, Lock, Satellite } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30 overflow-x-hidden overflow-y-auto">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08)_0%,transparent_50%)]" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <div className="grid-pattern opacity-10 absolute inset-0" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Zap className="text-white w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white leading-none">SAHAYA</h1>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.3em] mt-1">Command v4.0</p>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Network</a>
            <a href="#impact" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Impact</a>
            <a href="#security" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Protocols</a>
          </div>
          <button 
            onClick={onGetStarted}
            className="px-5 py-2.5 bg-white text-black text-[11px] font-bold uppercase tracking-widest rounded-full hover:bg-emerald-500 hover:text-white transition-all shadow-xl active:scale-95"
          >
            Terminal Access
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-40">
        <div className="grid lg:grid-template-columns-[1.2fr_0.8fr] gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Global Crisis Mitigation Network</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-8">
              ORCHESTRATING <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-500">RESILIENCE.</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-xl leading-relaxed mb-10 font-medium">
              Sahaya is the next-generation coordination layer for humanitarian operations. 
              We bridge the gap between reported signals and tactical intervention through 
              distributed intelligence and real-time logistics.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(16,185,129,0.2)] group"
              >
                Enter Dashboard
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800" />
                  ))}
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                  <span className="text-white">1,200+</span> Volunteers <br /> Active Now
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:block"
          >
            <div className="aspect-square rounded-[40px] border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-1 overflow-hidden">
               <div className="w-full h-full rounded-[38px] bg-slate-900/50 flex items-center justify-center relative">
                  <Satellite className="w-32 h-32 text-emerald-500/20 absolute top-10 right-10" />
                  <div className="p-8 w-full">
                     <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                          <Activity className="text-orange-500 w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Hazard</p>
                          <h4 className="text-lg font-black text-white leading-none">Sector 4 Displacement</h4>
                        </div>
                     </div>
                     <div className="space-y-4">
                        {[1,2,3].map(i => (
                          <div key={i} className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.random() * 60 + 20}%` }}
                              transition={{ duration: 2, delay: i * 0.2 }}
                              className="h-full bg-emerald-500/40"
                            />
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
            {/* Floating Accents */}
            <div className="absolute -bottom-6 -left-6 px-4 py-3 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl">
               <div className="flex items-center gap-3">
                  <Shield className="text-indigo-400 w-5 h-5" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest underline decoration-indigo-500/50 underline-offset-4">Secure Link Established</span>
               </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features Table Style */}
      <section id="features" className="relative z-10 border-t border-white/5 py-24 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-template-columns-[1fr_3fr] gap-12">
            <div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-4">Core Protocols</p>
              <h3 className="text-4xl font-black text-white tracking-tighter leading-none italic-small">System <br /> Capabilities</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Globe className="w-5 h-5" />} 
                title="Unified Logistics" 
                desc="A single pane of glass for all humanitarian assets and requests."
              />
              <FeatureCard 
                icon={<Users className="w-5 h-5" />} 
                title="Rapid Vetting" 
                desc="AI-assisted personnel verification for lightning-fast deployment."
              />
              <FeatureCard 
                icon={<Lock className="w-5 h-5" />} 
                title="Encrypted Comms" 
                desc="End-to-end telemetry protection for sensitive ground operations."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Interaction */}
      <footer className="relative z-10 py-12 border-t border-white/5 text-center">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Sahaya Command Interface • Est. 2024</p>
        <div className="flex items-center justify-center gap-6">
          <Heart className="w-4 h-4 text-rose-500 fill-current opacity-20" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Designed for Humanity</span>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group">
    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      <div className="text-emerald-500">{icon}</div>
    </div>
    <h4 className="text-lg font-black text-white mb-2 leading-none uppercase tracking-tighter">{title}</h4>
    <p className="text-sm text-slate-500 leading-relaxed font-medium">{desc}</p>
  </div>
);
