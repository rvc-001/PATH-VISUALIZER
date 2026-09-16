export class Satellite {
  name: string;
  r: number;
  w: number;
  inc: number;
  phase: number;

  constructor(name: string, radius: number, angularVelocity: number, inclination = 0.0, phase = 0.0) {
    this.name = name;
    this.r = radius;
    this.w = angularVelocity;
    // Convert degrees to radians for calculation
    this.inc = inclination * (Math.PI / 180);
    this.phase = phase;
  }

  position(t: number): [number, number, number] {
    // Calculate angle in the orbital plane
    const theta = this.w * t + this.phase;
    
    // 1. Position in a flat 2D plane (un-tilted)
    const x_flat = this.r * Math.cos(theta);
    const y_flat = this.r * Math.sin(theta);
    
    // 2. Rotate the plane by the inclination angle (around the X-axis)
    const x = x_flat;
    const y = y_flat * Math.cos(this.inc);
    const z = y_flat * Math.sin(this.inc);
    
    return [x, y, z];
  }

  getLatLon(t: number): { lat: number; lon: number } {
    const pos = this.position(t);
    const r = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
    const lat = Math.asin(pos[2] / r) * (180 / Math.PI);
    const lon = Math.atan2(pos[1], pos[0]) * (180 / Math.PI);
    return { lat, lon };
  }

  evasiveManeuver() {
    this.phase += 0.5;
    this.r += 0.5;
  }
}

export function distance(p1: [number, number, number], p2: [number, number, number]): number {
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2) + Math.pow(p1[2] - p2[2], 2));
}

export interface Alert {
  sat1: string;
  sat2: string;
  distance: number;
  position: [number, number, number];
}

export function checkCloseApproaches(satellites: Satellite[], t: number, threshold: number): Alert[] {
  const alerts: Alert[] = [];
  for (let i = 0; i < satellites.length; i++) {
    for (let j = i + 1; j < satellites.length; j++) {
      const p1 = satellites[i].position(t);
      const p2 = satellites[j].position(t);
      const d = distance(p1, p2);

      if (d < threshold) {
        // Midpoint of the two satellites
        const pos: [number, number, number] = [
          (p1[0] + p2[0]) / 2,
          (p1[1] + p2[1]) / 2,
          (p1[2] + p2[2]) / 2
        ];
        alerts.push({
          sat1: satellites[i].name,
          sat2: satellites[j].name,
          distance: d,
          position: pos
        });
      }
    }
  }
  return alerts;
}
