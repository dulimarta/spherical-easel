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

@Component({})
export default class IconBase extends Vue {
  @Prop() readonly iconName?: string;
  @Prop() readonly iconFile!: string;
  @Prop() readonly emphasizeTypes!: string[][];

  private svgSnippetRaw = "";
  private svgSnippetAmended = "";
  private doneFetching = false;

  mounted(): void {
    let filePath;
    // Failed attempt to load from current directory
    if (this.iconFile.startsWith(".") || this.iconFile.startsWith("/")) {
      filePath = this.iconFile;
    } else {
      filePath = "/" + this.iconFile;
    }
    this.doneFetching = false;
    axios.get(filePath).then(r => {
      this.svgSnippetRaw = r.data;
      this.doneFetching = true;
      const parts = this.svgSnippetRaw.split(";");
      // scale the angleMarkers fill and circular edge
      // read the iconAngleMarkerPaths.svg to find the id of "10yyyyyxx" where xx is 12, 13, 14, or 15 (indicating a fill object)
      // then the d="M -75.437 -26.553... gives the center of the dialation
      // so the new translation vector is [-75.437*(1-scale),-26.553*(1-scale)]
      const ind = parts.findIndex(ele => {
        if (
          this.getAttribute(ele, "id") !== undefined &&
          this.getAttribute(ele, "id")!.slice(0, 2) === "10" &&
          Number(this.getAttribute(ele, "id")!.slice(-2)) >= 12
        ) {
          return true;
        } else {
          return false;
        }
      });

      if (ind !== -1) {
        // there is an angleMarker fill path
        const vals = this.getAttribute(parts[ind], "d")!.split(" ");
        // vals[1] and vals[2] contain the center of the dilation
        parts.forEach((svgString, index) => {
          if (index === 0) return; // do nothing to the <defn>...</defn> string
          const id = this.getAttribute(svgString, "id")!;
          if (id.slice(0, 2) === "10") {
            // this is part of an angleMarker
            if (
              Number(id.slice(-2)) < 2 ||
              Number(id.slice(-2)) === 12 ||
              Number(id.slice(-2)) === 13
            ) {
              // this angleMarker is on the front
              parts[index] = this.setAttribute(
                parts[index],
                "transform",
                this.setTransformationScale(
                  this.getAttribute(parts[index], "transform")!,
                  SETTINGS.icons.angleMarker.scale.front,
                  Number(vals[1]) *
                    (1 - SETTINGS.icons.angleMarker.scale.front),
                  Number(vals[2]) * (1 - SETTINGS.icons.angleMarker.scale.front)
                )
              );
            } else {
              //this angleMarker is on the back
              parts[index] = this.setAttribute(
                parts[index],
                "transform",
                this.setTransformationScale(
                  this.getAttribute(parts[index], "transform")!,
                  SETTINGS.icons.angleMarker.scale.front,
                  Number(vals[1]) * (1 - SETTINGS.icons.angleMarker.scale.back),
                  Number(vals[2]) * (1 - SETTINGS.icons.angleMarker.scale.back)
                )
              );
            }
          }
        });
      }
      parts.forEach((svgString, index) => {
        if (index === 0) return; // do nothing to the <defn>...</defn> string
        parts[index] = this.amendAttributes(parts[index]);
      });
      this.svgSnippetAmended = parts.join(" ");
    });
  }

