'use client';
import { useState, useEffect } from 'react';
import { Satellite, checkCloseApproaches, Alert } from '@/utils/physics';
import GlobeCanvas from '@/components/GlobeScene';
import { Activity, Plus, Trash2, Settings2, ShieldAlert, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import { useAppStore } from '@/store';

export default function Home() {
  const { satellites, speed, addSatellite, removeSatellite, setSpeed, evadeSatellite } = useAppStore();

  const [collisionSimEnabled, setCollisionSimEnabled] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!collisionSimEnabled) {
      setAlerts([]);
      return;
    }

    let animationFrame: number;
    let lastTime = performance.now();
    let time = 0;

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      time += delta * speed;
      
      const newAlerts = checkCloseApproaches(satellites, time, 1.5);
      
      // If new alerts are found, add them to the state if they aren't already there
      if (newAlerts.length > 0) {
        setAlerts((prevAlerts) => {
          const combined = [...prevAlerts];
          newAlerts.forEach(newAlert => {
            // Check if this pair is already in the alerts
            const exists = combined.some(a => 
              (a.sat1 === newAlert.sat1 && a.sat2 === newAlert.sat2) ||
              (a.sat1 === newAlert.sat2 && a.sat2 === newAlert.sat1)
            );
            if (!exists) {
              combined.push(newAlert);
            }
          });
          return combined;
        });
      }

      animationFrame = requestAnimationFrame(loop);
    };
    
    animationFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrame);
  }, [collisionSimEnabled, satellites, speed]);

  const [newSat, setNewSat] = useState({
    name: `SAT-NEW-${Math.floor(Math.random() * 1000)}`,
    alt: 8.0,
    v: 0.1,
    inc: 15.0
  });

  const handleAddSatellite = (e: React.FormEvent) => {
    e.preventDefault();
    addSatellite(new Satellite(newSat.name, newSat.alt, newSat.v, newSat.inc, 0.0));
    setNewSat({
      ...newSat,
      name: `SAT-NEW-${Math.floor(Math.random() * 1000)}`
    });
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black text-zinc-100 font-sans selection:bg-blue-500/30">
      <GlobeCanvas satellites={satellites} speed={speed} alerts={alerts} />

      <div className="absolute top-0 left-0 h-full w-full pointer-events-none p-6 flex flex-col justify-between">
        
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/20 backdrop-blur-md">
              <img src="/icon.svg" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Mission Control</h1>
              <p className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">Orbital Trajectory System</p>
            </div>
          </div>
          
          <div className="flex gap-4 pointer-events-auto">
            <label className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors text-sm">
              <input 
                type="checkbox" 
                checked={collisionSimEnabled} 
                onChange={(e) => setCollisionSimEnabled(e.target.checked)}
                className="accent-red-500"
              />
              Collision Simulator
            </label>
            <Link href="/analytics" className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors">
              <BarChart2 size={16} />
              Mission Analytics
            </Link>
          </div>
        </header>

        <div className="w-full flex justify-between items-end pointer-events-none">
          <div className="w-[320px] pointer-events-auto flex flex-col gap-4">
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-2xl shadow-black/50">
              <div className="flex items-center gap-2 mb-4 text-sm font-medium text-zinc-300">
                <Plus size={16} />
                <h3>Inject Payload</h3>
              </div>
              
              <form onSubmit={handleAddSatellite} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase text-zinc-500 font-semibold tracking-wider">Designation</label>
                  <input 
                    type="text" 
                    value={newSat.name}
                    onChange={e => setNewSat({...newSat, name: e.target.value})}
                    className="bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase text-zinc-500 font-semibold tracking-wider">Altitude</label>
                    <input 
                      type="number" step="0.5"
                      value={newSat.alt}
                      onChange={e => setNewSat({...newSat, alt: parseFloat(e.target.value)})}
                      className="bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase text-zinc-500 font-semibold tracking-wider">Velocity</label>
                    <input 
                      type="number" step="0.01"
                      value={newSat.v}
                      onChange={e => setNewSat({...newSat, v: parseFloat(e.target.value)})}
                      className="bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 mb-2">
                  <label className="text-[10px] uppercase text-zinc-500 font-semibold tracking-wider">Inclination (°)</label>
                  <input 
                    type="range" min="0" max="180" step="5"
                    value={newSat.inc}
                    onChange={e => setNewSat({...newSat, inc: parseFloat(e.target.value)})}
                    className="w-full accent-blue-500"
                  />
                  <div className="text-xs text-right text-zinc-400">{newSat.inc}°</div>
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition-colors text-sm shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                  Launch Payload
                </button>
              </form>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-2xl shadow-black/50 flex flex-col max-h-[250px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-zinc-300">Active Constellation</h3>
                <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded font-mono border border-blue-500/20">
                  {satellites.length} ORBITING
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {satellites.map(sat => (
                  <div key={sat.name} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors group">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                      <span className="text-xs font-mono text-zinc-200">{sat.name}</span>
                    </div>
                    <button 
                      onClick={() => removeSatellite(sat.name)}
                      className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-2xl shadow-black/50">
              <div className="flex items-center gap-2 mb-4 text-sm font-medium text-zinc-300">
                <Settings2 size={16} />
                <h3>Simulation Settings</h3>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <label className="text-[10px] uppercase text-zinc-500 font-semibold tracking-wider">Time Multiplier</label>
                  <span className="text-xs font-mono text-blue-400">{speed}x</span>
                </div>
                <input 
                  type="range" min="0" max="10" step="0.5"
                  value={speed}
                  onChange={e => setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>

          </div>

          {/* Alert Panel */}
          {alerts.length > 0 && (
            <div className="pointer-events-auto flex flex-col gap-4 max-w-[400px]">
              {alerts.map((alert, idx) => (
                <div key={idx} className="bg-red-950/40 border border-red-500/50 rounded-2xl p-5 backdrop-blur-xl shadow-2xl shadow-red-900/50 animate-pulse">
                  <div className="flex items-center gap-2 mb-4 text-red-400 font-bold">
                    <ShieldAlert size={20} />
                    <h3>COLLISION WARNING</h3>
                  </div>
                  <p className="text-sm text-zinc-300 mb-4">
                    Close approach detected between <span className="font-mono text-white">{alert.sat1}</span> and <span className="font-mono text-white">{alert.sat2}</span>. 
                    Distance: <span className="text-red-400 font-bold">{alert.distance.toFixed(3)} units</span>
                  </p>
                  <p className="text-xs text-zinc-400 mb-4 italic">Action Required: Evade to adjust orbit, or Deorbit to permanently remove payload.</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        evadeSatellite(alert.sat1);
                        setAlerts(alerts.filter(a => a !== alert));
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium py-2 rounded-lg transition-colors text-sm shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                    >
                      Evade {alert.sat1}
                    </button>
                    <button 
                      onClick={() => {
                        removeSatellite(alert.sat1);
                        setAlerts(alerts.filter(a => a !== alert));
                      }}
                      className="flex-1 bg-red-900/80 hover:bg-red-800 text-white font-medium py-2 rounded-lg border border-red-500/30 transition-colors text-sm"
                    >
                      Deorbit {alert.sat1}
                    </button>
                    <button 
                      onClick={() => setAlerts(alerts.filter(a => a !== alert))}
                      className="px-3 bg-white/10 hover:bg-white/20 text-white font-medium py-2 rounded-lg transition-colors text-sm"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
