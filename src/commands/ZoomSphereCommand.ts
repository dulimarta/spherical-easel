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

  do() {
    Command.store.commit(
      "setZoomMagnificationFactor",
      this.previousMagnificationFactor
    );
    Command.store.commit("setZoomTranslation", this.previousTranslationVector);
    EventBus.fire("zoom-updated", {});
    //Command.store.commit("zoomSphere");
  }

  saveState() {
    // No work required here
  }

  restoreState() {
    Command.store.commit(
      "setZoomMagnificationFactor",
      this.magnificationFactor
    );
    Command.store.commit("setZoomTranslation", this.translationVector);
    EventBus.fire("zoom-updated", {});
    //Command.store.commit("previousZoomSphere");
  }
}
