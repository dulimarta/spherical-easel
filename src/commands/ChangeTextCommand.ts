import { Command } from "./Command";
import { SEText } from "@/models/SEText";

export class ChangeTextCommand extends Command {
    private seText: SEText;
    private oldText: string;
    private newText: string;

    constructor(
        seText: SEText,
        oldText: string,
        newText: string
      ) {
        super();
        this.seText = seText;
        this.oldText = oldText;
        this.newText = newText;

        console.log(`Old Text = ${oldText}`);
        console.log(`New Text = ${newText}`);
      }

    restoreState(): void {
        this.seText.setText(this.oldText); // Restore old text
        Command.store.changeText({
            textId: this.seText.id,
            newText: this.oldText
          }); // Apply the restoration
        this.seText.shallowUpdate(); // Ensure the visual state is refreshed
    }
    saveState(): void {
        this.lastState = this.seText.id;
    }

    do(): void {
        this.seText.setText(this.newText)
        Command.store.changeText({
            textId: this.seText.id,
            newText: this.newText
          }); // Apply new text
        this.seText.shallowUpdate();
    }

    toOpcode(): null | string | Array<string> {
        return null;
    }

}