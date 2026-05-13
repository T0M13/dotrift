import { RefObject, CSSProperties } from 'react';
import { DotriftConfig, ImageSource } from './index.js';

export declare function useDotrift(
  src: ImageSource,
  config?: DotriftConfig
): RefObject<HTMLCanvasElement>;

export interface DotriftCanvasProps extends DotriftConfig {
  src: ImageSource;
  style?: CSSProperties;
  className?: string;
}

export declare function DotriftCanvas(props: DotriftCanvasProps): JSX.Element;
