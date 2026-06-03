import * as THREE from 'three';
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useFBO, MeshTransmissionMaterial } from '@react-three/drei';
import { easing } from 'maath';

function GlassShape() {
  const meshRef = useRef();
  const buffer = useFBO();
  const targetPos = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const x = (state.pointer.x * state.viewport.width) / 2;
    const y = (state.pointer.y * state.viewport.height) / 2;

    easing.damp3(targetPos.current, [x, y, 0], 0.12, delta);
    meshRef.current.position.set(targetPos.current.x, targetPos.current.y, 0);

    meshRef.current.rotation.x += delta * 0.15;
    meshRef.current.rotation.y += delta * 0.2;

    // render scene to buffer for refraction
    const { gl, scene, camera } = state;
    gl.setRenderTarget(buffer);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.setClearColor(0x000000, 0);
  });

  return (
    <mesh ref={meshRef} scale={[4, 4, 4]}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshTransmissionMaterial
        buffer={buffer.texture}
        ior={1.2}
        thickness={3}
        anisotropy={0.1}
        chromaticAberration={0.15}
        transmission={0.95}
        roughness={0.1}
        metalness={0.05}
        distortionScale={0.3}
        temporalDistortion={0.2}
        color="#ffffff"
        attenuationColor="#c8d6e5"
        attenuationDistance={0.5}
      />
    </mesh>
  );
}

export default function FluidGlass() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 20 }}
      gl={{ alpha: true, antialias: true }}
      style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1.5} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#aaccff" />
      <GlassShape />
    </Canvas>
  );
}
