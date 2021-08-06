<template>
  <svg xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid meet"
    transform="matrix(1 0 0 -1 0 0)"
    viewBox="-250 -250 500 500"
    :aria-labelledby="iconName"
    role="presentation"
    style="overflow: visible"
    vector-effect="non-scaling-stroke">
    <g v-html="svgSnippetAmended">
    </g>
  </svg>
</template>

<script lang="ts">
import axios from "axios";
import { Prop, Component, Vue } from "vue-property-decorator";
import SETTINGS from "@/global-settings";
import Nodule from "@/plottables/Nodule";

@Component({})
export default class IconBase extends Vue {
  @Prop() readonly iconName?: string;
  @Prop() readonly iconFile!: string;
  @Prop() readonly emphasizeTypes!: string[][];

  private svgSnippetRaw = "";
  private svgSnippetAmended = "";
  private doneFetching = false;

  mounted(): void {
    // console.log("App location", window.location);
    let filePath: string;
    // Failed attempt to load from current directory
    if (this.iconFile.startsWith(".") || this.iconFile.startsWith("/")) {
      filePath = this.iconFile;
    } else {
      filePath = "/" + this.iconFile;
    }
    this.doneFetching = false;
    // By default, axios assumes a JSON response and the input will be parsed as JSON.
    // We want to override it to "text"
    axios.get(filePath, { responseType: "text" }).then(r => {
      this.svgSnippetRaw = r.data;
      this.doneFetching = true;
      const parts = this.svgSnippetRaw.split(";");
      // scale the angleMarkers fill and circular edge
      // the angle markers fill object contains the center of the dialation
      // then the d="M -75.437 -26.553... gives the center of the dialation
      // so the new translation vector is [-75.437*(1-scale),-26.553*(1-scale)]
      // const ind = parts.findIndex(ele => {
      //   const type = this.getAttribute(ele, "type");
      //   const fill = this.getAttribute(ele, "myfill");
      //   // console.log("check", type, fill);
      //   if (type === "angleMarker" && fill === "true") {
      //     return true;
      //   } else {
      //     return false;
      //   }
      // });

      // if (ind !== -1) {
      //   // there is an angleMarker fill path
      //   const vals = this.getAttribute(parts[ind], "d")?.split(" ") ?? [];
      //   if (vals.length === 0) {
      //     throw new Error(
      //       `IconBase - Undefined d path attribute in ${parts[ind]}.`
      //     );
      //   }
      // console.log("scale angle marker", vals[1], vals[2]);
      // vals[1] and vals[2] contain the center of the dilation, scale *all* anglemarker parts (both circle edge and fill)
      parts.forEach((svgString, index) => {
        if (index === 0) return; // do nothing to the <defn>...</defn> string
        const type = this.getAttribute(svgString, "type");
        const side = this.getAttribute(svgString, "side");
        const fill = this.getAttribute(svgString, "myfill");

        if (fill === "true" && type === "angleMarker") {
          const vals = this.getAttribute(svgString, "d")?.split(" ") ?? [];
          if (vals.length === 0) {
            throw new Error(
              `IconBase - Undefined d path attribute in ${svgString}.`
            );
          }
          // this is part of an angleMarker and the previous part is the edge of the fill so
          if (side === "front") {
            // this angleMarker is on the front
            parts[index] = this.setAttribute(
              parts[index],
              "transform",
              this.setTransformationScale(
                this.getAttribute(parts[index], "transform") ?? "",
                SETTINGS.icons.angleMarker.scale.front,
                Number(vals[1]) * (1 - SETTINGS.icons.angleMarker.scale.front),
                Number(vals[2]) * (1 - SETTINGS.icons.angleMarker.scale.front)
              )
            );
            parts[index - 1] = this.setAttribute(
              parts[index - 1],
              "transform",
              this.setTransformationScale(
                this.getAttribute(parts[index - 1], "transform") ?? "",
                SETTINGS.icons.angleMarker.scale.front,
                Number(vals[1]) * (1 - SETTINGS.icons.angleMarker.scale.front),
                Number(vals[2]) * (1 - SETTINGS.icons.angleMarker.scale.front)
              )
            );
          } else {
            //this angleMarker is on the back
            parts[index] = this.setAttribute(
              parts[index],
              "transform",
              this.setTransformationScale(
                this.getAttribute(parts[index], "transform") ?? "",
                SETTINGS.icons.angleMarker.scale.front,
                Number(vals[1]) * (1 - SETTINGS.icons.angleMarker.scale.back),
                Number(vals[2]) * (1 - SETTINGS.icons.angleMarker.scale.back)
              )
            );
            parts[index - 1] = this.setAttribute(
              parts[index - 1],
              "transform",
              this.setTransformationScale(
                this.getAttribute(parts[index - 1], "transform") ?? "",
                SETTINGS.icons.angleMarker.scale.front,
                Number(vals[1]) * (1 - SETTINGS.icons.angleMarker.scale.back),
                Number(vals[2]) * (1 - SETTINGS.icons.angleMarker.scale.back)
              )
            );
          }
        }
      });
      // }
      parts.forEach((svgString, index) => {
        if (index === 0) return; // do nothing to the <defn>...</defn> string
        parts[index] = this.amendAttributes(parts[index]);
        // Remove the four added attributes, type, side, fill, and part
        parts[index] = this.removeAttribute(parts[index], "type");
        parts[index] = this.removeAttribute(parts[index], "side");
        parts[index] = this.removeAttribute(parts[index], "myfill");
        parts[index] = this.removeAttribute(parts[index], "part");
      });
      this.svgSnippetAmended = parts.join(" ");
    });
  }

