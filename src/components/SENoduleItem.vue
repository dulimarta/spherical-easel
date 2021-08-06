<template>
  <div>
    <div class="node"
      @mouseenter="glowMe(true)"
      @mouseleave="glowMe(false)">

      <v-row>
        <v-col cols="auto">
          <v-icon v-if="isAntipode"
            medium>
            $vuetify.icons.value.antipode</v-icon>
          <v-icon v-else-if="isPointOnObject"
            medium>
            $vuetify.icons.value.pointOnObject
          </v-icon>
          <v-icon v-else-if="isIntersectionPoint"
            medium>
            $vuetify.icons.value.intersectionPoint
          </v-icon>
          <v-icon v-else-if="isPolar"
            medium>
            $vuetify.icons.value.polar
          </v-icon>
          <v-icon v-else-if="isPoint"
            medium>
            $vuetify.icons.value.point</v-icon>
          <v-icon v-else-if="isLineSegment"
            medium>
            $vuetify.icons.value.segment</v-icon>
          <v-icon v-else-if="isPerpendicular"
            medium>
            $vuetify.icons.value.perpendicular</v-icon>
          <v-icon v-else-if="isLine"
            medium>
            $vuetify.icons.value.line</v-icon>
          <v-icon v-else-if="isCircle"
            medium>
            $vuetify.icons.value.circle
          </v-icon>
          <v-icon v-else-if="isEllipse"
            medium>
            $vuetify.icons.value.ellipse
          </v-icon>
          <v-icon v-else-if="isParametric"
            medium>
            $vuetify.icons.value.parametric
          </v-icon>

          <v-icon v-else-if="isSlider">mdi-arrow-left-right</v-icon>
          <v-icon v-else-if="isAngle"
            medium>
            $vuetify.icons.value.angle</v-icon>
          <v-icon v-else-if="isMeasuredTriangle"
            medium>
            $vuetify.icons.value.measuredTriangle</v-icon>
          <v-icon v-else-if="isMeasuredPolygon"
            medium>
            $vuetify.icons.value.measuredPolygon</v-icon>
          <v-icon v-else-if="isSegmentLength">
            $vuetify.icons.value.segmentLength
          </v-icon>
          <v-icon v-else-if="isPointDistance">
            $vuetify.icons.value.pointDistance
          </v-icon>
          <v-icon v-else-if="isMeasurement">mdi-tape-measure
          </v-icon>
          <v-icon v-else-if="isCalculation">mdi-calculator</v-icon>

        </v-col>
        <v-col class="text-truncate">

          <v-tooltip right>
            <template v-slot:activator="{ on }">
              <div id="_test_selection"
                class="contentText ml-1"
                @click="selectMe"
                v-on="on"
                :class="showClass">
                <span class="text-truncate">{{ shortDisplayText }}</span>
              </div>
            </template>
            <span>{{ definitionText }}</span>
          </v-tooltip>

        </v-col>
        <v-col cols="auto">

          <v-tooltip right>
            <template v-slot:activator="{ on }">
              <div id="_test_toggle_visibility"
                v-show="isPlottable"
                v-on="on"
                @click="toggleVisibility"
                class="mr-2">
                <v-icon small
                  v-if="isHidden">
                  mdi-eye
                </v-icon>
                <v-icon small
                  v-else
                  style="color:gray">
                  mdi-eye-off
                </v-icon>
              </div>
            </template>
            <span>{{ $t(`objectTree.toggleDisplay`) }}</span>
          </v-tooltip>

        </v-col>
        <v-col cols="auto">

          <v-tooltip right>
            <template v-slot:activator="{ on }">
              <div id="_test_toggle_format"
                v-show="isExpressionAndNotCoordinate"
                v-on="on"
                @click="cycleValueDisplayMode"
                class="mr-2">
                <v-icon small>
                  mdi-recycle-variant
                </v-icon>
              </div>
            </template>
            <span>{{ $t(`objectTree.cycleValueDisplayMode`) }}</span>
          </v-tooltip>

        </v-col>
        <v-col cols="auto">

          <v-tooltip right>
            <template v-slot:activator="{ on }">
              <div id="_delete_node"
                v-on="on"
                @click="deleteNode"
                class="mr-2">
                <v-icon small>
                  mdi-trash-can-outline
                </v-icon>
              </div>
            </template>
            <span>{{ $t(`objectTree.deleteNode`) }}</span>
          </v-tooltip>

        </v-col>

      </v-row>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop, Component } from "vue-property-decorator";
