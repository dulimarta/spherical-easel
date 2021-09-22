<template>
  <div>
    <v-container class="node"
      @mouseenter="glowMe(true)"
      @mouseleave="glowMe(false)">

      <v-row dense
        justify="start"
        class="pa-0">
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
            $vuetify.icons.value.intersection
          </v-icon>
          <v-icon v-else-if="isPolar"
            medium>
            $vuetify.icons.value.polar
          </v-icon>
          <v-icon v-else-if="isMidpoint"
            medium>
            $vuetify.icons.value.midpoint
          </v-icon>
          <v-icon v-else-if="isNSectPoint"
            medium>
            $vuetify.icons.value.nSectPoint
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
          <v-icon v-else-if="isTangent"
            medium>
            $vuetify.icons.value.tangent</v-icon>
          <v-icon v-else-if="isAngleBisector"
            medium>
            $vuetify.icons.value.angleBisector</v-icon>
          <v-icon v-else-if="isNSectLine"
            medium>
            $vuetify.icons.value.nSectLine</v-icon>
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
                class="contentText"
                @click="selectMe"
                v-on="on"
                :class="showClass">
                <span class="text-truncate">{{ shortDisplayText }}</span>
              </div>
            </template>
            <span>{{ definitionText }}</span>
          </v-tooltip>

        </v-col>
        <v-col justify="end">
          <v-row align="center"
            no-gutters>
            <v-col>
              <v-tooltip right>
                <template v-slot:activator="{ on }">
                  <div id="_test_toggle_format"
                    v-show="isExpressionAndNotCoordinate"
                    v-on="on"
                    @click="cycleValueDisplayMode">
                    <v-icon small>
                      mdi-recycle-variant
                    </v-icon>
                  </div>
                </template>
                <span>{{ $t(`objectTree.cycleValueDisplayMode`) }}</span>
              </v-tooltip>
            </v-col>
            <v-col>
              <v-tooltip right>
                <template v-slot:activator="{ on }">
                  <div id="_test_toggle_visibility"
                    v-show="isPlottable"
                    v-on="on"
                    @click="toggleVisibility">
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
            <v-col>
              <v-tooltip right>
                <template v-slot:activator="{ on }">
                  <div id="_toggle_label_display"
                    v-show="isPlottable"
                    v-on="on"
                    @click="toggleLabelDisplay">

                    <v-icon small
                      v-if="isLabelHidden">
                      mdi-label-outline
                    </v-icon>
                    <v-icon small
                      v-else
                      style="color:gray">
                      mdi-label-off-outline
                    </v-icon>
                  </div>
                </template>
                <span>{{ $t(`objectTree.toggleLabelDisplay`) }}</span>
              </v-tooltip>
            </v-col>
            <v-col>
              <v-tooltip right>
                <template v-slot:activator="{ on }">
                  <div id="_delete_node"
                    v-on="on"
                    @click="deleteNode">
                    <v-icon small>
                      mdi-trash-can-outline
                    </v-icon>
                  </div>
                </template>
                <span>{{ $t(`objectTree.deleteNode`) }}</span>
              </v-tooltip>
            </v-col>

          </v-row>
        </v-col>
      </v-row>
      <v-row v-if="isParametric">
        <v-col cols="auto">
          t = {{parametricTime.toFixed(3)}}
        </v-col>
        <v-col>
          <v-slider v-model="parametricTime"
            :min="parametricTMin"
            :max="parametricTMax"
            :step="parametricTStep" />
        </v-col>
        <v-col cols="auto">
          <v-icon @click="animateCurvePoint">mdi-run</v-icon>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop, Component, Watch } from "vue-property-decorator";
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
import { AppState, ObjectState, ValueDisplayMode } from "@/types";
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
import { SENSectPoint } from "@/models/SENSectPoint";
import { SETangentLineThruPoint } from "@/models/SETangentLineThruPoint";
import { SENSectLine } from "@/models/SENSectLine";
import { SEStore } from "@/store";
import { namespace } from "vuex-class";
import { Matrix4, Vector3 } from "three";
import { SEParametricTracePoint } from "@/models/SEParametricTracePoint";

const SE = namespace("se");
@Component
export default class SENoduleItem extends Vue {
  @Prop() readonly node!: SENodule;

  @SE.State((s: AppState) => s.inverseTotalRotationMatrix)
  readonly inverseRotationMatrix!: Matrix4;

  private rotationMatrix = new Matrix4();
  private traceLocation = new Vector3();
  curve: SEParametric | null = null;
  curvePoint: SEParametricTracePoint | null = null;
  parametricTime = 0;
  parametricTMin = 0;
  parametricTMax = 1;
  parametricTStep = 0.01;

  /**
   * Objects that define the deleted objects (and all descendants) before deleting (for undoing delete)
   */
  private beforeDeleteStateMap: Map<number, ObjectState> = new Map(); //number is the SENodule.id
  private beforeDeleteSENoduleIDList: number[] = [];

