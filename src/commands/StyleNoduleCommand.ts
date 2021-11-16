import { Command } from "./Command";
import Nodule from "@/plottables/Nodule";
import { StyleOptions, StyleEditPanels } from "../types/Styles";

export class StyleNoduleCommand extends Command {
  private nodules: Nodule[] = [];
  private panel: StyleEditPanels;
  private currentStyles: StyleOptions[] = [];
  private pastStyles: StyleOptions[] = [];

  constructor(
    nodules: Nodule[],
    panel: StyleEditPanels,
    currentStyles: StyleOptions[],
    pastStyles: StyleOptions[]
  ) {
    super();
    // console.debug("Creating StyleNoduleCommand");
    this.nodules.push(...nodules);

    this.panel = panel;
    // Carefully clone so that we create new objects and no pointer from the inputs are carried to the variables of this command
    currentStyles.forEach(obj => {
      // console.log("current", obj);
      this.currentStyles.push({ ...obj });
    });
    pastStyles.forEach(obj => {
      // console.log("past", obj);
      this.pastStyles.push({ ...obj });
    });
  }

  do(): void {
    for (let i = 0; i < this.nodules.length; i++) {
      console.debug(
        "Do effect of StyleNoduleCommand on ",
        this.nodules[i],
        "with payload old",
        this.pastStyles[i],
        "new",
        this.currentStyles[i]
      );
      Command.store.changeStyle({
        selected: [this.nodules[i]],
        panel: this.panel,
        payload: {
          ...this.currentStyles[i]
        }
      });
    }
  }

  saveState(): void {
    this.lastState = 0;
  }

  restoreState(): void {
    for (let i = 0; i < this.nodules.length; i++) {
      // console.debug(
      //   "Restore effect of StyleNoduleCommand to ",
      //   this.nodules[i],
      //   "with payload",
      //   this.pastStyles[i]
      // );
      Command.store.changeStyle({
        selected: [this.nodules[i]],
        panel: this.panel,
        payload: {
          ...this.pastStyles[i]
        }
      });
    }
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