import { SENodule } from "../models/SENodule";
import { SEIntersectionPoint } from "../models/SEIntersectionPoint";
import { SEPoint } from "../models/SEPoint";
import { SELine } from "../models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "../models/SECircle";
import { SEExpression } from "@/models/SEExpression";
import { SESegmentLength } from "@/models/SESegmentLength";
import { SECalculation } from "../models/SECalculation";
import { SEPointDistance } from "@/models/SEPointDistance";
import { SESlider } from "@/models/SESlider";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { SetValueDisplayModeCommand } from "@/commands/SetValueDisplayModeCommand";
import { UpdateMode, UpdateStateType, ValueDisplayMode } from "@/types";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SEPointCoordinate } from "@/models/SEPointCoordinate";
import { SEEllipse } from "@/models/SEEllipse";
import { DeleteNoduleCommand } from "@/commands/DeleteNoduleCommand";
import { CommandGroup } from "@/commands/CommandGroup";
import { SEParametric } from "@/models/SEParametric";
import { SEPolygon } from "@/models/SEPolygon";
import { SEAntipodalPoint } from "@/models/SEAntipodalPoint";
import { SEPolarLine } from "@/models/SEPolarLine";
import { SEPolarPoint } from "@/models/SEPolarPoint";
import { SEPerpendicularLineThruPoint } from "@/models/SEPerpendicularLineThruPoint";
import { SEPointOnOneOrTwoDimensional } from "@/models/SEPointOnOneOrTwoDimensional";

@Component
export default class SENoduleItem extends Vue {
  @Prop() readonly node!: SENodule;

  /**
   * Objects that define the deleted objects (and all descendants) before deleting (for undoing delete)
   */
  private beforeDeleteState: UpdateStateType = {
    mode: UpdateMode.RecordStateForDelete,
    stateArray: []
  };

  glowMe(flag: boolean): void {
    /* If the highlighted object is plottable, we highlight
       it directly. Otherwise, we highlight its parents */
    if (this.isPlottable) this.node.glowing = flag;
    else if (this.node instanceof SESegmentLength) {
      const target = this.node.parents[0] as SESegment;
      target.glowing = flag;
    } else if (this.node instanceof SEPointDistance) {
      this.node.parents
        .map(n => n as SEPoint)
        .forEach((p: SEPoint) => {
          p.glowing = flag;
        });
    } else if (this.node instanceof SEPolygon) {
      this.node.seEdgeSegments
        .map(n => n as SESegment)
        .forEach((p: SESegment) => {
          p.glowing = flag;
        });
    }
  }

  selectMe(): void {
    if (this.node instanceof SEExpression) {
      // console.debug("Clicked", this.node.name);
      this.$emit("object-select", { id: this.node.id });
    }
  }

  toggleVisibility(): void {
    new SetNoduleDisplayCommand(this.node, !this.node.showing).execute();
  }

  deleteNode(): void {
    // if (!(this.node instanceof SECalculation)) {
    this.beforeDeleteState = {
      mode: UpdateMode.RecordStateForDelete,
      stateArray: []
    };
    // First mark all children of the victim out of date so that the update method does a topological sort
    this.node.markKidsOutOfDate();
    //Record the state of the victim and all the SENodules that depend on it (i.e kids, grandKids, etc..).
    this.node.update(this.beforeDeleteState);

    // console.debug("order of states before reverse");
    // this.beforeDeleteState.stateArray.forEach(obj =>
    //   console.debug(obj.object.name)
    // );
    // console.debug("end order");

    const deleteCommandGroup = new CommandGroup();
    // The update method orders the objects from the victim to the leaf (i.e objects with only in arrows)
    // To delete remove from the leaves to the victim (and to undo build from the victim to leaves -- accomplished
    // by the command group reversing the order on restore()).  Therefore reverse the stateArray.
    this.beforeDeleteState.stateArray.reverse();
    this.beforeDeleteState.stateArray.forEach(element => {
      deleteCommandGroup.addCommand(new DeleteNoduleCommand(element.object));
    });
    deleteCommandGroup.execute();
    // } else {
    // }
  }