  /**Blah abl */
  amendAttributes(svgPathString: string): string {
    const type = this.getAttribute(svgPathString, "type");
    if (type === undefined) {
      throw new Error(
        `IconBase - amendAttributes ${svgPathString} has no attribute type`
      );
    }
    const side = this.getAttribute(svgPathString, "side");
    if (side === undefined) {
      throw new Error(
        `IconBase - amendAttributes ${svgPathString} has no attribute side`
      );
    }
    const fill = this.getAttribute(svgPathString, "myfill");
    if (fill === undefined) {
      throw new Error(
        `IconBase - amendAttributes ${svgPathString} has no attribute fill`
      );
    }

    // console.log(this.getAttribute(svgPathString, "id"));
    // console.log(Nodule.idPlottableDescriptionMap);

    let newStrokeColor;
    let newStrokeWidth;
    let newFillColor;

    switch (type) {
      case "boundaryCircle": // The boundary circle
        svgPathString = this.setAttribute(
          svgPathString,
          "stroke-width",
          SETTINGS.icons.boundaryCircle.strokeWidth.toString()
        );
        svgPathString = this.setAttribute(
          svgPathString,
          "stroke",
          SETTINGS.icons.boundaryCircle.color
        );
        break;
      case "angleMarker":
        if (
          // make sure that we only apply the stroke width/color to the non-fill parts
          fill === "false"
          // Number(this.getAttribute(svgPathString, "id")!.slice(-2)) < 11
        ) {
          newStrokeWidth = this.getStrokeWidth(
            "angleMarker",
            this.emphasizeTypes,
            side
          );
          newStrokeColor = this.getStrokeColor(
            "angleMarker",
            this.emphasizeTypes,
            side
          );
          svgPathString = this.setAttribute(
            svgPathString,
            "stroke-width",
            newStrokeWidth
          );
          svgPathString = this.setAttribute(
            svgPathString,
            "stroke",
            newStrokeColor
          );
        } else {
          //now consider the fill objects
          newFillColor = this.getFillColor(
            "angleMarker",
            this.emphasizeTypes,
            side
          );
          svgPathString = this.setAttribute(
            svgPathString,
            "fill",
            newFillColor
          );
        }
        break;
      case "circle": //Circles
        // the fill object has an undefined stroke and shouldn't be changed (unless you want to destroy the gradient)
        if (this.getAttribute(svgPathString, "stroke") !== "undefined") {
          newStrokeWidth = this.getStrokeWidth(
            "circle",
            this.emphasizeTypes,
            side
          );
          newStrokeColor = this.getStrokeColor(
            "circle",
            this.emphasizeTypes,
            side
          );
          svgPathString = this.setAttribute(
            svgPathString,
            "stroke-width",
            newStrokeWidth
          );
          svgPathString = this.setAttribute(
            svgPathString,
            "stroke",
            newStrokeColor
          );
        } else {
          //now consider the fill objects
          newFillColor = this.getFillColor("circle", this.emphasizeTypes, side);
          if (newFillColor !== "") {
            // The fill object is not emphasized
            svgPathString = this.setAttribute(
              svgPathString,
              "fill",
              newFillColor
            );
          }
        }
        break;
      case "line": //Lines
        newStrokeWidth = this.getStrokeWidth("line", this.emphasizeTypes, side);
        newStrokeColor = this.getStrokeColor("line", this.emphasizeTypes, side);
        svgPathString = this.setAttribute(
          svgPathString,
          "stroke-width",
          newStrokeWidth
        );
        svgPathString = this.setAttribute(
          svgPathString,
          "stroke",
          newStrokeColor
        );
        break;
      case "point": //Points
        newStrokeWidth = this.getStrokeWidth(
          "point",
          this.emphasizeTypes,
          side
        );
        newStrokeColor = this.getStrokeColor(
          "point",
          this.emphasizeTypes,
          side
        );
        newFillColor = this.getFillColor("point", this.emphasizeTypes, side);
        svgPathString = this.setAttribute(
          svgPathString,
          "stroke-width",
          newStrokeWidth
        );
        svgPathString = this.setAttribute(
          svgPathString,
          "stroke",
          newStrokeColor
        );
        svgPathString = this.setAttribute(svgPathString, "fill", newFillColor);
        svgPathString = this.setAttribute(
          svgPathString,
          "transform",
          this.setTransformationScale(
            this.getAttribute(svgPathString, "transform") ?? "",
            side === "back"
              ? SETTINGS.icons.point.scale.back
              : SETTINGS.icons.point.scale.front
          )
        );
        break;
      case "segment": //Segments
        newStrokeWidth = this.getStrokeWidth(
          "segment",
          this.emphasizeTypes,
          side
        );
        newStrokeColor = this.getStrokeColor(
          "segment",
          this.emphasizeTypes,
          side
        );
        svgPathString = this.setAttribute(
          svgPathString,
          "stroke-width",
          newStrokeWidth
        );
        svgPathString = this.setAttribute(
          svgPathString,
          "stroke",
          newStrokeColor
        );
        break;

      case "ellipse": //Ellipses
        // the fill object has an undefined stroke and shouldn't be changed (unless you want to destroy the gradient)
        if (this.getAttribute(svgPathString, "stroke") !== "undefined") {
          newStrokeWidth = this.getStrokeWidth(
            "ellipse",
            this.emphasizeTypes,
            side
          );
          newStrokeColor = this.getStrokeColor(
            "ellipse",
            this.emphasizeTypes,
            side
          );
          svgPathString = this.setAttribute(
            svgPathString,
            "stroke-width",
            newStrokeWidth
          );
          svgPathString = this.setAttribute(
            svgPathString,
            "stroke",
            newStrokeColor
          );
        } else {
          //now consider the fill objects
          newFillColor = this.getFillColor(
            "ellipse",
            this.emphasizeTypes,
            side
          );
          if (newFillColor !== "") {
            // The fill object is not emphasized
            svgPathString = this.setAttribute(
              svgPathString,
              "fill",
              newFillColor
            );
          }
        }
        break;
    }
    return svgPathString;
  }

