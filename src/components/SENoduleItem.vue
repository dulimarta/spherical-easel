<template>
  <div>
    <v-container
      class="node"
      @mouseenter="glowMe(true)"
      @mouseleave="glowMe(false)">
      <v-row dense justify="start" class="pa-0">
        <v-col cols="auto">
          <v-icon
            size="medium"
            :icon="iconName"
            :class="animationClassName"></v-icon>
          <!--

          <v-icon v-else-if="isParametric" medium>
            $parametric
          </v-icon-->
        </v-col>
        <!--v-col class="text-truncate">
          <v-tooltip location="end">
            <template v-slot:activator="{ props }">
              <div
                id="_test_selection"
                class="contentText"
                @click="selectMe"
                v-bind="props"
                :class="[
                  showClass,
                  shakeMeasurementDisplay,
                  shakeTransformationDisplay
                ]">
                <span class="text-truncate">{{ shortDisplayText }}</span>
              </div>
            </template>
            <span>{{ definitionText }}</span>
          </v-tooltip>
        </v-col-->
        <!--v-col justify="end">
          <v-row align="center" no-gutters>
            <v-col>
              <v-tooltip location="end">
                <template v-slot:activator="{ props }">
                  <div
                    id="_test_copy_to_clipboard"
                    v-if="isMeasurement && supportsClipboard"
                    v-bind="props"
                    @click="copyToClipboard">
                    <v-icon small>
                      $copyToClipboard
                    </v-icon>
                  </div>
                </template>
                <span>{{ $t(`objectTree.copyToClipboard`) }}</span>
              </v-tooltip>
            </v-col>
            <v-col>
              <v-tooltip location="end">
                <template v-slot:activator="{ props }">
                  <div
                    id="_test_toggle_format"
                    v-if="isExpressionAndNotCoordinate"
                    v-bind="props"
                    @click="cycleValueDisplayMode">
                    <v-icon small>
                      $cycleNodeValueDisplayMode
                    </v-icon>
                  </div>
                </template>
                <span>{{ $t(`objectTree.cycleValueDisplayMode`) }}</span>
              </v-tooltip>
            </v-col>
            <v-col>
              <v-tooltip location="end">
                <template v-slot:activator="{ props }">
                  <div
                    id="_test_toggle_visibility"
                    v-if="isPlottable"
                    v-bind="props"
                    @click="toggleVisibility">
                    <v-icon small v-if="isHidden" :key="visibilityUpdateKey">
                      $showNode
                    </v-icon>
                    <v-icon
                      small
                      v-else
                      style="color: gray"
                      :key="visibilityUpdateKey">
                      $
                    </v-icon>
                  </div>
                </template>
                <span>{{ $t(`objectTree.toggleDisplay`) }}</span>
              </v-tooltip>
            </v-col>
            <v-col>
              <v-tooltip location="end">
                <template v-slot:activator="{ props }">
                  <div
                    id="_toggle_label_display"
                    v-if="isPlottable"
                    v-bind="props"
                    @click="toggleLabelDisplay">
                    <v-icon
                      small
                      v-if="isLabelHidden"
                      :key="labelVisibilityUpdateKey">
                      $showNodeLabel
                    </v-icon>
                    <v-icon
                      small
                      v-else
                      style="color: gray"
                      :key="labelVisibilityUpdateKey">
                      $hideNodeLabel
                    </v-icon>
                  </div>
                </template>
                <span>{{ $t(`objectTree.toggleLabelDisplay`) }}</span>
              </v-tooltip>
            </v-col>
            <v-col>
              <v-tooltip location="end">
                <template v-slot:activator="{ props }">
                  <div id="_delete_node" v-bind="props" @click="deleteNode">
                    <v-icon small> $deleteNode </v-icon>
                  </div>
                </template>
                <span>{{ $t(`objectTree.deleteNode`) }}</span>
              </v-tooltip>
            </v-col>
          </v-row>
        </v-col-->
      </v-row>
      <!--v-row v-if="isParametric">
        <v-col cols="auto"> t = {{ parametricTime.toFixed(3) }} </v-col>
        <v-col>
          <v-slider
            :model-value="parametricTime"
            :min="parametricTMin"
            :max="parametricTMax"
            :step="parametricTStep" />
        </v-col>
        <v-col cols="auto">
          <v-icon @click="animateCurvePoint">mdi-run</v-icon>
        </v-col>
      </v-row-->
    </v-container>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeMount, onMounted, ref, watch } from "vue";
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
import { ValueDisplayMode } from "@/types";
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
// import { Matrix4 } from "three";
import { SEParametricTracePoint } from "@/models/SEParametricTracePoint";
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
import { SEIsometryLine } from "@/models/SEIsometryLine";
import { SEIsometryCircle } from "@/models/SEIsometryCircle";
import { SEIsometrySegment } from "@/models/SEIsometrySegment";
import { SEIsometryEllipse } from "@/models/SEIsometryEllipse";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
const seStore = useSEStore();
const { actionMode } = storeToRefs(seStore);
const props = defineProps<{
  node: SENodule;
}>();
const emit = defineEmits(["object-select"]);
const { t } = useI18n();

