import { AddTextCommand } from "@/commands/AddTextCommand";
import Highlighter from "./Highlighter";
import { SEText } from "@/models/SEText";
import EventBus from "@/eventHandlers/EventBus";

export default class TextHandler extends Highlighter {
  mousePressed(event: MouseEvent): void {
    console.debug("TextHandler::mousePressed()");
    console.debug(`TextHandler: this.currentScreenVector.x = ${this.currentScreenVector.x}`);
    console.debug(`TextHandler: this.currentScreenVector.y = ${this.currentScreenVector.y}`);

    // Fire the event to show the dialog
    EventBus.fire("show-text-dialog", {}); // Keep it simple for now
    this.activate(); //setup event listner
  }

  activate(): void {
    console.debug("TextHandler activated");

    // Set up the listener for text submission
    EventBus.listen("text-data-submitted", this.handleTextInput.bind(this));
    this.deactivate(); //turn off eventListener
  }

  deactivate(): void {
    EventBus.unlisten("text-data-submitted");
  }

  // Method to receive text input
  handleTextInput(text: string): void {
    const testText = new SEText(
      text,
      this.currentScreenVector.x,
      this.currentScreenVector.y
    );
    const TextCmd = new AddTextCommand(testText);
    console.debug("Executing AddTextCommand...");
    TextCmd.execute();
  }

  mouseReleased(event: MouseEvent): void {
    /* None */
  }
}
