// Use this template as a starter for a new event handler
import { AddTextCommand } from "@/commands/AddTextCommand";
import Highlighter from "./Highlighter";
import { SEText } from "@/models/SEText";
export default class TextHandler extends Highlighter {
  mousePressed(event: MouseEvent): void {
    console.debug("TextHandler::mousePressed()")
    const testText = new SEText("Hello World!", 0, 0);
    const TextCmd = new AddTextCommand(testText);
    TextCmd.execute()
  }
  mouseReleased(event: MouseEvent): void {
    /* None */
  }

}
