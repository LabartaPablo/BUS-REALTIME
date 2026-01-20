
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MAP_IMAGE_URL } from '../constants';
import { BusRoute } from '../types';

interface BusPosition {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  route_short_name: string;
  bearing: number;
  targetBearing: number;
  currentBearing: number;
  agency_id: string;
  headsign: string;
  // Adjusted status to match BusRoute['status'] or the expected literal union
  delayStatus: 'On Time' | 'Delayed' | 'Cancelled' | 'Scheduled';
}

interface MapScreenProps {
  onSelectRoute: (route: BusRoute) => void;
  onSelectStop: () => void;
}

const getBusColors = (routeName: string, agencyId: string) => {
  if (routeName.startsWith('C') || routeName.startsWith('G') || routeName.startsWith('N')) {
    return { bg: '#00D06E', text: '#000', border: '#00ff87', glow: 'rgba(0, 208, 110, 0.4)' };
  }
  if (agencyId === '978') { // Dublin Bus (Yellow)
    return { bg: '#FFD700', text: '#003366', border: '#fff', glow: 'rgba(255, 215, 0, 0.4)' };
  }
  return { bg: '#137fec', text: '#FFFFFF', border: '#4ea1ff', glow: 'rgba(19, 127, 236, 0.4)' };
};

const MapScreen: React.FC<MapScreenProps> = ({ onSelectRoute, onSelectStop }) => {
  const [buses, setBuses] = useState<BusPosition[]>([]);
  const [selectedBus, setSelectedBus] = useState<BusPosition | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1.8);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lastInteractionTime = useRef(Date.now());

  const requestRef = useRef<number>(null);
  const startTimeRef = useRef<number | null>(null);
  const duration = 12000;

  const DUBLIN_NETWORK: Record<string, string[]> = useMemo(() => ({
    'Orbital': ['N4', 'N6'],
    'Spine': ['C1', 'C2', 'C3', 'C4', 'G1', 'G2'],
    'City': ['1', '4', '7', '9', '11', '13', '14', '15', '16', '26', '27', '33', '37', '38', '39', '40', '41', '46A', '122', '123', '145', '155']
  }), []);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const generateBuses = useCallback(() => {
    const allRoutes = Object.values(DUBLIN_NETWORK).flat();
    return Array.from({ length: 45 }).map((_, i) => {
      const x = 15 + Math.random() * 70;
      const y = 15 + Math.random() * 70;
      const b = Math.random() * 360;
      return {
        id: `bus-${i}`,
        startX: x, startY: y,
        targetX: x, targetY: y,
        currentX: x, currentY: y,
        route_short_name: allRoutes[Math.floor(Math.random() * allRoutes.length)],
        headsign: ['City Centre', 'Heuston', 'Bray', 'Howth'][Math.floor(Math.random() * 4)],
        bearing: b, targetBearing: b, currentBearing: b,
        agency_id: Math.random() > 0.4 ? '978' : '3',
        // Fix: Use a status consistent with the BusRoute status type
        delayStatus: (Math.random() > 0.9 ? 'Delayed' : 'On Time') as BusPosition['delayStatus']
      };
    });
  }, [DUBLIN_NETWORK]);

  const animate = useCallback((time: number) => {
    if (Date.now() - lastInteractionTime.current > 15000) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    if (startTimeRef.current === null) startTimeRef.current = time;
    const progress = Math.min((time - startTimeRef.current) / duration, 1);

    setBuses(prevBuses => prevBuses.map(bus => {
      const currentX = bus.startX + (bus.targetX - bus.startX) * progress;
      const currentY = bus.startY + (bus.targetY - bus.startY) * progress;
      let diff = bus.targetBearing - bus.bearing;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      const currentBearing = (bus.bearing + diff * progress) % 360;
      return { ...bus, currentX, currentY, currentBearing };
    }));

    if (progress < 1) {
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [duration]);

  useEffect(() => {
    setBuses(generateBuses());
    
    const cycle = () => {
      startTimeRef.current = null; // CRITICAL FIX: Reset start time for the next interpolation cycle
      setBuses(prevBuses => prevBuses.map(bus => ({
        ...bus,
        startX: bus.currentX,
        startY: bus.currentY,
        bearing: bus.currentBearing,
        targetX: Math.max(5, Math.min(95, bus.currentX + (Math.random() - 0.5) * 8)),
        targetY: Math.max(5, Math.min(95, bus.currentY + (Math.random() - 0.5) * 8)),
        targetBearing: (bus.currentBearing + (Math.random() - 0.5) * 60) % 360
      })));
      requestRef.current = requestAnimationFrame(animate);
    };

    const interval = setInterval(cycle, duration);
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      clearInterval(interval);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [generateBuses, animate, duration]);

  const onPointerDown = (e: React.PointerEvent) => {
    lastInteractionTime.current = Date.now();
    if (isDrawerOpen || isInitializing) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('.bus-card')) return;
    
    setIsDragging(true);
    dragStart.current = { x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y };
    if (containerRef.current) containerRef.current.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setMapOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const filteredBuses = useMemo(() => 
    buses.filter(bus => 
      bus.route_short_name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [buses, searchQuery]);

  return (
    <div 
      ref={containerRef}
      className="relative h-full w-full bg-[#080d14] overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => setIsDragging(false)}
    >
      <div className="absolute inset-0 pointer-events-none z-[5] opacity-20">
        <div className="rain-container"></div>
      </div>

      {isInitializing && (
        <div className="absolute inset-0 z-[500] bg-[#0a111a] flex flex-col items-center justify-center transition-opacity duration-1000">
          <div className="relative size-40 mb-10">
            <div className="absolute inset-0 border-[1px] border-primary/20 rounded-full scale-150 animate-ping"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="material-symbols-outlined text-primary text-5xl animate-pulse">radar</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-primary font-black text-[10px] uppercase tracking-[1em] mb-2">Establishing Sync</p>
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">NTA Real-time Gateway</p>
          </div>
        </div>
      )}

      <div 
        className="absolute inset-0 origin-center pointer-events-none transition-transform duration-75 ease-out"
        style={{ 
          transform: `translate3d(${mapOffset.x}px, ${mapOffset.y}px, 0) scale(${scale})`,
          willChange: 'transform'
        }}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 brightness-[0.4] grayscale-[0.1]"
          style={{ backgroundImage: `url(${MAP_IMAGE_URL})`, width: '100%', height: '100%' }}
        />

        {filteredBuses.map((bus) => {
          const colors = getBusColors(bus.route_short_name, bus.agency_id);
          const isSelected = selectedBus?.id === bus.id;
          const isMatch = searchQuery.length > 0 && bus.route_short_name.toLowerCase() === searchQuery.toLowerCase();

          return (
            <div 
              key={bus.id}
              className="absolute pointer-events-auto"
              style={{ 
                left: `${bus.currentX}%`, 
                top: `${bus.currentY}%`, 
                transform: `translate3d(-50%, -50%, 0) scale(${1/scale})`,
                opacity: (searchQuery.length > 0 && !isMatch) ? 0.1 : 1,
                zIndex: isSelected || isMatch ? 100 : 10
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBus(isSelected ? null : bus);
              }}
            >
              <div 
                className={`relative size-9 rounded-xl border-[2px] shadow-2xl flex items-center justify-center transition-all duration-300 ${isSelected ? 'scale-[1.8] ring-4 ring-white/10' : ''}`}
                style={{ 
                  backgroundColor: colors.bg,
                  borderColor: isMatch ? '#FFF' : colors.border,
                  color: colors.text,
                  boxShadow: isMatch || isSelected ? `0 0 35px ${colors.glow}` : 'none'
                }}
              >
                <span className="text-[11px] font-black tracking-tighter leading-none">{bus.route_short_name}</span>
                <div 
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-white opacity-90"
                  style={{ transform: `translateX(-50%) rotate(${bus.currentBearing}deg)`, transformOrigin: 'center 15px' }}
                />
              </div>

              {isSelected && (
                <div 
                  className="bus-card absolute bottom-16 left-1/2 -translate-x-1/2 bg-slate-900/98 backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] min-w-[280px] pointer-events-auto animate-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-3">
                     <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">Live Telemetry</span>
                     <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Active</span>
                     </div>
                  </div>
                  <h3 className="text-white font-black text-2xl tracking-tighter mb-1">{bus.route_short_name}</h3>
                  <p className="text-white/40 text-[11px] mb-6 font-bold leading-relaxed uppercase tracking-widest italic">Towards {bus.headsign}</p>
                  <button 
                    onClick={() => onSelectRoute({
                      id: bus.id, number: bus.route_short_name, destination: bus.headsign,
                      nextStop: 'Acquiring Stop...', status: bus.delayStatus, arrivalTime: 'Due',
                      occupancy: 'Plenty of seats', color: colors.bg
                    })}
                    className="w-full bg-primary text-white text-[11px] font-black py-4 rounded-[1.25rem] shadow-2xl shadow-primary/40 active:scale-95 transition-all uppercase tracking-[0.2em]"
                  >
                    Engage Tracking
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="absolute inset-0 pointer-events-none z-[200]">
        <div className="absolute top-16 left-6 right-6 flex gap-4">
          <div className="flex-1 pointer-events-auto bg-slate-900/90 backdrop-blur-3xl h-16 rounded-[2rem] border border-white/10 flex items-center px-7 shadow-2xl">
            <span className="material-symbols-outlined text-primary text-2xl mr-4">search</span>
            <input 
              type="text" 
              placeholder="Track line number..." 
              className="bg-transparent border-none text-white text-base font-bold focus:ring-0 placeholder:text-white/15 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onSelectStop(); }} 
            className="size-16 rounded-[2rem] bg-slate-900/90 backdrop-blur-3xl border border-white/10 text-white flex items-center justify-center pointer-events-auto shadow-2xl active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-2xl">grid_view</span>
          </button>
        </div>
      </div>

      <div 
        className={`absolute bottom-0 left-0 right-0 z-[300] bg-slate-900/98 backdrop-blur-3xl border-t border-white/10 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-t-[4rem] shadow-[0_-40px_120px_rgba(0,0,0,1)] flex flex-col ${isDrawerOpen ? 'h-[88%]' : 'h-24'}`}
      >
        <div 
          className="w-full h-24 flex-shrink-0 flex flex-col items-center justify-center cursor-pointer pointer-events-auto"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        >
          <div className="w-16 h-1.5 rounded-full bg-white/10 mb-4" />
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.6em] mb-1">Fleet Core Terminal</p>
          <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">{isDrawerOpen ? 'Minimize System' : 'Access Network'}</p>
        </div>

        <div className="px-10 pb-40 overflow-y-auto no-scrollbar flex-1 pointer-events-auto">
          {Object.entries(DUBLIN_NETWORK).map(([category, lines]) => (
            <div key={category} className="mb-12">
              <h4 className="text-[11px] font-black text-white/10 uppercase tracking-[0.5em] mb-6 pl-1">{category} Division</h4>
              <div className="grid grid-cols-4 gap-4">
                {lines.map((route: string) => (
                  <button
                    key={route}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery(route);
                      setIsDrawerOpen(false);
                      setSelectedBus(null);
                    }}
                    className={`h-20 rounded-[1.5rem] flex flex-col items-center justify-center transition-all border ${searchQuery === route ? 'bg-primary border-primary text-white scale-105 shadow-[0_15px_40px_rgba(19,127,236,0.4)]' : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10 hover:text-white'}`}
                  >
                    <span className="text-base font-black tracking-tight">{route}</span>
                    <span className="text-[9px] font-black opacity-30 mt-1">SYNC</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes rain { 
          from { transform: translateY(-100vh) translateX(20vw); } 
          to { transform: translateY(100vh) translateX(-20vw); } 
        }
        .rain-container::after {
          content: '';
          position: absolute;
          width: 2px;
          height: 100px;
          background: linear-gradient(transparent, rgba(19,127,236,0.4));
          left: 50%;
          animation: rain 1.5s linear infinite;
        }
        .animate-in { animation: scale-up 0.4s cubic-bezier(0.17, 0.67, 0.83, 0.67); }
        @keyframes scale-up { from { opacity: 0; transform: translate(-50%, 20px) scale(0.9); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
      `}</style>
    </div>
  );
};

export default MapScreen;