  getAttribute(
    svgPathString: string,
    attributeString: string
  ): string | undefined {
    const attributeIndex = svgPathString.indexOf(attributeString + "=");
    if (attributeIndex === -1) {
      return undefined;
    }
    const startIndex = attributeIndex + attributeString.length + 2;
    const endIndex = svgPathString.indexOf('"', startIndex);
    return svgPathString.slice(startIndex, endIndex);
  }

  setAttribute(
    svgPathString: string,
    attributeString: string,
    newAttributeValueString: string
  ): string {
    const attributeIndex = svgPathString.indexOf(attributeString + "=");
    if (attributeIndex === -1) {
      return svgPathString; // no changes if the attrribute is not already there
    }
    const startIndex = attributeIndex + attributeString.length + 2;
    const endIndex = svgPathString.indexOf('"', startIndex);
    const firstPart = svgPathString.slice(0, startIndex);
    const endPart = svgPathString.slice(endIndex);
    return firstPart + newAttributeValueString + endPart;
  }

  removeAttribute(svgPathString: string, attributeString: string): string {
    const attributeIndex = svgPathString.indexOf(attributeString + "=");
    if (attributeIndex === -1) {
      return svgPathString; // no changes if the attrribute is not already there
    }
    const startIndex = attributeIndex + attributeString.length + 2;
    const endIndex = svgPathString.indexOf('"', startIndex);
    const firstPart = svgPathString.slice(0, startIndex);
    const endPart = svgPathString.slice(endIndex);
    return firstPart + endPart;
  }
  /** Change matrices like
   * "matrix(0.595 0 0 0.595 114.678 27.373)"
   * to
   * "matrix(newScale 0 0 newScale xTranslate|114.678 yTranslate|27.373)"
   */
  setTransformationScale(
    oldTransformMatrix: string,
    newScale: number,
    xTranslate?: number,
    yTranslate?: number
  ): string {
    if (oldTransformMatrix === "") {
      throw new Error(
        `IconBase - Error in Set Transform Scale. Undefined SVG tansform matrix`
      );
    }
    const vals = oldTransformMatrix
      .slice(7, oldTransformMatrix.length - 1)
      .split(" ")
      .map(x => Number(x));
    if (xTranslate !== undefined) {
      vals[4] = xTranslate;
    }
    if (yTranslate !== undefined) {
      vals[5] = yTranslate;
    }
    return (
      "matrix(" +
      newScale * Math.sign(vals[0]) +
      " 0 0 " +
      newScale * Math.sign(vals[3]) +
      " " +
      vals[4] +
      " " +
      vals[5] +
      ")"
    );
  }

