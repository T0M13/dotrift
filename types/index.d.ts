export interface ParticleFXConfig {
  /** Canvas display size in px. Used for width and height when those are not set. Default: 200 */
  size?: number;
  /** Canvas width in px. Overrides size. Use for non-square. */
  width?: number;
  /** Canvas height in px. Overrides size. Use for non-square. */
  height?: number;
  /** Dots along the width axis. More = sharper, heavier. Default: 120 */
  grid?: number;
  /** Dot radius as a fraction of grid step. 1.0 = touching, 1.2 = overlapping. Default: 1.2 */
  dotSize?: number;
  /** Mouse repulsion radius in px. Default: 25 */
  repelRadius?: number;
  /** Mouse repulsion force strength. Default: 22 */
  repelForce?: number;
  /** Velocity damping per frame (0–1). Lower = snappier. Default: 0.5 */
  friction?: number;
  /** Spring stiffness pulling dots home (0.001–0.02). Default: 0.004 */
  spring?: number;
  /** Click shockwave strength. 0 = disabled. Default: 3 */
  ringStrength?: number;
  /** Shockwave expansion speed in px/s. Default: 180 */
  ringSpeed?: number;
  /** Shockwave ring thickness in px. Default: 14 */
  ringWidth?: number;
  /** Shockwave lifetime in ms. Default: 900 */
  ringDuration?: number;
  /** Canvas background color. null / 'transparent' = transparent canvas. Default: null */
  background?: string | null;
  /** Called once after the first frame is rendered. */
  onReady?: () => void;
}

export interface ParticleFXInstance {
  /** Update any config value live without re-mounting. */
  set(config: Partial<ParticleFXConfig>): void;
  /** Stop the animation and remove all event listeners. */
  destroy(): void;
}

export type ImageSource = string | HTMLImageElement | HTMLCanvasElement;

/**
 * Create a particle effect on a canvas element.
 *
 * @param canvas  A CSS selector string or HTMLCanvasElement
 * @param source  Image URL, HTMLImageElement, or HTMLCanvasElement
 * @param config  Optional configuration
 */
export declare function createParticleFX(
  canvas: HTMLCanvasElement | string,
  source: ImageSource,
  config?: ParticleFXConfig
): ParticleFXInstance;

export declare const ParticleFX: {
  create: typeof createParticleFX;
};

export default createParticleFX;
