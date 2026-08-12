import { Command } from "../commands-spherical/Command";
import {
  SavedNames,
  HEIntersectionReturnType,
  HEOneDimensional
} from "@/types";
import { SEIntersectionPoint } from "@/models-spherical/SEIntersectionPoint";
import { SENodule } from "@/models-spherical/SENodule";
import { toSVGType } from "@/types";
import { SELine } from "@/models-spherical/SELine";
import { SESegment } from "@/models-spherical/SESegment";
import { HEIntersectionPoint } from "@/models-hyperbolic/HEIntersectionPoint";

export class ChangeIntersectionPointPrincipleParents extends Command {
  private oldParentInfo: HEIntersectionReturnType;
  private newParentInfo: HEIntersectionReturnType;
  private commonHEIntersectionPoint: HEIntersectionPoint;

  constructor(newInfo: HEIntersectionReturnType) {
    super();
    this.commonHEIntersectionPoint = newInfo.HEIntersectionPoint;
    this.oldParentInfo = {
      HEIntersectionPoint: newInfo.HEIntersectionPoint,
      parent1: newInfo.HEIntersectionPoint.principleParent1,
      parent2: newInfo.HEIntersectionPoint.principleParent2,
      existingIntersectionPoint: true,
      createAntipodalPoint: !(
        (newInfo.HEIntersectionPoint.principleParent1 instanceof SELine ||
          newInfo.HEIntersectionPoint.principleParent1 instanceof SESegment) &&
        (newInfo.HEIntersectionPoint.principleParent2 instanceof SELine ||
          newInfo.HEIntersectionPoint.principleParent2 instanceof SESegment)
      ),
      order: newInfo.HEIntersectionPoint.intersectionOrder
    };
    this.newParentInfo = { ...newInfo };
  }

  do(): void {
    // change the principle parents of this.commonHEIntersectionPoint in that class
    this.commonHEIntersectionPoint.changePrincipleParents(this.newParentInfo);
    // update the DAG
    this.oldParentInfo.parent1.unregisterChild(this.commonHEIntersectionPoint);
    this.oldParentInfo.parent2.unregisterChild(this.commonHEIntersectionPoint);
    this.newParentInfo.parent1.registerChild(this.commonHEIntersectionPoint);
    this.newParentInfo.parent2.registerChild(this.commonHEIntersectionPoint);
  }

  saveState(): void {
    this.lastState = this.commonHEIntersectionPoint.id;
  }

  restoreState(): void {
    this.newParentInfo.parent2.unregisterChild(this.commonHEIntersectionPoint);
    this.newParentInfo.parent1.unregisterChild(this.commonHEIntersectionPoint);
    this.oldParentInfo.parent2.registerChild(this.commonHEIntersectionPoint);
    this.oldParentInfo.parent1.registerChild(this.commonHEIntersectionPoint);
    this.commonHEIntersectionPoint.changePrincipleParents(this.oldParentInfo);
  }

  toOpcode(): null | string | Array<string> {
    // return [
    //   "ChangeIntersectionPointPrincipleParents",
    //   // Any attribute that could possibly have a "=", "@", "&" or "/" should be run through Command.symbolToASCIIDec
    //   // Object specific attributes
    //   "intersectionPointName=" + this.commonHEIntersectionPoint.name,
    //   "intersectionPointInfoNewPrincipleParent1=" +
    //     this.newParentInfo.parent1.name,
    //   "intersectionPointInfoNewPrincipleParent2=" +
    //     this.newParentInfo.parent2.name,
    //   "intersectionPointOtherParentInfoNewOrder=" + this.newParentInfo.order
    // ].join("&");
    return null;
  }

  // static parse(command: string, objMap: Map<string, SENodule>): Command {
  //   const tokens = command.split("&");
  //   const propMap = new Map<SavedNames, string>();
  //   // load the tokens into the map
  //   tokens.forEach((token, ind) => {
  //     if (ind === 0) return; // don't put the command type in the propMap
  //     const parts = token.split("=");
  //     propMap.set(parts[0] as SavedNames, Command.asciiDecToSymbol(parts[1]));
  //   });

  //   // get the object specific attributes
  //   const commonIntersectionPoint = objMap.get(
  //     propMap.get("intersectionPointName") ?? ""
  //   ) as SEIntersectionPoint | undefined;

  //   const newPrincipleParent1 = objMap.get(
  //     propMap.get("intersectionPointInfoNewPrincipleParent1") ?? ""
  //   ) as SEOneDimensional | undefined;

  //   const newPrincipleParent2 = objMap.get(
  //     propMap.get("intersectionPointInfoNewPrincipleParent2") ?? ""
  //   ) as SEOneDimensional | undefined;

  //   const newOrder = Number(
  //     propMap.get("intersectionPointOtherParentInfoNewOrder")
  //   );

  //   if (
  //     commonIntersectionPoint != undefined &&
  //     newPrincipleParent1 != undefined &&
  //     newPrincipleParent2 != undefined &&
  //     !Number.isNaN(newOrder)
  //   ) {
  //     return new ChangeIntersectionPointPrincipleParents({
  //       SEIntersectionPoint: commonIntersectionPoint,
  //       parent1: newPrincipleParent1,
  //       parent2: newPrincipleParent2,
  //       existingIntersectionPoint: true,
  //       createAntipodalPoint: !(
  //         (newPrincipleParent1 instanceof SELine ||
  //           newPrincipleParent1 instanceof SESegment) &&
  //         (newPrincipleParent2 instanceof SELine ||
  //           newPrincipleParent2 instanceof SESegment)
  //       ),
  //       order: newOrder
  //     });
  //   }
  //   throw new Error(
  //     `Change Principle Parent Command: SEIntersection point ${commonIntersectionPoint}}  or new principle parent1 ${newPrincipleParent1}or new principle parent1 ${newPrincipleParent2} or new order ${newOrder} doesn't exist`
  //   );
  // }
}
