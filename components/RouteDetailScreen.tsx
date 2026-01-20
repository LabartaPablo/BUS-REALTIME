
import React, { useState, useEffect, useMemo } from 'react';
import { BusRoute } from '../types';
import { MAP_IMAGE_URL } from '../constants';
import { getTransitAnalysis } from '../geminiService';

interface RouteDetailScreenProps {
  route: BusRoute;
  onBack: () => void;
}

const RouteDetailScreen: React.FC<RouteDetailScreenProps> = ({ route, onBack }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>("Analyzing real-time traffic...");
  const [predictedOccupancy, setPredictedOccupancy] = useState<string>("Medium");
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      const result = await getTransitAnalysis(route.number, route.destination);
      setAiAnalysis(result.analysis);
      setPredictedOccupancy(result.predictedOccupancy);
    };
    fetchAnalysis();

    const favorites = JSON.parse(localStorage.getItem('transit_route_favorites') || '[]');
    setIsFavorite(favorites.includes(route.number));
  }, [route]);

  const occupancyDots = useMemo(() => {
    const count = predictedOccupancy === 'High' ? 24 : predictedOccupancy === 'Medium' ? 12 : 4;
    return Array.from({ length: 32 }).map((_, i) => i < count);
  }, [predictedOccupancy]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('transit_route_favorites') || '[]');
    let newFavs;
    if (favorites.includes(route.number)) {
      newFavs = favorites.filter((n: string) => n !== route.number);
    } else {
      newFavs = [...favorites, route.number];
    }
    localStorage.setItem('transit_route_favorites', JSON.stringify(newFavs));
    setIsFavorite(!isFavorite);
  };

  return (
    <div className="relative h-full w-full bg-[#0a0f16] flex flex-col overflow-hidden">
      <div className="absolute top-0 left-0 w-full z-20 pt-12 pb-6 px-4 bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="size-11 flex items-center justify-center rounded-2xl bg-white/5 backdrop-blur-xl text-white border border-white/10 hover:bg-white/10 active:scale-90 transition-all">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="bg-primary px-2 py-0.5 rounded-lg text-[10px] font-black uppercase text-white shadow-xl shadow-primary/20">{route.number}</span>
                <h2 className="text-white text-lg font-bold leading-tight truncate">To {route.destination}</h2>
              </div>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-0.5">Fleet Line Sync Active</p>
            </div>
          </div>
          
          <button 
            onClick={toggleFavorite}
            className={`size-11 flex items-center justify-center rounded-2xl backdrop-blur-xl transition-all border active:scale-90 ${isFavorite ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 'bg-white/5 border-white/10 text-white/30'}`}
          >
            <span className="material-symbols-outlined" style={{fontVariationSettings: isFavorite ? "'FILL' 1" : ""}}>
              star
            </span>
          </button>
        </div>
      </div>

      <div className="relative h-[40%] bg-[#080d14] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-110 blur-[1px]"
          style={{ backgroundImage: `url(${MAP_IMAGE_URL})` }}
        />
        
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50">
          <path d="M 50 400 Q 150 350 250 300 T 450 250" fill="none" stroke={route.color} strokeWidth="6" strokeLinecap="round" strokeDasharray="12 12" />
        </svg>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 scale-125">
          <div className="pulse-ring" style={{backgroundColor: route.color}}></div>
          <div className="size-12 rounded-2xl border-2 border-white/20 shadow-2xl flex items-center justify-center bg-slate-900" style={{borderColor: route.color}}>
            <span className="material-symbols-outlined text-white text-[24px]">directions_bus</span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 z-30 bg-slate-900 rounded-t-[3.5rem] shadow-[0_-30px_100px_rgba(0,0,0,0.8)] border-t border-white/10 px-6 pt-2 pb-12 overflow-y-auto no-scrollbar">
        <div className="flex justify-center py-4">
          <div className="h-1.5 w-14 rounded-full bg-white/10"></div>
        </div>

        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-3xl font-black text-white tracking-tighter">Line {route.number}</h3>
              <span className="px-2 py-1 rounded bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest border border-green-500/20">Operational</span>
            </div>
            <p className="text-white/40 text-sm font-medium">Next station: <span className="text-white/80">{route.nextStop}</span></p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-primary tracking-tighter">{route.arrivalTime}</p>
            <p className="text-[10px] font-black text-primary/50 uppercase tracking-widest">ETA</p>
          </div>
        </div>

        <div className="mb-8">
           <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Vehicle Load Capacity</p>
              <span className={`text-[10px] font-black uppercase tracking-widest ${predictedOccupancy === 'High' ? 'text-red-500' : 'text-green-500'}`}>
                {predictedOccupancy} Capacity
              </span>
           </div>
           <div className="grid grid-cols-8 gap-2 p-4 bg-white/5 rounded-2xl border border-white/5">
              {occupancyDots.map((isFull, i) => (
                <div key={i} className={`h-4 rounded-sm transition-all duration-700 ${isFull ? 'bg-primary shadow-[0_0_10px_rgba(19,127,236,0.5)]' : 'bg-white/10'}`}></div>
              ))}
           </div>
        </div>

        <div className="bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-3xl p-6 border border-primary/20 relative overflow-hidden mb-10 group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
            <span className="material-symbols-outlined text-6xl text-primary">auto_awesome</span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-[20px] animate-pulse">monitoring</span>
            <span className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Gemini Intelligence Report</span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed font-bold tracking-tight italic">"{aiAnalysis}"</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="flex flex-col items-center justify-center gap-2 h-24 rounded-3xl bg-white/5 text-white border border-white/10 hover:bg-white/10 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-2xl text-white/40">notifications_active</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Set Alert</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 h-24 rounded-3xl bg-primary text-white shadow-2xl shadow-primary/30 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-2xl">ios_share</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Live Link</span>
          </button>
        </div>
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default RouteDetailScreen;