  mounted(): void {
    if (this.node instanceof SEParametric) {
      this.curve = this.node;
      // const pt = new Point();
      this.curvePoint = this.curve.tracePoint;
      const [tMin, tMax] = this.curve.tMinMaxExpressionValues();
      this.parametricTMin = tMin;
      this.parametricTMax = tMax;
      this.parametricTStep = (tMax - tMin) / 100;
      this.onParametricTimeChanged(tMin);
    }
  }
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
    } else if (this.node instanceof SEPointCoordinate) {
      const target = this.node.point as SEPoint;
      target.glowing = flag;
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
  toggleLabelDisplay(): void {
    if (
      // this.isPlottable
      this.node instanceof SEPoint ||
      this.node instanceof SELine ||
      this.node instanceof SESegment ||
      this.node instanceof SECircle ||
      this.node instanceof SEEllipse ||
      this.node instanceof SEAngleMarker ||
      this.node instanceof SEParametric ||
      this.node instanceof SEPolygon
    ) {
      if (this.node.label) {
        new SetNoduleDisplayCommand(
          this.node.label,
          !this.node.label.showing
        ).execute();
      }
    }
  }

  deleteNode(): void {
    // Clear the delete array and map
    this.beforeDeleteStateMap.clear();
    this.beforeDeleteSENoduleIDList.splice(0);

    // First mark all children of the victim out of date so that the update method does a topological sort
    this.node.markKidsOutOfDate();
    //Record the state of the victim and all the SENodules that depend on it (i.e kids, grandKids, etc..).
    this.node.update(
      this.beforeDeleteStateMap,
      this.beforeDeleteSENoduleIDList
    );

    // console.debug("order of states before reverse");
    // this.beforeDeleteState.stateArray.forEach(obj =>
    //   console.debug(obj.object.name)
    // );
    // console.debug("end order");

    const deleteCommandGroup = new CommandGroup();
    // The update method orders the objects from the victim to the leaf (i.e objects with only in arrows)
    // To delete remove from the leaves to the victim (and to undo build from the victim to leaves -- accomplished
    // by the command group reversing the order on restore()).  Therefore reverse the stateArray.
    this.beforeDeleteSENoduleIDList.reverse();
    this.beforeDeleteSENoduleIDList.forEach(seNoduleID => {
      // Get the before state of the SENodule
      const seNoduleBeforeState = this.beforeDeleteStateMap.get(seNoduleID);

      if (seNoduleBeforeState !== undefined) {
        deleteCommandGroup.addCommand(
          new DeleteNoduleCommand(seNoduleBeforeState.object)
        );
      }
    });
    deleteCommandGroup.execute();
    // when deleting mesurements, the measure object(if any) must be unglowed
    SEStore.unglowAllSENodules();
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
      this.node.parents[0].update();
    }
  }

  @Watch("parametricTime")
  onParametricTimeChanged(tVal: number): void {
    if (this.curve && this.curvePoint) {
      this.curvePoint.setLocationByTime(tVal);
      this.curvePoint.markKidsOutOfDate();
      this.curvePoint.update();
    }
  }

  animateCurvePoint(): void {
    const repeatCount = Math.ceil(
      (this.parametricTMax - this.parametricTMin) / this.parametricTStep
    );
    this.parametricTime = this.parametricTMin;
    const timer = setInterval(() => {
      if (this.parametricTime <= this.parametricTMax) {
        this.parametricTime += this.parametricTStep;
      }
    }, 100);
    setTimeout(() => {
      console.debug("Stop the interval timer");
      clearInterval(timer);
    }, repeatCount * 100);
  }

  get isPoint(): boolean {
    return this.node instanceof SEPoint;
  }
  get isHidden(): boolean {
    return !this.node.showing;
  }
  get isLabelHidden(): boolean {
    if (
      // this.isPlottable
      this.node instanceof SEPoint ||
      this.node instanceof SELine ||
      this.node instanceof SESegment ||
      this.node instanceof SECircle ||
      this.node instanceof SEEllipse ||
      this.node instanceof SEAngleMarker ||
      this.node instanceof SEParametric ||
      this.node instanceof SEPolygon
    ) {
      return !this.node.label?.showing;
    }
    return false;
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
  get isMidpoint(): boolean {
    return (
      this.node instanceof SENSectPoint && (this.node as SENSectPoint).N === 2
    );
  }
  get isNSectPoint(): boolean {
    return this.node instanceof SENSectPoint;
  }

  get isTangent(): boolean {
    return this.node instanceof SETangentLineThruPoint;
  }
  get isAngleBisector(): boolean {
    return (
      this.node instanceof SENSectLine && (this.node as SENSectLine).N === 2
    );
  }
  get isNSectLine(): boolean {
    return this.node instanceof SENSectLine;
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
  // display: flex;
  // flex-direction: row;
  // align-items: center;
  // margin: 0 0.25em;
  background-color: white;
  .contentText {
    // Expand to fill in the remaining available space
    // flex-grow: 1;
  }
  v-icon {
    // Icons should not grow, just fit to content
    // flex-grow: 0;
  }

  &:hover {
    /* Change background on mouse hover only for nodes
       i.e. do not change bbackground on labels */
    background-color: var(--v-accent-lighten1);
  }
}
</style>