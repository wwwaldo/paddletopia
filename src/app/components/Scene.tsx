'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useTexture, Sky } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider} from '@react-three/rapier';
import { Suspense, useEffect, useState } from 'react';
import * as THREE from 'three';

// Preload the model
useGLTF.preload('/single-paddle.glb');

// Add styles
const titleStyle = {
  position: 'fixed' as const,
  top: '40px',
  left: '50%',
  transform: 'translateX(-50%)',
  fontFamily: '"Press Start 2P", cursive',
  fontSize: '36px',
  textAlign: 'center' as const,
  zIndex: 1000,
  textShadow: '2px 2px 0px #000000',
  padding: '10px',
  whiteSpace: 'nowrap',
  WebkitTextStroke: '1px black',
} as const;

const keyframesStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

  ${Array.from("PADDLETOPIA").map((_, i) => `
    @keyframes wave-${i} {
      ${Math.max(0, (i * 5) - 10)}% {
        transform: translateY(0px);
      }
      ${i * 5}% {
        transform: translateY(-25px);
      }
      ${i * 5 + 10}% {
        transform: translateY(0px);
      }
      100% {
        transform: translateY(0px);
      }
    }
  `).join('\n')}
`;

const letterStyle = (index: number) => ({
  display: 'inline-block',
  animation: `wave-${index} 2.5s linear infinite`,
  color: `hsl(${(index * 20) % 360}, 100%, 50%)`,
});

function getRandomPosition(): [number, number, number] {
  return [
    Math.random() * 320 - 160,  // x between -160 and 160 (80% of 400)
    Math.random() * 30,         // y between 0 and 30 (height)
    Math.random() * 160 - 80    // z between -80 and 80 (80% of 200)
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
      <primitive object={scene.clone()} scale={[90,90,90]} rotation={rotation} />
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
          color="#87CEEB" 
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
    </RigidBody>
  );
}

export default function Scene() {
  const [paddles, setPaddles] = useState<{ position: [number, number, number], rotation: [number, number, number] }[]>([
    { position: [150, 1, 60], rotation: [0, 0, Math.PI / 2] },
    { position: [-150, 0, -60], rotation: [0, Math.PI / 4, Math.PI / 2] },
    { position: [-100, 5, 70], rotation: [Math.PI / 6, 0, Math.PI / 3] },
    { position: [100, 10, -70], rotation: [Math.PI / 4, Math.PI / 4, 0] }
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

  useEffect(() => {
    // Add keyframes to document
    const style = document.createElement('style');
    style.textContent = keyframesStyle;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
      <div style={titleStyle}>
        {Array.from("PADDLETOPIA").map((char, index) => (
          <span key={index} style={letterStyle(index)}>
            {char}
          </span>
        ))}
      </div>
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
        camera={{ position: [0, 0, 200], fov: 45 }}
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
        <Physics gravity={[0, -60, 0]}>
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
