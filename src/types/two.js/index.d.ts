// Type definitions for js 0.7
// Project: https://two.js.org
// Definitions by: Carlos Precioso <https://github.com/cprecioso>
//                 Konstantin <https://github.com/demkonst>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.2

// Modified by Hans Dulimarta <hans.dulimarta@gmail.com>

// To enable access to Path.visible, Path.offset, Path.dashes
declare module "two.js" {
  type _Object = Two.Object;

  class Two {
    constructor(params?: Two.ConstructorParams);

    type: Two.Types;
    frameCount: number;
    timeDelta: number;
    width: number;
    height: number;
    playing: boolean;
    renderer: Two.Renderer;
    scene: Two.Group;

    appendTo(domElement: HTMLElement): this;
    play(): this;
    pause(): this;
    update(): this;
    render(): this;
    add(...objects: Two.Object[]): this;
    add(objects: ReadonlyArray<Two.Object>): this;
    remove(...objects: Two.Object[]): this;
    remove(objects: ReadonlyArray<Two.Object>): this;
    clear(): this;
    makeLine(x1: number, y1: number, x2: number, y2: number): Two.Line;
    makeRectangle(
      x: number,
      y: number,
      width: number,
      height: number
    ): Two.Rectangle;
    makeRoundedRectangle(
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ): Two.RoundedRectangle;
    makeCircle(x: number, y: number, radius: number): Two.Circle;
    makeEllipse(
      x: number,
      y: number,
      width: number,
      height: number
    ): Two.Ellipse;
    makeStar(
      ox: number,
      oy: number,
      or: number,
      ir: number,
      sides: number
    ): Two.Star;
    makePolygon(
      x: number,
      y: number,
      radius: number,
      sides: number
    ): Two.Polygon;
    makeArcSegment(
      ox: number,
      oy: number,
      ir: number,
      or: number,
      sa: number,
      ea: number,
      res?: number
    ): Two.ArcSegment;
    makeCurve(...coords: Array<number | boolean>): Two.Path;
    makeCurve(points: ReadonlyArray<Two.Vector>, open?: boolean): Two.Path;
    makePath(...coords: Array<number | boolean>): Two.Path;
    makePath(points: ReadonlyArray<Two.Vector>, open?: boolean): Two.Path;
    makeGroup(objects: ReadonlyArray<Two.Object>): Two.Group;
    makeGroup(...objects: Two.Object[]): Two.Group;
    interpret(svgNode: SVGElement): Two.Group;
    bind(event: string, callback: (...args: any[]) => void): this;
    unbind(
      event: string | null,
      callback: ((...args: any[]) => void) | null
    ): this;

    static Array: typeof Float32Array | typeof Array;
  }

  namespace Two {
    //   class Two{}
    interface ConstructorParams {
      type?: Types;
      width?: number;
      height?: number;
      autostart?: boolean;
      fullscreen?: boolean;
      ratio?: number;
    }

    namespace Utils {
      class Collection<T> extends Array<T> {}
    }

    enum Types {
      svg,
      webgl,
      canvas
    }

    const Properties: any[];

    enum Events {
      change,
      insert,
      load,
      order,
      pause,
      play,
      remove,
      render,
      resize,
      update
    }

    enum Commands {
      move,
      line,
      curve,
      arc,
      close
    }

    const Resolution: number;

    // const Instances: Two[];

    // function noConflict(): Two;

    export class Error {
      constructor(message: string);

      message: string;
    }

    export class Path {
      constructor(
        vertices: ReadonlyArray<Vector>,
        closed: boolean,
        curved: boolean,
        manual?: boolean
      );

      id: number;
      stroke: Color;
      fill: Color;
      linewidth: number;
      opacity: number;
      cap: string;
      join: string;
      miter: number;
      rotation: number;
      scale: number | Vector;
      translation: Vector;
      parent: Group;
      vertices: Utils.Collection<Anchor>;
      dashes: number[];
      offset: number;
      closed: boolean;
      curved: boolean;
      automatic: boolean;
      beginning: number;
      ending: number;
      clip: boolean;
      visible: boolean;

      clone(): this;
      center(): this;
      addTo(group: Group): this;
      remove(): this;
      getBoundingClientRect(shallow?: boolean): BoundingClientRect;
      noFill(): this;
      noStroke(): this;
      plot(): this;
      subdivide(): this;

      static MakeObservable(obj: any): any;
    }

    export class Line extends Path {
      constructor(x1: number, y1: number, x2: number, y2: number);
    }

    export class Rectangle extends Path {
      constructor(x: number, y: number, width: number, height: number);
    }

