import { useEffect, useRef } from 'react';
import { createParticleFX } from '../src/particle-fx.js';

/**
 * useParticleFX(src, config)
 *
 * Returns a ref to attach to a <canvas> element.
 * Cleans up automatically on unmount.
 *
 * @example
 * const ref = useParticleFX('/photo.jpg', { grid: 100 });
 * return <canvas ref={ref} style={{ borderRadius: 12 }} />;
 */
export function useParticleFX(src, config) {
  const canvasRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !src) return;
    instanceRef.current = createParticleFX(canvasRef.current, src, config);
    return () => { instanceRef.current?.destroy(); };
  }, [src]);

  // Live-update config without re-mounting
  useEffect(() => {
    if (instanceRef.current && config) {
      instanceRef.current.set(config);
    }
  }, [config]);

  return canvasRef;
}

/**
 * <ParticleFXCanvas> — drop-in component
 *
 * @example
 * <ParticleFXCanvas
 *   src="/photo.jpg"
 *   size={200}
 *   grid={110}
 *   repelRadius={30}
 *   style={{ borderRadius: 12 }}
 * />
 */
export function ParticleFXCanvas({ src, style, className, ...config }) {
  const ref = useParticleFX(src, config);
  return <canvas ref={ref} style={style} className={className} />;
}
