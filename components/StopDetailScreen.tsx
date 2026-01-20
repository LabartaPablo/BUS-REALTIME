
import React, { useState, useEffect } from 'react';
import { MAP_IMAGE_URL } from '../constants';
import { getTransitAnalysis } from '../geminiService';

interface StopDetailScreenProps {
  onBack: () => void;
}

const StopDetailScreen: React.FC<StopDetailScreenProps> = ({ onBack }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [networkInsight, setNetworkInsight] = useState("Scanning node connectivity...");
  const stopId = 'stop_271';

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('transit_favorites') || '[]');
    setIsFavorite(favorites.includes(stopId));

    const fetchStopInsight = async () => {
      const result = await getTransitAnalysis("North City Hub", "Regional Network");
      setNetworkInsight(result.analysis);
    };
    fetchStopInsight();
  }, []);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('transit_favorites') || '[]');
    let newFavs;
    if (favorites.includes(stopId)) {
      newFavs = favorites.filter((id: string) => id !== stopId);
    } else {
      newFavs = [...favorites, stopId];
    }
    localStorage.setItem('transit_favorites', JSON.stringify(newFavs));
    setIsFavorite(!isFavorite);
  };

  const departures = [
    { route: '46A', dest: 'Phoenix Park', time: '14:30', delay: '+3 min', status: 'delayed' },
    { route: '155', dest: 'Ikea', time: '14:36', eta: '6 min', status: 'live' },
    { route: '11', dest: 'Sandyford', time: '14:45', status: 'cancelled' },
    { route: '7', dest: 'Brides Glen', time: '14:55', status: 'scheduled' },
  ];

  return (
    <div className="h-full w-full bg-[#080d14] flex flex-col overflow-y-auto no-scrollbar pb-10">
      <div className="sticky top-0 z-50 bg-[#080d14]/90 backdrop-blur-3xl px-6 py-6 flex items-center justify-between border-b border-white/5">
        <button onClick={onBack} className="size-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-white">chevron_left</span>
        </button>
        <h2 className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Transit Hub</h2>
        <button 
          onClick={toggleFavorite}
          className={`size-12 flex items-center justify-center rounded-2xl transition-all border ${isFavorite ? 'bg-primary/20 border-primary text-primary shadow-[0_0_20px_rgba(19,127,236,0.3)]' : 'bg-white/5 border-white/10 text-white/20'}`}
        >
          <span className="material-symbols-outlined" style={{fontVariationSettings: isFavorite ? "'FILL' 1" : ""}}>
            bookmark
          </span>
        </button>
      </div>

      <div className="px-8 pt-10 mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#137fec]"></div>
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em]">Node Active</span>
        </div>
        <h1 className="text-4xl font-black text-white leading-[1.1] tracking-tighter mb-6">O'Connell Street Upper</h1>
        
        <div className="bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary p-6 rounded-r-3xl backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-lg">psychology</span>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Node Intelligence</span>
          </div>
          <p className="text-sm text-white/70 font-bold leading-relaxed italic tracking-tight">"{networkInsight}"</p>
        </div>
      </div>

      <div className="px-8 mb-12">
        <div className="relative h-44 w-full rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay scale-110"
            style={{ backgroundImage: `url(${MAP_IMAGE_URL})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080d14] via-transparent to-transparent" />
          <div className="absolute bottom-6 left-8">
            <div className="flex items-center gap-3 mb-2">
               <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/50 text-[9px] font-black uppercase tracking-widest">Sector D1</span>
               <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-[9px] font-black uppercase tracking-widest">Step-free</span>
            </div>
            <p className="text-white font-black text-xl tracking-tight">North City Centre Hub</p>
          </div>
        </div>
      </div>

      <div className="px-8 mb-4 flex justify-between items-center">
        <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em]">Real-time Wave</h3>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/10">
          <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Live Sync</span>
        </div>
      </div>
      
      <div className="space-y-4 px-8">
        {departures.map((dep, idx) => (
          <div key={idx} className={`relative flex items-center gap-5 p-6 rounded-[2rem] border transition-all group ${dep.status === 'cancelled' ? 'bg-white/5 border-white/5 opacity-40' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-primary/30 hover:translate-x-1'}`}>
            <div className={`size-14 rounded-2xl flex items-center justify-center font-black text-2xl text-white ${dep.status === 'cancelled' ? 'bg-slate-800' : 'bg-primary shadow-2xl shadow-primary/30'}`}>
              {dep.route}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-black text-white tracking-tight truncate">To {dep.dest}</h4>
              <div className="flex items-center gap-3 mt-1">
                {dep.status === 'live' ? (
                  <span className="text-green-400 text-sm font-black tracking-widest uppercase">
                    Due in {dep.eta}
                  </span>
                ) : (
                  <span className="text-white/40 text-sm font-bold tracking-widest">{dep.time}</span>
                )}
                {dep.delay && <span className="bg-red-500/10 text-red-500 text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest border border-red-500/10">{dep.delay}</span>}
              </div>
            </div>
            {dep.status !== 'cancelled' && (
              <div className="text-right">
                <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors text-[28px]">radar</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StopDetailScreen;
