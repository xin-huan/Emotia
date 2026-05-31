import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;

  uniform vec3 uTopColor;
  uniform vec3 uBottomColor;
  uniform float uIntensity;
  uniform float uGlowAmount;
  uniform float uNoiseIntensity;
  uniform float uTime;

  float hash2D(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise2D(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash2D(i), hash2D(i + vec2(1.0, 0.0)), f.x),
      mix(hash2D(i + vec2(0.0, 1.0)), hash2D(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 3; i++) {
      v += amp * noise2D(p * freq);
      freq *= 2.0;
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    float dist = abs(vUv.x - 0.5) * 2.0;
    float height = vUv.y;

    float noiseVal = fbm(vWorldPos.xy * 1.5 + uTime * 0.2) * uNoiseIntensity;

    float coreEdge = 0.15 + noiseVal * 0.3;
    float coreBeam = 1.0 - smoothstep(0.0, coreEdge, dist);

    float glow = exp(-dist * 2.5) * uGlowAmount * 100.0;

    float vertFade = smoothstep(0.0, 0.12, height) * (1.0 - smoothstep(0.88, 1.0, height));

    float alpha = (coreBeam * uIntensity + glow) * vertFade;
    alpha = clamp(alpha, 0.0, 1.0);

    vec3 color = mix(uBottomColor, uTopColor, height + noiseVal * 0.1);
    color += noiseVal * 0.05;

    gl_FragColor = vec4(color, alpha);
  }
`;

export default function LightPillar({
  topColor = '#10B981',
  bottomColor = '#ff9fd9',
  intensity = 1,
  rotationSpeed = 0.3,
  interactive = false,
  glowAmount = 0.002,
  pillarWidth = 3,
  pillarHeight = 0.4,
  noiseIntensity = 0.5,
  pillarRotation = 25,
}) {
  const groupRef = useRef();

  const topColorVec = useMemo(() => new THREE.Color(topColor), [topColor]);
  const bottomColorVec = useMemo(() => new THREE.Color(bottomColor), [bottomColor]);

  const planeAngles = useMemo(() => [0, 30, 60, 90, 120, 150], []);

  const uniforms = useMemo(() => ({
    uTopColor: { value: topColorVec },
    uBottomColor: { value: bottomColorVec },
    uIntensity: { value: intensity },
    uGlowAmount: { value: Math.max(glowAmount, 0.0001) },
    uNoiseIntensity: { value: noiseIntensity },
    uTime: { value: 0 },
  }), []);

  uniforms.uTopColor.value = topColorVec;
  uniforms.uBottomColor.value = bottomColorVec;
  uniforms.uIntensity.value = intensity;
  uniforms.uGlowAmount.value = Math.max(glowAmount, 0.0001);
  uniforms.uNoiseIntensity.value = noiseIntensity;

  // Scale geometry: raw values are design tokens, scale up for visibility
  const geoWidth = pillarWidth;
  const geoHeight = Math.max(pillarHeight * 10, 2);

  useFrame((state, delta) => {
    uniforms.uTime.value += delta;

    if (groupRef.current && rotationSpeed !== 0) {
      groupRef.current.rotation.y += delta * rotationSpeed;
    }

    if (interactive && groupRef.current) {
      const { pointer } = state;
      groupRef.current.rotation.y += (pointer.x * 0.5 - groupRef.current.rotation.y) * 0.05;
      groupRef.current.rotation.x += (pointer.y * 0.3 - groupRef.current.rotation.x) * 0.05;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, pillarRotation * Math.PI / 180, 0]}>
      {planeAngles.map((angle, i) => (
        <mesh key={i} rotation={[0, angle * Math.PI / 180, 0]}>
          <planeGeometry args={[geoWidth, geoHeight]} />
          <shaderMaterial
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
