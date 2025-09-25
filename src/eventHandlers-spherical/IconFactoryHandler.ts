import { ToolStrategy } from "./ToolStrategy";
import EventBus from "./EventBus";
import SETTINGS from "@/global-settings";
import { Command } from "@/commands-spherical/Command";
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

    let svgBlock = Command.dumpSVG(
      2 * SETTINGS.boundaryCircle.radius + 32, // doesn't matter for icon SVG
      nonScalingOptions,
      animateOptions,
      true // this is an svg for icon
    );
    // console.log(svgBlock);
    svgBlock = this.modifySVGBlockForIcon(svgBlock);

    let svgBlob = new Blob([svgBlock], { type: "image/svg+xml;charset=utf-8" });

    const urlObject = URL.createObjectURL(svgBlob);
    // this.updateIconPaths(); <--------------------------- uncomment for updating
    FileSaver.saveAs(urlObject, "iconXXXPaths.svg");
  }

  /**
   * Use this when you want to change an icon Attribute in all icon files. This will load a file, run it through
   *  modifySVGBlockForIcon, and then ask you to save it over the right file.
   */
  updateIconPaths(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const zIcons = SETTINGS.icons as Record<string, any>;
    for (let entry in zIcons) {
      if (entry == "polar" || entry == "line") {
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
      nextSymbolAfterNumber: string,
      type: "number" | "color"
    ): RegExp {
      let regExString =
        "(" +
        startOfLine +
        ".+" +
        secondPartBeforeNumber +
        (type == "number"
          ? ")((\\d+.\\d+)|(\\d+))("
          : ")((#......)|(#........))(") +
        nextSymbolAfterNumber +
        ".+)";
      return new RegExp(regExString, "g");
    }

    function createReplaceFunction(
      newValue: string
    ): (
      match: string,
      first: string,
      group1: string,
      group2: string,
      group3: string,
      rest: string
    ) => string {
      return function (
        match: string,
        first: string,
        group2: string,
        group3: string,
        group4: string,
        rest: string
      ): string {
        // console.log(
        //   "#######",
        //   match,
        //   "#",
        //   first,
        //   "#",
        //   group2,
        //   "#",
        //   group3,
        //   "#",
        //   group4,
        //   "#",
        //   rest
        // );
        return first + newValue + rest;
      };
    }

    //[start of the line containing attribute to be modified, end of the part of the line that is before the number, then next symbol after the number, new value]
    const iconAttributes: [
      string,
      string,
      string,
      string,
      "number" | "color"
    ][] = [
      ["boundaryCircleStyle", "stroke-width:", "1.5", ";", "number"],
      ["boundaryCircleStyle", "stroke:", "#000000FF", ";", "color"],
      ['<circle class="pointFront', 'r="', "24.0", '"', "number"],
      ['<circle class="pointFrontStyle3', 'r="', "20.0", '"', "number"], //non-free points
      ["pointFrontStyle", "stroke-width:", "1.5", ";", "number"],
      ["pointBackStyle", "stroke-width:", "1.5", ";", "number"],
      ["pointBackStyle", "stroke:", "#4d4dcb4d", ";", "color"],
      ["pointBackStyle", "fill:", "ff80804d", ";", "color"],
      ['<circle class="pointBack', 'r="', "20.0", '"', "number"],
      ["lineFrontStyle", "stroke-width:", "1.5", ";", "number"],
      ["lineFrontStyle", "stroke:", "#4287f5FF", ";", "color"],
      ["lineBackStyle", "stroke-width:", "1.0", ";", "number"],
      ["lineBackStyle", "stroke:", "#4287f5cc", ";", "color"],
      ["segmentFrontStyle", "stroke-width:", "1.5", ";", "number"],
      ["segmentFrontStyle", "stroke:", "#4287f5FF", ";", "color"],
      ["segmentBackStyle", "stroke-width:", "1.5", ";", "number"],
      ["segmentBackStyle", "stroke:", "#4287f54d", ";", "color"],
      ["circleFrontStyle", "stroke-width:", "1.5", ";", "number"],
      ["circleFrontStyle", "stroke:", "#4287f5FF", ";", "color"],
      ["ellipseFrontStyle", "stroke-width:", "1.5", ";", "number"],
      ["ellipseFrontStyle", "stroke:", "#4287f5FF", ";", "color"]
    ];

    //.pointBackStyle0 { fill:#EFCFCF; stroke:#B4B4D7; stroke-width:2; vector-effect: non-scaling-stroke;}

    let svgBlock = svgString;
    iconAttributes.forEach(attribute => {
      const replaceFunc = createReplaceFunction(attribute[2]);
      const myRegEx = regEx(
        attribute[0],
        attribute[1],
        attribute[3],
        attribute[4]
      );
      // console.log(
      //   myRegEx,
      //   attribute[0],
      //   attribute[1],
      //   attribute[2],
      //   attribute[3],
      //   attribute[4]
      // );
      svgBlock = svgBlock.replaceAll(myRegEx, replaceFunc);
    });

    return svgBlock;
  }
  // THESE ARE THE OLD ATTRIBUTES
  // static icons = {
  //   boundaryCircle: {
  //     strokeWidth: 1.5,
  //     color: "#000000FF"
  //   },
  //   // These are the detail of how the icon parts (points, lines, circles, etc.) are drawn when emphasized
  //   emphasize: {
  //     angleMarker: {
  //       strokeWidth: {
  //         front: 2.5,
  //         back: 2.5
  //       },
  //       edgeColor: {
  //         front: "#000000FF",
  //         back: "#0000004d"
  //       },
  //       fillColor: {
  //         front: "#d8ccffff",
  //         back: "#ff2b00ff"
  //       }
  //     },
  //     circle: {
  //       strokeWidth: {
  //         front: 1,
  //         back: 1
  //       },
  //       edgeColor: { front: "#000000FF", back: "#000000FF" },
  //       fillColor: {
  //         front: "#ff8080FF",
  //         back: "#ff8080FF"
  //       }
  //     },
  //     ellipse: {
  //       strokeWidth: {
  //         front: 1,
  //         back: 1
  //       },
  //       edgeColor: { front: "#000000FF", back: "#000000FF" },
  //       fillColor: {
  //         front: "#ff8080FF",
  //         back: "#ff8080FF"
  //       }
  //     },
  //     point: {
  //       strokeWidth: {
  //         front: 0.7,
  //         back: 0.7
  //       },
  //       edgeColor: { front: "#000000FF", back: "#000000FF" },
  //       fillColor: {
  //         front: "#ff8080FF",
  //         back: "#ff8080FF"
  //       }
  //     },
  //     line: {
  //       strokeWidth: {
  //         front: 1.5,
  //         back: 1.5
  //       },
  //       edgeColor: {
  //         front: "#4287f5ff",
  //         back: "#9ec1faff"
  //       }
  //     },
  //     segment: {
  //       strokeWidth: {
  //         front: 1.5,
  //         back: 1.5
  //       },
  //       edgeColor: {
  //         front: "#4287f5ff",
  //         back: "#9ec1faff"
  //       }
  //     }
  //   },
  //   // These are the detail of how the icon parts (points, lines, circles, etc.) are drawn when not emphasized
  //   normal: {
  //     angle: {
  //       scale: {
  //         front: 7,
  //         back: 5
  //       },
  //       strokeWidth: {
  //         front: 1,
  //         back: 1
  //       },
  //       edgeColor: {
  //         front: "#666666ff",
  //         back: "#999999ff"
  //       },
  //       fillColor: {
  //         front: "#e6e6e666",
  //         back: "#ffffff33"
  //       }
  //     },
  //     circle: {
  //       strokeWidth: {
  //         front: 1,
  //         back: 1
  //       },
  //       edgeColor: {
  //         front: "#666666ff",
  //         back: "#999999ff"
  //       },
  //       fillColor: {
  //         front: "#e6e6e666",
  //         back: "#ffffff33"
  //       }
  //     },
  //     ellipse: {
  //       strokeWidth: {
  //         front: 1,
  //         back: 1
  //       },
  //       edgeColor: {
  //         front: "#666666ff",
  //         back: "#999999ff"
  //       },
  //       fillColor: {
  //         front: "#e6e6e666",
  //         back: "#ffffff33"
  //       }
  //     },
  //     point: {
  //       scale: {
  //         front: 7,
  //         back: 9
  //       },
  //       strokeWidth: {
  //         front: 0.8,
  //         back: 0.7
  //       },
  //       edgeColor: {
  //         front: "#666666ff",
  //         back: "#999999ff"
  //       },
  //       fillColor: {
  //         front: "#e6e6e6ff",
  //         back: "#ffffffff"
  //       }
  //     },
  //     line: {
  //       strokeWidth: {
  //         front: 1,
  //         back: 1
  //       },
  //       edgeColor: {
  //         front: "#666666ff",
  //         back: "#999999ff"
  //       }
  //     },
  //     segment: {
  //       strokeWidth: {
  //         front: 1,
  //         back: 1
  //       },
  //       edgeColor: {
  //         front: "#666666ff",
  //         back: "#999999ff"
  //       }
  //     }
  //   }
  // };
}
