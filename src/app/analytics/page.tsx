'use client';
import { useAppStore } from '@/store';
import AnalyticsGlobe from '@/components/AnalyticsGlobe';
import { Activity, Globe } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AnalyticsPage() {
  const { satellites, speed } = useAppStore();
  const [time, setTime] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      setTime((t) => t + delta * speed);
      animationFrame = requestAnimationFrame(loop);
    };
    
    animationFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrame);
  }, [speed]);

  const groundTrackData = satellites.map((sat) => {
    const { lat, lon } = sat.getLatLon(time);
    return { name: sat.name, lat, lon };
  });

  return (
    <main className="min-h-screen bg-[#050505] text-zinc-100 p-6 flex flex-col font-sans">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/20 backdrop-blur-md">
            <img src="/icon.svg" alt="Logo" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Mission Analytics</h1>
            <p className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">Telemetry & Ground Tracks</p>
          </div>
        </div>
        
        <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors">
          <Globe size={16} />
          Return to 3D View
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Ground Track Plot */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col">
          <h3 className="text-lg font-medium text-white mb-6">Real-Time Ground Tracks</h3>
          <div className="flex-1 min-h-[400px]">
            <AnalyticsGlobe satellites={satellites} speed={speed} />
          </div>
        </div>

        {/* Telemetry Panel */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col">
          <h3 className="text-lg font-medium text-white mb-6">Live Telemetry</h3>
          <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {satellites.map(sat => {
              const { lat, lon } = sat.getLatLon(time);
              return (
                <div key={sat.name} className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-sm text-blue-400">{sat.name}</span>
                    <span className="text-[10px] uppercase text-zinc-500 tracking-wider">Alt: {sat.r.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                    <div>
                      <span className="text-zinc-500 block">LAT</span>
                      {lat.toFixed(2)}°
                    </div>
                    <div>
                      <span className="text-zinc-500 block">LON</span>
                      {lon.toFixed(2)}°
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
      `}} />
    </main>
  );
}
