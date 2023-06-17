import { Command } from "./Command";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SavedNames, SEOneDimensional, SEOneOrTwoDimensional } from "@/types";
import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { sRGBEncoding, Vector3 } from "three";
import Label from "@/plottables/Label";
import NonFreePoint from "@/plottables/NonFreePoint";
import { StyleEditPanels } from "@/types/Styles";
export class AddIntersectionPointCommand extends Command {
  private seIntersectionPoint: SEIntersectionPoint;
  private principleParent1: SEOneDimensional;
  private principleParent2: SEOneDimensional;
  private seLabel: SELabel;

  constructor(
    seIntersectionPoint: SEIntersectionPoint,
    parent1: SEOneDimensional,
    parent2: SEOneDimensional,
    seLabel: SELabel
  ) {
    super();
    this.seIntersectionPoint = seIntersectionPoint;
    this.principleParent1 = parent1;
    this.principleParent2 = parent2;
    this.seLabel = seLabel;
  }

  do(): void {
    // console.debug(
    //   `Add intersection point ${this.seIntersectionPoint.name} with parents ${
    //     this.principleParent1.name
    //   } and ${
    //     this.principleParent2.name
    //   } at ${this.seIntersectionPoint.locationVector.toFixed(2)}`
    // );
    this.principleParent1.registerChild(this.seIntersectionPoint);
    this.principleParent2.registerChild(this.seIntersectionPoint);
    this.seIntersectionPoint.registerChild(this.seLabel);
    Command.store.addPoint(this.seIntersectionPoint);
    Command.store.addLabel(this.seLabel);
  }

  saveState(): void {
    this.lastState = this.seIntersectionPoint.id;
  }

  restoreState(): void {
    Command.store.removeLabel(this.seLabel.id);
    Command.store.removePoint(this.lastState);
    this.seIntersectionPoint.unregisterChild(this.seLabel);
    this.principleParent1.unregisterChild(this.seIntersectionPoint);
    this.principleParent2.unregisterChild(this.seIntersectionPoint);
  }

