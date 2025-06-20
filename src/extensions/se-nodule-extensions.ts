import SETTINGS from "@/global-settings";
import { SECircle } from "@/models/SECircle";
import { SELabel } from "@/models/SELabel";
import { SELine } from "@/models/SELine";
import { SENodule } from "@/models/SENodule";
import { SEPoint } from "@/models/SEPoint";
import { SESegment } from "@/models/SESegment";
import { LabelParentTypes } from "@/types";
import { Vector3 } from "three";

function labelTypeOf(n: SENodule): LabelParentTypes {
  if (n instanceof SEPoint) return "point";
  if (n instanceof SESegment) return "segment"
  if (n instanceof SECircle) return "circle"
  if (n instanceof SELine) return "line"
  return "point";
}
const tmpVector = new Vector3();
const tmpVector2 = new Vector3();
SENodule.prototype.attachLabelWithOffset = function (offset: Vector3): SELabel {
  const labelType = labelTypeOf(this);

  const seLabel = new SELabel(labelType, this);
  switch (labelType) {
    case "point":
      tmpVector
        .copy((this as SEPoint).locationVector)
        .add(offset)
        .normalize();
      break;
    case "line":
      tmpVector
        .copy((this as SELine).endSEPoint.locationVector)
        .add(offset)
        .normalize();
      break;
    case "segment":
      tmpVector
        .copy((this as SESegment).getMidPointVector())
        .add(offset)
        .normalize();
      if ((this as SESegment).arcLength > Math.PI) {
        tmpVector.multiplyScalar(-1);
      }

      break;
    case "circle":
      tmpVector
        .copy((this as SECircle).circleSEPoint.locationVector)
        .add(offset)
        .normalize();
      break;
  }
  seLabel.locationVector = tmpVector;
  return seLabel;
};
