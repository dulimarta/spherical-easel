import { Command } from "./Command";
import EventBus from "@/eventHandlers/EventBus";

export class ZoomSphereCommand extends Command {
  private magnificationFactor: number;
  private translationVector: number[] = [];
  private previousMagnificationFactor: number;
  private previousTranslationVector: number[] = [];
  constructor(
    magFactor: number,
    transVector: number[],
    previousMagFactor: number,
    previousTransVector: number[]
  ) {
    super();
    this.magnificationFactor = magFactor;
    this.previousMagnificationFactor = previousMagFactor;
    for (let i = 0; i < 2; i++) {
      this.translationVector[i] = transVector[i];
      this.previousTranslationVector[i] = previousTransVector[i];
    }
  }
  /**
   * Used to combine two zoom commands that happen in a row (like with MouseWheel Zoom)
   */
  set setMagnificationFactor(mag: number) {
    this.magnificationFactor = mag;
  }
  set setTranslationVector(transVec: number[]) {
    for (let i = 0; i < 2; i++) {
      this.translationVector[i] = transVec[i];
    }
  }
  do(): void {
    Command.store.setZoomMagnificationFactor(this.magnificationFactor);
    Command.store.setZoomTranslation(this.translationVector);
    EventBus.fire("zoom-updated", {});
  }

  saveState(): void {
    // No work required here
  }

  restoreState(): void {
    Command.store.setZoomMagnificationFactor(this.previousMagnificationFactor);
    Command.store.setZoomTranslation(this.previousTranslationVector);
    EventBus.fire("zoom-updated", {});
    //Command.store("zoomSphere");
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
