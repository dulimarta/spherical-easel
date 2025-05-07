import { AddTextCommand } from "@/commands/AddTextCommand";
import Highlighter from "./Highlighter";
import { SEText } from "@/models/SEText";
import EventBus from "@/eventHandlers/EventBus";
import { StyleNoduleCommand } from "@/commands/StyleNoduleCommand";
import { StyleCategory } from "@/types/Styles";
import { CommandGroup } from "@/commands/CommandGroup";

export default class TextHandler extends Highlighter {

  private textObjectToEdit:SEText | null

  mousePressed(event: MouseEvent): void {
    // Filter for relevant text objects
    const texts = this.hitSETexts.filter(text => text.showing);

    if (texts.length > 0) {
      // A text object is clicked
      this.textObjectToEdit= texts[0]; // Get the top-most text object
   
      EventBus.fire("show-text-edit-dialog", {
        oldText: this.textObjectToEdit.noduleItemText,
        // textId: clickedTextObject.id,
        // seText: clickedTextObject
      });
      // console.debug("Event 'show-text-edit-dialog' fired");
    } else {
      // Fire the event to show the dialog
      EventBus.fire("show-text-dialog", {}); // Empty data if not required for the dialog
    }
  }
  mouseMoved(event: MouseEvent): void {
    // Find all the nearby (hitSE... objects) and update location vectors
    super.mouseMoved(event);
    const texts = this.hitSETexts.filter(text => text.showing);
    if (texts.length > 0){
      texts[0].glowing = true
    }
    
      
  }
  mouseReleased(event: MouseEvent): void {
    /* None */
  }
  activate(): void {
    // Set up the listener for text submission
    EventBus.listen("text-data-submitted", this.handleTextInput.bind(this));
    EventBus.listen("text-data-edited", this.handleEditInput.bind(this));
  }
  deactivate(): void {
    EventBus.unlisten("text-data-edited");
    EventBus.unlisten("text-data-submitted");
  }
  // Method to receive text input
  handleTextInput(data: { text: string }): void {
    //console.log("TextHandler::handleTextInput() called with data:", data);

    // Ensure the text content is accessed correctly from the event payload
    const submittedText = data.text; // Adjust if data is structured differently

    const newTextSENodule = new SEText(submittedText);
    newTextSENodule.locationVector = this.currentScreenVector;
    const textCommandGroup = new CommandGroup();

    const textCmd = new AddTextCommand(newTextSENodule);
    textCommandGroup.addCommand(textCmd);
    const changeTextCmd = new StyleNoduleCommand(
      [newTextSENodule.ref],
      StyleCategory.Label,
      [
        {
          labelDisplayText: submittedText
        }
      ],
      [
        {
          labelDisplayText: ""
        }
      ]
    );
    textCommandGroup.addCommand(changeTextCmd);
    textCommandGroup.execute();
    newTextSENodule.locationVector = this.currentScreenVector;
    // Deactivate the listener once the text is handled
    //this.deactivate();
  }
  // Method to edit existing text
  handleEditInput(data: {
    seText: SEText;
    oldText: string;
    text: string;
    textId: number;
  }): void {
    // console.debug("Replaced Text:", data.text);
    // console.debug("Replaced Text ID in handleEditInput():", data.textId);
    // console.debug("Original Text in handleEditInput():", data.oldText);
    // console.debug("Original seText Value:", data.seText);

    const changeTextCmd = new StyleNoduleCommand(
      [data.seText.ref],
      StyleCategory.Label,
      [
        {
          labelDisplayText: data.text
        }
      ],
      [
        {
          labelDisplayText: data.oldText
        }
      ]
    );
    changeTextCmd.execute();
  }

  
}
