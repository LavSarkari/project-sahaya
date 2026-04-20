import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Package, Plus, Minus, AlertTriangle, TrendingDown, Box, MapPin, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AREAS } from '../constants';

interface Resource {
  id: string;
  name: string;
  category: 'FOOD' | 'MEDICAL' | 'WATER' | 'SHELTER';
  quantity: number;
  threshold: number;
  areaId: string;
  lastUpdated: any;
}

export const LogisticsHub: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeArea, setActiveArea] = useState<string>('all');

  useEffect(() => {
    const q = query(collection(db, 'resources'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Resource[];
      setResources(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateStock = async (id: string, delta: number) => {
    const res = resources.find(r => r.id === id);
    if (!res) return;
    const newQty = Math.max(0, res.quantity + delta);
    await updateDoc(doc(db, 'resources', id), {
      quantity: newQty,
      lastUpdated: serverTimestamp()
    });
  };

  const filteredResources = activeArea === 'all' 
    ? resources 
    : resources.filter(r => r.areaId === activeArea);

  return (
    <div className="flex-1 bg-[var(--bg)] overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
               <Package className="w-5 h-5 text-[var(--accent)]" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)]">Supply Grid v1.0</span>
            </div>
            <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">Logistics Hub</h1>
            <p className="text-[var(--text-secondary)] font-medium max-w-md">Oversee and allocate critical aid resources across active mission sectors.</p>
          </div>

          <div className="flex bg-[var(--surface)] p-1 rounded-xl border border-[var(--border)] shadow-sm">
             {['all', ...new Set(AREAS.map(a => a.id))].slice(0, 5).map(area => (
               <button
                 key={area}
                 onClick={() => setActiveArea(area)}
                 className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                   activeArea === area 
                    ? 'bg-[var(--text-primary)] text-[var(--text-inverse)] shadow-md' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)]'
                 }`}
               >
                 {area}
               </button>
             ))}
          </div>
        </header>

        {/* Status Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-[var(--surface)] p-6 rounded-3xl border border-[var(--border)] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                 <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <AlertTriangle className="w-5 h-5" />
                 </div>
                 <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/5 px-2 py-1 rounded-full">Critical Stock</span>
              </div>
              <div>
                 <div className="text-3xl font-black text-[var(--text-primary)]">
                    {resources.filter(r => r.quantity <= r.threshold).length}
                 </div>
                 <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-1">Resource Shortages Detected</div>
              </div>
           </div>

           <div className="bg-[var(--surface)] p-6 rounded-3xl border border-[var(--border)] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                 <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                    <Box className="w-5 h-5" />
                 </div>
                 <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest bg-[var(--accent)]/5 px-2 py-1 rounded-full">Active Units</span>
              </div>
              <div>
                 <div className="text-3xl font-black text-[var(--text-primary)]">
                    {resources.reduce((sum, r) => sum + r.quantity, 0).toLocaleString()}
                 </div>
                 <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-1">Total Aid Items in Grid</div>
              </div>
           </div>

           <div className="bg-[var(--surface)] p-6 rounded-3xl border border-[var(--border)] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                 <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Activity className="w-5 h-5" />
                 </div>
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-2 py-1 rounded-full">Deployment</span>
              </div>
              <div>
                 <div className="text-3xl font-black text-[var(--text-primary)]">Steady</div>
                 <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-1">Movement Stability Index</div>
              </div>
           </div>
        </div>

        {/* Inventory List */}
        <div className="bg-[var(--surface)] rounded-[32px] border border-[var(--border)] shadow-sm overflow-hidden">
           <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Live Inventory</h3>
              <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)]">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 Real-time Telemetry
              </div>
           </div>

           <div className="divide-y divide-[var(--border)]">
              {filteredResources.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                   <Package className="w-12 h-12 text-[var(--text-secondary)] opacity-20 mx-auto" />
                   <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">No resources cataloged for this sector</p>
                </div>
              ) : (
                filteredResources.map((res) => (
                  <div key={res.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-[var(--hover)] transition-all">
                     <div className="flex items-center gap-6 flex-1">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${
                          res.quantity <= res.threshold 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
                            : 'bg-[var(--bg)] border-[var(--border)] text-[var(--accent)]'
                        }`}>
                           <Package className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                           <div className="flex items-center gap-2">
                              <h4 className="text-lg font-bold text-[var(--text-primary)]">{res.name}</h4>
                              <span className="text-[8px] font-black uppercase border border-[var(--border)] px-2 py-0.5 rounded-full text-[var(--text-secondary)]">{res.category}</span>
                           </div>
                           <div className="flex items-center gap-3 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {res.areaId}</span>
                              {res.quantity <= res.threshold && (
                                <span className="text-rose-500 flex items-center gap-1 font-black">
                                   <TrendingDown className="w-3 h-3" /> Shortage
                                </span>
                              )}
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-6">
                        <div className="text-right px-4">
                           <div className={`text-2xl font-black ${res.quantity <= res.threshold ? 'text-rose-500' : 'text-[var(--text-primary)]'}`}>
                              {res.quantity.toLocaleString()}
                           </div>
                           <div className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">Target: {res.threshold}+</div>
                        </div>

                        <div className="flex items-center gap-2 bg-[var(--bg)] p-1.5 rounded-2xl border border-[var(--border)]">
                           <button 
                             onClick={() => updateStock(res.id, -10)}
                             className="w-10 h-10 rounded-xl hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-all flex items-center justify-center"
                           >
                              <Minus className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => updateStock(res.id, 10)}
                             className="w-10 h-10 rounded-xl hover:bg-emerald-500/10 text-[var(--text-secondary)] hover:text-emerald-500 transition-all flex items-center justify-center"
                           >
                              <Plus className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