  cycleValueDisplayMode(): void {
    // If the user clicks this they the want to have the label showing so turn it on
    if (this.node instanceof SEAngleMarker) {
      if (!this.node.label?.showing) {
        if (this.node.label) {
          new SetNoduleDisplayCommand(this.node.label, true).execute();
        }
      }
    } else if (this.node instanceof SESegmentLength) {
      if (!this.node.seSegment.label?.showing) {
        if (this.node.seSegment.label) {
          new SetNoduleDisplayCommand(
            this.node.seSegment.label,
            true
          ).execute();
        }
      }
    } else if (this.node instanceof SEPolygon) {
      if (!this.node.label?.showing) {
        if (this.node.label) {
          new SetNoduleDisplayCommand(this.node.label, true).execute();
        }
      }
    }
    const oldValueDisplayMode = (this.node as SEExpression).valueDisplayMode;
    let newValueDisplayMode: ValueDisplayMode;
    // Compute the next valueDisplayMode so that we cycle through the different options
    switch (oldValueDisplayMode) {
      case ValueDisplayMode.Number:
        newValueDisplayMode = ValueDisplayMode.MultipleOfPi;
        break;
      case ValueDisplayMode.MultipleOfPi:
        newValueDisplayMode = ValueDisplayMode.DegreeDecimals;
        break;
      case ValueDisplayMode.DegreeDecimals:
        newValueDisplayMode = ValueDisplayMode.Number;
        break;
    }
    new SetValueDisplayModeCommand(
      this.node as SEExpression,
      oldValueDisplayMode,
      newValueDisplayMode
    ).execute();
    // update a parent (who is parent to both this measurement and the label) to update the display on the sphere canvas
    if (!(this.node instanceof SECalculation)) {
      this.node.parents[0].markKidsOutOfDate();
      this.node.parents[0].update({
        mode: UpdateMode.DisplayOnly,
        stateArray: []
      });
    }
  }
  get isPoint(): boolean {
    return this.node instanceof SEPoint;
  }
  get isHidden(): boolean {
    return !this.node.showing;
  }
  get isExpressionAndNotCoordinate(): boolean {
    return (
      this.node instanceof SEExpression &&
      !(this.node instanceof SEPointCoordinate)
    );
  }
  get isLine(): boolean {
    return this.node instanceof SELine;
  }
  get isLineSegment(): boolean {
    return this.node instanceof SESegment;
  }
  get isCircle(): boolean {
    return this.node instanceof SECircle;
  }
  get isEllipse(): boolean {
    return this.node instanceof SEEllipse;
  }
  get isIntersectionPoint(): boolean {
    return this.node instanceof SEIntersectionPoint;
  }
  get isAngle(): boolean {
    return this.node instanceof SEAngleMarker;
  }
  get isMeasurement(): boolean {
    return this.node instanceof SEExpression;
  }
  get isCalculation(): boolean {
    return this.node instanceof SECalculation;
  }
  get isSlider(): boolean {
    return this.node instanceof SESlider;
  }
  get isMeasuredTriangle(): boolean {
    return (
      this.node instanceof SEPolygon && this.node.seEdgeSegments.length === 3
    );
  }
  get isMeasuredPolygon(): boolean {
    return this.node instanceof SEPolygon;
  }

  get isParametric(): boolean {
    return this.node instanceof SEParametric;
  }

  get isAntipode(): boolean {
    return this.node instanceof SEAntipodalPoint;
  }

  get isPolar(): boolean {
    return (
      this.node instanceof SEPolarLine || this.node instanceof SEPolarPoint
    );
  }

  get isPerpendicular(): boolean {
    return this.node instanceof SEPerpendicularLineThruPoint;
  }
  get isPointOnObject(): boolean {
    return this.node instanceof SEPointOnOneOrTwoDimensional;
  }

  get isSegmentLength(): boolean {
    return this.node instanceof SESegmentLength;
  }

  get isPointDistance(): boolean {
    return this.node instanceof SEPointDistance;
  }

  get isPlottable(): boolean {
    return (
      this.node instanceof SEPoint ||
      this.node instanceof SELine ||
      this.node instanceof SESegment ||
      this.node instanceof SECircle ||
      this.node instanceof SEEllipse ||
      this.node instanceof SEAngleMarker ||
      this.node instanceof SEParametric ||
      this.node instanceof SEPolygon
    );
  }

  get showClass(): string {
    return this.node.showing ? "visibleNode" : "invisibleNode";
  }

  get shortDisplayText(): string {
    return this.node.noduleItemText;
  }
  get definitionText(): string {
    return this.node.noduleDescription;
  }

  // TODO: the following getter definition is recursive
  // and is not currently used. DO we need this?
  // get magnificationLevel(): number {
  //   return this.magnificationLevel;
  // }
}
</script>

<style scoped lang="scss">
.invisibleNode {
  color: gray;
  font-style: italic;
}
.node,
.visibleNode {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0 0.25em;
  background-color: white;
  .contentText {
    // Expand to fill in the remaining available space
    flex-grow: 1;
  }
  v-icon {
    // Icons should not grow, just fit to content
    flex-grow: 0;
  }

  &:hover {
    /* Change background on mouse hover only for nodes
       i.e. do not change bbackground on labels */
    background-color: var(--v-accent-lighten1);
  }
}
</style>