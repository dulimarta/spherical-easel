import { Command } from "./Command";
import { Vector3 } from "three";
import { SESegment } from "@/models/SESegment";
import { toSVGType } from "@/types";

export class MoveSegmentCommand extends Command {
  private seSegment: SESegment;
  private oldNormalVector = new Vector3();
  private newNormalVector = new Vector3();
  private oldArcLength: number;
  private newArcLength: number;

  constructor(
    seSegment: SESegment,
    oldNormalVector: Vector3,
    newNormalVector: Vector3,
    oldArcLength: number,
    newArcLength: number
  ) {
    super();
    this.seSegment = seSegment;
    this.oldNormalVector.copy(oldNormalVector);
    this.newNormalVector.copy(newNormalVector);
    this.oldArcLength = oldArcLength;
    this.newArcLength = newArcLength;
  }

  do(): void {
    Command.store.changeSegmentNormalVectorArcLength({
      segmentId: this.seSegment.id,
      normal: this.newNormalVector,
      arcLength: this.newArcLength
    });
  }

  saveState(): void {
    this.lastState = this.seSegment.id;
  }

  restoreState(): void {
    Command.store.changeSegmentNormalVectorArcLength({
      segmentId: this.lastState,
      normal: this.oldNormalVector,
      arcLength: this.oldArcLength
    });
  }

  toSVG(deletedNoduleIds: Array<number>): null | toSVGType[]{
    // First check to make sure that the object is not deleted, is showing, and exists (otherwise return null)
    //

    return null
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
