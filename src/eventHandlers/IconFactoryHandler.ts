import { ToolStrategy } from "./ToolStrategy";
import EventBus from "./EventBus";
import SETTINGS from "@/global-settings";
import { Command } from "@/commands/Command";
import FileSaver from "file-saver";

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
    // EventBus.fire("export-current-svg-for-icon", {});

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
    // Chose inverScaleFactor so that
    // const scaleFactor = (width - 32) / (2 * SETTINGS.boundaryCircle.radius); // scale so that there is a 16 pixel boundary from
    // is 1
    const inverseScaleFactorWidth = 2 * SETTINGS.boundaryCircle.radius + 32;
    let  svgBlock = Command.dumpSVG(
      inverseScaleFactorWidth,
      nonScalingOptions,
      animateOptions
    );
    // Now set the properties of the elements
    // Adjust the point radius
    const pointRadiusRegex = /<circle class="pointFront.*r="(\d+\.\d+)/g
    svgBlock = svgBlock.replaceAll(pointRadiusRegex, function (match,x) {return match.replace(/r="\d+\.\d+/g,'r="20')+x.replace(/\d+\.\d+/g,"")})

    // const paragraph = '\<circle class=\"pointFrontStyle0\" cx="-95.55427251732101" cy="-39.11662817551963" r="2.020785219399538" />'

    // Global flag required when calling replaceAll with regex
    //

    // console.log(paragraph.replaceAll(regex, function (match,x) {return match.replace(/r="\d+\.\d+/g,'r="20')+x.replace(/\d+\.\d+/g,"")}));



    let svgBlob = new Blob([svgBlock], { type: "image/svg+xml;charset=utf-8" });

    const urlObject = URL.createObjectURL(svgBlob);
    FileSaver.saveAs(urlObject, "iconXXXPaths.svg");
  }
}