  toOpcode(): null | string | Array<string> {
    // don't need the other parent array because that is handled in the commands AddIntersectionPointOtherParent and RemoveIntersectionPointOtherParent

    // let intersectionPointParentArrayNameList = "";
    // this.seIntersectionPoint.otherParentArray.forEach(parent => {
    //   intersectionPointParentArrayNameList +=
    //     Command.symbolToASCIIDec(parent.name) + "@";
    // });
    // intersectionPointParentArrayNameList =
    //   intersectionPointParentArrayNameList.slice(0, -1);
    // console.debug(
    //   `Intersection point ${this.seIntersectionPoint.name}, principle parent1 ${this.principleParent1.name}, principle parent 2 ${this.principleParent2.name}`
    // );
    return [
      "AddIntersectionPoint",
      // Any attribute that could possibly have a "= or "&" or "/" should be run through Command.symbolToASCIIDec
      // All plottable objects have these attributes
      "objectName=" + Command.symbolToASCIIDec(this.seIntersectionPoint.name),
      "objectExists=" + this.seIntersectionPoint.exists,
      "objectShowing=" + this.seIntersectionPoint.showing,
      "objectFrontStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seIntersectionPoint.ref.currentStyleState(
              StyleEditPanels.Front
            )
          )
        ),
      "objectBackStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seIntersectionPoint.ref.currentStyleState(StyleEditPanels.Back)
          )
        ),
      // All labels have these attributes
      "labelName=" + Command.symbolToASCIIDec(this.seLabel.name),
      "labelStyle=" +
        Command.symbolToASCIIDec(
          JSON.stringify(
            this.seLabel.ref.currentStyleState(StyleEditPanels.Label)
          )
        ),
      "labelVector=" + this.seLabel.ref._locationVector.toFixed(9),
      "labelShowing=" + this.seLabel.showing,
      "labelExists=" + this.seLabel.exists,
      // Object specific attributes
      "intersectionPointPrincipleParent1Name=" + this.principleParent1.name,
      "intersectionPointPrincipleParent2Name=" + this.principleParent2.name,
      "intersectionPointUserCreated=" + this.seIntersectionPoint.isUserCreated,
      "intersectionPointOrder=" + this.seIntersectionPoint.intersectionOrder,
      "intersectionPointVector=" +
        this.seIntersectionPoint.locationVector.toFixed(9)
      // "intersectionPointOtherParentArrayLength=" +
      //   this.seIntersectionPoint.otherParentArray.length,
      // "intersectionPointOtherParentArrayNameList=" +
      //   intersectionPointParentArrayNameList
    ].join("&");
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    // console.log(command);
    const tokens = command.split("&");
    const propMap = new Map<SavedNames, string>();
    // load the tokens into the map
    tokens.forEach((token, ind) => {
      if (ind === 0) return; // don't put the command type in the propMap
      const parts = token.split("=");
      if (parts[0] !== "intersectionPointOtherParentArrayNameList") {
        propMap.set(parts[0] as SavedNames, Command.asciiDecToSymbol(parts[1]));
      } else {
        propMap.set(parts[0] as SavedNames, parts[1]); // Don't run parts[1] thru Command.asciiDecToSymbol yet
      }
    });

    // get the object specific attributes
    const principleParent1 = objMap.get(
      propMap.get("intersectionPointPrincipleParent1Name") ?? ""
    ) as SEOneDimensional | undefined;

    const principleParent2 = objMap.get(
      propMap.get("intersectionPointPrincipleParent2Name") ?? ""
    ) as SEOneDimensional | undefined;

    const positionVector = new Vector3();
    positionVector.from(propMap.get("intersectionPointVector")); // convert to vector, if .from() fails the vector is set to 0,0,1

    const intersectionOrder = Number(propMap.get("intersectionPointOrder"));

    const intersectionPointUserCreated =
      propMap.get("intersectionPointUserCreated") === "true";

    // don't need the other parent array because that is handled in the commands AddIntersectionPointOtherParent and RemoveIntersectionPointOtherParent
    // const otherParentArrayLength = Number(
    //   propMap.get("intersectionPointOtherParentArrayLength")
    // );

    // const otherParents: (SEOneDimensional | undefined)[] = [];
    // if (otherParentArrayLength > 0) {
    //   const arrayNameList = propMap.get(
    //     "intersectionPointOtherParentArrayNameList"
    //   );
    //   if (arrayNameList) {
    //     const list = arrayNameList
    //       .split("@")
    //       .map(str => Command.asciiDecToSymbol(str));
    //     list.forEach(name => {
    //       const parent = objMap.get(name) as SEOneDimensional | undefined;
    //       otherParents.push(parent);
    //     });
    //   }
    // }

    if (
      principleParent2 &&
      principleParent1 &&
      positionVector.z !== 1 &&
      !isNaN(intersectionOrder)
    ) {
      //make the intersection point
      const nonFreePoint = new NonFreePoint();
      const seIntersectionPoint = new SEIntersectionPoint(
        nonFreePoint,
        principleParent1,
        principleParent2,
        intersectionOrder,
        intersectionPointUserCreated
      );
      seIntersectionPoint.locationVector = positionVector;
      //style the intersection point
      const intersectionPointFrontStyleString = propMap.get("objectFrontStyle");
      if (intersectionPointFrontStyleString !== undefined)
        nonFreePoint.updateStyle(
          StyleEditPanels.Front,
          JSON.parse(intersectionPointFrontStyleString)
        );
      const intersectionPointBackStyleString = propMap.get("objectBackStyle");
      if (intersectionPointBackStyleString !== undefined)
        nonFreePoint.updateStyle(
          StyleEditPanels.Back,
          JSON.parse(intersectionPointBackStyleString)
        );

      //make the label and set its location
      const label = new Label("point");
      const seLabel = new SELabel(label, seIntersectionPoint);
      const seLabelLocation = new Vector3();
      seLabelLocation.from(propMap.get("labelVector")); // convert to Number
      seLabel.locationVector.copy(seLabelLocation);
      //style the label
      const labelStyleString = propMap.get("labelStyle");

      if (labelStyleString !== undefined) {
        label.updateStyle(StyleEditPanels.Label, JSON.parse(labelStyleString));
      }

      //put the intersection point in the object map
      if (propMap.get("objectName") !== undefined) {
        seIntersectionPoint.name = propMap.get("objectName") ?? "";
        seIntersectionPoint.showing = propMap.get("objectShowing") === "true";
        seIntersectionPoint.exists = propMap.get("objectExists") === "true";
        objMap.set(seIntersectionPoint.name, seIntersectionPoint);
      } else {
        throw new Error(
          "AddIntersectionPoint: Intersection point Name doesn't exist"
        );
      }

      //put the label in the object map
      if (propMap.get("labelName") !== undefined) {
        seLabel.name = propMap.get("labelName") ?? "";
        seLabel.showing = propMap.get("labelShowing") === "true";
        seLabel.exists = propMap.get("labelExists") === "true";
        objMap.set(seLabel.name, seLabel);
      } else {
        throw new Error("AddIntersectionPoint: Label Name doesn't exist");
      }
      // // add the other parents
      // otherParents.forEach(parent => {
      //   if (parent) {
      //     seIntersectionPoint.addIntersectionOtherParent(parent);
      //   }
      // });
      return new AddIntersectionPointCommand(
        seIntersectionPoint,
        principleParent1,
        principleParent2,
        seLabel
      );
    }
    throw new Error(
      `AddIntersectionPointCommand: HERE ${principleParent1?.name}, ${principleParent2?.name},  ${positionVector}, ${intersectionOrder}, or some element of the other parent array is undefined`
    );
  }
}
