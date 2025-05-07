import { AddTextCommand } from "@/commands/AddTextCommand";
import Highlighter from "./Highlighter";
import { SEText } from "@/models/SEText";
import EventBus from "@/eventHandlers/EventBus";
import { StyleNoduleCommand } from "@/commands/StyleNoduleCommand";
import { StyleCategory } from "@/types/Styles";
import { CommandGroup } from "@/commands/CommandGroup";

export default class TextHandler extends Highlighter {
  private textObjectToEdit: SEText | null = null;
  private oldText: string | null = null;

  mousePressed(event: MouseEvent): void {
    // Filter for relevant text objects
    const texts = this.hitSETexts.filter(text => text.showing);

    if (texts.length > 0) {
      // A text object is clicked
      this.textObjectToEdit = texts[0]; // Get the top-most text object
      this.oldText = this.textObjectToEdit.ref.text; // the current text displayed
    }
    EventBus.fire("show-text-edit-dialog", {
      oldText: this.textObjectToEdit
        ? this.textObjectToEdit.noduleItemText
        : null
    });
  }
  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);
    const texts = this.hitSETexts.filter(text => text.showing);
    if (texts.length > 0) {
      texts[0].glowing = true;
    }
  }
  mouseReleased(event: MouseEvent): void {
    /* None */
  }
  activate(): void {
    // Set up the listener for text submission
    EventBus.listen("text-data-submitted", this.handleTextInput.bind(this));
  }
  deactivate(): void {
    EventBus.unlisten("text-data-submitted");
  }
  // Method to receive text input for both creating new text objects and editing existing ones.
  handleTextInput(payload: { text: string }): void {
    // console.log(
    //   "TextHandler::handleTextInput() called with data:",
    //   payload.text
    // );
    // console.log(
    //   "text object",
    //   this.textObjectToEdit
    //     ? this.textObjectToEdit.name
    //     : "No text object selected"
    // );

    // Ensure the text content is accessed correctly from the event payload
    const newText = payload.text; // The new text.
    // if the new text is empty do not create a new text object and do not modify any existing text objects
    if (newText !== "") {
      const textCommandGroup = new CommandGroup();
      if (this.textObjectToEdit) {
        // modify existing text object
        const changeTextCmd = new StyleNoduleCommand(
          [this.textObjectToEdit.ref],
          StyleCategory.Label,
          [
            {
              labelDisplayText: newText
            }
          ],
          [
            {
              labelDisplayText: this.oldText ?? "" // this.oldText should always be non empty
            }
          ]
        );
        textCommandGroup.addCommand(changeTextCmd);
      } else {
        //create new text object
        const newTextSENodule = new SEText(newText);
        newTextSENodule.locationVector = this.currentScreenVector;
        const textCmd = new AddTextCommand(newTextSENodule);
        textCommandGroup.addCommand(textCmd);
        const changeTextCmd = new StyleNoduleCommand(
          [newTextSENodule.ref],
          StyleCategory.Label,
          [
            {
              labelDisplayText: newText //new text
            }
          ],
          [
            {
              labelDisplayText: "" //old text, never displayed because an undo will also remove the text object from the display
            }
          ]
        );
        textCommandGroup.addCommand(changeTextCmd);
      }
      textCommandGroup.execute();
    } else {
      //Warn the user that they can't have an empty text object
      EventBus.fire("show-alert", {
        key: `handlers.emptyTextObjectWarning`,
        keyOptions: {},
        type: "warning"
      });
    }
    // Clear the selected text object (if any)
    this.textObjectToEdit = null;
  }
}
