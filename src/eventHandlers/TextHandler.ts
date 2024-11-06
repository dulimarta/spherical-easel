import { AddTextCommand } from "@/commands/AddTextCommand";
import Highlighter from "./Highlighter";
import { SEText } from "@/models/SEText";
import EventBus from "@/eventHandlers/EventBus";

export default class TextHandler extends Highlighter {
  mousePressed(event: MouseEvent): void {
    console.debug("TextHandler::mousePressed()");
    console.debug(`Current Screen Vector - x: ${this.currentScreenVector.x}, y: ${this.currentScreenVector.y}`);

    // Fire the event to show the dialog
    EventBus.fire("show-text-dialog", {}); // Empty data if not required for the dialog
    console.debug("Event 'show-text-dialog' fired");

    this.activate(); // Setup event listener for text submission
  }

  activate(): void {
    console.debug("TextHandler activated");

    // Set up the listener for text submission
    EventBus.listen("text-data-submitted", this.handleTextInput.bind(this));
  }

  deactivate(): void {
    EventBus.unlisten("text-data-submitted");
    console.debug("TextHandler deactivated");
  }

  // Method to receive text input
  handleTextInput(data: any): void {
    console.debug("TextHandler::handleTextInput() called with data:", data);

    // Ensure the text content is accessed correctly from the event payload
    const submittedText = data.text || ""; // Adjust if data is structured differently

    console.debug(`Received text: "${submittedText}"`);
    console.debug(`Rendering text at x: ${this.currentScreenVector.x}, y: ${this.currentScreenVector.y}`);

    const testText = new SEText(
      submittedText,
      this.currentScreenVector.x,
      this.currentScreenVector.y
    );

    const TextCmd = new AddTextCommand(testText);
    console.debug("Executing AddTextCommand to display the text on canvas...");
    TextCmd.execute();

    // Deactivate the listener once the text is handled
    this.deactivate();
  }

  mouseReleased(event: MouseEvent): void {
    /* None */
  }
}
