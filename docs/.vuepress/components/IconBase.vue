<template>
  <div>
    <svg xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      :width="iconSize"
      :height="iconSize"
      transform="matrix(1 0 0 -1 0 0)"
      viewBox="-250 -250 500 500"
      :aria-labelledby="iconName"
      role="presentation"
      style="overflow: visible"
      class="svg"
      vector-effect="non-scaling-stroke">
      <g v-html="svgSnippetAmended">
      </g>
    </svg>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import axios from "axios";
import SETTINGS from "./iconSettings.js";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";

type ObjType =
  | "line"
  | "point"
  | "segment"
  | "circle"
  | "angleMarker"
  | "ellipse";
@Component
export default class IconBase extends Vue {
  @Prop() readonly iconName?: string;
  @Prop() readonly iconSize?: number;

  private svgSnippetRaw = "";
  private svgSnippetAmended = "";
  private doneFetching = false;

  mounted() {
    let filePath: string = "";
    let emphasizeTypes: Array<Array<string>>;
    let filePathStart = "/icons/";
    switch (this.iconName) {
      case "line":
        filePath = filePathStart + "iconLinePaths.svg";
        emphasizeTypes = [
          ["line", "front", "back"],
          ["point", "front", "back"]
        ];
        break;
    }

    this.doneFetching = false;

    function getAttribute(svgPathString: string, attributeString: string) {
      const attributeIndex = svgPathString.indexOf(attributeString + "=");
      if (attributeIndex === -1) {
        return undefined;
      }
      const startIndex = attributeIndex + attributeString.length + 2;
      const endIndex = svgPathString.indexOf('"', startIndex);
      return svgPathString.slice(startIndex, endIndex);
    }
    function setAttribute(
      svgPathString: string,
      attributeString: string,
      newAttributeValueString: string
    ) {
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
    function setTransformationScale(
      oldTransformMatrix: string,
      newScale: number,
      xTranslate?: number,
      yTranslate?: number
    ) {
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
    function getStrokeColor(
      objectType: ObjType,
      emph: Array<Array<string>>,
      backFront: string
    ) {
      let ind;
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
    function getFillColor(
      objectType: ObjType,
      emph: Array<Array<string>>,
      backFront: string
    ) {
      let ind;
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
    function getStrokeWidth(
      objectType: string,
      emph: Array<Array<string>>,
      backFront: string
    ) {
      let ind;
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
    function amendAttributes(svgPathString: string) {
      const type = getAttribute(svgPathString, "type");
      if (type === undefined) {
        throw new Error(
          `IconBase - amendAttributes ${svgPathString} has no attribute type`
        );
      }
      const side = getAttribute(svgPathString, "side");
      if (side === undefined) {
        throw new Error(
          `IconBase - amendAttributes ${svgPathString} has no attribute side`
        );
      }
      const fill = getAttribute(svgPathString, "myfill");
      if (fill === undefined) {
        throw new Error(
          `IconBase - amendAttributes ${svgPathString} has no attribute fill`
        );
      }

      // console.log(getAttribute(svgPathString, "id"));
      // console.log(Nodule.idPlottableDescriptionMap);

      let newStrokeColor;
      let newStrokeWidth;
      let newFillColor;

      switch (type) {
        case "boundaryCircle": // The boundary circle
          svgPathString = setAttribute(
            svgPathString,
            "stroke-width",
            SETTINGS.icons.boundaryCircle.strokeWidth.toString()
          );
          svgPathString = setAttribute(
            svgPathString,
            "stroke",
            SETTINGS.icons.boundaryCircle.color
          );
          break;
        case "angleMarker":
          if (
            // make sure that we only apply the stroke width/color to the non-fill parts
            fill === "false"
            // Number(getAttribute(svgPathString, "id")!.slice(-2)) < 11
          ) {
            newStrokeWidth = getStrokeWidth(
              "angleMarker",
              emphasizeTypes,
              side
            );
            newStrokeColor = getStrokeColor(
              "angleMarker",
              emphasizeTypes,
              side
            );
            svgPathString = setAttribute(
              svgPathString,
              "stroke-width",
              newStrokeWidth
            );
            svgPathString = setAttribute(
              svgPathString,
              "stroke",
              newStrokeColor
            );
          } else {
            //now consider the fill objects
            newFillColor = getFillColor("angleMarker", emphasizeTypes, side);
            svgPathString = setAttribute(svgPathString, "fill", newFillColor);
          }
          break;
        case "circle": //Circles
          // the fill object has an undefined stroke and shouldn't be changed (unless you want to destroy the gradient)
          if (getAttribute(svgPathString, "stroke") !== "undefined") {
            newStrokeWidth = getStrokeWidth("circle", emphasizeTypes, side);
            newStrokeColor = getStrokeColor("circle", emphasizeTypes, side);
            svgPathString = setAttribute(
              svgPathString,
              "stroke-width",
              newStrokeWidth
            );
            svgPathString = setAttribute(
              svgPathString,
              "stroke",
              newStrokeColor
            );
          } else {
            //now consider the fill objects
            newFillColor = getFillColor("circle", emphasizeTypes, side);
            if (newFillColor !== "") {
              // The fill object is not emphasized
              svgPathString = setAttribute(svgPathString, "fill", newFillColor);
            }
          }
          break;
        case "line": //Lines
          newStrokeWidth = getStrokeWidth("line", emphasizeTypes, side);
          newStrokeColor = getStrokeColor("line", emphasizeTypes, side);
          svgPathString = setAttribute(
            svgPathString,
            "stroke-width",
            newStrokeWidth
          );
          svgPathString = setAttribute(svgPathString, "stroke", newStrokeColor);
          break;
        case "point": //Points
          newStrokeWidth = getStrokeWidth("point", emphasizeTypes, side);
          newStrokeColor = getStrokeColor("point", emphasizeTypes, side);
          newFillColor = getFillColor("point", emphasizeTypes, side);
          svgPathString = setAttribute(
            svgPathString,
            "stroke-width",
            newStrokeWidth
          );
          svgPathString = setAttribute(svgPathString, "stroke", newStrokeColor);
          svgPathString = setAttribute(svgPathString, "fill", newFillColor);
          svgPathString = setAttribute(
            svgPathString,
            "transform",
            setTransformationScale(
              getAttribute(svgPathString, "transform") ?? "",
              side === "back"
                ? SETTINGS.icons.point.scale.back
                : SETTINGS.icons.point.scale.front
            )
          );
          break;
        case "segment": //Segments
          newStrokeWidth = getStrokeWidth("segment", emphasizeTypes, side);
          newStrokeColor = getStrokeColor("segment", emphasizeTypes, side);
          svgPathString = setAttribute(
            svgPathString,
            "stroke-width",
            newStrokeWidth
          );
          svgPathString = setAttribute(svgPathString, "stroke", newStrokeColor);
          break;

        case "ellipse": //Ellipses
          // the fill object has an undefined stroke and shouldn't be changed (unless you want to destroy the gradient)
          if (getAttribute(svgPathString, "stroke") !== "undefined") {
            newStrokeWidth = getStrokeWidth("ellipse", emphasizeTypes, side);
            newStrokeColor = getStrokeColor("ellipse", emphasizeTypes, side);
            svgPathString = setAttribute(
              svgPathString,
              "stroke-width",
              newStrokeWidth
            );
            svgPathString = setAttribute(
              svgPathString,
              "stroke",
              newStrokeColor
            );
          } else {
            //now consider the fill objects
            newFillColor = getFillColor("ellipse", emphasizeTypes, side);
            if (newFillColor !== "") {
              // The fill object is not emphasized
              svgPathString = setAttribute(svgPathString, "fill", newFillColor);
            }
          }
          break;
      }
      return svgPathString;
    }
    function removeAttribute(svgPathString: string, attributeString: string) {
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
      //   const type = getAttribute(ele, "type");
      //   const fill = getAttribute(ele, "myfill");
      //   // console.log("check", type, fill);
      //   if (type === "angleMarker" && fill === "true") {
      //     return true;
      //   } else {
      //     return false;
      //   }
      // });

      // if (ind !== -1) {
      //   // there is an angleMarker fill path
      //   const vals = getAttribute(parts[ind], "d")?.split(" ") ?? [];
      //   if (vals.length === 0) {
      //     throw new Error(
      //       `IconBase - Undefined d path attribute in ${parts[ind]}.`
      //     );
      //   }
      // console.log("scale angle marker", vals[1], vals[2]);
      // vals[1] and vals[2] contain the center of the dilation, scale *all* anglemarker parts (both circle edge and fill)
      parts.forEach((svgString, index) => {
        // console.log(svgString, svgString.indexOf("type" + "="));
        if (index === 0) return; // do nothing to the <defn>...</defn> string
        const type = getAttribute(svgString, "type");
        const side = getAttribute(svgString, "side");
        const fill = getAttribute(svgString, "myfill");

        if (fill === "true" && type === "angleMarker") {
          const vals = getAttribute(svgString, "d")?.split(" ") ?? [];
          if (vals.length === 0) {
            throw new Error(
              `IconBase - Undefined d path attribute in ${svgString}.`
            );
          }
          // this is part of an angleMarker and the previous part is the edge of the fill so
          if (side === "front") {
            // this angleMarker is on the front
            parts[index] = setAttribute(
              parts[index],
              "transform",
              setTransformationScale(
                getAttribute(parts[index], "transform") ?? "",
                SETTINGS.icons.angleMarker.scale.front,
                Number(vals[1]) * (1 - SETTINGS.icons.angleMarker.scale.front),
                Number(vals[2]) * (1 - SETTINGS.icons.angleMarker.scale.front)
              )
            );
            parts[index - 1] = setAttribute(
              parts[index - 1],
              "transform",
              setTransformationScale(
                getAttribute(parts[index - 1], "transform") ?? "",
                SETTINGS.icons.angleMarker.scale.front,
                Number(vals[1]) * (1 - SETTINGS.icons.angleMarker.scale.front),
                Number(vals[2]) * (1 - SETTINGS.icons.angleMarker.scale.front)
              )
            );
          } else {
            //this angleMarker is on the back
            parts[index] = setAttribute(
              parts[index],
              "transform",
              setTransformationScale(
                getAttribute(parts[index], "transform") ?? "",
                SETTINGS.icons.angleMarker.scale.front,
                Number(vals[1]) * (1 - SETTINGS.icons.angleMarker.scale.back),
                Number(vals[2]) * (1 - SETTINGS.icons.angleMarker.scale.back)
              )
            );
            parts[index - 1] = setAttribute(
              parts[index - 1],
              "transform",
              setTransformationScale(
                getAttribute(parts[index - 1], "transform") ?? "",
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
        parts[index] = amendAttributes(parts[index]);
        // Remove the four added attributes, type, side, fill, and part
        parts[index] = removeAttribute(parts[index], "type");
        parts[index] = removeAttribute(parts[index], "side");
        parts[index] = removeAttribute(parts[index], "myfill");
        parts[index] = removeAttribute(parts[index], "part");
      });
      this.svgSnippetAmended = parts.join(" ");
    });
  }
}
</script>

<style scoped>
.svg {
  display: inline-block;
  vertical-align: baseline;
  margin: 2px;
  border: 0px solid grey;
}
</style>
