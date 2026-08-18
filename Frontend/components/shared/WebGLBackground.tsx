'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sparkles } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from 'next-themes';

function Scene() {
  const { theme, resolvedTheme } = useTheme();
  const groupRef = useRef<THREE.Group>(null);
  
  // Subtle rotation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0005;
      groupRef.current.rotation.x += 0.0002;
    }
  });

  const isDark = theme === 'dark' || resolvedTheme === 'dark';

  return (
    <group ref={groupRef}>
      <Sparkles 
        count={isDark ? 100 : 50} 
        scale={20} 
        size={3} 
        speed={0.4} 
        opacity={isDark ? 0.4 : 0.15} 
        color={isDark ? '#fb923c' : '#f97316'} 
      />
      {isDark && (
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      )}
    </group>
  );
}

export default function WebGLBackground() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none transition-opacity duration-1000">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Scene />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 dark:to-black/50 pointer-events-none" />
    </div>
  );
}