const visibilityUpdateKey = ref(0); //If we don't use this, the the icons for visibility do not alternate between a closed eye and an open eye. It would only display the initial icon.
const labelVisibilityUpdateKey = ref(0); //If we don't use this, the the icons for visibility do not alternate between a label and a label with a slash. It would only display the initial icon.
const iconName = ref("mdi-help");
// const rotationMatrix = new Matrix4();
// private traceLocation = new Vector3();
let nodeName = "";
let nodeType = "";

let curve: SEParametric | null = null;
let curvePoint: SEParametricTracePoint | null = null;
const parametricTime = ref(0);
const parametricTMin = ref(0);
const parametricTMax = ref(1);
const parametricTStep = ref(0.01);
const supportsClipboard = ref(false); //For copying the value of a measurement to the clipboard

/**
 * Objects that define the deleted objects (and all descendants) before deleting (for undoing delete)
 */

onBeforeMount(() => {
  if (navigator.clipboard) {
    supportsClipboard.value = true;
  }
  if (props.node instanceof SEPoint) {
    iconName.value = "$point";
  } else if (props.node instanceof SEAntipodalPoint) {
    iconName.value = "$antipodalPoint";
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.points`, 3);
  } else if (props.node instanceof SEPointOnOneOrTwoDimensional) {
    iconName.value = "$pointOnObject";
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.points`, 3);
  } else if (props.node instanceof SEIntersectionPoint) {
    iconName.value = "$intersect";
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.points`, 3);
  } else if (props.node instanceof SEPolarLine) {
    iconName.value = "$polar";
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.lines`, 3);
  } else if (props.node instanceof SEPolarPoint) {
    iconName.value = "$polar";
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.points`, 3);
  } else if (
    props.node instanceof SENSectPoint &&
    (props.node as SENSectPoint).N === 2
  ) {
    iconName.value = "$midpoint";
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.points`, 3);
  } else if (props.node instanceof SENSectPoint) {
    iconName.value = "$nSectPoint";
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.points`, 3);
  } else if (
    props.node instanceof SETransformedPoint ||
    props.node instanceof SEInversionCircleCenter
  ) {
    iconName.value = "$transformedPoint";
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.points`, 3);
  } else if (props.node instanceof SEIsometrySegment) {
    iconName.value = "$transformedSegment";
    nodeName = props.node.name; //props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.segments`, 3);
  } else if (props.node instanceof SESegment) {
    iconName.value = "$segment";
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.segments`, 3);
  } else if (props.node instanceof SEPerpendicularLineThruPoint) {
    iconName.value = "$perpendicular";
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.lines`, 3);
  } else if (props.node instanceof SETangentLineThruPoint) {
    iconName.value = "$tangent";
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.lines`, 3);
  } else if (
    props.node instanceof SENSectLine &&
    (props.node as SENSectLine).N === 2
  ) {
    iconName.value = "$angleBisector";
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.lines`, 3);
  } else if (props.node instanceof SENSectLine) {
    iconName.value = "$nSectLine";
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.lines`, 3);
  } else if (props.node instanceof SEIsometryLine) {
    iconName.value = "$transformedLine";
    nodeName = props.node.name; //props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.lines`, 3);
  } else if (props.node instanceof SELine) {
    iconName.value = "$line";
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.lines`, 3);
  } else if (
    props.node instanceof SEIsometryCircle ||
    (props.node instanceof SECircle &&
      props.node.circleSEPoint instanceof SETransformedPoint &&
      props.node.centerSEPoint instanceof SEInversionCircleCenter &&
      props.node.centerSEPoint.parentTransformation.name ===
        props.node.circleSEPoint.parentTransformation.name)
  ) {
    iconName.value = "$transformedCircle";
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.circles`, 3);
  } else if (props.node instanceof SECircle) {
    iconName.value = "$circle";
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.segments`, 3);
  } else if (props.node instanceof SEIsometryEllipse) {
    iconName.value = "$transformedEllipse";
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.ellipses`, 3);
  } else if (props.node instanceof SEEllipse) {
    iconName.value = "$ellipse";
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.ellipses`, 3);
  }
  else if (props.node instanceof SETranslation) {
    iconName.value = "$translation"
    nodeName = props.node.name; //props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.transformations`, 3);
  }
  else if (props.node instanceof SERotation) {
    iconName.value = "$rotation"
    nodeName = props.node.name; //props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.transformations`, 3);
  }
  else if (props.node instanceof SEReflection) {
    iconName.value = "$reflection"
    nodeName = props.node.name; // props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.transformations`, 3);
  }
  else if (props.node instanceof SEPointReflection) {
    iconName.value = "$pointReflection"
    nodeName = props.node.name; // props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.transformations`, 3);
  }
  else if (props.node instanceof SEInversion) {
    iconName.value = "$inversion"
    nodeName = props.node.name; //props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.transformations`, 3);
  }
  else if (props.node instanceof SEAngleMarker) {
    iconName.value = "$angle"
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.angleMarkers`, 3);
  }
  else if (
    props.node instanceof SEPolygon &&
    props.node.seEdgeSegments.length === 3
  ) {
    iconName.value = "$measureTriangle"
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.triangles`, 3);
  }
  else if (props.node instanceof SEPolygon) {
    iconName.value = "$measurePolygon"
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.polygons`, 3);
  }
  else if (props.node instanceof SESegmentLength) {
    iconName.value = "$segmentLength"
    nodeName = props.node.seSegment.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.measurements`, 3);
  }
  else if (props.node instanceof SEPointDistance) {
    iconName.value = "$pointDistance"
    nodeName = props.node.name; //props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.measurements`, 3);
  }
  else if (props.node instanceof SECalculation) {
    iconName.value = "$calculationObject"
    nodeName = props.node.name; //props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.calculations`, 3);
  }
  else if (props.node instanceof SEExpression) {
    iconName.value = "$measurementObject"
    nodeName = props.node.name; //props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.measurements`, 3);
  }

});

