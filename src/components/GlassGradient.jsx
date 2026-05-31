import { useEffect, useRef } from 'react';
import { Renderer, Program, Triangle, Mesh, Vec2 } from 'ogl';

const vertexShader = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec2 uMouse;

  // ======== NOISE FUNCTIONS ========
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float hash3(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5, f = 1.0;
    for (int i = 0; i < 3; i++) {
      v += a * noise(p * f);
      f *= 2.0; a *= 0.5;
    }
    return v;
  }

  float fbmDetail(vec2 p) {
    float v = 0.0, a = 0.5, f = 1.0;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p * f + float(i));
      f *= 2.1; a *= 0.45;
    }
    return v;
  }

  // ======== SHATTER / GLASS REFRACTION ========
  // Creates crystalline faceted UV displacement (glass shatter effect)
  vec2 shatter(vec2 uv, float intensity) {
    vec2 disp = vec2(0.0);
    // 3 scales of faceting for natural glass fracture look
    float scales[3];
    scales[0] = 12.0; scales[1] = 25.0; scales[2] = 45.0;
    float amps[3];
    amps[0] = 0.012; amps[1] = 0.006; amps[2] = 0.003;

    for (int s = 0; s < 3; s++) {
      vec2 g = floor(uv * scales[s]);
      vec2 r = vec2(hash(g), hash(g + 0.5)) * 2.0 - 1.0;
      disp += r * amps[s];
    }
    return uv + disp * intensity;
  }

  // Highlights at shard boundaries (glowing crack lines)
  float shardEdges(vec2 uv) {
    float e = 0.0;
    float sc[2];
    sc[0] = 12.0; sc[1] = 25.0;
    for (int i = 0; i < 2; i++) {
      vec2 f = fract(uv * sc[i]);
      float edge = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
      e += (1.0 - smoothstep(0.0, 0.04, edge)) * 0.15;
    }
    return e;
  }

  // ======== GRADIENT SAMPLING ========
  vec3 sampleGradient(vec2 uv) {
    float n = fbm(uv * 3.0 + uTime * 0.04) * 0.05;
    float t = uv.x + n;

    vec3 c1 = vec3(0.08, 0.10, 0.14);
    vec3 c2 = vec3(0.18, 0.20, 0.26);
    vec3 c3 = vec3(0.32, 0.34, 0.40);
    vec3 c4 = vec3(0.50, 0.51, 0.56);
    vec3 c5 = vec3(0.72, 0.70, 0.68);
    vec3 c6 = vec3(0.94, 0.93, 0.90);

    vec3 col = mix(c1, c2, smoothstep(0.02, 0.20, t));
    col = mix(col, c3, smoothstep(0.15, 0.38, t));
    col = mix(col, c4, smoothstep(0.32, 0.55, t));
    col = mix(col, c5, smoothstep(0.50, 0.72, t));
    col = mix(col, c6, smoothstep(0.68, 0.90, t));
    return col;
  }

  // ======== BOKEH SHAPES ========
  // Hexagonal bokeh (6-sided aperture shape)
  float hexBokeh(vec2 uv, vec2 center, float size) {
    vec2 d = (uv - center) / size;
    float r = length(d);
    // Polygon distance for hexagonal shape
    float a = atan(d.y, d.x);
    float hex = cos(floor(a / 1.0472 + 0.5) * 1.0472 - a) * r;
    return 1.0 - smoothstep(0.8, 1.0, hex / cos(3.14159 / 6.0));
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 st = (uv - 0.5) * vec2(aspect, 1.0);

    // ======== 1. SINE WAVE DISTORTION ========
    float w1 = sin(st.y * 3.5 + uTime * 0.1) * 0.007;
    float w2 = cos(st.y * 6.5 - uTime * 0.08 + 1.2) * 0.005;
    float w3 = sin(st.x * 2.8 + uTime * 0.06) * 0.004;
    float w4 = sin((st.x + st.y) * 4.0 + uTime * 0.09) * 0.003;
    float mw = sin(st.y * 2.2 - uMouse.x * 1.8) * 0.005 * smoothstep(0.0, 1.0, st.x + 0.5);
    float waveDisp = w1 + w2 + w3 + w4 + mw;

    // Apply wave distortion to UV
    vec2 warpedUV = uv + vec2(waveDisp * 1.5, waveDisp * 0.3);

    // ======== 2. SHATTER REFRACTION ========
    // Compute brightness first to drive shatter intensity
    float baseBright = dot(sampleGradient(warpedUV), vec3(0.299, 0.587, 0.114));
    float shatterIntensity = smoothstep(0.4, 0.85, warpedUV.x) * (0.6 + baseBright * 1.5);

    // Apply shatter displacement
    vec2 shatteredUV = shatter(warpedUV, shatterIntensity);

    // ======== 3. MULTI-SAMPLE BLUR (frosted glass) ========
    float blurR = 0.004;
    vec3 col = sampleGradient(shatteredUV) * 0.45;
    col += sampleGradient(shatteredUV + vec2( blurR,  0.0)) * 0.14;
    col += sampleGradient(shatteredUV + vec2(-blurR,  0.0)) * 0.14;
    col += sampleGradient(shatteredUV + vec2( 0.0,  blurR)) * 0.14;
    col += sampleGradient(shatteredUV + vec2( 0.0, -blurR)) * 0.13;

    // ======== 4. CHROMATIC ABERRATION ========
    float caStr = smoothstep(0.3, 0.88, uv.x) * 2.2;
    float bright = dot(col, vec3(0.299, 0.587, 0.114));
    caStr *= 1.0 + bright * 1.8;

    vec2 caOff = vec2(waveDisp * caStr * 10.0 + shatterIntensity * 0.008, 0.0);
    vec3 cr = sampleGradient(shatteredUV + caOff);
    vec3 cb = sampleGradient(shatteredUV - caOff * 0.65);
    col.r = mix(col.r, cr.r * 1.04, caStr * 0.55);
    col.b = mix(col.b, cb.b * 0.96, caStr * 0.55);

    float lum = dot(col, vec3(0.299, 0.587, 0.114));

    // ======== 5. SHARD EDGE GLOW ========
    float edgeGlow = shardEdges(shatteredUV) * shatterIntensity * 0.12;
    col += edgeGlow * vec3(0.95, 0.92, 0.88);

    // ======== 6. LIGHT WISPS (光丝) ========
    float wisps = 0.0;
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      float wy = 0.08 + fi * 0.18 + sin(uTime * 0.12 + fi * 2.5) * 0.07;
      float wa = -0.4 + fi * 0.13 + sin(uTime * 0.08 + fi) * 0.04;
      float wd = abs((uv.y - wy) - (uv.x - 0.5) * wa);
      float w = exp(-wd * 16.0) * (0.28 + 0.15 * sin(uTime * 0.7 + fi * 3.0));
      w *= smoothstep(0.1, 0.88, uv.x);
      w *= 1.0 - smoothstep(0.0, 0.5, abs(uv.y - 0.5) * 2.0) * 0.3;
      wisps += w;
    }
    // Upward radiating glow from right-center
    float topGlow = exp(-abs(uv.x - 0.7) * 6.0) * exp(-abs(uv.y - 0.65) * 3.5);
    topGlow *= 0.12 + 0.08 * sin(uTime * 0.4);
    topGlow *= 1.0 + fbmDetail(uv * 5.0 + uTime * 0.05) * 0.3;

    col += vec3(0.96, 0.94, 0.90) * wisps * 0.5;
    col += vec3(1.0, 0.97, 0.93) * topGlow * 0.3;

    // ======== 7. BOKEH (散景光斑) ========
    float bok = 0.0;
    for (int j = 0; j < 7; j++) {
      float fj = float(j);
      vec2 bp = vec2(
        0.4 + sin(fj * 2.4 + uTime * 0.08) * 0.32,
        0.2 + cos(fj * 2.9 + uTime * 0.11) * 0.22
      );
      float bs = 0.015 + hash(vec2(fj, 0.3)) * 0.04;
      float hb = hexBokeh(uv, bp, bs);
      float bm = smoothstep(0.4, 0.9, uv.x);
      bok += hb * bm * 0.065;
    }
    col += vec3(0.97, 0.95, 0.92) * bok * (0.25 + lum * 0.6);

    // ======== 8. INTERNAL REFRACTION SPARKLES ========
    // Tiny sparkle points in the brightest shattered glass areas
    float sparkle = 0.0;
    for (int k = 0; k < 6; k++) {
      float fk = float(k);
      vec2 sp = shatteredUV * 80.0 + fk * 13.7;
      vec2 gi = floor(sp);
      vec2 gf = fract(sp) - 0.5;
      float spark = exp(-dot(gf, gf) * 30.0);
      spark *= hash(gi + fk) > 0.92 ? 1.0 : 0.0;
      sparkle += spark * 0.15;
    }
    col += vec3(1.0, 0.98, 0.94) * sparkle * shatterIntensity * 0.7;

    // ======== 9. WARM COLOR GRADING (right side) ========
    float warm = smoothstep(0.45, 0.88, uv.x);
    warm *= 1.0 - abs(uv.y - 0.5) * 1.1;
    warm *= 1.0 + fbm(uv * 4.0 + uTime * 0.03) * 0.2;
    col = mix(col, col * vec3(1.06, 1.02, 0.96), warm * 0.25);

    // Warm golden highlight in center-right
    float golden = smoothstep(0.5, 0.78, uv.x) * smoothstep(0.2, 0.8, uv.y);
    golden *= 1.0 - smoothstep(0.3, 0.7, abs(uv.y - 0.5));
    col += vec3(0.04, 0.03, 0.0) * golden * 0.5;

    // ======== 10. COOL SHADOW TONE (left side) ========
    float cool = (1.0 - smoothstep(0.1, 0.45, uv.x)) * 0.2;
    col = mix(col, col * vec3(0.88, 0.9, 1.0), cool);

    // ======== 11. FILM GRAIN (胶片颗粒) ========
    float grain = hash(uv * uResolution + uTime * 60.0 + sin(uv.y * 400.0) * 0.5);
    grain = (grain - 0.5) * 0.04;
    float grainStr = 0.55 + (1.0 - lum) * 0.45;
    col += grain * grainStr;

    // Dynamic fine grain layer
    float grain2 = (hash(uv * uResolution * 1.7 + uTime * 40.0) - 0.5) * 0.02;
    col += grain2 * (0.4 + 0.3 * sin(uTime * 0.4));

    // ======== 12. DITHERING (去色带) ========
    vec2 dithCoord = floor(uv * uResolution / 6.0) * 6.0;
    float dither = (hash(dithCoord + vec2(0.3, 0.7)) - 0.5) * 0.018;
    col += dither;

    // ======== 13. VIGNETTE (暗角) ========
    float vig = 1.0 - smoothstep(0.3, 1.5, length(st * vec2(1.35, 0.85)));
    vig *= 1.0 - smoothstep(-0.5, 0.28, st.x) * 0.4;
    vig *= 1.0 - smoothstep(-0.5, 0.18, st.y) * 0.22;
    // Soft top-right vignette too
    vig *= 1.0 - smoothstep(0.35, 0.9, st.y) * smoothstep(0.4, 0.85, st.x) * 0.08;
    col *= vig;

    // ======== 14. RIGHT-SIDE HIGHLIGHT BLOOM ========
    float bloom = smoothstep(0.58, 0.92, uv.x) * smoothstep(0.2, 0.78, uv.y);
    bloom *= 1.0 + fbm(uv * 3.0 + uTime * 0.06) * 0.2;
    col += bloom * vec3(1.0, 0.97, 0.92) * 0.06;

    // ======== 15. TONE MAPPING (soft clip) ========
    col = col / (col + vec3(1.0));
    col = clamp(col, 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function GlassGradient({ style }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer, gl, program, mesh, rafId;
    let mouseTarget = { x: 0.5, y: 0.5 };
    let mouseCurrent = { x: 0.5, y: 0.5 };
    let startTime = performance.now();

    try {
      renderer = new Renderer({ alpha: false, antialias: false });
      gl = renderer.gl;
      if (!gl) { console.error('GlassGradient: WebGL not supported'); return; }

      container.appendChild(gl.canvas);

      program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: new Vec2() },
          uMouse: { value: new Vec2(0.5, 0.5) },
        },
      });

      mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    } catch (e) {
      console.error('GlassGradient setup failed:', e);
      return;
    }

    function resize() {
      if (!container || !gl || !renderer) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w * dpr, h * dpr);
      gl.canvas.style.width = w + 'px';
      gl.canvas.style.height = h + 'px';
      program.uniforms.uResolution.value.set(gl.canvas.width, gl.canvas.height);
    }

    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseTarget.x = (e.clientX - rect.left) / rect.width;
      mouseTarget.y = 1.0 - (e.clientY - rect.top) / rect.height;
    };
    container.addEventListener('mousemove', handleMouseMove);

    function update(t) {
      rafId = requestAnimationFrame(update);
      program.uniforms.uTime.value = (t - startTime) * 0.001;
      mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * 0.04;
      mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * 0.04;
      program.uniforms.uMouse.value.set(mouseCurrent.x, mouseCurrent.y);
      renderer.render({ scene: mesh });
    }

    rafId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      container.removeEventListener('mousemove', handleMouseMove);
      if (gl?.canvas?.parentNode) container.removeChild(gl.canvas);
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, ...style }} />
  );
}
