<template>
  <svg xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid meet"
    viewBox="-150 -150 300 300"
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
        break;
      case "11": //Circles
        // the fill object has an undefined stroke and shouldn't be changed (unless you want to destroy the gradient)
        if (this.getAttribute(svgPathString, "stroke") !== "undefined") {
          svgPathString = this.setAttribute(
            svgPathString,
            "stroke-width",
            noduleType!.slice(-1) === "1"
              ? SETTINGS.icons.circle.strokeWidth.back.toString()
              : SETTINGS.icons.circle.strokeWidth.front.toString()
          );
          svgPathString = this.setAttribute(
            svgPathString,
            "stroke",
            noduleType!.slice(-1) === "1"
              ? SETTINGS.icons.circle.edgeColor.back.toString()
              : SETTINGS.icons.circle.edgeColor.front.toString()
          );
        }
        break;
      case "12": //Lines
        svgPathString = this.setAttribute(
          svgPathString,
          "stroke-width",
          noduleType!.slice(-1) === "1"
            ? SETTINGS.icons.line.strokeWidth.back.toString()
            : SETTINGS.icons.line.strokeWidth.front.toString()
        );
        svgPathString = this.setAttribute(
          svgPathString,
          "stroke",
          noduleType!.slice(-1) === "1"
            ? SETTINGS.icons.line.edgeColor.back.toString()
            : SETTINGS.icons.line.edgeColor.front.toString()
        );
        break;
      case "13": //Points
        svgPathString = this.setAttribute(
          svgPathString,
          "stroke-width",
          noduleType!.slice(-1) === "1"
            ? SETTINGS.icons.point.strokeWidth.back.toString()
            : SETTINGS.icons.point.strokeWidth.front.toString()
        );
        svgPathString = this.setAttribute(
          svgPathString,
          "stroke",
          noduleType!.slice(-1) === "1"
            ? SETTINGS.icons.point.edgeColor.back
            : SETTINGS.icons.point.edgeColor.front
        );
        svgPathString = this.setAttribute(
          svgPathString,
          "fill",
          noduleType!.slice(-1) === "1"
            ? SETTINGS.icons.point.fillColor.back
            : SETTINGS.icons.point.fillColor.front
        );
        svgPathString = this.setAttribute(
          svgPathString,
          "transform",
          this.setTransformationScale(
            this.getAttribute(svgPathString, "transform")!,
            noduleType!.slice(-1) === "1"
              ? SETTINGS.icons.point.scale.back
              : SETTINGS.icons.point.scale.front
          )
        );
        break;
      case "14": //Segments
        svgPathString = this.setAttribute(
          svgPathString,
          "stroke-width",
          noduleType!.slice(-1) === "1" || noduleType!.slice(-1) === "3"
            ? SETTINGS.icons.segment.strokeWidth.back.toString()
            : SETTINGS.icons.segment.strokeWidth.front.toString()
        );
        svgPathString = this.setAttribute(
          svgPathString,
          "stroke",
          noduleType!.slice(-1) === "1" || noduleType!.slice(-1) === "3"
            ? SETTINGS.icons.segment.edgeColor.back
            : SETTINGS.icons.segment.edgeColor.front
        );
        break;
    }
    return svgPathString;
  }

  getAttribute(
    svgPathString: string,
    attributeString: string
  ): string | undefined {
    // console.log(svgPathString);
    // console.log(attributeString);
    const attributeIndex = svgPathString.indexOf(attributeString + "=");
    if (attributeIndex === -1) {
      return undefined;
    }
    // console.log(attributeIndex);
    const startIndex = attributeIndex + attributeString.length + 2;
    // console.log(startIndex);
    const endIndex = svgPathString.indexOf('"', startIndex);
    // console.log(endIndex);
    return svgPathString.slice(startIndex, endIndex);
  }

  setAttribute(
    svgPathString: string,
    attributeString: string,
    newAttributeValueString: string
  ): string {
    // console.log(svgPathString);
    // console.log(attributeString);
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
   * "matrix(newScale 0 0 newScale 114.678 27.373)"
   */
  setTransformationScale(oldTransformMatrix: string, newScale: number): string {
    const vals = oldTransformMatrix
      .slice(7, oldTransformMatrix.length - 1)
      .split(" ")
      .map(x => Number(x));
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
}
</script>

<style scoped>
svg {
  display: inline-block;
  vertical-align: baseline;
  margin-bottom: -2px; /* yes, I'm that particular about formatting */
}
</style>