  getStrokeWidth(
    objectType: string,
    emph: string[][],
    backFront: string
  ): string {
    let ind: number;
    switch (objectType) {
      case "point":
        ind = emph.findIndex(strArray => {
          return strArray[0] === "point";
        });
        if (ind === -1) {
          // This object is not emphasized
          if (backFront === "back") {
            return SETTINGS.icons.point.strokeWidth.back.toString();
          } else {
            return SETTINGS.icons.point.strokeWidth.front.toString();
          }
        } else {
          if (backFront === "back") {
            if (emph[ind].indexOf("back") !== -1) {
              // The back side of the object is emphasized
              return SETTINGS.icons.emphasize.point.strokeWidth.back.toString();
            } else {
              return SETTINGS.icons.point.strokeWidth.back.toString();
            }
          } else {
            if (emph[ind].indexOf("front") !== -1) {
              // The front side of the object is emphasized
              return SETTINGS.icons.emphasize.point.strokeWidth.front.toString();
            } else {
              return SETTINGS.icons.point.strokeWidth.front.toString();
            }
          }
        }
      case "line":
        ind = emph.findIndex(strArray => {
          return strArray[0] === "line";
        });
        if (ind === -1) {
          // This object is not emphasized
          if (backFront === "back") {
            return SETTINGS.icons.line.strokeWidth.back.toString();
          } else {
            return SETTINGS.icons.line.strokeWidth.front.toString();
          }
        } else {
          if (backFront === "back") {
            if (emph[ind].indexOf("back") !== -1) {
              // The back side of the object is emphasized
              return SETTINGS.icons.emphasize.line.strokeWidth.back.toString();
            } else {
              return SETTINGS.icons.line.strokeWidth.back.toString();
            }
          } else {
            if (emph[ind].indexOf("front") !== -1) {
              // The front side of the object is emphasized
              return SETTINGS.icons.emphasize.line.strokeWidth.front.toString();
            } else {
              return SETTINGS.icons.line.strokeWidth.front.toString();
            }
          }
        }
      case "segment":
        ind = emph.findIndex(strArray => {
          return strArray[0] === "segment";
        });
        if (ind === -1) {
          // This object is not emphasized
          if (backFront === "back" || backFront === "03") {
            return SETTINGS.icons.segment.strokeWidth.back.toString();
          } else {
            return SETTINGS.icons.segment.strokeWidth.front.toString();
          }
        } else {
          if (backFront === "back" || backFront === "03") {
            if (emph[ind].indexOf("back") !== -1) {
              // The back side of the object is emphasized
              return SETTINGS.icons.emphasize.segment.strokeWidth.back.toString();
            } else {
              return SETTINGS.icons.segment.strokeWidth.back.toString();
            }
          } else {
            if (emph[ind].indexOf("front") !== -1) {
              // The front side of the object is emphasized
              return SETTINGS.icons.emphasize.segment.strokeWidth.front.toString();
            } else {
              return SETTINGS.icons.segment.strokeWidth.front.toString();
            }
          }
        }
      case "circle":
        ind = emph.findIndex(strArray => {
          return strArray[0] === "circle";
        });
        if (ind === -1) {
          // This object is not emphasized
          if (backFront === "back") {
            return SETTINGS.icons.circle.strokeWidth.back.toString();
          } else {
            return SETTINGS.icons.circle.strokeWidth.front.toString();
          }
        } else {
          if (backFront === "back") {
            if (emph[ind].indexOf("back") !== -1) {
              // The back side of the object is emphasized
              return SETTINGS.icons.emphasize.circle.strokeWidth.back.toString();
            } else {
              return SETTINGS.icons.circle.strokeWidth.back.toString();
            }
          } else {
            if (emph[ind].indexOf("front") !== -1) {
              // The front side of the object is emphasized
              return SETTINGS.icons.emphasize.circle.strokeWidth.front.toString();
            } else {
              return SETTINGS.icons.circle.strokeWidth.front.toString();
            }
          }
        }
      case "angleMarker":
        ind = emph.findIndex(strArray => {
          return strArray[0] === "angleMarker";
        });
        if (ind === -1) {
          // This object is not emphasized
          if (backFront === "back") {
            return SETTINGS.icons.angleMarker.strokeWidth.back.toString();
          } else {
            return SETTINGS.icons.angleMarker.strokeWidth.front.toString();
          }
        } else {
          if (backFront === "back") {
            if (emph[ind].indexOf("back") !== -1) {
              // The back side of the object is emphasized
              return SETTINGS.icons.emphasize.angleMarker.strokeWidth.back.toString();
            } else {
              return SETTINGS.icons.angleMarker.strokeWidth.back.toString();
            }
          } else {
            if (emph[ind].indexOf("front") !== -1) {
              // The front side of the object is emphasized
              return SETTINGS.icons.emphasize.angleMarker.strokeWidth.front.toString();
            } else {
              return SETTINGS.icons.angleMarker.strokeWidth.front.toString();
            }
          }
        }
      case "ellipse":
        ind = emph.findIndex(strArray => {
          return strArray[0] === "ellipse";
        });
        if (ind === -1) {
          // This object is not emphasized
          if (backFront === "back") {
            return SETTINGS.icons.ellipse.strokeWidth.back.toString();
          } else {
            return SETTINGS.icons.ellipse.strokeWidth.front.toString();
          }
        } else {
          if (backFront === "back") {
            if (emph[ind].indexOf("back") !== -1) {
              // The back side of the object is emphasized
              return SETTINGS.icons.emphasize.ellipse.strokeWidth.back.toString();
            } else {
              return SETTINGS.icons.ellipse.strokeWidth.back.toString();
            }
          } else {
            if (emph[ind].indexOf("front") !== -1) {
              // The front side of the object is emphasized
              return SETTINGS.icons.emphasize.ellipse.strokeWidth.front.toString();
            } else {
              return SETTINGS.icons.ellipse.strokeWidth.front.toString();
            }
          }
        }
    }
    return "1";
  }

