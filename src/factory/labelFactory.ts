import { SELabel } from "@/models/SELabel";
import { SENodule } from "@/models/SENodule";
import { LabelParentTypes, SavedNames } from "@/types";
import { StyleCategory, StyleOptions } from "@/types/Styles";
import { Vector3 } from "three";

// export function createLabel(
//   labelType: LabelParentTypes,
//   parent: SENodule,
//   position: string /* Vector3 string representation */| undefined,
//   styles: StyleOptions | undefined
// ) {
//   const seLabel = new SELabel(labelType, parent);
//   const seLabelLocation = new Vector3();
//   if (position)
//     seLabelLocation.from(position); // convert to Number
//   // else if (typeof position === "object") {
//   //   seLabelLocation.copy(position);
//   // }
//   seLabel.locationVector.copy(seLabelLocation);
//   if (styles)
//     seLabel.updatePlottableStyle(StyleCategory.Label, styles);
//   return seLabel;
// }
