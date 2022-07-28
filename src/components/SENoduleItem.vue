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
            $vuetify.icons.value.antipodalPoint</v-icon>
          <v-icon v-else-if="isPointOnObject"
            medium>
            $vuetify.icons.value.pointOnObject
          </v-icon>
          <v-icon v-else-if="isIntersectionPoint"
            medium>
            $vuetify.icons.value.intersect
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
          <v-icon v-else-if="isTransformedPoint"
            medium>
            $vuetify.icons.value.transformedPoint
          </v-icon>
          <v-icon v-else-if="isPoint"
            medium>
            $vuetify.icons.value.point</v-icon>
          <v-icon v-else-if="isTransformedSegment"
            medium>
            $vuetify.icons.value.transformedSegment
          </v-icon>
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
          <v-icon v-else-if="isTransformedLine"
            medium>
            $vuetify.icons.value.transformedLine
          </v-icon>
          <v-icon v-else-if="isLine"
            medium>
            $vuetify.icons.value.line</v-icon>
          <v-icon v-else-if="isTransformedCircle"
            medium>
            $vuetify.icons.value.transformedCircle
          </v-icon>
          <v-icon v-else-if="isCircle"
            medium>
            $vuetify.icons.value.circle
          </v-icon>
          <v-icon v-else-if="isTransformedEllipse"
            medium>
            $vuetify.icons.value.transformedEllipse
          </v-icon>
          <v-icon v-else-if="isEllipse"
            medium>
            $vuetify.icons.value.ellipse
          </v-icon>
          <v-icon v-else-if="isParametric"
            medium>
            $vuetify.icons.value.parametric
          </v-icon>
          <v-icon :class="shakeTransformationDisplay"
            v-else-if="isTranslation"
            medium>
            $vuetify.icons.value.translation
          </v-icon>
          <v-icon :class="shakeTransformationDisplay"
            v-else-if="isRotation"
            medium>
            $vuetify.icons.value.rotation
          </v-icon>
          <v-icon :class="shakeTransformationDisplay"
            v-else-if="isReflection"
            medium>
            $vuetify.icons.value.reflection
          </v-icon>
          <v-icon :class="shakeTransformationDisplay"
            v-else-if="isPointReflection"
            medium>
            $vuetify.icons.value.pointReflection
          </v-icon>
          <v-icon :class="shakeTransformationDisplay"
            v-else-if="isInversion"
            medium>
            $vuetify.icons.value.inversion
          </v-icon>
          <v-icon :class="shakeMeasurementDisplay"
            v-else-if="isAngle"
            medium>
            $vuetify.icons.value.angle
          </v-icon>
          <v-icon :class="shakeMeasurementDisplay"
            v-else-if="isMeasureTriangle"
            medium>
            $vuetify.icons.value.measureTriangle
          </v-icon>
          <v-icon :class="shakeMeasurementDisplay"
            v-else-if="isMeasurePolygon"
            medium>
            $vuetify.icons.value.measurePolygon
          </v-icon>
          <v-icon :class="shakeMeasurementDisplay"
            v-else-if="isSegmentLength"
            medium>
            $vuetify.icons.value.segmentLength
          </v-icon>
          <v-icon :class="shakeMeasurementDisplay"
            v-else-if="isPointDistance"
            medium>
            $vuetify.icons.value.pointDistance
          </v-icon>
          <v-icon :class="shakeMeasurementDisplay"
            v-else-if="isCalculation"
            medium>
            $vuetify.icons.value.calculationObject
          </v-icon>
          <v-icon :class="shakeMeasurementDisplay"
            v-else-if="isMeasurement"
            medium>
            $vuetify.icons.value.measurementObject
          </v-icon>

        </v-col>
        <v-col class="text-truncate">
          <v-tooltip right>
            <template v-slot:activator="{ on }">
              <div id="_test_selection"
                class="contentText"
                @click="selectMe"
                v-on="on"
                :class="[showClass,shakeMeasurementDisplay,shakeTransformationDisplay]">
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
                  <div id="_test_copy_to_clipboard"
                    v-if="isMeasurement && supportsClipboard"
                    v-on="on"
                    @click="copyToClipboard">
                    <v-icon small>
                      $vuetify.icons.value.copyToClipboard
                    </v-icon>
                  </div>
                </template>
                <span>{{ $t(`objectTree.copyToClipboard`) }}</span>
              </v-tooltip>
            </v-col>
            <v-col>
              <v-tooltip right>
                <template v-slot:activator="{ on }">
                  <div id="_test_toggle_format"
                    v-if="isExpressionAndNotCoordinate"
                    v-on="on"
                    @click="cycleValueDisplayMode">
                    <v-icon small>
                      $vuetify.icons.value.cycleNodeValueDisplayMode
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
                    v-if="isPlottable"
                    v-on="on"
                    @click="toggleVisibility">
                    <v-icon small
                      v-if="isHidden"
                      :key="visibilityUpdateKey">
                      $vuetify.icons.value.showNode
                    </v-icon>
                    <v-icon small
                      v-else
                      style="color:gray"
                      :key="visibilityUpdateKey">
                      $vuetify.icons.value.hideNode
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
                    v-if="isPlottable"
                    v-on="on"
                    @click="toggleLabelDisplay">
                    <v-icon small
                      v-if="isLabelHidden"
                      :key="labelVisibilityUpdateKey">
                      $vuetify.icons.value.showNodeLabel
                    </v-icon>
                    <v-icon small
                      v-else
                      style="color:gray"
                      :key="labelVisibilityUpdateKey">
                      $vuetify.icons.value.hideNodeLabel
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
                      $vuetify.icons.value.deleteNode
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
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { SetValueDisplayModeCommand } from "@/commands/SetValueDisplayModeCommand";
import { ActionMode, ObjectState, ValueDisplayMode } from "@/types";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import { SEPointCoordinate } from "@/models/SEPointCoordinate";
import { SEEllipse } from "@/models/SEEllipse";
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
import { Matrix4, Vector3 } from "three";
import { SEParametricTracePoint } from "@/models/SEParametricTracePoint";
import { mapActions, mapState } from "pinia";
import { useSEStore } from "@/stores/se";
import EventBus from "@/eventHandlers/EventBus";
import { SETransformation } from "@/models/SETransformation";
import { SETranslation } from "@/models/SETranslation";
import { SEPointReflection } from "@/models/SEPointReflection";
import { SEReflection } from "@/models/SEReflection";
import { SERotation } from "@/models/SERotation";
import { SEInversion } from "@/models/SEInversion";
import { SETransformedPoint } from "@/models/SETransformedPoint";
import { SEInversionCircleCenter } from "@/models/SEInversionCircleCenter";
import i18n from "@/i18n";
import { SEIsometryLine } from "@/models/SEIsometryLine";
import { SEIsometryCircle } from "@/models/SEIsometryCircle";
import { SEIsometrySegment } from "@/models/SEIsometrySegment";
import { SEIsometryEllipse } from "@/models/SEIsometryEllipse";

