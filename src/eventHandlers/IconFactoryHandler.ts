import { ToolStrategy } from "./ToolStrategy";
import EventBus from "./EventBus";
import SETTINGS from "@/global-settings";
import { Command } from "@/commands/Command";
import FileSaver from "file-saver";
import axios from "axios";
import { IconNames } from "@/types";

export default class IconFactoryHandler implements ToolStrategy {
  constructor() {
    // No code
  }

  mousePressed(event: MouseEvent): void {
    // No code
  }

  mouseMoved(event: MouseEvent): void {
    // No code
  }

  mouseReleased(event: MouseEvent): void {
    // No code
  }

  mouseLeave(event: MouseEvent): void {
    // No code
  }

  activate(): void {
    // No code
  }

  deactivate(): void {
    // No code
  }
  createIconPaths(): void {
    const nonScalingOptions = {
      stroke: true,
      text: true,
      pointRadius: true,
      scaleFactor: 1
    };

    const animateOptions = undefined;
    // {
    //   axis: new Vector3(),
    //   degrees: Math.PI / 8,
    //   duration: 0.25, // in seconds
    //   frames: 30,
    //   repeat: 1
    // };

    // Chose inverseScaleFactor so that
    // const scaleFactor = (width - 32) / (2 * SETTINGS.boundaryCircle.radius); // scale so that there is a 16 pixel boundary from
    // is 1
    const inverseScaleFactorWidth = 2 * SETTINGS.boundaryCircle.radius + 32;
    let svgBlock = Command.dumpSVG(
      inverseScaleFactorWidth,
      nonScalingOptions,
      animateOptions
    );
    svgBlock = this.modifySVGBlockForIcon(svgBlock);

    let svgBlob = new Blob([svgBlock], { type: "image/svg+xml;charset=utf-8" });

    const urlObject = URL.createObjectURL(svgBlob);
   // this.updateIconPaths();
    FileSaver.saveAs(urlObject, "iconXXXPaths.svg");
  }

  updateIconPaths(): void {
    const zIcons = SETTINGS.icons as Record<string, any>;
    for (let entry in zIcons) {
      if (zIcons[entry].props != undefined) {
        let svgFileName = zIcons[entry].props.svgFileName;
        if (svgFileName != "") {
          let filePath = "../../icons/" + svgFileName;
          axios.get(filePath, { responseType: "text" }).then(r => {
            let svgSnippetRaw = r.data;
            svgSnippetRaw = this.modifySVGBlockForIcon(svgSnippetRaw);
            let svgBlob = new Blob([svgSnippetRaw], {
              type: "image/svg+xml;charset=utf-8"
            });
            const urlObject = URL.createObjectURL(svgBlob);
            FileSaver.saveAs(urlObject, svgFileName);
          });
        }
      }
    }
  }
  /**
   * Creates a regular expression that looks for firstPart followed by any characters (except new line) ending with secondPart
   * followed be a decimal or integer followed by the rest of the line
   * @param svgString
   * @returns
   */
  modifySVGBlockForIcon(svgString: string): string {
    function regEx(
      startOfLine: string,
      secondPartBeforeNumber: string,
      nextSymbolAfterNumber: string
    ): RegExp {
      let regExString =
        "(" +
        startOfLine +
        ".+" +
        secondPartBeforeNumber +
        ")((\\d+.\\d+)|\\d+)(" +
        nextSymbolAfterNumber +
        ".+)";
      return new RegExp(regExString, "g");
    }

    function createReplaceFunction(
      newValue: string
    ): (
      match: string,
      first: string,
      numberV1: string,
      numberV2: string,
      rest: string
    ) => string {
      return function (
        match: string,
        first: string,
        numberV1: string,
        numberV2: string,
        rest: string
      ): string {
        console.log(first, rest);
        return first + newValue + rest;
      };
    }

    //[start of the line containing attribute to be modified, end of the part of the line that is before the number, then next symbol after the number, new value]
    const iconAttributes = [
      ['<circle class="pointFront', 'r="', '"', "4.0"],
      [".pointFrontStyle", "stroke-width:", ";", "1.5"],
      [".boundaryCircleStyle", "stroke-width:", ";", "3.5"]
    ];
    let svgBlock = svgString;
    iconAttributes.forEach(attribute => {
      const replaceFunc = createReplaceFunction(attribute[3]);
      const myRegEx = regEx(attribute[0], attribute[1], attribute[2]);
      svgBlock = svgBlock.replaceAll(myRegEx, replaceFunc);
    });

    return svgBlock;
  }
}