onMounted((): void => {
  if (props.node instanceof SEParametric) {
    curve = props.node;
    // const pt = new Point();
    curvePoint = curve.tracePoint;
    const [tMin, tMax] = curve.tMinMaxExpressionValues();
    parametricTMin.value = tMin;
    parametricTMax.value = tMax;
    parametricTStep.value = (tMax - tMin) / 100;
    onParametricTimeChanged(tMin);
  }
});

function glowMe(flag: boolean): void {
  /* If the highlighted object is plottable, we highlight
       it directly. Otherwise, we highlight its parents */
  if (isPlottable) props.node.glowing = flag;
  else if (props.node instanceof SESegmentLength) {
    const target = props.node.parents[0] as SESegment;
    target.glowing = flag;
  } else if (props.node instanceof SEPointDistance) {
    props.node.parents
      .map(n => n as SEPoint)
      .forEach((p: SEPoint) => {
        p.glowing = flag;
      });
  } else if (props.node instanceof SEPolygon) {
    props.node.seEdgeSegments
      .map(n => n as SESegment)
      .forEach((p: SESegment) => {
        p.glowing = flag;
      });
  } else if (props.node instanceof SEPointCoordinate) {
    const target = props.node.point as SEPoint;
    target.glowing = flag;
  } else if (props.node instanceof SETranslation) {
    const target = props.node.seLineOrSegment as SESegment;
    target.glowing = flag;
  } else if (props.node instanceof SEPointReflection) {
    const target = props.node.sePointOfReflection as SEPoint;
    target.glowing = flag;
  } else if (props.node instanceof SEReflection) {
    const target = props.node.seLineOrSegment as SESegment;
    target.glowing = flag;
  } else if (props.node instanceof SERotation) {
    const target = props.node.seRotationPoint as SEPoint;
    target.glowing = flag;
  } else if (props.node instanceof SEInversion) {
    const target = props.node.seCircleOfInversion as SECircle;
    target.glowing = flag;
  }

  if (props.node instanceof SEExpression) {
    EventBus.fire("measured-circle-set-temporary-radius", {
      display: flag,
      radius: props.node.value
    });
  }
}

