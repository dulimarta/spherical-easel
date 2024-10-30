// Use this template as a starter for a new event handler
import { AddTextCommand } from "@/commands/AddTextCommand";
import Highlighter from "./Highlighter";
import { SEText } from "@/models/SEText";
export default class TextHandler extends Highlighter {
  mousePressed(event: MouseEvent): void {
    console.debug("TextHandler::mousePressed()")
    console.debug(`TextHandler: this.currentScreenVector.x = ${this.currentScreenVector.x}`);
    console.debug(`TextHandler: this.currentScreenVector.y = ${this.currentScreenVector.y}`);
    const testText = new SEText("Hello World!",
      this.currentScreenVector.x,
      this.currentScreenVector.y
    );
    const TextCmd = new AddTextCommand(testText);
    console.debug("Executing AddTextCommand...");
    TextCmd.execute();

    // fire event like "show text dialog box"
  }
  mouseReleased(event: MouseEvent): void {
    /* None */
  }

}
