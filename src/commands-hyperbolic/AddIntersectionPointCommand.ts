import { Command } from "../commands-spherical/Command";
import { HEOneDimensional } from "@/types";
import { HELabel } from "@/models-hyperbolic/HELabel";
import { HEIntersectionPoint } from "@/models-hyperbolic/HEIntersectionPoint";

export class AddIntersectionPointCommand extends Command {
  private heIntersectionPoint: HEIntersectionPoint;
  private principleParent1: HEOneDimensional;
  private principleParent2: HEOneDimensional;
  private heLabel: HELabel;

  constructor(
    seIntersectionPoint: HEIntersectionPoint,
    parent1: HEOneDimensional,
    parent2: HEOneDimensional,
    heLabel: HELabel
  ) {
    super();
    this.heIntersectionPoint = seIntersectionPoint;
    this.principleParent1 = parent1;
    this.principleParent2 = parent2;
    this.heLabel = heLabel;
  }

  do(): void {
    // console.debug(
    //   `Add intersection point ${this.seIntersectionPoint.name} with parents ${
    //     this.principleParent1.name
    //   } and ${
    //     this.principleParent2.name
    //   } at ${this.seIntersectionPoint.locationVector.toFixed(2)}`
    // );
    this.principleParent1.registerChild(this.heIntersectionPoint);
    this.principleParent2.registerChild(this.heIntersectionPoint);
    this.heIntersectionPoint.registerChild(this.heLabel);
    Command.hstore.addPoint(this.heIntersectionPoint);
    Command.hstore.addLabel(this.heLabel);
  }

