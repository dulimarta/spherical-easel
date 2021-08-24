import { SENodule } from "@/models/SENodule";
import { SEPencil } from "@/models/SEPencil";
import { SEPerpendicularLineThruPoint } from "@/models/SEPerpendicularLineThruPoint";
import { SEStore } from "@/store";
import { isTangentLineThruPointState } from "@/types";
import { Command } from "./Command";
import { CommandGroup } from "./CommandGroup";

export class AddPencilCommand extends Command {
  private pencil: SEPencil;

  constructor(pencil: SEPencil) {
    super();
    this.pencil = pencil;
  }

  do(): void {
    this.pencil.lines.forEach((line: SEPerpendicularLineThruPoint) => {
      SEStore.addLine(line);
      this.pencil.commonPoint.registerChild(line);
      this.pencil.commonParametric.registerChild(line);
    });
    // Command.store.addPencil(this.pencil);
  }

  saveState(): void {
    // no cde needed
  }

  restoreState(): void {
    console.debug(
      "Undoing SEPencil, number of perp lines",
      this.pencil.lines.length
    );
    this.pencil.lines.forEach((line: SEPerpendicularLineThruPoint) => {
      Command.store.removeLine(line.id);
      this.pencil.commonPoint.unregisterChild(line);
      this.pencil.commonParametric.unregisterChild(line);
    });
  }

  toOpcode(): null | string | Array<string> {
    return null;
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    return new CommandGroup();
  }
}
