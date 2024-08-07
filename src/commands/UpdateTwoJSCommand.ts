import { Command } from "./Command";
import EventBus from "@/eventHandlers/EventBus";

export class UpdateTwoJSCommand extends Command {
  do(): void {
    EventBus.fire("update-two-instance", {});
  }

  saveState(): void {}

  restoreState(): void {}

  toOpcode(): null | string | Array<string> {
    return null;
  }
}
