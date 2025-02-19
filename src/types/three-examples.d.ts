declare module 'three/examples/jsm/loaders/FontLoader' {
  import { Loader } from 'three';
  import { Font } from 'three/examples/jsm/loaders/FontLoader';

  export class FontLoader extends Loader {
    constructor(manager?: THREE.LoadingManager);
    load(
      url: string,
      onLoad?: (responseFont: Font) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    parse(json: any): Font;
  }
}

declare module 'three/examples/jsm/geometries/TextGeometry' {
  import { Geometry } from 'three';
  import { Font } from 'three/examples/jsm/loaders/FontLoader';

  export class TextGeometry extends Geometry {
    constructor(text: string, parameters: TextGeometryParameters);
  }

  export interface TextGeometryParameters {
    font: Font;
    size?: number;
    height?: number;
    curveSegments?: number;
    bevelEnabled?: boolean;
    bevelThickness?: number;
    bevelSize?: number;
    bevelOffset?: number;
    bevelSegments?: number;
  }
}

declare module 'three/examples/jsm/renderers/CSS2DRenderer' {
  import { WebGLRenderer, Object3D } from 'three';

  export class CSS2DRenderer extends WebGLRenderer {
    constructor();
    domElement: HTMLElement;
    setSize(width: number, height: number): void;
  }

  // Updated CSS2DObject declaration
  export class CSS2DObject extends Object3D {
    constructor(element: HTMLElement);
    element: HTMLElement;
    renderOrder: number; // Ensure this property is available
  }
}
