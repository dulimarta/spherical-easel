import { Command } from "./Command";
import {
  CommandReturnType,
  SavedNames,
  SEIntersectionReturnType,
  SEOneDimensional
} from "@/types";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SENodule } from "@/models/SENodule";
import { toSVGType } from "@/types";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";

export class RemoveIntersectionPointOtherParentsInfo extends Command {
  private otherParentsInfo: SEIntersectionReturnType;

  constructor(otherParentsInfo: SEIntersectionReturnType) {
    super();
    this.otherParentsInfo = otherParentsInfo;
  }

  do(): CommandReturnType {
    // console.debug(
    //   `RemoveIntersectionPointOtherParent: DO Remove intersection point parent, ${this.seOtherParent.name}`
    // );
    this.otherParentsInfo.SEIntersectionPoint.removeIntersectionOtherParentInfo(
      this.otherParentsInfo
    );
    return { success: true };
  }

  saveState(): void {
    this.lastState = this.otherParentsInfo.SEIntersectionPoint.id;
  }
  restoreState(): void {
    // console.debug(
    //   `RemoveIntersectionPointOtherParent: restore Add intersection point parent, ${this.seOtherParent.name}`
    // );
    // Add the parent to the list of parents in the SEIntersectionPoint
    this.otherParentsInfo.SEIntersectionPoint.addIntersectionOtherParentInfo(
      this.otherParentsInfo
    );
  }

  toOpcode(): null | string | Array<string> {
    return [
      "RemoveIntersectionPointOtherParentsInfo",
      // Object specific attributes
      "intersectionPointName=" + this.otherParentsInfo.SEIntersectionPoint.name,
      "intersectionPointOtherParentInfoName1=" +
        this.otherParentsInfo.parent1.name,
      "intersectionPointOtherParentInfoName2=" +
        this.otherParentsInfo.parent2.name,
      "intersectionPointOtherParentInfoOrder=" + this.otherParentsInfo.order
    ].join("&");
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
      return new RemoveIntersectionPointOtherParentsInfo({
        SEIntersectionPoint: intersectionPoint,
        parent1: firstParent,
        parent2: secondParent,
        existingIntersectionPoint: true,
        createAntipodalPoint: !(
          (firstParent instanceof SELine || firstParent instanceof SESegment) &&
          (secondParent instanceof SELine || secondParent instanceof SESegment)
        ),
        order: order
      });
    }
    throw new Error(
      `RemoveIntersectionPointOtherParentCommand: ${intersectionPoint}  or ${firstParent} or ${secondParent} or ${order} is undefined`
    );
  }
}
