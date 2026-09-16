'use client';
import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Satellite } from '@/utils/physics';

function TexturedEarth() {
  const colorMap = useTexture('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
  
  return (
    <mesh>
      <sphereGeometry args={[6, 64, 64]} />
      <meshStandardMaterial map={colorMap} roughness={0.6} />
    </mesh>
  );
}

function GroundTrackMesh({ sat, time }: { sat: Satellite; time: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Calculate projected points directly on the Earth's surface (radius 6.02 to avoid z-fighting)
  const surfacePoints = useMemo(() => {
    const pts = [];
    const steps = 150;
    const period = (2 * Math.PI) / Math.max(sat.w, 0.001);
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * period;
      const pos = sat.position(t);
      const vec = new THREE.Vector3(...pos).normalize().multiplyScalar(6.02);
      pts.push(vec);
    }
    return pts;
  }, [sat]);

  useFrame(() => {
    if (meshRef.current) {
      const pos = sat.position(time);
      const surfacePos = new THREE.Vector3(...pos).normalize().multiplyScalar(6.02);
      meshRef.current.position.copy(surfacePos);
    }
  });

  return (
    <group>
      {/* Ground Track Trail */}
      <Line points={surfacePoints} color="#3b82f6" lineWidth={2} transparent opacity={0.6} />
      
      {/* Ground Track Current Position Marker */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#60a5fa" />
        <pointLight color="#3b82f6" intensity={2} distance={2} />
      </mesh>
    </group>
  );
}

function GroundTrackGroup({ satellites, speed }: { satellites: Satellite[], speed: number }) {
  const [time, setTime] = useState(0);

  useFrame((state, delta) => {
    setTime((t) => t + delta * speed);
  });

  return (
    <>
      {satellites.map((sat, i) => (
        <GroundTrackMesh key={sat.name} sat={sat} time={time} />
      ))}
    </>
  );
}

export default function AnalyticsGlobe({ satellites, speed = 2 }: { satellites: Satellite[], speed?: number }) {
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-[#050505]">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <ambientLight intensity={1.5} />
        <pointLight position={[100, 10, 50]} intensity={3000} color="#ffffff" />
        <pointLight position={[-100, -10, -50]} intensity={1000} color="#ffffff" />
        <TexturedEarth />
        <GroundTrackGroup satellites={satellites} speed={speed} />
        <OrbitControls enablePan={false} minDistance={6.5} maxDistance={20} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