function selectMe(): void {
  // console.log("Clicked", props.node.name);
  if (props.node instanceof SEExpression) {
    emit("object-select", { id: props.node.id });
    EventBus.fire("set-expression-for-tool", {
      expression: props.node
    });
  } else if (props.node instanceof SETransformation) {
    EventBus.fire("set-transformation-for-tool", {
      transformation: props.node
    });
  }
}

function toggleVisibility(): void {
  new SetNoduleDisplayCommand(props.node, !props.node.showing).execute();
  visibilityUpdateKey.value += 1;
  labelVisibilityUpdateKey.value += 1;
}
function toggleLabelDisplay(): void {
  if (
    props.node instanceof SEPoint ||
    props.node instanceof SELine ||
    props.node instanceof SESegment ||
    props.node instanceof SECircle ||
    props.node instanceof SEEllipse ||
    props.node instanceof SEAngleMarker ||
    props.node instanceof SEParametric ||
    props.node instanceof SEPolygon
  ) {
    if (props.node.label) {
      new SetNoduleDisplayCommand(
        props.node.label,
        !props.node.label.showing
      ).execute();
    }
  }
  visibilityUpdateKey.value += 1; // Without this, the display icon doesn't change between the two showing and not showing variants.
  labelVisibilityUpdateKey.value += 1; // Without this, the label icon doesn't change between the two showing and not showing variants.
}
function copyToClipboard(): void {
  if (props.node instanceof SEExpression) {
    navigator.clipboard.writeText(String(props.node.value)).then(() =>
      EventBus.fire("show-alert", {
        key: "objectTree.copiedMeasurementSuccessfullyToClipboard",
        type: "success"
      })
    );
  }
}

function deleteNode(): void {
  //Trigger event in sphereFrame to use the delete tool to delete the object and all its descendants
  EventBus.fire("delete-node", {
    victim: props.node,
    victimName: nodeName,
    victimType: nodeType
  });
  // when deleting mesurements, the measure object(if any) must be unglowed
  seStore.unglowAllSENodules();
}

function cycleValueDisplayMode(): void {
  // If the user clicks this they the want to have the label showing so turn it on
  if (props.node instanceof SEAngleMarker) {
    if (props.node.label) {
      if (!props.node.label.showing) {
        new SetNoduleDisplayCommand(props.node.label, true).execute();
      }
    }
  } else if (props.node instanceof SESegmentLength) {
    if (props.node.seSegment.label) {
      if (!props.node.seSegment.label.showing) {
        new SetNoduleDisplayCommand(props.node.seSegment.label, true).execute();
      }
    }
  } else if (props.node instanceof SEPolygon) {
    if (props.node.label) {
      if (!props.node.label.showing) {
        new SetNoduleDisplayCommand(props.node.label, true).execute();
      }
    }
  }
  const oldValueDisplayMode = (props.node as SEExpression).valueDisplayMode;
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
    props.node as SEExpression,
    oldValueDisplayMode,
    newValueDisplayMode
  ).execute();
  // update a parent (who is parent to both this measurement and the label) to update the display on the sphere canvas
  // if (!(props.node instanceof SECalculation)) {
  //   props.node.parents[0].markKidsOutOfDate();
  //   props.node.parents[0].update();
  // }
  // console.debug(
  //   `Cycle display mode: node ${props.node.name}, new mode: ${newValueDisplayMode}`
  // );
  visibilityUpdateKey.value += 1;
  labelVisibilityUpdateKey.value += 1;
}

