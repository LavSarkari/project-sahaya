import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Map, Marker } from 'pigeon-maps';
import { Issue, UserProfile } from '../types';
import { RESPONSE_TEAMS } from '../constants';
import { 
  Shield, MapPin, Users, Brain, Activity, 
  Layers, Navigation, CheckCircle2, 
  Locate, Plus, Minus, Compass, 
  Target, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface MapViewProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  selectedIssueId: string | null;
  center: [number, number];
  zoom: number;
  onBoundsChanged: (center: [number, number], zoom: number) => void;
}

export const MapView: React.FC<MapViewProps> = ({ 
  issues, 
  onSelectIssue, 
  selectedIssueId, 
  center, 
  zoom, 
  onBoundsChanged 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(500);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<UserProfile[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme detection for tactical filtering
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    return () => observer.disconnect();
  }, []);

  // Real-time volunteer positions
  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'volunteer'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const volData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
      setVolunteers(volData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setContainerHeight(entry.contentRect.height);
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // Spatial clustering engine for ISSUES
  const clusterData = useMemo(() => {
    const zoomLevel = zoom || 13;
    const clusterRadius = 0.12 / Math.pow(2.0, zoomLevel - 10);
    
    if (zoomLevel > 16) return issues.map(i => ({ type: 'single', data: i }));

    const clusters: any[] = [];
    const processed = new Set();

    issues.forEach(issue => {
      if (processed.has(issue.id)) return;

      const nearby = issues.filter(other => {
        if (processed.has(other.id)) return false;
        const dist = Math.sqrt(
          Math.pow(issue.coordinates.lat - other.coordinates.lat, 2) +
          Math.pow(issue.coordinates.lng - other.coordinates.lng, 2)
        );
        return dist < clusterRadius;
      });

      if (nearby.length > 1) {
        const catCounts: Record<string, number> = {};
        nearby.forEach(n => { catCounts[n.category] = (catCounts[n.category] || 0) + 1; });
        const dominantCategory = Object.entries(catCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
        
        clusters.push({
          type: 'cluster',
          id: `cluster-${issue.id}`,
          count: nearby.length,
          issues: nearby, 
          dominantCategory,
          coordinates: {
            lat: nearby.reduce((sum, n) => sum + n.coordinates.lat, 0) / nearby.length,
            lng: nearby.reduce((sum, n) => sum + n.coordinates.lng, 0) / nearby.length
          },
          avgPriority: nearby.some(n => n.priority === 'HIGH') ? 'HIGH' : nearby.some(n => n.priority === 'MED') ? 'MED' : 'LOW'
        });
        nearby.forEach(n => processed.add(n.id));
      } else {
        clusters.push({ type: 'single', data: issue });
        processed.add(issue.id);
      }
    });

    return clusters;
  }, [issues, zoom]);

  // Mission Paths: Lines from volunteers to their assigned issues
  const missionPaths = useMemo(() => {
    return volunteers
      .filter(v => v.activeTaskId && v.status === 'en-route')
      .map(v => {
        const issue = issues.find(i => i.id === v.activeTaskId);
        if (!issue || !v.coordinates) return null;
        return {
          id: `path-${v.uid}-${issue.id}`,
          from: v.coordinates,
          to: issue.coordinates,
          isHigh: issue.priority === 'HIGH'
        };
      })
      .filter(Boolean);
  }, [volunteers, issues]);

  const handleClusterClick = (cluster: any) => {
    if (zoom < 16) onBoundsChanged([cluster.coordinates.lat, cluster.coordinates.lng], zoom + 2.5);
    else setSelectedClusterId(cluster.id);
  };

  const selectedCluster = useMemo(() => 
    clusterData.find(c => c.type === 'cluster' && c.id === selectedClusterId),
  [clusterData, selectedClusterId]);

  const selectedIssue = useMemo(() => issues.find(i => i.id === selectedIssueId), [issues, selectedIssueId]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-slate-950 overflow-hidden">
      {/* Tactical Filters Applied to Map Interface */}
      <div className={`w-full h-full transition-all duration-700 ${isDarkMode ? 'tactical-map-dark' : 'tactical-map-light'}`}>
        <Map 
          height={containerHeight} 
          center={center} 
          zoom={zoom}
          onBoundsChanged={({ center, zoom }) => onBoundsChanged(center, zoom)}
          boxClassname="pigeon-filters-none"
        >
          {/* Mission Paths - Tactical SVGs connecting teams to crises */}
          {missionPaths.map(path => path && (
            // @ts-ignore
            <Marker key={path.id} anchor={[path.from.lat, path.from.lng]}>
              <div className="pointer-events-none overflow-visible">
                <svg className="absolute top-0 left-0 w-[2000px] h-[2000px] -translate-x-1/2 -translate-y-1/2 transition-all">
                  <defs>
                    <linearGradient id={`grad-${path.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={path.isHigh ? "#f43f5e" : "#0ea5e9"} stopOpacity="0.2" />
                      <stop offset="100%" stopColor={path.isHigh ? "#f43f5e" : "#0ea5e9"} stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                  {/* Simplified path rendering for SVG lines across map */}
                  {/* In pigeon-maps, drawing lines requires converting coords, here we use markers for point visibility */}
                </svg>
              </div>
            </Marker>
          ))}

          {/* Issue Clusters & Markers */}
          {clusterData.map(item => {
            if (item.type === 'cluster') {
              const isHighPriority = item.avgPriority === 'HIGH';
              // @ts-ignore
              return (
                <Marker key={item.id} anchor={[item.coordinates.lat, item.coordinates.lng]}>
                  <button onClick={() => handleClusterClick(item)} className="relative group transition-all">
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 ${
                        isHighPriority ? 'bg-rose-950/90 border-rose-500 text-rose-400 group-hover:bg-rose-900' 
                        : 'bg-indigo-950/90 border-indigo-500 text-indigo-400 group-hover:bg-indigo-900'
                    }`}>
                      <div className="flex flex-col items-center">
                        <span className="text-[14px] font-black tracking-tighter leading-none">{item.count}</span>
                        <span className="text-[7px] font-black uppercase opacity-60 tracking-widest leading-none mt-0.5">{item.dominantCategory}</span>
                      </div>
                    </div>
                    {isHighPriority && <div className="absolute inset-0 rounded-full bg-rose-500 animate-pulse opacity-20 -z-10 scale-125" />}
                  </button>
                </Marker>
              );
            }

            const issue = item.data;
            const isSelected = selectedIssueId === issue.id;
            // @ts-ignore
            return (
              <Marker key={issue.id} anchor={[issue.coordinates.lat, issue.coordinates.lng]} onClick={() => onSelectIssue(issue)}>
                <div className={`relative group cursor-pointer transition-all duration-500 ${isSelected ? 'scale-125 z-50' : ''}`}>
                  {/* Sonar Selection Ring */}
                  {isSelected && (
                    <motion.div 
                      layoutId="sonar"
                      className="absolute inset-0 -m-6 rounded-full border-2 border-indigo-400/50 animate-sonar pointer-events-none" 
                    />
                  )}
                  
                  {/* Impact Zone (Pulsing Radius for Critical) */}
                  {issue.priority === 'HIGH' && (
                    <div className="absolute inset-0 -m-12 rounded-full bg-rose-500/5 border border-rose-500/20 animate-impact pointer-events-none" />
                  )}

                  {/* Marker Pin */}
                  <motion.div 
                    animate={isSelected ? { y: [0, -4, 0] } : {}}
                    transition={{ repeat: isSelected ? Infinity : 0, duration: 2 }}
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shadow-2xl transition-all ${
                      issue.priority === 'HIGH' ? 'bg-rose-500 border-white text-white' :
                      issue.priority === 'MED' ? 'bg-amber-500 border-white text-white' : 'bg-emerald-500 border-white text-white'
                    } ${isSelected ? 'ring-4 ring-indigo-500/40 shadow-indigo-500/20' : 'group-hover:ring-4 group-hover:ring-white/20'}`}
                  >
                    {issue.category === 'MEDICAL' ? <Activity className="w-4 h-4" /> :
                     issue.category === 'SECURITY' ? <Shield className="w-4 h-4" /> :
                     issue.category === 'FOOD' ? <Users className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                  </motion.div>
                  
                  {/* Soft Info Popup (Hover OR Selected) */}
                  <AnimatePresence>
                    {(isSelected || selectedClusterId === null) && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10, x: '-50%' }}
                        animate={(isSelected || (selectedIssueId === null)) ? { opacity: isSelected ? 1 : 0, scale: isSelected ? 1 : 0.9, y: isSelected ? 0 : 10 } : {}}
                        whileHover={{ opacity: 1, scale: 1, y: 0 }}
                        className={`absolute bottom-[130%] left-1/2 -translate-x-1/2 w-56 bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-3xl z-[100] transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 pointer-events-none'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${issue.priority === 'HIGH' ? 'bg-rose-500' : issue.priority === 'MED' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-[0.2em]">{issue.category}</span>
                          </div>
                          {isSelected && <div className="text-[7px] font-mono text-slate-600">LIVE_TRACKING</div>}
                        </div>
                        <div className="text-[12px] font-bold text-white mb-2 leading-tight tracking-tight">{issue.title}</div>
                        
                        {isSelected && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="pt-2 border-t border-white/10 space-y-2 mt-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Confidence</span>
                              <span className="text-[9px] text-emerald-400 font-mono font-bold">{(issue.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <div className="text-[9px] text-slate-400 leading-relaxed line-clamp-2 italic">"{issue.description}"</div>
                            <div className="flex items-center gap-2 text-[8px] font-bold text-indigo-400 uppercase tracking-widest pt-1">
                              <Brain className="w-2.5 h-2.5" />
                              Optimal Route Identified
                            </div>
                          </motion.div>
                        )}
                        
                        {/* Pointer Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-slate-950/90" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Marker>
            );
          })}

          {/* Dynamic Volunteer Markers */}
          {volunteers.map(vol => {
            const coords = vol.coordinates || { lat: 26.87, lng: 80.95 };
            const isEnRoute = vol.status === 'en-route';
            const issue = isEnRoute ? issues.find(i => i.id === vol.activeTaskId) : null;
            
            // Calculate bearing to target if en-route
            let bearing = 0;
            if (isEnRoute && issue) {
              const y = Math.sin((issue.coordinates.lng - coords.lng) * Math.PI / 180) * Math.cos(issue.coordinates.lat * Math.PI / 180);
              const x = Math.cos(coords.lat * Math.PI / 180) * Math.sin(issue.coordinates.lat * Math.PI / 180) -
                        Math.sin(coords.lat * Math.PI / 180) * Math.cos(issue.coordinates.lat * Math.PI / 180) * Math.cos((issue.coordinates.lng - coords.lng) * Math.PI / 180);
              bearing = Math.atan2(y, x) * 180 / Math.PI;
            }

            return (
              <Marker key={vol.uid} anchor={[coords.lat, coords.lng]}>
                <div className="relative group">
                  {/* Directional Indicator for En-Route Missions */}
                  {isEnRoute && (
                    <motion.div 
                      animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ rotate: bearing }}
                      className="absolute inset-0 -m-6 flex items-center justify-center pointer-events-none"
                    >
                      <div className="w-1 h-8 bg-gradient-to-t from-amber-500/80 to-transparent rounded-full origin-bottom translate-y-[-100%]" />
                    </motion.div>
                  )}

                  <div className={`w-7 h-7 rounded-lg border-2 border-white flex items-center justify-center shadow-lg transition-all transform rotate-45 ${
                    vol.status === 'en-route' ? 'bg-amber-500 ring-4 ring-amber-500/20' : vol.status === 'active' ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}>
                     {vol.status === 'en-route' ? <Navigation className="w-3.5 h-3.5 text-white -rotate-45" /> :
                      vol.status === 'active' ? <CheckCircle2 className="w-3.5 h-3.5 text-white -rotate-45" /> : <Shield className="w-3.5 h-3.5 text-white -rotate-45" />}
                  </div>

                  {/* Hover Label */}
                  <div className="absolute top-1/2 left-full ml-3 -translate-y-1/2 whitespace-nowrap bg-slate-950/90 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shadow-2xl z-50 pointer-events-none">
                    <div className="flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-current" style={{ color: vol.status === 'en-route' ? '#f59e0b' : '#10b981' }} />
                       {vol.name}
                    </div>
                  </div>
                </div>
              </Marker>
            );
          })}
        </Map>
      </div>

      {/* --- TACTICAL HUD OVERLAYS --- */}
      
      {/* Top Left: Map Meta info */}
      <div className="absolute top-4 left-4 z-40 pointer-events-none">
        <div className="glass p-3 rounded-2xl flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] leading-none mb-1.5">Sector Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
              <span className="text-xs font-bold text-[var(--text-primary)] tracking-tight">Active Coverage</span>
            </div>
          </div>
          <div className="w-px h-8 bg-[var(--border)]" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] leading-none mb-1.5">Live Feed</span>
            <span className="text-[11px] font-mono font-bold text-[var(--text-primary)]">SGNL_ACK_{volunteers.length}</span>
          </div>
        </div>
      </div>

      {/* Bottom Right: Floating HUD Controls */}
      <div className="absolute bottom-6 right-6 z-40 flex flex-col gap-3">
        <div className="flex flex-col bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <button 
            onClick={() => onBoundsChanged(center, zoom + 1)}
            className="p-3 hover:bg-white/10 text-slate-400 hover:text-white transition-all border-b border-white/5"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onBoundsChanged(center, zoom - 1)}
            className="p-3 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        <button 
          onClick={() => onBoundsChanged([22.5, 78.5], 5)} // Nationwide India center
          className="w-10 h-10 bg-[var(--accent)] text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-blue-600 transition-all active:scale-95 group"
        >
          <Locate className="w-4 h-4 group-hover:animate-pulse" />
        </button>

        <div className="w-10 h-10 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center relative shadow-2xl">
          <Compass className="w-5 h-5 text-slate-500 animate-[spin_20s_linear_infinite]" />
          <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
        </div>
      </div>

      {/* Bottom Left: Tactical Legend & Indicators */}
      <div className="absolute bottom-6 left-6 z-40 flex flex-col gap-2 pointer-events-none">
        <div className="glass p-3 rounded-2xl max-w-[140px]">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[9px] font-black text-[var(--text-primary)] uppercase tracking-wider">Map Legend</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="text-[8px] font-bold text-[var(--text-secondary)] uppercase">Critical Alert</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[8px] font-bold text-[var(--text-secondary)] uppercase">Response Active</span>
            </div>
            {missionPaths.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-px bg-amber-500/50 border-t border-dashed" />
                <span className="text-[8px] font-bold text-amber-500 uppercase tracking-tight">Mission Path</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedCluster && (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute inset-x-4 bottom-4 z-50 pointer-events-none">
             <div className="max-w-lg mx-auto bg-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-3xl pointer-events-auto overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <Target className="w-4 h-4 text-indigo-400" />
                     <div>
                       <h4 className="text-xs font-bold text-white tracking-tight">Clustered Intelligence</h4>
                       <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{selectedCluster.count} Combined Signals Observed</p>
                     </div>
                   </div>
                   <button onClick={() => setSelectedClusterId(null)} className="p-1 px-3 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-bold text-slate-400 transition-colors uppercase tracking-widest">Close Log</button>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-3 space-y-2">
                  {selectedCluster.issues.map((issue: Issue) => (
                    <button
                     key={issue.id}
                     onClick={() => {
                       onSelectIssue(issue);
                       setSelectedClusterId(null);
                     }}
                     className="w-full text-left p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 transition-all flex items-center gap-3 group"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                        issue.priority === 'HIGH' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                        issue.priority === 'MED' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                        'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      }`}>
                         {issue.category === 'MEDICAL' ? <Activity className="w-4 h-4" /> :
                          issue.category === 'SECURITY' ? <Shield className="w-4 h-4" /> :
                          <MapPin className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-widest">{issue.category}</span>
                          <span className="text-[7px] font-mono text-slate-600 uppercase">Signal: {issue.id.slice(0, 6)}</span>
                        </div>
                        <h5 className="text-[11px] font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{issue.title}</h5>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-3 bg-indigo-500/5 border-t border-white/5 text-center">
                   <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-widest">Select a signal to initialize deep telemetry</p>
                </div>
             </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// Helper for smaller icons or missing ones
const ActivityIcon = () => (
  <Activity className="w-4 h-4" />
);
