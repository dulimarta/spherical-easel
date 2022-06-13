import { Command } from "./Command";

// This Command class is not doing anything
// Use this for quick placeholder in debugging the other
// Command classes
export class NullCommand extends Command {
  restoreState(): void {
    /* todo */
  }
  saveState(): void {
    /* todo */
  }
  do(): void {
    /* todo */
  }
  toOpcode(): string | string[] | null {
    return null;
  }
}
