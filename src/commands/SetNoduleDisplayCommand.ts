import { Command } from "./Command";
import { SENodule } from "@/models/SENodule";

export class SetNoduleDisplayCommand extends Command {
  private seNodule: SENodule;
  private showing: boolean;

  constructor(seNodule: SENodule, showing: boolean) {
    super();
    this.seNodule = seNodule;
    this.showing = showing;
  }

  do(): void {
    this.seNodule.showing = this.showing;
  }

  saveState(): void {
    this.lastState = this.seNodule.id;
  }

  restoreState(): void {
    this.seNodule.showing = !this.showing;
  }
}
