import { CKPoint } from "@/models/CKPoint";
import { Command } from "./Command";
import { CKLine } from "@/models/CKLine";

export class AddLineKommand extends Command {
  constructor(
    private line: CKLine,
    private startPoint: CKPoint,
    private endPoint: CKPoint
  ) {
    super();
  }

  restoreState(preventGraphicalUpdate?: boolean): void {
    this.store.removeLine(this.line.id);
    this.startPoint.unregisterChild(this.line);
    this.endPoint.unregisterChild(this.line);
  }

  saveState(): void {}
  do(preventGraphicalUpdate?: boolean): void {
    this.startPoint.registerChild(this.line);
    this.endPoint.registerChild(this.line);
    this.store.addLine(this.line);
    this.line.notifyModelUpdated();
  }
  toOpcode(): null | string | Array<string> {
    return null;
  }
}
