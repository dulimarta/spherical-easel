import { Command } from "./Command";
import Nodule from "@/plottables/Nodule";
import { StyleOptions, StyleCategory } from "../types/Styles";
import { toSVGType } from "@/types";

export class StyleNoduleCommand extends Command {
  private nodules: Nodule[] = [];
  private panel: StyleCategory;
  private currentStyles: StyleOptions[] = [];
  private pastStyles: StyleOptions[] = [];

  constructor(
    nodules: Nodule[],
    panel: StyleCategory,
    currentStyles: StyleOptions[],
    pastStyles: StyleOptions[]
  ) {
    super();
    console.log("Creating StyleNoduleCommand");
    this.nodules.push(...nodules);
    console.log(
      "Creating - targets ",
      this.nodules.map(nod => nod.name)
    );

    this.panel = panel;
    // Carefully clone so that we create new objects and no pointer from the inputs are carried to the variables of this command

    switch (panel) {
      case 0:
        console.log("Creating - Target Label");
        break;
      case 1:
        console.log("Creating - Target Front");
        break;
      case 2:
        console.log("Creating - Target Back");
        break;
    }

    pastStyles.forEach(obj => {
      console.log("Creating - past", obj);
      this.pastStyles.push({ ...obj });
    });

    currentStyles.forEach(obj => {
      console.log("Creating - current", obj);
      this.currentStyles.push({ ...obj });
    });
  }

  do(): void {
    for (let i = 0; i < this.nodules.length; i++) {
      console.log(
        "CMD- Do effect of StyleNoduleCommand on ",
        this.nodules[i].name,
        "to",
        this.currentStyles[i]
      );
      switch (this.panel) {
        case 0:
          console.log("CMD - Target Label");
          break;
        case 1:
          console.log("CMD - Target Front");
          break;
        case 2:
          console.log("CMD - Target Back");
          break;
      }

      this.nodules[i].updateStyle(this.panel, this.currentStyles[i]);

      // console.debug("new", this.currentStyles[i]);
    }
  }

  saveState(): void {
    this.lastState = 0;
  }

  restoreState(): void {
    for (let i = 0; i < this.nodules.length; i++) {
      console.log(
        "CMD - Restore effect of StyleNoduleCommand on ",
        this.nodules[i].name,
        " to ",
        this.pastStyles[i]
      );
      switch(this.panel){
      case 0:
        console.log("CMD - Target Label")
        break;
      case 1:
        console.log("CMD - Target Front")
        break;
      case 2:
        console.log("CMD - Target Back")
        break;
    }
      this.nodules[i].updateStyle(this.panel, this.pastStyles[i]);
    }
  }

  toOpcode(): null | string | Array<string> {
    return null; // Exclude this command from interpretation
  }
}
