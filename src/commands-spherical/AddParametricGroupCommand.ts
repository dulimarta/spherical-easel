import { Command } from "./Command";
import { SENodule } from "@/models-spherical/SENodule";
// import { Vector3 } from "three";
import { SEParametricGroup } from "@/models-spherical/SEParametricGroup";
// import { SEExpression } from "@/models-spherical/SEExpression";
// import {
//   CoordExpression,
//   MinMaxExpression,
//   MinMaxNumber,
//   SavedNames
// } from "@/types";
// import { StyleCategory } from "@/types/Styles";
// import { CommandGroup } from "./CommandGroup";
import { toSVGType } from "@/types";

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
