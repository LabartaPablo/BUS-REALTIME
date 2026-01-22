import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { BusRoute } from '../types';
import { fetchBusPositions, BusPosition } from '../busApiService';
import { fetchStops, fetchStopSchedule, StopData, ScheduleEntry } from '../stopsApiService';
import { interpolateBearing, lerp } from '../utils/interpolation';
import 'leaflet/dist/leaflet.css';

interface MapScreenProps {
  onSelectRoute: (route: BusRoute) => void;
  onSelectStop: () => void;
}

const MapScreen: React.FC<MapScreenProps> = ({ onSelectRoute, onSelectStop }) => {
  const [buses, setBuses] = useState<BusPosition[]>([]);
  const [previousBuses, setPreviousBuses] = useState<BusPosition[]>([]);
  const [animationProgress, setAnimationProgress] = useState(1);
  const [stops, setStops] = useState<StopData[]>([]);
  const [selectedStop, setSelectedStop] = useState<StopData | null>(null);
  const [stopSchedule, setStopSchedule] = useState<ScheduleEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBus, setSelectedBus] = useState<BusPosition | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSchedulePanelOpen, setIsSchedulePanelOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const DUBLIN_NETWORK: Record<string, string[]> = useMemo(() => ({
    'Orbital': ['N4', 'N6'],
    'Spine': ['C1', 'C2', 'C3', 'C4', 'G1', 'G2'],
    'City': ['1', '4', '7', '9', '11', '13', '14', '15', '16', '26', '27', '33', '37', '38', '39', '40', '41', '46A', '122', '123', '145', '155']
  }), []);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch bus positions
  useEffect(() => {
    const loadBuses = async () => {
      const positions = await fetchBusPositions();
      setPreviousBuses(buses.length > 0 ? buses : positions);
      setBuses(positions);
      setAnimationProgress(0);
    };

    loadBuses();
    const interval = setInterval(loadBuses, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch stops
  useEffect(() => {
    const loadStops = async () => {
      const stopsData = await fetchStops(500);
      setStops(stopsData);
    };
    loadStops();
  }, []);

  // Animation loop
  useEffect(() => {
    if (animationProgress >= 1 || buses.length === 0) return;

    let animationFrame: number;
    const startTime = Date.now();
    const duration = 15000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(progress);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [buses]);

  const interpolatedBuses = useMemo(() => {
    if (animationProgress === 1 || previousBuses.length === 0) return buses;

    return buses.map(bus => {
      const prevBus = previousBuses.find(p => p.id === bus.id);
      if (!prevBus) return bus;

      return {
        ...bus,
        lat: lerp(prevBus.lat, bus.lat, animationProgress),
        lng: lerp(prevBus.lng, bus.lng, animationProgress),
        bearing: interpolateBearing(prevBus.bearing, bus.bearing, animationProgress)
      };
    });
  }, [buses, previousBuses, animationProgress]);

  const filteredBuses = useMemo(() =>
    interpolatedBuses.filter(bus =>
      bus.route_short_name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [interpolatedBuses, searchQuery]);

  const handleStopClick = async (stop: StopData) => {
    setSelectedStop(stop);
    setIsSchedulePanelOpen(true);
    const schedule = await fetchStopSchedule(stop.stop_id);
    setStopSchedule(schedule);
  };

  return (
    <div className="relative h-full w-full bg-[#080d14] overflow-hidden select-none">
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

      <MapContainer
        center={[53.3498, -6.2603]}
        zoom={13}
        className="h-full w-full"
        zoomControl={false}
        style={{ background: '#080d14' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Bus markers */}
        {filteredBuses.map((bus) => {
          const isMatch = searchQuery.length > 0 && bus.route_short_name.toLowerCase() === searchQuery.toLowerCase();
          const fillColor = bus.route_color || '#007bff';

          return (
            <CircleMarker
              key={bus.id}
              center={[bus.lat, bus.lng]}
              radius={8}
              pathOptions={{
                fillColor: fillColor,
                color: isMatch ? '#FFF' : fillColor,
                weight: 2,
                opacity: (searchQuery.length > 0 && !isMatch) ? 0.3 : 1,
                fillOpacity: (searchQuery.length > 0 && !isMatch) ? 0.3 : 0.9
              }}
              eventHandlers={{
                click: () => setSelectedBus(bus)
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-black text-lg">{bus.route_short_name}</h3>
                  <p className="text-sm text-gray-600">Towards {bus.headsign || 'City Centre'}</p>
                  <button
                    onClick={() => onSelectRoute({
                      id: bus.id,
                      number: bus.route_short_name,
                      destination: bus.headsign || 'City Centre',
                      nextStop: 'Acquiring Stop...',
                      status: 'On Time',
                      arrivalTime: 'Due',
                      occupancy: 'Plenty of seats',
                      color: fillColor
                    })}
                    className="mt-2 w-full bg-primary text-white text-xs font-bold py-2 px-4 rounded"
                  >
                    Track Route
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Stop markers */}
        {stops.map((stop) => (
          <CircleMarker
            key={stop.stop_id}
            center={[stop.stop_lat, stop.stop_lon]}
            radius={3}
            pathOptions={{
              fillColor: '#fff',
              color: '#333',
              weight: 1,
              fillOpacity: 0.6,
              opacity: 0.8
            }}
            eventHandlers={{
              click: () => handleStopClick(stop)
            }}
          >
            <Popup>
              <div className="p-1">
                <p className="font-bold text-xs">{stop.stop_name}</p>
                <p className="text-[10px] text-gray-500">Click for schedule</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Schedule Panel */}
      {isSchedulePanelOpen && selectedStop && (
        <div className="absolute top-0 right-0 bottom-0 w-96 bg-slate-900/98 backdrop-blur-3xl border-l border-white/10 z-[400] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-white font-black text-xl">{selectedStop.stop_name}</h2>
                <p className="text-white/40 text-sm">Stop ID: {selectedStop.stop_id}</p>
              </div>
              <button
                onClick={() => setIsSchedulePanelOpen(false)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {stopSchedule.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-8">No upcoming arrivals</p>
              ) : (
                stopSchedule.map((entry, idx) => (
                  <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex justify-between items-center">
                      <div>
                        <span
                          className="inline-block px-2 py-1 rounded text-white font-black text-sm mr-2"
                          style={{ backgroundColor: entry.route_color }}
                        >
                          {entry.route_short_name}
                        </span>
                        <span className="text-white/70 text-sm">{entry.trip_headsign || 'City Centre'}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{entry.scheduled_time}</p>
                        {entry.delay_seconds !== 0 && (
                          <p className="text-xs text-red-400">+{Math.floor(entry.delay_seconds / 60)}min</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none z-[200]">
        <div className="absolute top-16 left-6 right-6 flex gap-4">
          <div className="flex-1 pointer-events-auto bg-slate-900/90 backdrop-blur-3xl h-16 rounded-[2rem] border border-white/10 flex items-center px-7 shadow-2xl">
            <span className="material-symbols-outlined text-primary text-2xl mr-4">search</span>
            <input
              type="text"
              placeholder="Track line number..."
              className="bg-transparent border-none text-white text-base font-bold focus:ring-0 placeholder:text-white/15 w-full outline-none"
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

      <div className={`absolute bottom-0 left-0 right-0 z-[300] bg-slate-900/98 backdrop-blur-3xl border-t border-white/10 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] rounded-t-[4rem] shadow-[0_-40px_120px_rgba(0,0,0,1)] flex flex-col ${isDrawerOpen ? 'h-[88%]' : 'h-24'}`}>
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
        .leaflet-container { background: #080d14; }
        .leaflet-popup-content-wrapper { background: #1c2630; color: white; }
        .leaflet-popup-tip { background: #1c2630; }
      `}</style>
    </div>
  );
};

export default MapScreen;