@Component({
  computed: {
    ...mapState(useSEStore, ["inverseTotalRotationMatrix", "actionMode"])
  },
  methods: {
    ...mapActions(useSEStore, ["unglowAllSENodules"])
  }
})
export default class SENoduleItem extends Vue {
  @Prop() readonly node!: SENodule;

  private visibilityUpdateKey = 0; //If we don't use this, the the icons for visibility do not alternate between a closed eye and an open eye. It would only display the initial icon.
  private labelVisibilityUpdateKey = 0; //If we don't use this, the the icons for visibility do not alternate between a label and a label with a slash. It would only display the initial icon.

  readonly inverseRotationMatrix!: Matrix4;
  readonly actionMode!: ActionMode;
  readonly unglowAllSENodules!: () => void;
  private rotationMatrix = new Matrix4();
  private traceLocation = new Vector3();
  private nodeName = "";
  private nodeType = "";

  curve: SEParametric | null = null;
  curvePoint: SEParametricTracePoint | null = null;
  parametricTime = 0;
  parametricTMin = 0;
  parametricTMax = 1;
  parametricTStep = 0.01;

  supportsClipboard = false; //For copying the value of a measurement to the clipboard

  /**
   * Objects that define the deleted objects (and all descendants) before deleting (for undoing delete)
   */
  private beforeDeleteStateMap: Map<number, ObjectState> = new Map(); //number is the SENodule.id
  private beforeDeleteSENoduleIDList: number[] = [];