  getStrokeColor(
    objectType: string,
    emph: string[][],
    backFront: string
  ): string {
    let ind: number;
    switch (objectType) {
      case "point":
        ind = emph.findIndex(strArray => {
          return strArray[0] === "point";
        });
        if (ind === -1) {
          // This object is not emphasized
          if (backFront === "back") {
            return SETTINGS.icons.point.edgeColor.back;
          } else {
            return SETTINGS.icons.point.edgeColor.front;
          }
        } else {
          if (backFront === "back") {
            if (emph[ind].indexOf("back") !== -1) {
              // The back side of the object is emphasized
              return SETTINGS.icons.emphasize.point.edgeColor.back;
            } else {
              return SETTINGS.icons.point.edgeColor.back;
            }
          } else {
            if (emph[ind].indexOf("front") !== -1) {
              // The front side of the object is emphasized
              return SETTINGS.icons.emphasize.point.edgeColor.front;
            } else {
              return SETTINGS.icons.point.edgeColor.front;
            }
          }
        }
      case "line":
        ind = emph.findIndex(strArray => {
          return strArray[0] === "line";
        });
        if (ind === -1) {
          // This object is not emphasized
          if (backFront === "back") {
            return SETTINGS.icons.line.edgeColor.back;
          } else {
            return SETTINGS.icons.line.edgeColor.front;
          }
        } else {
          if (backFront === "back") {
            if (emph[ind].indexOf("back") !== -1) {
              // The back side of the object is emphasized
              return SETTINGS.icons.emphasize.line.edgeColor.back;
            } else {
              return SETTINGS.icons.line.edgeColor.back;
            }
          } else {
            if (emph[ind].indexOf("front") !== -1) {
              // The front side of the object is emphasized
              return SETTINGS.icons.emphasize.line.edgeColor.front;
            } else {
              return SETTINGS.icons.line.edgeColor.front;
            }
          }
        }
      case "segment":
        ind = emph.findIndex(strArray => {
          return strArray[0] === "segment";
        });
        if (ind === -1) {
          // This object is not emphasized
          if (backFront === "back" || backFront === "03") {
            return SETTINGS.icons.segment.edgeColor.back;
          } else {
            return SETTINGS.icons.segment.edgeColor.front;
          }
        } else {
          if (backFront === "back" || backFront === "03") {
            if (emph[ind].indexOf("back") !== -1) {
              // The back side of the object is emphasized
              return SETTINGS.icons.emphasize.segment.edgeColor.back;
            } else {
              return SETTINGS.icons.segment.edgeColor.back;
            }
          } else {
            if (emph[ind].indexOf("front") !== -1) {
              // The front side of the object is emphasized
              return SETTINGS.icons.emphasize.segment.edgeColor.front;
            } else {
              return SETTINGS.icons.segment.edgeColor.front;
            }
          }
        }
      case "circle":
        ind = emph.findIndex(strArray => {
          return strArray[0] === "circle";
        });
        if (ind === -1) {
          // This object is not emphasized
          if (backFront === "back") {
            return SETTINGS.icons.circle.edgeColor.back;
          } else {
            return SETTINGS.icons.circle.edgeColor.front;
          }
        } else {
          if (backFront === "back") {
            if (emph[ind].indexOf("back") !== -1) {
              // The back side of the object is emphasized
              return SETTINGS.icons.emphasize.circle.edgeColor.back;
            } else {
              return SETTINGS.icons.circle.edgeColor.back;
            }
          } else {
            if (emph[ind].indexOf("front") !== -1) {
              // The front side of the object is emphasized
              return SETTINGS.icons.emphasize.circle.edgeColor.front;
            } else {
              return SETTINGS.icons.circle.edgeColor.front;
            }
          }
        }
      case "angleMarker":
        ind = emph.findIndex(strArray => {
          return strArray[0] === "angleMarker";
        });
        if (ind === -1) {
          // This object is not emphasized
          if (backFront === "back") {
            return SETTINGS.icons.angleMarker.edgeColor.back;
          } else {
            return SETTINGS.icons.angleMarker.edgeColor.front;
          }
        } else {
          if (backFront === "back") {
            if (emph[ind].indexOf("back") !== -1) {
              // The back side of the object is emphasized
              return SETTINGS.icons.emphasize.angleMarker.edgeColor.back;
            } else {
              return SETTINGS.icons.angleMarker.edgeColor.back;
            }
          } else {
            if (emph[ind].indexOf("front") !== -1) {
              // The front side of the object is emphasized
              return SETTINGS.icons.emphasize.angleMarker.edgeColor.front;
            } else {
              return SETTINGS.icons.angleMarker.edgeColor.front;
            }
          }
        }
      case "ellipse":
        ind = emph.findIndex(strArray => {
          return strArray[0] === "ellipse";
        });
        if (ind === -1) {
          // This object is not emphasized
          if (backFront === "back") {
            return SETTINGS.icons.ellipse.edgeColor.back;
          } else {
            return SETTINGS.icons.ellipse.edgeColor.front;
          }
        } else {
          if (backFront === "back") {
            if (emph[ind].indexOf("back") !== -1) {
              // The back side of the object is emphasized
              return SETTINGS.icons.emphasize.ellipse.edgeColor.back;
            } else {
              return SETTINGS.icons.ellipse.edgeColor.back;
            }
          } else {
            if (emph[ind].indexOf("front") !== -1) {
              // The front side of the object is emphasized
              return SETTINGS.icons.emphasize.ellipse.edgeColor.front;
            } else {
              return SETTINGS.icons.ellipse.edgeColor.front;
            }
          }
        }
    }
    return "hsla(0, 0%, 0%, 1)";
  }

