import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Map, Marker, ZoomControl } from 'pigeon-maps';
import { Issue, ResponseTeam, UserProfile } from '../types';
import { RESPONSE_TEAMS } from '../constants';
import { Shield, MapPin, Users, Brain, Activity, Maximize2, ListFilter, AlertTriangle, Layers, Navigation, CheckCircle2 } from 'lucide-react';
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

export const MapView: React.FC<MapViewProps> = ({ issues, onSelectIssue, selectedIssueId, center, zoom, onBoundsChanged }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(500);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [volunteers, setVolunteers] = useState<UserProfile[]>([]);

  // Real-time volunteer positions and status
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
        // Optimization: also consider category affinity for density if needed, 
        // but primarily we stick to spatial and then summarize metadata
        const dist = Math.sqrt(
          Math.pow(issue.coordinates.lat - other.coordinates.lat, 2) +
          Math.pow(issue.coordinates.lng - other.coordinates.lng, 2)
        );
        return dist < clusterRadius;
      });

      if (nearby.length > 1) {
        const clusterId = `cluster-${issue.id}`;
        
        // Calculate category distribution
        const catCounts: Record<string, number> = {};
        nearby.forEach(n => {
          catCounts[n.category] = (catCounts[n.category] || 0) + 1;
        });

        // Determine dominant category and average priority
        const dominantCategory = Object.entries(catCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
        
        clusters.push({
          type: 'cluster',
          id: clusterId,
          count: nearby.length,
          issues: nearby, 
          categoryCounts: catCounts,
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

  const handleClusterClick = (cluster: any) => {
    if (zoom < 16) {
      // Zoom in center of cluster
      onBoundsChanged([cluster.coordinates.lat, cluster.coordinates.lng], zoom + 2.5);
    } else {
      // If we are getting close, show the list
      setSelectedClusterId(cluster.id);
    }
  };

  const selectedCluster = useMemo(() => 
    clusterData.find(c => c.type === 'cluster' && c.id === selectedClusterId),
  [clusterData, selectedClusterId]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-slate-950 overflow-hidden">
      <Map 
        height={containerHeight} 
        center={center} 
        zoom={zoom}
        onBoundsChanged={({ center, zoom }) => onBoundsChanged(center, zoom)}
        boxClassname="pigeon-filters-none"
      >
        <ZoomControl />
        
        {/* Issue Clusters & Markers */}
        {clusterData.map(item => {
          if (item.type === 'cluster') {
            const isHighPriority = item.avgPriority === 'HIGH';
            return (
              // @ts-ignore
              <Marker key={item.id} anchor={[item.coordinates.lat, item.coordinates.lng]}>
                <button 
                  onClick={() => handleClusterClick(item)}
                  className="relative group transition-all"
                >
                  <div className={`
                    w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95
                    ${isHighPriority 
                      ? 'bg-rose-950/90 border-rose-500 text-rose-400 group-hover:bg-rose-900' 
                      : 'bg-indigo-950/90 border-indigo-500 text-indigo-400 group-hover:bg-indigo-900'}
                  `}>
                    <div className="flex flex-col items-center">
                      <span className="text-[14px] font-black tracking-tighter leading-none">{item.count}</span>
                      <span className="text-[7px] font-black uppercase opacity-60 tracking-widest leading-none mt-0.5">{item.dominantCategory}</span>
                    </div>
                  </div>
                  
                  {/* Category mini-indicators */}
                  <div className="absolute -top-1 -right-1 flex gap-0.5">
                    {Object.keys(item.categoryCounts).map(cat => (
                      <div key={cat} className="w-1.5 h-1.5 rounded-full bg-white/40 border border-white/20" />
                    ))}
                  </div>
                  
                  {isHighPriority && (
                    <div className="absolute inset-0 rounded-full bg-rose-500 animate-pulse opacity-20 -z-10 scale-125" />
                  )}

                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-slate-950 border border-white/10 rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                    <span className="text-[8px] font-bold uppercase tracking-widest">Click to zoom / Inspect</span>
                  </div>
                </button>
              </Marker>
            );
          }

          const issue = item.data;
          const isSelected = selectedIssueId === issue.id;
          return (
            // @ts-ignore
            <Marker key={issue.id} anchor={[issue.coordinates.lat, issue.coordinates.lng] as [number, number]} onClick={() => onSelectIssue(issue)}>
              <div className={`relative group cursor-pointer transition-transform hover:scale-110 ${isSelected ? 'scale-125 z-40' : ''}`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg transition-all ${
                  issue.priority === 'HIGH' ? 'bg-rose-500 border-white text-white' :
                  issue.priority === 'MED' ? 'bg-amber-500 border-white text-white' :
                  'bg-emerald-500 border-white text-white'
                } ${isSelected ? 'ring-4 ring-white/20' : ''}`}>
                  {issue.category === 'FOOD' ? <Users className="w-4 h-4" /> :
                   issue.category === 'MEDICAL' ? <Activity className="w-4 h-4" /> :
                   issue.category === 'SECURITY' ? <Shield className="w-4 h-4" /> :
                   <MapPin className="w-4 h-4" />}
                </div>
                
                {issue.priority === 'HIGH' && (
                  <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-20 -z-10" />
                )}
                
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 pointer-events-none z-[100] shadow-2xl">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      issue.priority === 'HIGH' ? 'bg-rose-500' : 
                      issue.priority === 'MED' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-widest">{issue.category}</span>
                  </div>
                  <div className="text-[11px] font-bold text-white mb-2 leading-tight tracking-tight">{issue.title}</div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1.5">
                      <Brain className="w-2.5 h-2.5 text-emerald-500" />
                      <div className="text-[7.5px] text-emerald-500/80 font-bold uppercase tracking-widest leading-none">AI Priority: {issue.priority}</div>
                    </div>
                    <span className="text-[7.5px] font-mono text-slate-600">ID: {issue.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Dynamic Volunteer Markers */}
        {volunteers.map(vol => {
          // Use stored coordinates or fallback to mock team positions for visual variety in demo
          const coords = vol.coordinates || RESPONSE_TEAMS.find(rt => rt.id.includes(vol.uid.slice(-1)))?.coordinates || { lat: 26.87 + Math.random()*0.05, lng: 80.95 + Math.random()*0.05 };
          
          return (
            // @ts-ignore
            <Marker key={vol.uid} anchor={[coords.lat, coords.lng] as [number, number]}>
              <div className="relative group overflow-visible">
                <div className={`w-7 h-7 rounded-lg border-2 border-white flex items-center justify-center shadow-lg transition-all transform rotate-45 ${
                  vol.status === 'en-route' ? 'bg-amber-500 animate-pulse' :
                  vol.status === 'active' ? 'bg-emerald-500' :
                  'bg-indigo-500'
                }`}>
                   {vol.status === 'en-route' ? <Navigation className="w-3.5 h-3.5 text-white -rotate-45" /> :
                    vol.status === 'active' ? <CheckCircle2 className="w-3.5 h-3.5 text-white -rotate-45" /> :
                    <Shield className="w-3.5 h-3.5 text-white -rotate-45" />}
                </div>
                
                <div className="absolute top-1/2 left-full ml-3 -translate-y-1/2 whitespace-nowrap bg-slate-900/90 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-xl z-50">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      vol.status === 'en-route' ? 'bg-amber-500' :
                      vol.status === 'active' ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`} />
                    <span>{vol.name} ({vol.status || 'standby'})</span>
                  </div>
                  {vol.activeTaskId && (
                    <div className="mt-1 text-[7px] text-slate-500 font-mono tracking-tighter uppercase">Task: {vol.activeTaskId.slice(0, 8)}</div>
                  )}
                </div>
              </div>
            </Marker>
          );
        })}
      </Map>

      {/* Cluster Details Modal/Overlay */}
      <AnimatePresence>
        {selectedCluster && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-x-4 bottom-4 z-50 pointer-events-none"
          >
            <div className="max-w-lg mx-auto bg-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-3xl pointer-events-auto overflow-hidden">
               <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                      <Layers className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-tight">Clustered Intelligence</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{selectedCluster.count} Combined Signals Observed</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedClusterId(null)}
                    className="p-1 px-3 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-bold text-slate-400 transition-colors uppercase tracking-widest"
                  >
                    Close Log
                  </button>
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
                       <div className="text-[8px] text-slate-500 mt-1 flex items-center gap-1.5">
                         <MapPin className="w-2.5 h-2.5" />
                         {issue.location}
                       </div>
                     </div>
                     <Maximize2 className="w-3 h-3 text-slate-700 group-hover:text-indigo-500 transition-colors" />
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

      {/* Map Legend overlay - Compact Pill Design */}
      <motion.div 
        className="absolute bottom-3 left-3 lg:bottom-5 lg:left-5 bg-slate-950/80 border border-white/10 backdrop-blur-xl rounded-full z-40 shadow-2xl overflow-hidden group/legend transition-all"
        initial={{ width: '40px', height: '40px' }}
        whileHover={{ width: 'auto', height: 'auto', borderRadius: '12px' }}
      >
        <div className="flex flex-col p-2 min-w-[36px] items-center lg:items-start group-hover/legend:p-3">
          <div className="flex items-center gap-2 mb-0 group-hover/legend:mb-2 group-hover/legend:border-b group-hover/legend:border-white/5 group-hover/legend:pb-1.5 group-hover/legend:w-full">
            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <h4 className="text-[8px] font-bold text-slate-400 uppercase tracking-widest hidden group-hover/legend:block whitespace-nowrap">Location Guide</h4>
          </div>
          
          <div className="hidden group-hover/legend:flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)] shrink-0" />
              <span className="text-[8.5px] font-bold text-slate-400 uppercase whitespace-nowrap">Help Request</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 bg-indigo-500 rotate-45 border border-white/20 shrink-0" />
              <span className="text-[8.5px] font-bold text-slate-400 uppercase whitespace-nowrap">Response Team</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[8.5px] font-bold text-slate-400 uppercase whitespace-nowrap">Safe Sector</span>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Search/Filter Helper - More discrete */}
      <div className="absolute top-3 right-3 lg:top-5 lg:right-14 p-0.5 bg-slate-950/60 backdrop-blur-md border border-white/5 rounded-full z-40 flex items-center gap-1.5 px-2">
        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[7.5px] lg:text-[8px] font-bold text-slate-500 uppercase tracking-[0.15em] border-none whitespace-nowrap">
          Signal Active
        </span>
      </div>
    </div>
  );
};

// Helper for smaller icons or missing ones
const ActivityIcon = () => (
  <Activity className="w-4 h-4" />
);
