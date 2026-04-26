import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl';
import { useEffect, useRef } from 'react';

// --- 辅助工具 ---
function lerp(p1, p2, t) { return p1 + (p2 - p1) * t; }

function createTextTexture(gl, text, color = '#4D664D', font = 'bold 30px sans-serif') {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = font;
  const metrics = context.measureText(text);
  canvas.width = metrics.width + 40;
  canvas.height = 80;
  context.font = font;
  context.fillStyle = color;
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

// --- 标题类：现在它会自动带一个白色的底框 ---
class CardTitle {
  constructor({ gl, parentCard, text, textColor }) {
    this.gl = gl;
    this.parentCard = parentCard;
    const { texture, width, height } = createTextTexture(gl, text, textColor);

    const geometry = new Plane(gl);
    const program = new Program(gl, {
      vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.05) discard;
          gl_FragColor = color;
        }
      `,
      uniforms: { tMap: { value: texture } },
      transparent: true
    });

    this.mesh = new Mesh(gl, { geometry, program });
    const aspect = width / height;
    const h = parentCard.scale.y * 0.12; // 标题高度占卡片的比例
    this.mesh.scale.set(h * aspect, h, 1);
    // 定位于卡片底部白框的中心
    this.mesh.position.y = -parentCard.scale.y * 0.38;
    this.mesh.position.z = 0.01;
    this.mesh.setParent(parentCard);
  }
}

class Media {
  constructor({ geometry, gl, image, index, length, scene, screen, text, viewport, bend, textColor, borderRadius }) {
    this.extra = 0;
    this.gl = gl;
    this.image = image;
    this.index = index;
    this.length = length;
    this.scene = scene;
    this.screen = screen;
    this.text = text;
    this.viewport = viewport;
    this.bend = bend;
    this.textColor = textColor;
    this.borderRadius = borderRadius;

    this.createShader();
    this.createMesh(geometry);
    this.onResize();
    this.createTitle();
  }

  createShader() {
    this.texture = new Texture(this.gl, { generateMipmaps: true });
    this.program = new Program(this.gl, {
      vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          // 移除了波浪位移，保持平面
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        uniform vec2 uPlaneSizes;
        uniform vec2 uImageSizes;
        uniform float uBorderRadius;
        varying vec2 vUv;

        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }

        void main() {
          // 计算图片自适应填充
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(vUv.x * ratio.x + (1.0 - ratio.x) * 0.5, vUv.y * ratio.y + (1.0 - ratio.y) * 0.5);

          // 核心逻辑：划分图片区域和白底区域
          // 顶部 75% 是图片，底部 25% 是白底
          vec4 color;
          if (vUv.y > 0.25) {
            // 图片区域（向上偏移 UV 以对齐）
            vec2 imgUv = vec2(uv.x, (uv.y - 0.25) / 0.75);
            color = texture2D(tMap, imgUv);
          } else {
            // 底部白框区域
            color = vec4(1.0, 1.0, 1.0, 1.0);
          }

          // 圆角剪裁
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          float alpha = 1.0 - smoothstep(-0.002, 0.002, d);

          gl_FragColor = vec4(color.rgb, alpha);
        }
      `,
      uniforms: {
        tMap: { value: this.texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uBorderRadius: { value: this.borderRadius }
      },
      transparent: true
    });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = this.image;
    img.onload = () => {
      this.texture.image = img;
      this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
    };
  }

  createMesh(geometry) {
    this.plane = new Mesh(this.gl, { geometry, program: this.program });
    this.plane.setParent(this.scene);
  }

  createTitle() {
    this.title = new CardTitle({
      gl: this.gl,
      parentCard: this.plane,
      text: this.text,
      textColor: this.textColor
    });
  }

  update(scroll, direction) {
    this.plane.position.x = this.x - scroll.current - this.extra;
    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    if (this.bend !== 0) {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);
      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      this.plane.position.y = this.bend > 0 ? -arc : arc;
      this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
    }

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    if (direction === 'right' && this.plane.position.x + planeOffset < -viewportOffset) this.extra -= this.widthTotal;
    if (direction === 'left' && this.plane.position.x - planeOffset > viewportOffset) this.extra += this.widthTotal;
  }

  onResize({ screen, viewport } = {}) {
    if (screen) this.screen = screen;
    if (viewport) this.viewport = viewport;

    const scale = this.screen.height / 1500;
    this.plane.scale.y = (this.viewport.height * (1100 * scale)) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * (750 * scale)) / this.screen.width;
    this.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];

    this.width = this.plane.scale.x + 1.5;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

// App 类保持基本逻辑，仅优化渲染性能
class App {
  constructor(container, { items, bend, textColor, borderRadius, scrollSpeed, scrollEase }) {
    this.container = container;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
    this.scrollSpeed = scrollSpeed;

    this.renderer = new Renderer({ alpha: true, antialias: true, dpr: 2 });
    this.gl = this.renderer.gl;
    this.container.appendChild(this.gl.canvas);

    this.camera = new Camera(this.gl, { fov: 45 });
    this.camera.position.z = 20;
    this.scene = new Transform();

    this.onResize();
    this.planeGeometry = new Plane(this.gl, { widthSegments: 1, heightSegments: 1 });

    const data = items.concat(items); // 循环拼接
    this.medias = data.map((d, i) => new Media({
      geometry: this.planeGeometry, gl: this.gl, image: d.image, index: i, length: data.length,
      scene: this.scene, screen: this.screen, text: d.text, viewport: this.viewport,
      bend, textColor, borderRadius
    }));

    this.addEvents();
    this.update();
  }

  addEvents() {
    window.addEventListener('resize', this.onResize.bind(this));
    const onMove = (e) => {
      if (!this.isDown) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      this.scroll.target += (this.start - x) * 0.05;
      this.start = x;
    };
    this.container.addEventListener('mousedown', e => { this.isDown = true; this.start = e.clientX; });
    this.container.addEventListener('touchstart', e => { this.isDown = true; this.start = e.touches[0].clientX; });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('mouseup', () => this.isDown = false);
    window.addEventListener('touchend', () => this.isDown = false);
    this.container.addEventListener('wheel', e => { this.scroll.target += e.deltaY * 0.1; });
  }

  onResize() {
    this.screen = { width: this.container.clientWidth, height: this.container.clientHeight };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({ aspect: this.screen.width / this.screen.height });
    const fov = (this.camera.fov * Math.PI) / 180;
    const h = 2 * Math.tan(fov / 2) * this.camera.position.z;
    this.viewport = { width: h * this.camera.aspect, height: h };
    if (this.medias) this.medias.forEach(m => m.onResize({ screen: this.screen, viewport: this.viewport }));
  }

  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const dir = this.scroll.current > this.scroll.last ? 'right' : 'left';
    this.medias.forEach(m => m.update(this.scroll, dir));
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = requestAnimationFrame(this.update.bind(this));
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.gl.canvas.remove();
  }
}

export default function CircularGallery(props) {
  const ref = useRef();
  useEffect(() => {
    const app = new App(ref.current, props);
    return () => app.destroy();
  }, [props.items]);
  return <div className="w-full h-full cursor-grab active:cursor-grabbing" ref={ref} />;
}