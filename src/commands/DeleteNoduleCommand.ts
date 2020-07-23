import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";
import { PointState } from "@/types";
import { SEPoint } from "@/models/SEPoint";
import { SELine } from "@/models/SELine";
import { SECircle } from "@/models/SECircle";
import { SESegment } from "@/models/SESegment";

export class DeleteNoduleCommand extends Command {
  private seNodule: SENodule;
  private parentIds: number[] = [];
  constructor(seNodule: SENodule) {
    super();
    this.seNodule = seNodule;
    this.seNodule.parents.forEach(nodule => {
      this.parentIds.push(nodule.id);
    });
  }

  do(): void {
    // Remove from the Data Structure (DAG)
    // Notice that this make the parents array empty so that is why we stored the parents ids in a separate
    // array for restore state.
    if (this.seNodule.parents.length > 0) {
      this.seNodule.parents.forEach(nodule => {
        nodule.unregisterChild(this.seNodule);
      });
    }
    // Remove from the store and turn off the display
    if (this.seNodule instanceof SEPoint) {
      Command.store.commit("removePoint", this.seNodule.id);
    } else if (this.seNodule instanceof SELine) {
      Command.store.commit("removeLine", this.seNodule.id);
    } else if (this.seNodule instanceof SECircle) {
      Command.store.commit("removeCircle", this.seNodule.id);
    } else if (this.seNodule instanceof SESegment) {
      Command.store.commit("removeSegment", this.seNodule.id);
    }
  }

  saveState(): void {
    this.lastState = this.seNodule.id;
  }

  restoreState(): void {
    // Add the point to the store and turn on display
    if (this.seNodule instanceof SEPoint) {
      Command.store.commit("addPoint", this.seNodule);
    } else if (this.seNodule instanceof SELine) {
      Command.store.commit("addLine", this.seNodule);
    } else if (this.seNodule instanceof SECircle) {
      Command.store.commit("addCircle", this.seNodule);
    } else if (this.seNodule instanceof SESegment) {
      Command.store.commit("addSegment", this.seNodule);
    }
    // Add to the Data Structure (DAG)
    if (this.parentIds.length > 0) {
      this.parentIds.forEach(num => {
        Command.store.getters.getSENodule(num).registerChild(this.seNodule);
      });
    }
  }
}
