import { AddTextCommand } from "@/commands/AddTextCommand";
import { ChangeTextCommand } from "@/commands/ChangeTextCommand";
import Highlighter from "./Highlighter";
import { SEText } from "@/models/SEText";
import EventBus from "@/eventHandlers/EventBus";

export default class TextHandler extends Highlighter {
  mousePressed(event: MouseEvent): void {
    console.debug("TextHandler::mousePressed()");
    console.debug(`Current Screen Vector - x: ${this.currentScreenVector.x}, y: ${this.currentScreenVector.y}`);

    // Filter for relevant text objects
    const texts = this.hitSETexts.filter(
      (text) => text.showing
    );

    if (texts.length > 0) {
      // A text object is clicked
      const clickedText = texts[0]; // Get the top-most text object
      console.log("Clicked on SEText:", clickedText.noduleItemText);

      

      new ChangeTextCommand(
        clickedText,
        clickedText.noduleItemText,
        newText
      )
    }
    else {
    // Fire the event to show the dialog
    EventBus.fire("show-text-dialog", {}); // Empty data if not required for the dialog
    console.debug("Event 'show-text-dialog' fired");
    }
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

    const text = new SEText(
      submittedText,
      this.currentScreenVector.x,
      this.currentScreenVector.y
    );

    const TextCmd = new AddTextCommand(text);
    TextCmd.execute();

    // Deactivate the listener once the text is handled
    //this.deactivate();
  }

  mouseReleased(event: MouseEvent): void {
    /* None */
  }
}
