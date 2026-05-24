import Algebra, { AlgebraElement } from "ts-geometric-algebra";
const Elliptic = Algebra(3, 0);
// export class GAElement extends AlgebraElement {
//   get e0() {
//     return this.getAt[0];
//   }
// }

export function useEllipticGA() {
  function makePoint(x: number, y: number, z: number): AlgebraElement {
    const pt = Elliptic.fromVector([x, y, z], 2);
    // console.log(
    //   "created point:",
    //   pt[0],
    //   pt[1],
    //   pt[2],
    //   pt[3],
    //   pt[4],
    //   pt[5],
    //   pt[6],
    //   pt[7]
    // );
    return pt;
  }
  function makeLine(x: number, y: number, z: number): AlgebraElement {
    const ln = Elliptic.fromVector([x, y, z], 1);
    console.log(
      "created point:",
      ln[0],
      ln[1],
      ln[2],
      ln[3],
      ln[4],
      ln[5],
      ln[6],
      ln[7]
    );
    return ln;
  }

  return {
    makePoint,
    makeLine
  };
}
