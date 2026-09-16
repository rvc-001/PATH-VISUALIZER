import { create } from 'zustand';
import { Satellite } from '@/utils/physics';

interface AppState {
  satellites: Satellite[];
  speed: number;
  addSatellite: (sat: Satellite) => void;
  removeSatellite: (name: string) => void;
  setSpeed: (speed: number) => void;
  evadeSatellite: (name: string) => void;
}

const EARTH_RADIUS = 6.0;

const INITIAL_SATS = [
  new Satellite("SAT-LEO-01", EARTH_RADIUS + 1.0, 0.15, 45.0, 0.0),
  new Satellite("SAT-POLAR-02", EARTH_RADIUS + 1.5, 0.12, 90.0, 2.0),
  new Satellite("SAT-GEO-03", EARTH_RADIUS + 2.5, 0.08, 0.0, 4.0),
  new Satellite("SAT-MEO-04", EARTH_RADIUS + 6.0, 0.05, 30.0, 1.0)
];

export const useAppStore = create<AppState>((set) => ({
  satellites: INITIAL_SATS,
  speed: 2,
  addSatellite: (sat) => set((state) => ({ satellites: [...state.satellites, sat] })),
  removeSatellite: (name) => set((state) => ({
    satellites: state.satellites.filter((s) => s.name !== name)
  })),
  setSpeed: (speed) => set({ speed }),
  evadeSatellite: (name) => set((state) => {
    const updated = state.satellites.map(sat => {
      if (sat.name === name) {
        // Create a new instance with the evasive maneuver applied to force re-render
        const newSat = new Satellite(sat.name, sat.r, sat.w, sat.inc * (180 / Math.PI), sat.phase);
        newSat.evasiveManeuver();
        return newSat;
      }
      return sat;
    });
    return { satellites: updated };
  }),
}));
