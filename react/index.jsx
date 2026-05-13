import { useEffect, useRef } from 'react';
import { createDotrift } from '../src/dotrift.js';

/**
 * useDotrift(src, config)
 *
 * Returns a ref to attach to a <canvas> element.
 * Cleans up automatically on unmount.
 *
 * @example
 * const ref = useDotrift('/photo.jpg', { grid: 100 });
 * return <canvas ref={ref} style={{ borderRadius: 12 }} />;
 */
export function useDotrift(src, config) {
  const canvasRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !src) return;
    instanceRef.current = createDotrift(canvasRef.current, src, config);
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
 * <DotriftCanvas> — drop-in component
 *
 * @example
 * <DotriftCanvas
 *   src="/photo.jpg"
 *   size={200}
 *   grid={110}
 *   repelRadius={30}
 *   style={{ borderRadius: 12 }}
 * />
 */
export function DotriftCanvas({ src, style, className, ...config }) {
  const ref = useDotrift(src, config);
  return <canvas ref={ref} style={style} className={className} />;
}
