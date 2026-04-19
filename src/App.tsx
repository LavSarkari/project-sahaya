import React, { useState, useMemo } from 'react';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { IssueFeed } from './components/IssueFeed';
import { IssueDetail } from './components/IssueDetail';
import { MapView } from './components/MapView';
import { MOCK_ISSUES, AREAS } from './constants';
import { Issue } from './types';
import { motion, AnimatePresence, animate } from 'motion/react';
import { Map as MapIcon, Activity, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { subscribeToIssues } from './services/issueService';
import { useAuth } from './contexts/AuthContext';
import { isAdminEmail } from './lib/utils';

import { ReportIssue } from './components/ReportIssue';
import { LoginPage } from './components/LoginPage';
import { VolunteerView } from './components/VolunteerView';
import { PersonnelManager } from './components/PersonnelManager';
import { LandingPage } from './components/LandingPage';
import { Settings } from './components/Settings';

export default function App() {
  const { user, profile, loading } = useAuth();
  const [issues, setIssues] = useState<Issue[]>(MOCK_ISSUES);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'team' | 'reports' | 'reporter' | 'tasks' | 'settings'>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Sync active view with role on initial login + RBAC enforcement
  React.useEffect(() => {
    if (user || profile) {
      const isAdmin = profile?.role === 'admin' || isAdminEmail(user?.email);
      
      if (isAdmin) {
        // Admins default to overview, but allow settings
        if (activeView !== 'settings') setActiveView('overview');
      } else if (profile?.role === 'reporter') {
        // Reporters can only see reporter + settings
        if (activeView !== 'settings') setActiveView('reporter');
      } else if (profile?.role === 'volunteer') {
        // Volunteers can only see tasks + settings
        if (activeView !== 'settings') setActiveView('tasks');
      }
    }
  }, [profile, user]);

  // RBAC: Enforce view restrictions on every view change
  const handleViewChange = (view: typeof activeView) => {
    const isAdmin = profile?.role === 'admin' || isAdminEmail(user?.email);
    
    // Settings is accessible to everyone
    if (view === 'settings') {
      setActiveView(view);
      return;
    }
    
    // Admin-only views
    if (['overview', 'team', 'reports'].includes(view) && !isAdmin) {
      return; // silently block
    }
    // Volunteer-only views
    if (view === 'tasks' && profile?.role !== 'volunteer' && !isAdmin) {
      return;
    }
    
    setActiveView(view);
  };

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
         <Activity className="w-8 h-8 text-slate-400 animate-pulse mb-4" />
         <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Getting latest updates...</div>
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
    
    let targetCenter: [number, number] = [26.87, 80.95];
    let targetZoom = 13;

    if (!id && issues.length > 0) {
      const lats = issues.map(i => i.coordinates.lat);
      const lngs = issues.map(i => i.coordinates.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      targetCenter = [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
      
      const maxSpread = Math.max(maxLat - minLat, maxLng - minLng);
      targetZoom = 5;
      if (maxSpread < 0.1) targetZoom = 13;
      else if (maxSpread < 1) targetZoom = 10;
      else if (maxSpread < 5) targetZoom = 7;
      else if (maxSpread < 15) targetZoom = 5.5;
    }

    // "Fly Up" Animation using motion's animate function
    animate(mapZoom, targetZoom, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1], // Custom "fly-up" ease
      onUpdate: (latest) => setMapZoom(latest)
    });

    animate(mapCenter[0], targetCenter[0], {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setMapCenter(prev => [latest, prev[1]])
    });

    animate(mapCenter[1], targetCenter[1], {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setMapCenter(prev => [prev[0], latest])
    });
  };

  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    
    // Smooth transition to selected issue
    animate(mapZoom, 15, {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setMapZoom(latest)
    });

    animate(mapCenter[0], issue.coordinates.lat, {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setMapCenter(prev => [latest, prev[1]])
    });

    animate(mapCenter[1], issue.coordinates.lng, {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setMapCenter(prev => [prev[0], latest])
    });
  };

  return (
    <div className={`flex flex-col h-[100dvh] w-screen overflow-hidden bg-brand-bg relative text-[var(--text-primary)] font-sans`}>
      {/* Background Layers */}
      <div className="fixed inset-0 bg-brand-bg z-[-2] pointer-events-none transition-colors duration-500" />
      
      <TopNav 
        onMenuClick={() => setIsSidebarOpen(true)} 
        activeView={activeView} 
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />
      
      <div className="flex flex-1 overflow-hidden relative z-10 w-full lg:flex-row flex-col">
        <Sidebar 
          selectedAreaId={selectedAreaId} 
          onSelectArea={(id) => {
            handleSelectArea(id);
            setIsSidebarOpen(false);
          }}
          activeView={activeView}
          onViewChange={(v) => {
            handleViewChange(v as any);
            setIsSidebarOpen(false);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          issues={issues}
          collapsed={isNavCollapsed}
          onToggleCollapse={() => setIsNavCollapsed(!isNavCollapsed)}
        />
        
        <main className="flex-1 overflow-hidden relative flex flex-col">
          {activeView === 'overview' ? (
            <div className="flex-1 flex flex-col overflow-hidden w-full relative">
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full">
                {/* Map Column - Optimized height on mobile */}
                <div className="h-[320px] lg:h-full lg:flex-1 relative border-b lg:border-b-0 lg:border-l border-[var(--border)] bg-brand-bg overflow-hidden order-first lg:order-last">
                  <button 
                    onClick={() => setIsPanelOpen(!isPanelOpen)}
                    title={isPanelOpen ? "Close Controls" : "Open Controls"}
                    className="absolute top-1/2 -translate-y-1/2 left-0 z-[500] w-5 h-24 bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--border)] border-l-0 rounded-r-2xl shadow-2xl hidden lg:flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:w-7 hover:bg-[var(--surface)] transition-all group"
                  >
                    <div className="flex flex-col items-center gap-1">
                      {isPanelOpen ? <PanelLeftClose className="w-4 h-4 pointer-events-none" /> : <PanelLeftOpen className="w-4 h-4 pointer-events-none" />}
                      <div className="w-1 h-8 bg-[var(--border)] rounded-full group-hover:bg-[var(--accent)] transition-colors" />
                    </div>
                  </button>
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
                <div 
                  className={`flex-1 transition-all duration-300 ease-in-out lg:shrink-0 lg:flex-none flex flex-col bg-brand-bg lg:bg-transparent relative overflow-hidden lg:border-r border-[var(--border)] ${
                    isPanelOpen ? 'lg:w-[410px] opacity-100' : 'lg:w-0 lg:opacity-0'
                  }`}
                >
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
                        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-md flex items-center justify-between shrink-0">
                          <button 
                            onClick={() => setSelectedIssue(null)}
                            className="flex items-center gap-2 text-[12px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            <span className="text-lg leading-none">←</span> Back to list
                          </button>
                          <div className="text-[10px] font-medium text-[var(--text-secondary)] opacity-60">Getting details</div>
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
          ) : activeView === 'tasks' ? (
            <VolunteerView />
          ) : activeView === 'team' ? (
            <PersonnelManager />
          ) : activeView === 'settings' ? (
            <Settings />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-12 max-w-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6">
                  <Activity className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-sans font-bold text-[var(--text-primary)] mb-2">Section Unavailable</h2>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-8">
                  The <span className="font-medium">{activeView}</span> section is currently undergoing maintenance.
                </p>
                <button 
                  onClick={() => setActiveView('overview')}
                  className="w-full py-3 bg-[var(--text-primary)] text-[var(--text-inverse)] rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
                >
                  Return to Overview
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
