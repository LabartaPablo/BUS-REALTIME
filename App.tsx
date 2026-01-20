
import React, { useState, useEffect } from 'react';
import { Screen, BusRoute } from './types';
import { MOCK_ROUTES } from './constants';
import MapScreen from './components/MapScreen';
import RouteDetailScreen from './components/RouteDetailScreen';
import StopDetailScreen from './components/StopDetailScreen';
import { getTransitAnalysis } from './geminiService';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('MAP');
  const [selectedRoute, setSelectedRoute] = useState<BusRoute>(MOCK_ROUTES[0]);
  const [systemAlert, setSystemAlert] = useState<string>("");

  useEffect(() => {
    const fetchGlobalStatus = async () => {
      try {
        const insight = await getTransitAnalysis("General Dublin Network", "City Centre");
        setSystemAlert(insight.analysis);
      } catch (e) {
        setSystemAlert("Monitoring Dublin network traffic flow...");
      }
    };
    fetchGlobalStatus();
    const interval = setInterval(fetchGlobalStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleRouteSelect = (route: BusRoute) => {
    setSelectedRoute(route);
    setCurrentScreen('ROUTE_DETAIL');
  };

  const handleStopSelect = () => {
    setCurrentScreen('STOP_DETAIL');
  };

  const handleBack = () => {
    setCurrentScreen('MAP');
  };

  return (
    <div className="h-screen w-full relative overflow-hidden flex flex-col font-sans select-none bg-background-dark">
      {/* Ticker de Alerta - Capa de Sistema */}
      {currentScreen === 'MAP' && (
        <div className={`absolute top-0 left-0 w-full z-[400] transition-transform duration-500 ${systemAlert ? 'translate-y-0' : '-translate-y-full'} bg-primary/95 backdrop-blur-2xl h-10 border-b border-white/10 flex items-center shadow-[0_4px_30px_rgba(0,0,0,0.4)]`}>
          <div className="flex items-center gap-4 w-full px-4 overflow-hidden">
             <div className="flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest flex-shrink-0">
               <span className="material-symbols-outlined text-[14px] animate-pulse">radar</span>
               <span>Radar AI</span>
             </div>
             <div className="flex-1 overflow-hidden relative">
               <p className="text-[11px] font-bold text-white whitespace-nowrap animate-marquee">
                 {systemAlert || "Initializing Dublin Transit Radar network mapping..."} • REAL-TIME FLEET TELEMETRY ACTIVE • TRACKING ALL SERVICES • 
               </p>
             </div>
          </div>
        </div>
      )}

      {currentScreen === 'MAP' && (
        <MapScreen 
          onSelectRoute={handleRouteSelect} 
          onSelectStop={handleStopSelect}
        />
      )}
      
      {currentScreen === 'ROUTE_DETAIL' && (
        <RouteDetailScreen 
          route={selectedRoute} 
          onBack={handleBack} 
        />
      )}

      {currentScreen === 'STOP_DETAIL' && (
        <StopDetailScreen 
          onBack={handleBack} 
        />
      )}
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-150%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
        }
        body {
          overscroll-behavior-y: contain;
        }
      `}</style>
    </div>
  );
};

export default App;