  saveState(): void {
    this.lastState = this.heIntersectionPoint.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.heLabel.id);
    Command.store.removePoint(this.lastState);
    this.heIntersectionPoint.unregisterChild(this.heLabel);
    this.principleParent1.unregisterChild(this.heIntersectionPoint);
    this.principleParent2.unregisterChild(this.heIntersectionPoint);
  }

  // getSVGObjectLabelPairs(): [SENodule, HELabel][] {
  //   return [[this.heIntersectionPoint, this.heLabel]];
  // }

  toOpcode(): null | string | Array<string> {
    // // don't need the other parent array because that is handled in the commands AddIntersectionPointOtherParent and RemoveIntersectionPointOtherParent

    // return [
    //   "AddIntersectionPoint",
    //   // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
    //   // All plottable objects have these attributes
    //   "objectName=" + Command.symbolToASCIIDec(this.heIntersectionPoint.name),
    //   "objectExists=" + this.heIntersectionPoint.exists,
    //   "objectShowing=" + this.heIntersectionPoint.showing,
    //   "objectFrontStyle=" +
    //     Command.symbolToASCIIDec(
    //       JSON.stringify(
    //         this.heIntersectionPoint.ref.currentStyleState(StyleCategory.Front)
    //       )
    //     ),
    //   "objectBackStyle=" +
    //     Command.symbolToASCIIDec(
    //       JSON.stringify(
    //         this.heIntersectionPoint.ref.currentStyleState(StyleCategory.Back)
    //       )
    //     ),
    //   // All labels have these attributes
    //   "labelName=" + Command.symbolToASCIIDec(this.heLabel.name),
    //   "labelStyle=" +
    //     Command.symbolToASCIIDec(
    //       JSON.stringify(
    //         this.heLabel.ref.currentStyleState(StyleCategory.Label)
    //       )
    //     ),
    //   "labelVector=" + this.heLabel.ref._locationVector.toFixed(9),
    //   "labelShowing=" + this.heLabel.showing,
    //   "labelExists=" + this.heLabel.exists,
    //   // Object specific attributes
    //   "intersectionPointPrincipleParent1Name=" + this.principleParent1.name,
    //   "intersectionPointPrincipleParent2Name=" + this.principleParent2.name,
    //   "intersectionPointUserCreated=" + this.heIntersectionPoint.isUserCreated,
    //   "intersectionPointOrder=" + this.heIntersectionPoint.intersectionOrder,
    //   "intersectionPointVector=" +
    //     this.heIntersectionPoint.locationVector.toFixed(9)
    //   // "intersectionPointOtherParentArrayLength=" +
    //   //   this.seIntersectionPoint.otherParentArray.length,
    //   // "intersectionPointOtherParentArrayNameList=" +
    //   //   intersectionPointParentArrayNameList
    // ].join("&");
    return null;
  }

  // static parse(command: string, objMap: Map<string, SENodule>): Command {
  //   // console.log(command);
  //   const tokens = command.split("&");
  //   const propMap = new Map<SavedNames, string>();
  //   // load the tokens into the map
  //   tokens.forEach((token, ind) => {
  //     if (ind === 0) return; // don't put the command type in the propMap
  //     const parts = token.split("=");
  //     if (parts[0] !== "intersectionPointOtherParentArrayNameList") {
  //       propMap.set(parts[0] as SavedNames, Command.asciiDecToSymbol(parts[1]));
  //     } else {
  //       propMap.set(parts[0] as SavedNames, parts[1]); // Don't run parts[1] thru Command.asciiDecToSymbol yet
  //     }
  //   });

  //   // get the object specific attributes
  //   const principleParent1 = objMap.get(
  //     propMap.get("intersectionPointPrincipleParent1Name") ?? ""
  //   ) as HEOneDimensional | undefined;

  //   const principleParent2 = objMap.get(
  //     propMap.get("intersectionPointPrincipleParent2Name") ?? ""
  //   ) as HEOneDimensional | undefined;

  //   const positionVector = new Vector3();
  //   positionVector.from(propMap.get("intersectionPointVector")); // convert to vector, if .from() fails the vector is set to 0,0,1

  //   const intersectionOrder = Number(propMap.get("intersectionPointOrder"));

  //   const intersectionPointUserCreated =
  //     propMap.get("intersectionPointUserCreated") === "true";

  //   // don't need the other parent array because that is handled in the commands AddIntersectionPointOtherParent and RemoveIntersectionPointOtherParent
  //   // const otherParentArrayLength = Number(
  //   //   propMap.get("intersectionPointOtherParentArrayLength")
  //   // );

  //   // const otherParents: (HEOneDimensional | undefined)[] = [];
  //   // if (otherParentArrayLength > 0) {
  //   //   const arrayNameList = propMap.get(
  //   //     "intersectionPointOtherParentArrayNameList"
  //   //   );
  //   //   if (arrayNameList) {
  //   //     const list = arrayNameList
  //   //       .split("@")
  //   //       .map(str => Command.asciiDecToSymbol(str));
  //   //     list.forEach(name => {
  //   //       const parent = objMap.get(name) as HEOneDimensional | undefined;
  //   //       otherParents.push(parent);
  //   //     });
  //   //   }
  //   // }

  //   if (
  //     principleParent2 &&
  //     principleParent1 &&
  //     positionVector.z !== 1 &&
  //     !isNaN(intersectionOrder)
  //   ) {
  //     //make the intersection point
  //     const seIntersectionPoint = new SEIntersectionPoint(
  //       principleParent1,
  //       principleParent2,
  //       intersectionOrder,
  //       intersectionPointUserCreated
  //     );
  //     seIntersectionPoint.locationVector = positionVector;
  //     //style the intersection point
  //     const intersectionPointFrontStyleString = propMap.get("objectFrontStyle");
  //     if (intersectionPointFrontStyleString !== undefined)
  //       seIntersectionPoint.updatePlottableStyle(
  //         StyleCategory.Front,
  //         JSON.parse(intersectionPointFrontStyleString)
  //       );
  //     const intersectionPointBackStyleString = propMap.get("objectBackStyle");
  //     if (intersectionPointBackStyleString !== undefined)
  //       seIntersectionPoint.updatePlottableStyle(
  //         StyleCategory.Back,
  //         JSON.parse(intersectionPointBackStyleString)
  //       );

  //     //make the label and set its location
  //     const seLabel = new HELabel("point", seIntersectionPoint);
  //     const seLabelLocation = new Vector3();
  //     seLabelLocation.from(propMap.get("labelVector")); // convert to Number
  //     seLabel.locationVector = seLabelLocation; // Don't use copy() on a prop
  //     //style the label
  //     const labelStyleString = propMap.get("labelStyle");

  //     if (labelStyleString !== undefined) {
  //       seLabel.updatePlottableStyle(
  //         StyleCategory.Label,
  //         JSON.parse(labelStyleString)
  //       );
  //     }

  //     //put the intersection point in the object map
  //     if (propMap.get("objectName") !== undefined) {
  //       seIntersectionPoint.name = propMap.get("objectName") ?? "";
  //       seIntersectionPoint.showing = propMap.get("objectShowing") === "true";
  //       seIntersectionPoint.exists = propMap.get("objectExists") === "true";
  //       objMap.set(seIntersectionPoint.name, seIntersectionPoint);
  //     } else {
  //       throw new Error(
  //         "AddIntersectionPoint: Intersection point Name doesn't exist"
  //       );
  //     }

  //     //put the label in the object map
  //     if (propMap.get("labelName") !== undefined) {
  //       seLabel.name = propMap.get("labelName") ?? "";
  //       seLabel.showing = propMap.get("labelShowing") === "true";
  //       seLabel.exists = propMap.get("labelExists") === "true";
  //       objMap.set(seLabel.name, seLabel);
  //     } else {
  //       throw new Error("AddIntersectionPoint: Label Name doesn't exist");
  //     }

  //     return new AddIntersectionPointCommand(
  //       seIntersectionPoint,
  //       principleParent1,
  //       principleParent2,
  //       seLabel
  //     );
  //   }
  //   throw new Error(
  //     `AddIntersectionPointCommand: HERE ${principleParent1?.name}, ${principleParent2?.name},  ${positionVector}, ${intersectionOrder}, or some element of the other parent array is undefined`
  //   );
  // }
}
