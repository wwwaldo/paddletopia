'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useTexture, Sky } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider} from '@react-three/rapier';
import { Suspense, useEffect, useState } from 'react';
import * as THREE from 'three';

// Preload the model
useGLTF.preload('/single-paddle.glb');

function getRandomPosition(): [number, number, number] {
  return [
    Math.random() * 100 - 50, // x between -50 and 50
    Math.random() * 30,       // y between 0 and 30
    Math.random() * 100 - 50  // z between -50 and 50
  ];
}

function getRandomRotation(): [number, number, number] {
  return [
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2
  ];
}

function Model({ position = [0, 0, 0] as [number, number, number],
  rotation = [0, 0, Math.PI / 2] as [number, number, number] }) {
  const { scene } = useGLTF('/single-paddle.glb');
  
  return (
    <RigidBody colliders="hull" restitution={0.7} position={position}>
      <primitive object={scene.clone()} scale={[50, 50, 50]} rotation={rotation} />
    </RigidBody>
  );
}

function Floor() {
  const texture = useTexture('/textures/tennis-court.jpeg');
  
  return (
    <RigidBody type="fixed">
      {/* Infinite physics floor */}
      <CuboidCollider args={[1000, 0.1, 1000]} position={[0, -20, 0]} />
      {/* Tennis court */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -19.9, 0]} receiveShadow>
        <planeGeometry args={[400, 200]} />
        <meshStandardMaterial 
          map={texture}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      {/* Infinite floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -20, 0]} receiveShadow>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial 
          color="#1e3a8a"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
    </RigidBody>
  );
}

export default function Scene() {
  const [paddles, setPaddles] = useState<{ position: [number, number, number], rotation: [number, number, number] }[]>([
    { position: [20, 1, 10], rotation: [0, 0, Math.PI / 2] },
    { position: [20, 0, 10], rotation: [0, Math.PI / 4, Math.PI / 2] },
    { position: [-20, 5, -10], rotation: [Math.PI / 6, 0, Math.PI / 3] },
    { position: [0, 10, 0], rotation: [Math.PI / 4, Math.PI / 4, 0] }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPaddles(currentPaddles => {
        const updatedPaddles = [...currentPaddles, {
          position: getRandomPosition(),
          rotation: getRandomRotation()
        }];
        
        // Remove oldest paddles if we exceed 42
        if (updatedPaddles.length > 42) {
          return updatedPaddles.slice(-42); // Keep only the last 42 paddles
        }
        return updatedPaddles;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '16px',
        zIndex: 1000
      }}>
        Paddles: {paddles.length} / 42
      </div>
      <Canvas
        camera={{ position: [0, 0, 100], fov: 45 }}
        className="bg-gray-900"
        shadows
      >
        <Sky 
          distance={450000}
          sunPosition={[0, 1, 0]}
          inclination={0.6}
          azimuth={0.1}
        />
        <ambientLight intensity={1.5} />
        <spotLight
          position={[10, 10, 5]}
          intensity={2}
          castShadow
        />
        <directionalLight
          position={[-10, -10, -5]}
          intensity={1}
        />
        <Physics gravity={[0, -30, 0]}>
          <Suspense fallback={null}>
            {paddles.map((paddle, index) => (
              <Model 
                key={index}
                position={paddle.position}
                rotation={paddle.rotation}
              />
            ))}
            <Floor />
          </Suspense>
        </Physics>
        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          minDistance={30}
          maxDistance={200}
          maxPolarAngle={Math.PI / 2 - 0.1}  
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
