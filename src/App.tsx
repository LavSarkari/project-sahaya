import React, { useState, useMemo } from 'react';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { IssueFeed } from './components/IssueFeed';
import { IssueDetail } from './components/IssueDetail';
import { MapView } from './components/MapView';
import { SummaryBar } from './components/SummaryBar';
import { MOCK_ISSUES, AREAS } from './constants';
import { Issue } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Map as MapIcon, Activity } from 'lucide-react';

import { subscribeToIssues } from './services/issueService';
import { useAuth } from './contexts/AuthContext';
import { isAdminEmail } from './lib/utils';

import { ReportIssue } from './components/ReportIssue';
import { LoginPage } from './components/LoginPage';
import { VolunteerView } from './components/VolunteerView';
import { PersonnelManager } from './components/PersonnelManager';
import { LandingPage } from './components/LandingPage';

export default function App() {
  const { user, profile, loading } = useAuth();
  const [issues, setIssues] = useState<Issue[]>(MOCK_ISSUES);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'personnel' | 'reports' | 'reporter' | 'ops'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  // Sync active view with role on initial login
  React.useEffect(() => {
    if (user || profile) {
      const isAdmin = profile?.role === 'admin' || isAdminEmail(user?.email);
      
      if (isAdmin) {
        setActiveView('dashboard');
      } else if (profile?.role === 'reporter') {
        setActiveView('reporter');
      } else if (profile?.role === 'volunteer') {
        setActiveView('ops');
      }
    }
  }, [profile, user]);

  // Map state for smooth panning
  const [mapCenter, setMapCenter] = useState<[number, number]>([26.87, 80.95]);
  const [mapZoom, setMapZoom] = useState<number>(13);

  // Real-time Firestore Subscription
  React.useEffect(() => {
    if (!user) {
      setIssues(MOCK_ISSUES);
      return;
    }

    const unsubscribe = subscribeToIssues((updatedIssues) => {
      if (updatedIssues.length > 0) {
        setIssues(updatedIssues);
      } else {
        setIssues(MOCK_ISSUES);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const filteredIssues = useMemo(() => {
    if (!selectedAreaId) return issues;
    return issues.filter(issue => issue.areaId === selectedAreaId);
  }, [selectedAreaId, issues]);

  const selectedAreaName = useMemo(() => {
    if (!selectedAreaId) return 'All Areas';
    return AREAS.find(a => a.id === selectedAreaId)?.name || 'Unknown Sector';
  }, [selectedAreaId]);

  // Loading state
  if (loading) {
     return (
       <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center">
         <Activity className="w-8 h-8 text-emerald-500 animate-pulse mb-4" />
         <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Calibrating Telemetry...</div>
       </div>
     );
  }

  // Show Landing Page first
  if (showLanding && !user) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  // Auth Protection
  if (!user) {
    return <LoginPage />;
  }

  const handleSelectArea = (id: string | null) => {
    setSelectedAreaId(id);
    setSelectedIssue(null); 
    setMapCenter([26.87, 80.95]);
    setMapZoom(13);
  };

  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setMapCenter([issue.coordinates.lat, issue.coordinates.lng]);
    setMapZoom(15);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-brand-bg relative text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background Layers */}
      <div className="fixed inset-0 bg-slate-950 z-[-2] pointer-events-none" />
      <div className="fixed inset-0 grid-pattern z-[-1] pointer-events-none opacity-20" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(16,185,129,0.05)_0%,transparent_50%)] z-[-1] pointer-events-none" />

      <TopNav onMenuClick={() => setIsSidebarOpen(true)} activeView={activeView} />
      
      <div className="flex flex-1 overflow-hidden relative z-10 w-full lg:flex-row flex-col">
        <Sidebar 
          selectedAreaId={selectedAreaId} 
          onSelectArea={(id) => {
            handleSelectArea(id);
            setIsSidebarOpen(false);
          }}
          activeView={activeView}
          onViewChange={(v) => {
            setActiveView(v);
            setIsSidebarOpen(false);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          issues={issues}
        />
        
        <main className="flex-1 overflow-hidden relative flex flex-col">
          {activeView === 'dashboard' ? (
            <div className="flex-1 flex flex-col overflow-hidden w-full relative">
              <SummaryBar issues={filteredIssues} />
              
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full">
                {/* Map Column - Optimized height on mobile */}
                <div className="h-[320px] lg:h-full lg:flex-1 relative border-b lg:border-b-0 lg:border-l border-white/5 bg-slate-950 overflow-hidden order-first lg:order-last">
                  <MapView 
                    issues={filteredIssues}
                    onSelectIssue={handleSelectIssue}
                    selectedIssueId={selectedIssue?.id || null}
                    center={mapCenter}
                    zoom={mapZoom}
                    onBoundsChanged={(c, z) => {
                      setMapCenter(c);
                      setMapZoom(z);
                    }}
                  />
                </div>

                {/* List / Detail Column - Flexible below map on mobile */}
                <div className="flex-1 lg:w-[410px] lg:shrink-0 lg:flex-none flex flex-col bg-slate-950 lg:bg-slate-900/40 relative overflow-hidden lg:border-r border-white/5">
                  <AnimatePresence mode="wait">
                    {!selectedIssue ? (
                      <motion.div 
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col overflow-hidden"
                      >
                        <IssueFeed 
                          issues={filteredIssues} 
                          areaName={selectedAreaName}
                          selectedIssueId={null}
                          onSelectIssue={handleSelectIssue}
                        />
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="detail"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex-1 flex flex-col overflow-hidden relative"
                      >
                        <div className="p-3 border-b border-white/5 bg-slate-900/20 flex items-center justify-between shrink-0">
                          <button 
                            onClick={() => setSelectedIssue(null)}
                            className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                          >
                            <span className="text-base leading-none">←</span> Back to signals
                          </button>
                          <div className="text-[9px] font-mono text-emerald-500/40 uppercase">Analysis engine running</div>
                        </div>
                        <IssueDetail issue={selectedIssue} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ) : activeView === 'reporter' ? (
            <ReportIssue />
          ) : activeView === 'ops' ? (
            <VolunteerView />
          ) : activeView === 'personnel' ? (
            <PersonnelManager />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-12 max-w-sm">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                  <Activity className="w-8 h-8 text-emerald-500 animate-pulse" />
                </div>
                <h2 className="text-xl font-sans font-bold text-white mb-2 decoration-emerald-500/30 underline underline-offset-8">System Module Offline</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                  The <span className="text-slate-300 font-mono italic">{activeView}</span> coordination engine is currently undergoing maintenance or initialization.
                </p>
                <button 
                  onClick={() => setActiveView('dashboard')}
                  className="w-full py-3 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20 text-xs font-bold uppercase tracking-[0.2em] hover:bg-emerald-500/20 transition-all"
                >
                  Return to Command
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