    export class RoundedRectangle extends Path {
      constructor(
        x: number,
        y: number,
        width: number,
        height: number,
        radius?: number
      );
    }

    export class Ellipse extends Path {
      constructor(x: number, y: number, width: number, height: number);
    }

    export class Star extends Path {
      constructor(
        ox: number,
        oy: number,
        or: number,
        ir?: number,
        sides?: number
      );
    }

    export class Polygon extends Path {
      constructor(x: number, y: number, radius: number, sides?: number);
    }

    export class Circle extends Path {
      constructor(x: number, y: number, radius: number);
    }

    export class ArcSegment extends Path {
      constructor(
        ox: number,
        oy: number,
        ir: number,
        or: number,
        sa: number,
        ea: number,
        res?: number
      );
    }

    export class Group {
      constructor();

      id: string;
      stroke: Color;
      fill: Color;
      linewidth: number;
      opacity: number;
      cap: string;
      join: string;
      miter: number;
      rotation: number;
      scale: number | Vector;
      translation: Vector;
      children: _Object[];
      parent: Group;
      mask: Path;

      clone(): this;
      center(): this;
      addTo(group: Group): this;
      add(...objects: _Object[]): this;
      add(objects: ReadonlyArray<_Object>): this;
      remove(...objects: _Object[]): this;
      remove(objects: ReadonlyArray<_Object>): this;
      getBoundingClientRect(shallow?: boolean): BoundingClientRect;
      noFill(): this;
      noStroke(): this;

      static MakeObservable(obj: any): any;
    }

    type BoundingClientRect = Record<
      "top" | "left" | "right" | "bottom" | "width" | "height",
      number
    >;

    type Object = Path | Group | Text;

    export class Vector {
      constructor(x: number, y: number);

      x: number;
      y: number;

      set(x: number, y: number): this;
      copy(v: Vector): this;
      clear(): this;
      clone(): this;
      add(v1: Vector, v2: Vector): this;
      addSelf(v: Vector): this;
      sub(v1: Vector, v2: Vector): this;
      subSelf(v: Vector): this;
      multiplySelf(v: Vector): this;
      multiplyScalar(value: number): this;
      divideScalar(value: number): this;
      negate(): this;
      dot(v: Vector): number;
      lengthSquared(): number;
      length(): number;
      normalize(): this;
      distanceTo(v: Vector): number;
      distanceToSquared(v: Vector): number;
      setLength(length: number): this;
      equals(v: Vector): boolean;
      lerp(v: Vector, t: number): this;
      isZero(): boolean;
    }

    export class Anchor extends Vector {
      constructor(
        x: number,
        y: number,
        lx: number,
        ly: number,
        rx: number,
        ry: number,
        command: Commands | string
      );

      command: string;
      controls?: { right: Vector; left: Vector };

      listen(): this;
      ignore(): this;

      static AppendCurveProperties(): void;
    }

    export class Stop {
      constructor(offset: number, color: string, opacity: number);

      offset: number;
      color: string;
      opacity: number;

      clone(): this;
    }

    type Color = string | LinearGradient | RadialGradient;

    export class LinearGradient {
      constructor(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        stops: ReadonlyArray<Stop>
      );

      left: Vector;
      right: Vector;
      spread: string;
      stops: Utils.Collection<Stop>;

      clone(): this;
    }

    export class RadialGradient {
      constructor(
        x: number,
        y: number,
        radius: number,
        stops: ReadonlyArray<Stop>,
        fx?: number,
        fy?: number
      );

      center: Vector;
      radius: number;
      focal: Vector;
      spread: string;
      stops: Utils.Collection<Stop>;

      clone(): this;
    }

    export class Text {
      constructor(message: string, x: number, y: number, styles?: any);

      value: string;
      family: string;
      size: number;
      leading: number;
      alignment: string;
      fill: Color;
      stroke: Color;
      linewidth: number;
      style: string;
      weight: number | string;
      decoration: string;
      baseline: string;
      opacity: number;
      visible: boolean;
      rotation: number;
      scale: number | Vector;
      translation: Vector;

      clone(): this;
      getBoundingClientRect(shallow?: boolean): BoundingClientRect;
      noFill(): this;
      noStroke(): this;

      static MakeObservable(obj: any): any;
    }

    type Renderer = SVGRenderer | WebGLRenderer | CanvasRenderer;

    export class SVGRenderer {
      setSize(width: number, height: number): this;
    }
    export class WebGLRenderer {
      setSize(width: number, height: number): this;
    }
    export class CanvasRenderer {
      setSize(width: number, height: number): this;
    }
  }

  // Since we can use only ONE export assignment,
  // both the exported class and namespace must use
  // the SAME name
  export = Two;
}
