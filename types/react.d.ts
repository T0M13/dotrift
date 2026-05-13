import { RefObject, CSSProperties } from 'react';
import { ParticleFXConfig, ImageSource } from './index.js';

export declare function useParticleFX(
  src: ImageSource,
  config?: ParticleFXConfig
): RefObject<HTMLCanvasElement>;

export interface ParticleFXCanvasProps extends ParticleFXConfig {
  src: ImageSource;
  style?: CSSProperties;
  className?: string;
}

export declare function ParticleFXCanvas(props: ParticleFXCanvasProps): JSX.Element;
