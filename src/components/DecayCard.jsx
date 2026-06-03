import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './DecayCard.css';

const DecayCard = ({
  image,
  color,
  baseFrequency = 0.012,
  numOctaves = 5,
  seed = 4,
  maxDisplacement = 300,
  movementBound = 50,
  className = '',
  children,
}) => {
  const svgRef = useRef(null);
  const displacementMapRef = useRef(null);
  const cursor = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const cachedCursor = useRef({ ...cursor.current });
  const winsize = useRef({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const lerp = (a, b, n) => (1 - n) * a + n * b;
    const map = (x, a, b, c, d) => ((x - a) * (d - c)) / (b - a) + c;
    const distance = (x1, x2, y1, y2) => Math.hypot(x1 - x2, y1 - y2);

    const handleResize = () => {
      winsize.current = { width: window.innerWidth, height: window.innerHeight };
    };

    const handleMouseMove = ev => {
      cursor.current = { x: ev.clientX, y: ev.clientY };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    const imgValues = {
      imgTransforms: { x: 0, y: 0, rz: 0 },
      displacementScale: 0,
    };

    const render = () => {
      let targetX = lerp(imgValues.imgTransforms.x, map(cursor.current.x, 0, winsize.current.width, -120, 120), 0.1);
      let targetY = lerp(imgValues.imgTransforms.y, map(cursor.current.y, 0, winsize.current.height, -120, 120), 0.1);
      let targetRz = lerp(imgValues.imgTransforms.rz, map(cursor.current.x, 0, winsize.current.width, -10, 10), 0.1);

      if (targetX > movementBound) targetX = movementBound + (targetX - movementBound) * 0.2;
      if (targetX < -movementBound) targetX = -movementBound + (targetX + movementBound) * 0.2;
      if (targetY > movementBound) targetY = movementBound + (targetY - movementBound) * 0.2;
      if (targetY < -movementBound) targetY = -movementBound + (targetY + movementBound) * 0.2;

      imgValues.imgTransforms.x = targetX;
      imgValues.imgTransforms.y = targetY;
      imgValues.imgTransforms.rz = targetRz;

      if (svgRef.current) {
        gsap.set(svgRef.current, {
          x: imgValues.imgTransforms.x,
          y: imgValues.imgTransforms.y,
          rotateZ: imgValues.imgTransforms.rz,
        });
      }

      const cursorTravelledDistance = distance(
        cachedCursor.current.x, cursor.current.x,
        cachedCursor.current.y, cursor.current.y
      );
      imgValues.displacementScale = lerp(
        imgValues.displacementScale,
        map(cursorTravelledDistance, 0, 200, 0, maxDisplacement),
        0.06
      );

      if (displacementMapRef.current) {
        gsap.set(displacementMapRef.current, { attr: { scale: imgValues.displacementScale } });
      }

      cachedCursor.current = { ...cursor.current };
      rafId = requestAnimationFrame(render);
    };

    let rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [maxDisplacement, movementBound]);

  return (
    <div className={`decay-bg ${className}`} ref={svgRef}>
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" className="svg">
        <filter id="decayFilter">
          <feTurbulence
            type="turbulence"
            baseFrequency={baseFrequency}
            numOctaves={numOctaves}
            seed={seed}
            stitchTiles="stitch"
            x="0%" y="0%" width="100%" height="100%"
            result="turbulence1"
          />
          <feDisplacementMap
            ref={displacementMapRef}
            in="SourceGraphic"
            in2="turbulence1"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="B"
            x="0%" y="0%" width="100%" height="100%"
            result="displacementMap3"
          />
        </filter>
        <g>
          {color ? (
            <rect x="0" y="0" width="1920" height="1080" fill={color} filter="url(#decayFilter)" />
          ) : (
            <image
              href={image}
              x="0" y="0"
              width="1920" height="1080"
              filter="url(#decayFilter)"
              preserveAspectRatio="xMidYMid slice"
            />
          )}
        </g>
      </svg>
      {children && <div className="card-text">{children}</div>}
    </div>
  );
};

export default DecayCard;
