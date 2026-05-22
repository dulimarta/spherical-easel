import Algebra, { AlgebraElement } from "ts-geometric-algebra";
const Elliptic = Algebra(3, 0);
// export interface GAElement {
//   get e0(): number;
//   get e1(): number;
//   get e2(): number;
//   get e3(): number;
//   get e12(): number;
//   get e13(): number;
//   get e23(): number;
//   get e123(): number;
// }

export function useEllipticGA() {
  function makePoint(x: number, y: number, z: number): AlgebraElement {
    return Elliptic.fromVector([x, y, z]);
  }

  return {
    makePoint
  };
}
