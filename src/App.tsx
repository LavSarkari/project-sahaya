import React, { useState, useMemo } from 'react';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { IssueFeed } from './components/IssueFeed';
import { IssueDetail } from './components/IssueDetail';
import { MapView } from './components/MapView';
import { MOCK_ISSUES, AREAS } from './constants';
import { Issue } from './types';
import { motion, AnimatePresence, animate } from 'motion/react';
import { Map as MapIcon, Activity, PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight, Heart, ShieldAlert } from 'lucide-react';
import { VolunteerApplication } from './components/VolunteerApplication';

import { subscribeToIssues } from './services/issueService';
import { useAuth } from './contexts/AuthContext';
import { isAdminEmail } from './lib/utils';

import { ReportIssue } from './components/ReportIssue';
import { LoginPage } from './components/LoginPage';
import { VolunteerView } from './components/VolunteerView';
import { PersonnelManager } from './components/PersonnelManager';
import { LandingPage } from './components/LandingPage';
import { Settings } from './components/Settings';
import { LogisticsHub } from './components/LogisticsHub';
import { StrategicAllocation } from './components/StrategicAllocation';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Route guard component — renders children only if the user has the required role
const RequireRole: React.FC<{
  allowed: string[];
  children: React.ReactNode;
}> = ({ allowed, children }) => {
  const { profile, user } = useAuth();
  const isAdmin = profile?.role === 'admin' || isAdminEmail(user?.email);
  const hasAccess = isAdmin || (profile?.role && allowed.includes(profile.role));

  if (!hasAccess) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Access Restricted</h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            You don't have permission to view this section. This area is restricted to authorized personnel only.
          </p>
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-bold">
            Required: {allowed.join(' or ')} • Your role: {profile?.role || 'unknown'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default function App() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeView = useMemo(() => {
    const path = location.pathname.split('/')[1] || 'overview';
    return path as any;
  }, [location]);

  const [issues, setIssues] = useState<Issue[]>(MOCK_ISSUES);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
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
    if (user && profile) {
      const isAdmin = profile?.role === 'admin' || isAdminEmail(user?.email);
      
      // If we are at root but the user has a specific role, or we need to enforce RBAC
      if (location.pathname === '/' || location.pathname === '/overview') {
        if (!isAdmin) {
          if (profile?.role === 'volunteer') navigate('/tasks');
          else if (profile?.role === 'reporter') navigate('/reporter');
        }
      }
      
      // Block non-admins from admin-only routes via URL bar
      const adminOnlyPaths = ['/team', '/reports', '/logistics', '/allocation'];
      if (adminOnlyPaths.includes(location.pathname) && !isAdmin) {
        if (profile?.role === 'volunteer') navigate('/tasks');
        else navigate('/reporter');
      }
    }
  }, [profile, user, location.pathname]);

  // Handle post-login redirects
  React.useEffect(() => {
    if (user && profile) {
      const redirect = sessionStorage.getItem('post-login-redirect');
      if (redirect === 'volunteer-apply') {
        navigate('/volunteer-apply');
        sessionStorage.removeItem('post-login-redirect');
      }
    }
  }, [user, profile]);

  // RBAC: Direct routing and enforcement
  const handleViewChange = (view: string) => {
    const isAdmin = profile?.role === 'admin' || isAdminEmail(user?.email);
    const target = view === 'overview' ? '/' : `/${view}`;
    
    // Auth & RBAC checks
    if (view === 'settings') {
      navigate(target);
      return;
    }
    
    if (['team', 'reports', 'logistics', 'allocation'].includes(view) && !isAdmin) return;
    if (view === 'tasks' && profile?.role !== 'volunteer' && !isAdmin) return;
    
    navigate(target);
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
    return (
      <LandingPage 
        onGetStarted={() => setShowLanding(false)} 
        theme={theme}
      />
    );
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
          <Routes>
            <Route path="/" element={
              <div className="flex-1 flex flex-col overflow-hidden w-full relative">
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full">
                  <div className="h-[320px] lg:h-full lg:flex-1 relative border-b lg:border-b-0 lg:border-l border-[var(--border)] bg-brand-bg overflow-hidden order-first lg:order-last">
                    <button 
                      onClick={() => setIsPanelOpen(!isPanelOpen)}
                      className={`absolute left-0 top-1/2 -translate-y-1/2 z-[500] w-[14px] hover:w-5 h-24 bg-[var(--surface)] hover:bg-[var(--accent)] border border-l-0 border-[var(--border)] rounded-r-xl shadow-xl hidden lg:flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-inverse)] transition-all duration-300 group cursor-pointer`}
                    >
                      <div className={`transition-transform duration-500 ${isPanelOpen ? 'rotate-0' : 'rotate-180'}`}>
                        <ChevronLeft className="w-3.5 h-3.5" />
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
                          </div>
                          <IssueDetail issue={selectedIssue} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            } />
            <Route path="/reporter" element={<ReportIssue />} />
            <Route path="/volunteer-apply" element={<VolunteerApplication onCancel={() => navigate('/reporter')} isDashboard={true} />} />
            <Route path="/tasks" element={<RequireRole allowed={['volunteer']}><VolunteerView /></RequireRole>} />
            <Route path="/team" element={<RequireRole allowed={['admin']}><PersonnelManager /></RequireRole>} />
            <Route path="/settings" element={<Settings />} />
             <Route path="/logistics" element={<RequireRole allowed={['admin']}><LogisticsHub /></RequireRole>} />
            <Route path="/allocation" element={<RequireRole allowed={['admin']}><StrategicAllocation /></RequireRole>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
