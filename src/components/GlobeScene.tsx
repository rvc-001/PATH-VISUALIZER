'use client';
import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Satellite, Alert } from '@/utils/physics';

function Earth() {
  return (
    <mesh>
      <sphereGeometry args={[6, 64, 64]} />
      <meshStandardMaterial color="#020813" roughness={0.8} />
      <mesh>
        <sphereGeometry args={[6.02, 32, 32]} />
        <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.1} />
      </mesh>
    </mesh>
  );
}

function SatelliteMesh({ sat, time }: { sat: Satellite; time: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const points = useMemo(() => {
    const pts = [];
    const steps = 100;
    const period = (2 * Math.PI) / Math.max(sat.w, 0.001); // Prevent division by zero
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * period;
      pts.push(new THREE.Vector3(...sat.position(t)));
    }
    return pts;
  }, [sat]);

  useFrame(() => {
    if (meshRef.current) {
      const pos = sat.position(time);
      meshRef.current.position.set(...pos);
    }
  });

  return (
    <group>
      <Line points={points} color="rgba(255, 215, 0, 0.3)" lineWidth={1} transparent />
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.2, 0]} />
        <meshBasicMaterial color="#ef4444" />
        <Html distanceFactor={15}>
          <div className="px-2 py-0.5 rounded text-[10px] font-mono text-white bg-black/50 border border-white/10 whitespace-nowrap backdrop-blur-sm select-none pointer-events-none">
            {sat.name}
          </div>
        </Html>
      </mesh>
    </group>
  );
}

function SatelliteGroup({ satellites, speed }: { satellites: Satellite[], speed: number }) {
  const [time, setTime] = useState(0);

  useFrame((state, delta) => {
    setTime((t) => t + delta * speed);
  });

  return (
    <>
      {satellites.map((sat, i) => (
        <SatelliteMesh key={sat.name} sat={sat} time={time} />
      ))}
    </>
  );
}

function CollisionEffect({ pos }: { pos: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    if (meshRef.current && materialRef.current) {
      const scale = 1 + Math.sin(clock.elapsedTime * 10) * 0.5;
      meshRef.current.scale.set(scale, scale, scale);
      materialRef.current.opacity = 0.5 + Math.sin(clock.elapsedTime * 10) * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={pos}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshBasicMaterial ref={materialRef} color="#ff0000" transparent opacity={0.8} />
      <pointLight color="#ff0000" intensity={5} distance={10} />
    </mesh>
  );
}

export default function GlobeCanvas({ satellites, speed = 2, alerts = [] }: { satellites: Satellite[], speed?: number, alerts?: Alert[] }) {
  return (
    <div className="absolute inset-0 w-full h-full bg-[#050505]">
      <Canvas camera={{ position: [15, 10, 15], fov: 45 }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[100, 10, -50]} intensity={2000} color="#ffffff" />
        <pointLight position={[-100, -10, 50]} intensity={1000} color="#3b82f6" />
        <Earth />
        <SatelliteGroup satellites={satellites} speed={speed} />
        {alerts.map((alert, i) => (
          <CollisionEffect key={`alert-${i}`} pos={alert.position} />
        ))}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <OrbitControls enablePan={false} minDistance={8} maxDistance={40} autoRotate autoRotateSpeed={0.2} />
      </Canvas>
    </div>
  );
}
