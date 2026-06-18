/// <reference types="vite/client" />

declare module '*.svg?react' {
  import type { ComponentType, SVGProps } from 'react';
  type SvgReactComponentProps = SVGProps<SVGSVGElement> & {
    size?: string | number;
  };
  const ReactComponent: ComponentType<SvgReactComponentProps>;
  export default ReactComponent;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