  /**Blah abl */
  amendAttributes(svgPathString: string): string {
    let noduleType = this.getAttribute(svgPathString, "id");
    let newStrokeColor;
    let newStrokeWidth;
    let newFillColor;
    switch (noduleType!.slice(0, 2)) {
      case "99": // The boundary circle
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
      case "10": //AngleMarkers
        if (
          // make sure that we only apply the stroke width/color to the non-fill parts
          Number(this.getAttribute(svgPathString, "id")!.slice(-2)) < 11
        ) {
          newStrokeWidth = this.getStrokeWidth(
            "angleMarker",
            this.emphasizeTypes,
            noduleType!.slice(-2)
          );
          newStrokeColor = this.getStrokeColor(
            "angleMarker",
            this.emphasizeTypes,
            noduleType!.slice(-2)
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
            noduleType!.slice(-2)
          );
          svgPathString = this.setAttribute(
            svgPathString,
            "fill",
            newFillColor
          );
        }
        break;
      case "11": //Circles
        // the fill object has an undefined stroke and shouldn't be changed (unless you want to destroy the gradient)
        if (this.getAttribute(svgPathString, "stroke") !== "undefined") {
          newStrokeWidth = this.getStrokeWidth(
            "circle",
            this.emphasizeTypes,
            noduleType!.slice(-2)
          );
          newStrokeColor = this.getStrokeColor(
            "circle",
            this.emphasizeTypes,
            noduleType!.slice(-2)
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
            "circle",
            this.emphasizeTypes,
            noduleType!.slice(-2)
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
      case "12": //Lines
        newStrokeWidth = this.getStrokeWidth(
          "line",
          this.emphasizeTypes,
          noduleType!.slice(-2)
        );
        newStrokeColor = this.getStrokeColor(
          "line",
          this.emphasizeTypes,
          noduleType!.slice(-2)
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
      case "13": //Points
        newStrokeWidth = this.getStrokeWidth(
          "point",
          this.emphasizeTypes,
          noduleType!.slice(-2)
        );
        newStrokeColor = this.getStrokeColor(
          "point",
          this.emphasizeTypes,
          noduleType!.slice(-2)
        );
        newFillColor = this.getFillColor(
          "point",
          this.emphasizeTypes,
          noduleType!.slice(-2)
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
        svgPathString = this.setAttribute(svgPathString, "fill", newFillColor);
        svgPathString = this.setAttribute(
          svgPathString,
          "transform",
          this.setTransformationScale(
            this.getAttribute(svgPathString, "transform")!,
            noduleType!.slice(-2) === "1"
              ? SETTINGS.icons.point.scale.back
              : SETTINGS.icons.point.scale.front
          )
        );
        break;
      case "14": //Segments
        newStrokeWidth = this.getStrokeWidth(
          "segment",
          this.emphasizeTypes,
          noduleType!.slice(-2)
        );
        newStrokeColor = this.getStrokeColor(
          "segment",
          this.emphasizeTypes,
          noduleType!.slice(-2)
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
          if (backFront === "01") {
            return SETTINGS.icons.point.strokeWidth.back.toString();
          } else {
            return SETTINGS.icons.point.strokeWidth.front.toString();
          }
        } else {
          if (backFront === "01") {
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
          if (backFront === "01") {
            return SETTINGS.icons.line.strokeWidth.back.toString();
          } else {
            return SETTINGS.icons.line.strokeWidth.front.toString();
          }
        } else {
          if (backFront === "01") {
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
          if (backFront === "01" || backFront === "03") {
            return SETTINGS.icons.segment.strokeWidth.back.toString();
          } else {
            return SETTINGS.icons.segment.strokeWidth.front.toString();
          }
        } else {
          if (backFront === "01" || backFront === "03") {
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
          if (backFront === "01") {
            return SETTINGS.icons.circle.strokeWidth.back.toString();
          } else {
            return SETTINGS.icons.circle.strokeWidth.front.toString();
          }
        } else {
          if (backFront === "01") {
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
          if (
            backFront === "04" ||
            backFront === "05" ||
            backFront === "10" ||
            backFront === "11"
          ) {
            return SETTINGS.icons.angleMarker.strokeWidth.back.toString();
          } else {
            return SETTINGS.icons.angleMarker.strokeWidth.front.toString();
          }
        } else {
          if (
            backFront === "04" ||
            backFront === "05" ||
            backFront === "10" ||
            backFront === "11"
          ) {
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
          if (backFront === "01") {
            return SETTINGS.icons.point.edgeColor.back;
          } else {
            return SETTINGS.icons.point.edgeColor.front;
          }
        } else {
          if (backFront === "01") {
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
          if (backFront === "01") {
            return SETTINGS.icons.line.edgeColor.back;
          } else {
            return SETTINGS.icons.line.edgeColor.front;
          }
        } else {
          if (backFront === "01") {
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
          if (backFront === "01" || backFront === "03") {
            return SETTINGS.icons.segment.edgeColor.back;
          } else {
            return SETTINGS.icons.segment.edgeColor.front;
          }
        } else {
          if (backFront === "01" || backFront === "03") {
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
          if (backFront === "01") {
            return SETTINGS.icons.circle.edgeColor.back;
          } else {
            return SETTINGS.icons.circle.edgeColor.front;
          }
        } else {
          if (backFront === "01") {
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
          if (
            backFront === "04" ||
            backFront === "05" ||
            backFront === "10" ||
            backFront === "11"
          ) {
            return SETTINGS.icons.angleMarker.edgeColor.back;
          } else {
            return SETTINGS.icons.angleMarker.edgeColor.front;
          }
        } else {
          if (
            backFront === "04" ||
            backFront === "05" ||
            backFront === "10" ||
            backFront === "11"
          ) {
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
          if (backFront === "01") {
            return SETTINGS.icons.point.fillColor.back;
          } else {
            return SETTINGS.icons.point.fillColor.front;
          }
        } else {
          if (backFront === "01") {
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
          if (backFront === "01") {
            return SETTINGS.icons.circle.fillColor.back;
          } else {
            return SETTINGS.icons.circle.fillColor.front;
          }
        } else {
          if (backFront === "01") {
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