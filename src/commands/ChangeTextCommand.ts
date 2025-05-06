import { Command } from "./Command";
import { SEText } from "@/models/SEText";

export class ChangeTextCommand extends Command {
  private seText: SEText;
  private oldText: string;
  private newText: string;

  constructor(seText: SEText, oldText: string, newText: string) {
    super();
    this.seText = seText;
    this.oldText = oldText;
    this.newText = newText;

    console.log(`Old Text = ${oldText}`);
    console.log(`New Text = ${newText}`);
  }
  do(): void {
    this.seText.text = this.newText;
    Command.store.changeText({
      textId: this.seText.id,
      newText: this.newText
    }); // Apply new text
    this.seText.shallowUpdate();
  }

  saveState(): void {
    this.lastState = this.seText.id;
  }

  restoreState(): void {
    this.seText.text = this.oldText; // Restore old text
    Command.store.changeText({
      textId: this.seText.id,
      newText: this.oldText
    }); // Apply the restoration
    this.seText.shallowUpdate(); // Ensure the visual state is refreshed
  }

  toOpcode(): null | string | Array<string> {
    // This doesn't need to be implemented because the latest version of the text will be saved in the
    return null;
  }
}
