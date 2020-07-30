import { UpdateStateType } from "@/types";
import { Vector3 } from "three";
import { Styles } from "@/types/Styles";
import { SEMeasurement } from "./SEMeasurement";
import { SESegment } from "./SESegment";

const emptySet = new Set<Styles>();

export class SELength extends SEMeasurement {
  constructor(parent: SESegment) {
    super();

    // This length object is a child of the segment
    parent.registerChild(this);
  }

  public customStyles = (): Set<Styles> => emptySet;

  public update(state: UpdateStateType): void {
    // Node code yet
  }

  /**
   * Is the object hit a point at a particular sphere location?
   * @param sphereVector a location on the ideal unit sphere
   */
  public isHitAt = (unitIdealVector: Vector3): boolean => false;
}
