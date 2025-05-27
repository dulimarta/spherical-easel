import { Command } from "./Command";
import {
  SavedNames,
  SEIntersectionReturnType,
  SEOneDimensional,
  toSVGType
} from "@/types";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SENodule } from "@/models/SENodule";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";

export class AddIntersectionPointOtherParentsInfo extends Command {
  private otherParentsInfo: SEIntersectionReturnType;
  // There are situations where this command is one in a command group and we don't know if we can actually add otherParentsInfo.parent1 or otherParentsInfo.parent2 until all the previous command in the group have executed (so that the DAG is upto date). For example,
  //Case 1
  // 1) Create a circle, C1, using P1 (center) and P2 (point on edge)
  // 2) Create a segment, Ls1, from P1 to P2 - this creates an (non-displayed yet) intersection point P3 (and its antipode) a the place opposite P2 where the extension of Ls1 would intersect C1. The parents of P3 are C2 and Ls1
  // 3) Create a line, Li1, from P1 to P2 - Li1 is NOT a parent of P3 so (Li1,C1) *should* be added as an other parent info of P3.  We can only effectively test if Li1 is a parent of P3 *after* Li3 has bee added to the DAG.
  //
  // Case 2
  // 1) Create a segment from P1 to P2
  // 2) Create a circle, C1, using P1 (center) and P2 (point on edge)
  // 3) Create a circle, C2, using P2 (center) and P1 (point on edge)
  //   This creates two points of intersection between C1 and C2, P3 and P4 whose parents are C1 and C2
  // 4) Create segment P1 to P3, with midpoint P5
  // 5) Create segment P1 to P4, with midpoint P6
  // 6) Create segment P2 to P3, with midpoint P7
  // 7) Create segment P2 to P4, with midpoint P8
  // 8) Create segment, Ls6, P5 to P2
  // 9) Create segment, Ls7, P7 to P1
  //  Ls6 and Ls7 create an intersection point P9
  // 10) Create segment, Ls8, P6 to P2
  // 11) Create segment, Ls9, P8 to P1
  //  Ls8 and Ls9 create an intersection point P10
  // 12) Create line, Li1, from P9 to P10
  // Li1 passes through P3 (and P4) always, however P3 is a parent of Li1 and it is only after adding Li1 to the DAG that we can effectively figure out that Li1 is a descendent of P3 (and P4) so (Li1,C1) (and Li1, C2) should *not* be other parent info of P3 (or P4)
  //
  // So create this flag to so that this command is used or not
  private useThisAddIntersectionPointCommand = true;

  constructor(seIntersectionPointInfo: SEIntersectionReturnType) {
    super();
    this.otherParentsInfo = seIntersectionPointInfo;
  }

  do(): void {
    // Add the info to the list of parents info the SEIntersectionPoint, as long as neither parent is a descendent of the SEIntersectionPoint
    // console.log(
    //   `AddIntersectionPointOtherParentCommand: DO For intersection point ${this.seIntersectionPoint.name}, add ${this.seOtherParent.name}`
    // );
    if (this.useThisAddIntersectionPointCommand) {
      // addIntersectionOtherParentInfo return a boolean that indicates if it was possible to actually add the parent. If so this command is useful, If not this command is ignored. The inside of this conditional is always reached once.
      this.useThisAddIntersectionPointCommand =
        this.otherParentsInfo.SEIntersectionPoint.addIntersectionOtherParentInfo(
          this.otherParentsInfo
        );
    }
  }

  saveState(): void {
    this.lastState = this.otherParentsInfo.SEIntersectionPoint.id;
  }

  restoreState(): void {
    // console.debug(
    //   `AddIntersectionPointOtherParentCommand: restoreState For intersection point ${this.seIntersectionPoint.name}, remove ${this.seOtherParent.name}`
    // );
    if (this.useThisAddIntersectionPointCommand) {
      this.otherParentsInfo.SEIntersectionPoint.removeIntersectionOtherParentInfo(
        this.otherParentsInfo
      );
    }
  }

  toOpcode(): null | string | Array<string> {
    if (this.useThisAddIntersectionPointCommand) {
      return [
        "AddIntersectionPointOtherParentsInfo",
        // Object specific attributes
        "intersectionPointName=" +
          this.otherParentsInfo.SEIntersectionPoint.name,
        "intersectionPointOtherParentInfoName1=" +
          this.otherParentsInfo.parent1.name,
        "intersectionPointOtherParentInfoName2=" +
          this.otherParentsInfo.parent2.name,
        "intersectionPointOtherParentInfoOrder=" + this.otherParentsInfo.order
      ].join("&");
    } else {
      return null;
    }
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    const tokens = command.split("&");
    const propMap = new Map<SavedNames, string>();
    // load the tokens into the map
    tokens.forEach((token, ind) => {
      if (ind === 0) return; // don't put the command type in the propMap
      const parts = token.split("=");
      propMap.set(parts[0] as SavedNames, Command.asciiDecToSymbol(parts[1]));
    });

    // get the object specific attributes
    const intersectionPoint = objMap.get(
      propMap.get("intersectionPointName") ?? ""
    ) as SEIntersectionPoint | undefined;

    const firstParent = objMap.get(
      propMap.get("intersectionPointOtherParentInfoName1") ?? ""
    ) as SEOneDimensional | undefined;

    const secondParent = objMap.get(
      propMap.get("intersectionPointOtherParentInfoName2") ?? ""
    ) as SEOneDimensional | undefined;

    const order = Number(propMap.get("intersectionPointOtherParentInfoOrder"));

    if (
      intersectionPoint != undefined &&
      firstParent != undefined &&
      secondParent != undefined &&
      !Number.isNaN(order)
    ) {
      return new AddIntersectionPointOtherParentsInfo({
        SEIntersectionPoint: intersectionPoint,
        parent1: firstParent,
        parent2: secondParent,
        existingIntersectionPoint: true,
        createAntipodalPoint:
          (firstParent instanceof SELine || firstParent instanceof SESegment) &&
          (secondParent instanceof SELine || secondParent instanceof SESegment),
        order: order
      });
    }
    throw new Error(
      `AddIntersectionPointOtherParentCommand: ${intersectionPoint}  or ${firstParent} or ${secondParent} or ${order} is undefined`
    );
  }
}