  created() {
    if (navigator.clipboard) {
      this.supportsClipboard = true;
    }
  }

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
    } else if (this.node instanceof SETranslation) {
      const target = this.node.seLineOrSegment as SESegment;
      target.glowing = flag;
    } else if (this.node instanceof SEPointReflection) {
      const target = this.node.sePointOfReflection as SEPoint;
      target.glowing = flag;
    } else if (this.node instanceof SEReflection) {
      const target = this.node.seLineOrSegment as SESegment;
      target.glowing = flag;
    } else if (this.node instanceof SERotation) {
      const target = this.node.seRotationPoint as SEPoint;
      target.glowing = flag;
    } else if (this.node instanceof SEInversion) {
      const target = this.node.seCircleOfInversion as SECircle;
      target.glowing = flag;
    }

    if (this.node instanceof SEExpression) {
      EventBus.fire("measured-circle-set-temporary-radius", {
        display: flag,
        radius: this.node.value
      });
    }
  }

  selectMe(): void {
    // console.log("Clicked", this.node.name);
    if (this.node instanceof SEExpression) {
      this.$emit("object-select", { id: this.node.id });
      EventBus.fire("set-expression-for-tool", {
        expression: this.node
      });
    } else if (this.node instanceof SETransformation) {
      EventBus.fire("set-transformation-for-tool", {
        transformation: this.node
      });
    }
  }

  toggleVisibility(): void {
    new SetNoduleDisplayCommand(this.node, !this.node.showing).execute();
    this.visibilityUpdateKey += 1;
    this.labelVisibilityUpdateKey += 1;
  }
  toggleLabelDisplay(): void {
    if (
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
    this.visibilityUpdateKey += 1; // Without this, the display icon doesn't change between the two showing and not showing variants.
    this.labelVisibilityUpdateKey += 1; // Without this, the label icon doesn't change between the two showing and not showing variants.
  }
  copyToClipboard(): void {
    if (this.node instanceof SEExpression) {
      navigator.clipboard.writeText(String(this.node.value)).then(() =>
        EventBus.fire("show-alert", {
          key: "objectTree.copiedMeasurementSuccessfullyToClipboard",
          type: "success"
        })
      );
    }
  }

  deleteNode(): void {
    //Trigger event in sphereFrame to use the delete tool to delete the object and all its descendants
    EventBus.fire("delete-node", {
      victim: this.node,
      victimName: this.nodeName,
      victimType: this.nodeType
    });
    // when deleting mesurements, the measure object(if any) must be unglowed
    this.unglowAllSENodules();
  }

  cycleValueDisplayMode(): void {
    // If the user clicks this they the want to have the label showing so turn it on
    if (this.node instanceof SEAngleMarker) {
      if (this.node.label) {
        if (!this.node.label?.showing) {
          new SetNoduleDisplayCommand(this.node.label, true).execute();
        }
      }
    } else if (this.node instanceof SESegmentLength) {
      if (this.node.seSegment.label) {
        if (!this.node.seSegment.label.showing) {
          new SetNoduleDisplayCommand(
            this.node.seSegment.label,
            true
          ).execute();
        }
      }
    } else if (this.node instanceof SEPolygon) {
      if (this.node.label) {
        if (!this.node.label.showing) {
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
    // if (!(this.node instanceof SECalculation)) {
    //   this.node.parents[0].markKidsOutOfDate();
    //   this.node.parents[0].update();
    // }
    // console.debug(
    //   `Cycle display mode: node ${this.node.name}, new mode: ${newValueDisplayMode}`
    // );
    this.visibilityUpdateKey += 1;
    this.labelVisibilityUpdateKey += 1;
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
    if (this.node instanceof SELine) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.lines`, 3);
      return true;
    }
    return false;
  }
  get isLineSegment(): boolean {
    //return this.node instanceof SESegment;
    if (this.node instanceof SESegment) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.segments`, 3);
      return true;
    }
    return false;
  }
  get isCircle(): boolean {
    //return this.node instanceof SECircle;
    if (this.node instanceof SECircle) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.segments`, 3);
      return true;
    }
    return false;
  }
  get isEllipse(): boolean {
    //return this.node instanceof SEEllipse;
    if (this.node instanceof SEEllipse) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.ellipses`, 3);
      return true;
    }
    return false;
  }
  get isIntersectionPoint(): boolean {
    //return this.node instanceof SEIntersectionPoint;
    if (this.node instanceof SEIntersectionPoint) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.points`, 3);
      return true;
    }
    return false;
  }
  get isAngle(): boolean {
    //return this.node instanceof SEAngleMarker;
    if (this.node instanceof SEAngleMarker) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.angleMarkers`, 3);
      return true;
    }
    return false;
  }
  get isMeasurement(): boolean {
    //   return this.node instanceof SEExpression;
    if (this.node instanceof SEExpression) {
      this.nodeName = this.node.name; //this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.measurements`, 3);
      return true;
    }
    return false;
  }
  get isCalculation(): boolean {
    // return this.node instanceof SECalculation;
    if (this.node instanceof SECalculation) {
      this.nodeName = this.node.name; //this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.calculations`, 3);
      return true;
    }
    return false;
  }
  // get isSlider(): boolean { // Not needed as SESlider items are sorted in SENoduleList
  //   return this.node instanceof SESlider;
  // }
  get isMeasureTriangle(): boolean {
    //return (
    //  this.node instanceof SEPolygon && this.node.seEdgeSegments.length === 3
    //);
    if (
      this.node instanceof SEPolygon &&
      this.node.seEdgeSegments.length === 3
    ) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.triangles`, 3);
      return true;
    }
    return false;
  }
  get isMeasurePolygon(): boolean {
    //return this.node instanceof SEPolygon;
    if (this.node instanceof SEPolygon) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.polygons`, 3);
      return true;
    }
    return false;
  }

  get isParametric(): boolean {
    // return this.node instanceof SEParametric;
    if (this.node instanceof SEParametric) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.parametrics`, 3);
      return true;
    }
    return false;
  }

  get isAntipode(): boolean {
    //return this.node instanceof SEAntipodalPoint;
    if (this.node instanceof SEAntipodalPoint) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.points`, 3);
      return true;
    }
    return false;
  }

  get isPolar(): boolean {
    //return (
    //  this.node instanceof SEPolarLine || this.node instanceof SEPolarPoint
    //);
    if (this.node instanceof SEPolarLine) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.lines`, 3);
    } else if (this.node instanceof SEPolarPoint) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.points`, 3);
    }
    return (
      this.node instanceof SEPolarLine || this.node instanceof SEPolarPoint
    );
  }

  get isPerpendicular(): boolean {
    //return this.node instanceof SEPerpendicularLineThruPoint;
    if (this.node instanceof SEPerpendicularLineThruPoint) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.lines`, 3);
      return true;
    }
    return false;
  }
  get isPointOnObject(): boolean {
    // return this.node instanceof SEPointOnOneOrTwoDimensional;
    if (this.node instanceof SEPointOnOneOrTwoDimensional) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.points`, 3);
      return true;
    }
    return false;
  }

  get isSegmentLength(): boolean {
    // return this.node instanceof SESegmentLength;
    if (this.node instanceof SESegmentLength) {
      this.nodeName = this.node.seSegment.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.measurements`, 3);
      return true;
    }
    return false;
  }

  get isPointDistance(): boolean {
    //return this.node instanceof SEPointDistance;
    if (this.node instanceof SEPointDistance) {
      this.nodeName = this.node.name; //this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.measurements`, 3);
      return true;
    }
    return false;
  }
  get isMidpoint(): boolean {
    //return (
    // this.node instanceof SENSectPoint && (this.node as SENSectPoint).N === 2
    //)
    if (
      this.node instanceof SENSectPoint &&
      (this.node as SENSectPoint).N === 2
    ) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.points`, 3);
      return true;
    }
    return false;
  }
  get isNSectPoint(): boolean {
    //return this.node instanceof SENSectPoint;
    if (this.node instanceof SENSectPoint) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.points`, 3);
      return true;
    }
    return false;
  }

  get isTangent(): boolean {
    //return this.node instanceof SETangentLineThruPoint;
    if (this.node instanceof SETangentLineThruPoint) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.lines`, 3);
      return true;
    }
    return false;
  }
  get isAngleBisector(): boolean {
    // return (
    //   this.node instanceof SENSectLine && (this.node as SENSectLine).N === 2
    // );
    if (
      this.node instanceof SENSectLine &&
      (this.node as SENSectLine).N === 2
    ) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.lines`, 3);
      return true;
    }
    return false;
  }
  get isNSectLine(): boolean {
    // return this.node instanceof SENSectLine;
    if (this.node instanceof SENSectLine) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.lines`, 3);
      return true;
    }
    return false;
  }

  get isTranslation(): boolean {
    //return this.node instanceof SETranslation;
    if (this.node instanceof SETranslation) {
      this.nodeName = this.node.name; //this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.transformations`, 3);
      return true;
    }
    return false;
  }

  get isRotation(): boolean {
    //return this.node instanceof SERotation;
    if (this.node instanceof SERotation) {
      this.nodeName = this.node.name; //this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.transformations`, 3);
      return true;
    }
    return false;
  }

  get isReflection(): boolean {
    //return this.node instanceof SEReflection;
    if (this.node instanceof SEReflection) {
      this.nodeName = this.node.name; // this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.transformations`, 3);
      return true;
    }
    return false;
  }

  get isPointReflection(): boolean {
    // return this.node instanceof SEPointReflection;
    if (this.node instanceof SEPointReflection) {
      this.nodeName = this.node.name; // this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.transformations`, 3);
      return true;
    }
    return false;
  }

  get isInversion(): boolean {
    //return this.node instanceof SEInversion;
    if (this.node instanceof SEInversion) {
      this.nodeName = this.node.name; //this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.transformations`, 3);
      return true;
    }
    return false;
  }
  get isTransformedPoint(): boolean {
    // return (
    //   this.node instanceof SETransformedPoint ||
    //   this.node instanceof SEInversionCircleCenter
    // );
    if (
      this.node instanceof SETransformedPoint ||
      this.node instanceof SEInversionCircleCenter
    ) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.points`, 3);
      return true;
    }
    return false;
  }
  get isTransformedLine(): boolean {
    //return this.node instanceof SEIsometryLine;
    if (this.node instanceof SEIsometryLine) {
      this.nodeName = this.node.name; //this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.lines`, 3);
      return true;
    }
    return false;
  }
  get isTransformedSegment(): boolean {
    //return this.node instanceof SEIsometrySegment;
    if (this.node instanceof SEIsometrySegment) {
      this.nodeName = this.node.name; //this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.segments`, 3);
      return true;
    }
    return false;
  }
  get isTransformedCircle(): boolean {
    // return (
    //   (this.node instanceof SECircle &&
    //     this.node.circleSEPoint instanceof SETransformedPoint &&
    //     this.node.centerSEPoint instanceof SETransformedPoint &&
    //     this.node.circleSEPoint.parentTransformation.name ===
    //       this.node.centerSEPoint.parentTransformation.name) ||
    //   (this.node instanceof SECircle &&
    //     this.node.centerSEPoint instanceof SEInversionCircleCenter)
    // );
    if (
      this.node instanceof SEIsometryCircle ||
      (this.node instanceof SECircle &&
        this.node.circleSEPoint instanceof SETransformedPoint &&
        this.node.centerSEPoint instanceof SEInversionCircleCenter &&
        this.node.centerSEPoint.parentTransformation.name ===
          this.node.circleSEPoint.parentTransformation.name)
    ) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.circles`, 3);
      return true;
    }
    return false;
  }
  get isTransformedEllipse(): boolean {
    if (this.node instanceof SEIsometryEllipse) {
      this.nodeName = this.node.label?.ref.shortUserName ?? "";
      this.nodeType = i18n.tc(`objects.ellipses`, 3);
      return true;
    }
    return false;
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
    this.visibilityUpdateKey += 1; // if we don't do this, then for a user created point, undoing/redoing doesn't update the icon between eye/slash eye. This issue is revealed when 1) Draw two lines 2) use point tool to create the intersection 3) hide the intersection with the object panel icon 4) undo button on sphere frame
    this.labelVisibilityUpdateKey += 1; //
    return this.node.showing ? "visibleNode" : "invisibleNode";
  }
  //only shake the measurement icons initially when the measured circle tool is selected (There should also be a message displayed telling the user to select a measurement)
  get shakeMeasurementDisplay(): string {
    return this.actionMode === "measuredCircle" &&
      this.node instanceof SEExpression
      ? "shake"
      : "";
  }

  //only shake the transformation icons initially when the apply transformations tool is selected (There should also be a message displayed telling the user to select a translation)
  get shakeTransformationDisplay(): string {
    return this.actionMode === "applyTransformation" &&
      this.node instanceof SETransformation
      ? "shake"
      : "";
  }

  get shortDisplayText(): string {
    return this.node.noduleItemText;
  }
  get definitionText(): string {
    return this.node.noduleDescription;
  }
}
</script>

<style scoped lang="scss">
.shake {
  animation: shake 2s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  transform: translate3d(0, 0, 0);
}
@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }
  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}
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
