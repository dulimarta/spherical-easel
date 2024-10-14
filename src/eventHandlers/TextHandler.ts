// Use this template as a starter for a new event handler
import { TextCommand } from "@/commands/TextCommand";
import Highlighter from "./Highlighter";
export default class TextHandler extends Highlighter {
  mousePressed(event: MouseEvent): void {
    console.debug("TextHandler::mousePressed")

  }
  mouseReleased(event: MouseEvent): void {
    // throw new Error("Method not implemented.");
    const TextCmd = new TextCommand("released", event.clientX, event.clientY)
    TextCmd.execute()
  }

}