watch(() => parametricTime.value, onParametricTimeChanged);

function onParametricTimeChanged(tVal: number): void {
  if (curve && curvePoint) {
    curvePoint.setLocationByTime(tVal);
    curvePoint.markKidsOutOfDate();
    curvePoint.update();
  }
}

function animateCurvePoint(): void {
  const repeatCount = Math.ceil(
    (parametricTMax.value - parametricTMin.value) / parametricTStep.value
  );
  parametricTime.value = parametricTMin.value;
  const timer = setInterval(() => {
    if (parametricTime.value <= parametricTMax.value) {
      parametricTime.value += parametricTStep.value;
    }
  }, 100);
  setTimeout(() => {
    console.debug("Stop the interval timer");
    clearInterval(timer);
  }, repeatCount * 100);
}

const isHidden = computed((): boolean => {
  return !props.node.showing;
});
const isLabelHidden = computed((): boolean => {
  if (
    props.node instanceof SEPoint ||
    props.node instanceof SELine ||
    props.node instanceof SESegment ||
    props.node instanceof SECircle ||
    props.node instanceof SEEllipse ||
    props.node instanceof SEAngleMarker ||
    props.node instanceof SEParametric ||
    props.node instanceof SEPolygon
  ) {
    return !props.node.label?.showing;
  }
  return false;
});
const isExpressionAndNotCoordinate = computed((): boolean => {
  return (
    props.node instanceof SEExpression &&
    !(props.node instanceof SEPointCoordinate)
  );
});

const isMeasurement = computed((): boolean => {
    return props.node instanceof SEExpression;
});
// const isSlider = computed((): boolean { // Not needed as SESlider items are sorted in SENoduleList
//   return props.node instanceof SESlider;
// }

const isParametric = computed((): boolean => {
  // return props.node instanceof SEParametric;
  if (props.node instanceof SEParametric) {
    nodeName = props.node.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.parametrics`, 3);
    return true;
  }
  return false;
});

const isNSectPoint = computed((): boolean => {
  //return props.node instanceof SENSectPoint;
  return false;
});

const isTangent = computed((): boolean => {
  //return props.node instanceof SETangentLineThruPoint;
  return false;
});

const isPlottable = computed((): boolean => {
  return (
    props.node instanceof SEPoint ||
    props.node instanceof SELine ||
    props.node instanceof SESegment ||
    props.node instanceof SECircle ||
    props.node instanceof SEEllipse ||
    props.node instanceof SEAngleMarker ||
    props.node instanceof SEParametric ||
    props.node instanceof SEPolygon
  );
});

const showClass = computed((): string => {
  visibilityUpdateKey.value += 1; // if we don't do this, then for a user created point, undoing/redoing doesn't update the icon between eye/slash eye. This issue is revealed when 1) Draw two lines 2) use point tool to create the intersection 3) hide the intersection with the object panel icon 4) undo button on sphere frame
  labelVisibilityUpdateKey.value += 1; //
  return props.node.showing ? "visibleNode" : "invisibleNode";
});

//only shake the measurement icons initially when the measured circle tool is selected (There should also be a message displayed telling the user to select a measurement)
const animationClassName = computed((): string => {
  if (actionMode.value === "measuredCircle" && props.node instanceof SEEllipse)
    return "shake";
  if (
    actionMode.value === "applyTransformation" &&
    props.node instanceof SETransformation
  )
    return "shake";
  return "";
});
const shakeMeasurementDisplay = computed((): string => {
  return actionMode.value === "measuredCircle" &&
    props.node instanceof SEExpression
    ? "shake"
    : "";
});

//only shake the transformation icons initially when the apply transformations tool is selected (There should also be a message displayed telling the user to select a translation)
const shakeTransformationDisplay = computed((): string => {
  return actionMode.value === "applyTransformation" &&
    props.node instanceof SETransformation
    ? "shake"
    : "";
});

const shortDisplayText = computed((): string => {
  return props.node.noduleItemText;
});
const definitionText = computed((): string => {
  return props.node.noduleDescription;
});
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
