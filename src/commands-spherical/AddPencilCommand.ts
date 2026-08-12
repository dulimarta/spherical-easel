import { SENodule } from "@/models-spherical/SENodule";
import { SEPencil } from "@/models-spherical/SEPencil";
import { SEPerpendicularLineThruPoint } from "@/models-spherical/SEPerpendicularLineThruPoint";
import { Command } from "./Command";
import { CommandGroup } from "./CommandGroup";
import { toSVGType } from "@/types";

export class AddPencilCommand extends Command {
  private pencil: SEPencil;

  constructor(pencil: SEPencil) {
    super();
    this.pencil = pencil;
  }

  do(): void {
    Command.store.addPoint(this.pencil.commonPoint);
    this.pencil.lines.forEach((line: SEPerpendicularLineThruPoint) => {
      Command.store.addLine(line);
      this.pencil.commonPoint.registerChild(line);
      this.pencil.commonParametric.registerChild(line);
    });
  }

  saveState(): void {
    // no cde needed
  }

  restoreState(): void {
    this.pencil.lines.forEach((line: SEPerpendicularLineThruPoint) => {
      this.pencil.commonPoint.unregisterChild(line);
      this.pencil.commonParametric.unregisterChild(line);
      Command.store.removeLine(line.id);
    });
    Command.store.removePoint(this.pencil.commonPoint.id);
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }

  static parse(command: string, objMap: Map<string, SENodule>): Command {
    return new CommandGroup();
  }
}
