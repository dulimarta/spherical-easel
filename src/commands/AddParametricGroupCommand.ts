import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
// import { Vector3 } from "three";
import { SEParametricGroup } from "@/models/SEParametricGroup";
// import { SEExpression } from "@/models/SEExpression";
// import {
//   CoordExpression,
//   MinMaxExpression,
//   MinMaxNumber,
//   SavedNames
// } from "@/types";
// import { StyleCategory } from "@/types/Styles";
// import { CommandGroup } from "./CommandGroup";
import { toSVGReturnType } from "@/types";

export class AddParametricGroupCommand extends Command {
  private group: SEParametricGroup;
  // private seExpressionParents: SEExpression[] = [];
  // private seLabel: SELabel;

  constructor(
    group: SEParametricGroup
    // seExpressionParents: SEExpression[],
    // seLabel: SELabel
  ) {
    super();
    this.group = group;
    // this.seExpressionParents.push(...seExpressionParents);
    // this.seLabel = seLabel;
  }

  do(): void {
    this.group.members.forEach(par =>
      // par.registerChild(this.seParametric)
      Command.store.addParametric(par)
    );
    // this.seParametric.registerChild(this.seLabel);
    // Command.store.addParametric(this.seParametric);
    // Command.store.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.group.members.map(par => par.id);
  }

  restoreState(): void {
    (this.lastState as Array<number>).forEach(id => {
      Command.store.removeParametric(id);
    });
    // Command.store.removeLabel(this.seLabel.id);
    // Command.store.removeParametric(this.lastState);
    // this.seParametric.unregisterChild(this.seLabel);
    // this.seExpressionParents.forEach(par =>
    //   par.unregisterChild(this.seParametric)
    // );
  }

  toSVG(deletedNoduleIds: Array<number>): null | toSVGReturnType[]{
    // First check to make sure that the object is not deleted, is showing, and exists (otherwise return null)
    //

    return null
  }

  toOpcode(): null | string | Array<string> {
    return [
      "AddParametricGroup"
      // Any attribute that could possibly have a "=", "@", "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      // Object specific attributes
    ].join("&");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    throw new Error("AddParametricGroup: NOT IMPLEMENTED");
  }
}
