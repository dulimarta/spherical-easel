// Use this template as a starter for a new event handler
import { DummyCommand } from "@/commands-spherical/DummyCommand";
import Highlighter from "./Highlighter";
export default class DummyHandler extends Highlighter {
  mousePressed(event: MouseEvent): void {
    console.debug("DummyHandler::mousePressed");
  }
  mouseReleased(event: MouseEvent): void {
    // throw new Error("Method not implemented.");
    const dummyCmd = new DummyCommand("released", event.clientX, event.clientY);
    dummyCmd.execute();
  }
}