  getFillColor(
    objectType: string,
    emph: string[][],
    backFront: string
  ): string {
    let ind: number;
    switch (objectType) {
      case "point":
        ind = emph.findIndex(strArray => {
          return strArray[0] === "point";
        });
        if (ind === -1) {
          // This object is not emphasized
          if (backFront === "back") {
            return SETTINGS.icons.point.fillColor.back;
          } else {
            return SETTINGS.icons.point.fillColor.front;
          }
        } else {
          if (backFront === "back") {
            if (emph[ind].indexOf("back") !== -1) {
              // The back side of the object is emphasized
              return SETTINGS.icons.emphasize.point.fillColor.back;
            } else {
              return SETTINGS.icons.point.fillColor.back;
            }
          } else {
            if (emph[ind].indexOf("front") !== -1) {
              // The front side of the object is emphasized
              return SETTINGS.icons.emphasize.point.fillColor.front;
            } else {
              return SETTINGS.icons.point.fillColor.front;
            }
          }
        }
      case "line":
        break;
      case "segment":
        break;
      case "circle":
        ind = emph.findIndex(strArray => {
          return strArray[0] === "circle";
        });
        if (ind === -1) {
          // This object is not emphasized
          if (backFront === "back") {
            return SETTINGS.icons.circle.fillColor.back;
          } else {
            return SETTINGS.icons.circle.fillColor.front;
          }
        } else {
          if (backFront === "back") {
            if (emph[ind].indexOf("back") !== -1) {
              // The back side of the object is emphasized which means the gradient should remain so don't change the fill
              return ""; //SETTINGS.icons.emphasize.circle.fillColor.back;
            } else {
              return SETTINGS.icons.circle.fillColor.back;
            }
          } else {
            if (emph[ind].indexOf("front") !== -1) {
              // The front side of the object is emphasized which means the gradient should remain so don't change the fill
              return ""; //SETTINGS.icons.emphasize.circle.fillColor.front;
            } else {
              return SETTINGS.icons.circle.fillColor.front;
            }
          }
        }
      case "angleMarker":
        ind = emph.findIndex(strArray => {
          return strArray[0] === "angleMarker";
        });
        if (ind === -1) {
          // This object is not emphasized
          if (backFront === "14" || backFront === "15") {
            return SETTINGS.icons.angleMarker.fillColor.back;
          } else {
            return SETTINGS.icons.angleMarker.fillColor.front;
          }
        } else {
          if (backFront === "14" || backFront === "15") {
            if (emph[ind].indexOf("back") !== -1) {
              // The back side of the object is emphasized
              return SETTINGS.icons.emphasize.angleMarker.fillColor.back;
            } else {
              return SETTINGS.icons.angleMarker.fillColor.back;
            }
          } else {
            if (emph[ind].indexOf("front") !== -1) {
              // The front side of the object is emphasized
              return SETTINGS.icons.emphasize.angleMarker.fillColor.front;
            } else {
              return SETTINGS.icons.angleMarker.fillColor.front;
            }
          }
        }
      case "ellipse":
        ind = emph.findIndex(strArray => {
          return strArray[0] === "ellipse";
        });
        if (ind === -1) {
          // This object is not emphasized
          if (backFront === "back") {
            return SETTINGS.icons.ellipse.fillColor.back;
          } else {
            return SETTINGS.icons.ellipse.fillColor.front;
          }
        } else {
          if (backFront === "back") {
            if (emph[ind].indexOf("back") !== -1) {
              // The back side of the object is emphasized which means the gradient should remain so don't change the fill
              return ""; //SETTINGS.icons.emphasize.ellipse.fillColor.back;
            } else {
              return SETTINGS.icons.ellipse.fillColor.back;
            }
          } else {
            if (emph[ind].indexOf("front") !== -1) {
              // The front side of the object is emphasized which means the gradient should remain so don't change the fill
              return ""; //SETTINGS.icons.emphasize.ellipse.fillColor.front;
            } else {
              return SETTINGS.icons.ellipse.fillColor.front;
            }
          }
        }
    }
    return "hsla(0, 0%, 0%, 0)";
  }
}
</script>

<style scoped>
svg {
  display: inline-block;
  vertical-align: baseline;
  margin-bottom: -2px; /* yes, I'm that particular about formatting */
}
</style>
