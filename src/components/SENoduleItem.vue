<template>
  <div>
    <v-container
      class="node"
      @mouseenter="glowMe(true)"
      @mouseleave="glowMe(false)">
      <v-row density="compact" justify="start" class="pa-0">
        <v-col cols="auto">
          <v-icon
            size="medium"
            :icon="iconName"
            :class="animationClassName"></v-icon>
          <!--v-icon v-else-if="isParametric" medium>
            $parametric
          </v-icon-->
        </v-col>
        <v-col class="text-truncate">
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
                <span class="text-truncate ml-1">
                  {{ node.noduleItemText }}
                </span>
              </div>
            </template>
            <span>{{ node.noduleDescription }}/ {{ nodeName }}</span>
          </v-tooltip>
        </v-col>
        <v-col justify="end">
          <v-row align="center" no-gutters>
            <v-col>
              <v-tooltip location="end">
                <template v-slot:activator="{ props }">
                  <div
                    id="_test_copy_to_clipboard"
                    v-if="isMeasurement && supportsClipboard"
                    v-bind="props"
                    @click="copyToClipboard">
                    <v-icon size="small">$copyToClipboard</v-icon>
                  </div>
                </template>
                <span>{{ $t(`objectTree.copyToClipboard`) }}</span>
              </v-tooltip>
            </v-col>
          </v-row>
        </v-col>
        <v-col>
          <v-tooltip location="end">
            <template v-slot:activator="{ props }">
              <div
                id="_test_toggle_format"
                v-if="isExpressionAndNotCoordinateNotEarthMode"
                v-bind="props"
                @click="cycleValueDisplayMode">
                <v-icon size="small">$cycleNodeValueDisplayMode</v-icon>
              </div>
            </template>
            <span>{{ $t(`objectTree.cycleValueDisplayMode`) }}</span>
          </v-tooltip>
        </v-col>
        <v-col>
          <v-tooltip location="end">
            <template v-slot:activator="{ props }">
              <v-icon
                id="_test_toggle_visibility"
                v-if="isPlottable"
                v-bind="props"
                @click="toggleVisibility"
                size="tiny"
                :icon="node.showing ? '$hideNode' : '$showNode'"
                :key="visibilityUpdateKey"
                :style="{ color: node.showing ? 'gray' : 'black' }" />
            </template>
            <span>{{ $t(`objectTree.toggleDisplay`) }}</span>
          </v-tooltip>
        </v-col>
        <v-col>
          <v-tooltip location="end">
            <template v-slot:activator="{ props }">
              <v-icon
                id="_toggle_label_display"
                v-if="isPlottable"
                v-bind="props"
                @click="toggleLabelDisplay"
                size="small"
                :icon="isLabelHidden() ? '$showNodeLabel' : '$hideNodeLabel'"
                :style="{ color: isLabelHidden() ? 'inherit' : 'gray' }"
                :key="labelVisibilityUpdateKey"></v-icon>
            </template>
            <span>{{ $t(`objectTree.toggleLabelDisplay`) }}</span>
          </v-tooltip>
        </v-col>
        <v-col>
          <v-tooltip location="end">
            <template v-slot:activator="{ props }">
              <div id="_delete_node" v-bind="props" @click="deleteNode">
                <v-icon size="small" icon="$deleteNode" />
              </div>
            </template>
            <span>{{ $t(`objectTree.deleteNode`) }}</span>
          </v-tooltip>
        </v-col>
      </v-row>
      <!--v-row v-if="isParametric">
        <v-col cols="auto"> t = {{ parametricTime.toFixed(3) }} </v-col>
        <v-col>
          <v-slider
            v-model="parametricTime"
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
import {
  computed,
  onBeforeUnmount,
  onBeforeMount,
  onMounted,
  ref,
  Ref,
  watch
} from "vue";
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
import SETTINGS from "@/global-settings";
import { SEEarthPoint } from "@/models/SEEarthPoint";
import { Poles } from "@/types";
import { SELatitude } from "@/models/SELatitude";
import { SELongitude } from "@/models/SELongitude";
const seStore = useSEStore();
const { actionMode, isEarthMode } = storeToRefs(seStore);
const props = defineProps<{
  node: SENodule;
}>();
const emit = defineEmits(["object-select"]);
const { t } = useI18n();

const visibilityUpdateKey = ref(1); //If we don't use this even in Vue 3, the the icons for visibility do not alternate between a closed eye and an open eye. It would only display the initial icon.
const labelVisibilityUpdateKey = ref(1); //If we don't use this even in Vue 3, the the icons for visibility do not alternate between a label and a label with a slash. It would only display the initial icon.
const iconName = ref("mdi-help");
// const rotationMatrix = new Matrix4();
// private traceLocation = new Vector3();
let nodeName = "";
let nodeType = "";

let isNorthPole = false; //NP
let isSouthPole = false;
let isEquator = false;
let isPrimeMeridian = false;
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
  if (props.node.isLabelable()) {
    nodeName = (props.node as any).label?.ref.shortUserName ?? "";
  } else {
    nodeName = props.node.name;
  }
  if (false) {
  } else if (props.node instanceof SEEarthPoint) {
    // All the point subclasses with SEPoint last
    iconName.value = "$earthPoint";
    nodeType = t(`objects.points`, 3);
    //NP
    if (props.node.latitude == 90 && props.node.longitude == 0) {
      isNorthPole = true;
    } else if (props.node.latitude == -90 && props.node.longitude == 0) {
      isSouthPole = true;
    }
  } else if (props.node instanceof SEAntipodalPoint) {
    iconName.value = "$antipodalPoint";
    nodeType = t(`objects.points`, 3);
  } else if (props.node instanceof SEIntersectionPoint) {
    iconName.value = "$intersect";
    nodeType = t(`objects.points`, 3);
  } else if (props.node instanceof SENSectPoint) {
    iconName.value = props.node.N === 2 ? "$midpoint" : "$nSectPoint";
    nodeType = t(`objects.points`, 3);
  } else if (props.node instanceof SEPolarPoint) {
    iconName.value = "$polar";
    nodeType = t(`objects.points`, 3);
  } else if (
    props.node instanceof SETransformedPoint ||
    props.node instanceof SEInversionCircleCenter
  ) {
    iconName.value = "$transformedPoint";
    nodeType = t(`objects.points`, 3);
  } else if (props.node instanceof SEPointOnOneOrTwoDimensional) {
    iconName.value = "$pointOnObject";
    nodeType = t(`objects.points`, 3);
  } else if (props.node instanceof SEPoint) {
    iconName.value = "$point";
    nodeType = t(`objects.points`, 3);
  } else if (
    props.node instanceof SEIsometryCircle ||
    (props.node instanceof SECircle &&
      props.node.circleSEPoint instanceof SETransformedPoint &&
      props.node.centerSEPoint instanceof SEInversionCircleCenter &&
      props.node.centerSEPoint.parentTransformation.name ===
        props.node.circleSEPoint.parentTransformation.name)
  ) {
    // All the SECircle subclasses with SECircle last
    iconName.value = "$transformedCircle";
    nodeType = t(`objects.circles`, 3);
  } else if (props.node instanceof SELatitude) {
    iconName.value = "$earthLatitude";
    nodeType = t(`objects.circle`, 3);
    if (props.node.latitude == 0) {
      isEquator = true;
    }
  } else if (props.node instanceof SECircle) {
    iconName.value = "$circle";
    nodeType = t(`objects.circles`, 3);
  } else if (props.node instanceof SEIsometryEllipse) {
    // All the SEEllipse subclasses with SEEllipse last
    iconName.value = "$transformedEllipse";
    nodeType = t(`objects.ellipses`, 3);
  } else if (props.node instanceof SEEllipse) {
    iconName.value = "$ellipse";
    nodeType = t(`objects.ellipses`, 3);
  } else if (props.node instanceof SEInversion) {
    // All the transformation classes
    iconName.value = "$inversion";
    nodeType = t(`objects.transformations`, 3);
  } else if (props.node instanceof SEPointReflection) {
    iconName.value = "$pointReflection";
    nodeType = t(`objects.transformations`, 3);
  } else if (props.node instanceof SEReflection) {
    iconName.value = "$reflection";
    nodeType = t(`objects.transformations`, 3);
  } else if (props.node instanceof SERotation) {
    iconName.value = "$rotation";
    nodeType = t(`objects.transformations`, 3);
  } else if (props.node instanceof SETranslation) {
    iconName.value = "$translation";
    nodeType = t(`objects.transformations`, 3);
  } // All the SELine subclasses with SELine last
  else if (props.node instanceof SEPerpendicularLineThruPoint) {
    iconName.value = "$perpendicular";
    nodeType = t(`objects.lines`, 3);
  } else if (props.node instanceof SEIsometryLine) {
    iconName.value = "$transformedLine";
    nodeName = props.node.name;
    nodeType = t(`objects.lines`, 3);
  } else if (props.node instanceof SENSectLine) {
    iconName.value = props.node.N === 2 ? "$angleBisector" : "$nSectLine";
    nodeType = t(`objects.lines`, 3);
  } else if (props.node instanceof SEPolarLine) {
    iconName.value = "$polar";
    nodeType = t(`objects.lines`, 3);
  } else if (props.node instanceof SETangentLineThruPoint) {
    iconName.value = "$tangent";
    nodeType = t(`objects.lines`, 3);
  } else if (props.node instanceof SELine) {
    iconName.value = "$line";
    nodeType = t(`objects.lines`, 3);
  } //All the SESegment subclasses with SESegment last
  else if (props.node instanceof SEIsometrySegment) {
    iconName.value = "$transformedSegment";
    nodeName = props.node.name;
    nodeType = t(`objects.segments`, 3);
  } else if (props.node instanceof SELongitude) {
    iconName.value = "$earthLongitude";
    nodeType = t(`objects.segments`, 3);
    if (props.node.longitude == 0) {
      isPrimeMeridian = true;
    }
  } else if (props.node instanceof SESegment) {
    iconName.value = "$segment";
    nodeType = t(`objects.segments`, 3);
  } // All the SEExpression subclasses with SEExpression last
  else if (props.node instanceof SEAngleMarker) {
    iconName.value = "$angle";
    nodeType = t(`objects.angleMarkers`, 3);
  } else if (props.node instanceof SEPolygon) {
    iconName.value =
      props.node.seEdgeSegments.length === 3
        ? "$measureTriangle"
        : "$measurePolygon";
    nodeType = t(`objects.triangles`, 3);
  } else if (props.node instanceof SESegmentLength) {
    iconName.value = "$segmentLength";
    nodeType = t(`objects.measurements`, 3);
  } else if (props.node instanceof SEPointDistance) {
    iconName.value = "$pointDistance";
    nodeName = props.node.name;
    nodeType = t(`objects.measurements`, 3);
  } else if (props.node instanceof SECalculation) {
    iconName.value = "$calculationObject";
    nodeName = props.node.name;
    nodeType = t(`objects.calculations`, 3);
  } else if (props.node instanceof SEExpression) {
    iconName.value = "$measurementObject";
    nodeName = props.node.name;
    nodeType = t(`objects.measurements`, 3);
  }
});

onMounted((): void => {
  if (props.node instanceof SEParametric) {
    curve = props.node;
    curvePoint = curve.tracePoint;
    const [tMin, tMax] = curve.tMinMaxExpressionValues();
    parametricTMin.value = tMin;
    parametricTMax.value = tMax;
    parametricTStep.value = (tMax - tMin) / 100;
    onParametricTimeChanged(tMin);
  }
  EventBus.listen("update-label-and-showing-display", updateVisibilityKeys);
});

function updateVisibilityKeys() {
  visibilityUpdateKey.value = 1 - visibilityUpdateKey.value;
  labelVisibilityUpdateKey.value = visibilityUpdateKey.value;
}

onBeforeUnmount((): void => {
  EventBus.unlisten("update-label-and-showing-display");
});

function glowMe(flag: boolean): void {
  /* If the highlighted object is plottable, we highlight
       it directly. Otherwise, we highlight its parents */
  if (isPlottable.value) {
    props.node.glowing = flag;
  } else if (props.node instanceof SESegmentLength) {
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
  updateVisibilityKeys();
  //NP
  if (isNorthPole) {
    EventBus.fire("update-pole-switch", {
      pole: Poles.NORTH,
      val: props.node.showing
    });
  } else if (isSouthPole) {
    EventBus.fire("update-pole-switch", {
      pole: Poles.SOUTH,
      val: props.node.showing
    });
  } else if (isEquator) {
    EventBus.fire("update-equator-switch", { val: props.node.showing });
  } else if (isPrimeMeridian) {
    EventBus.fire("update-prime-meridian-switch", { val: props.node.showing });
  }
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
  updateVisibilityKeys();
  // labelVisibilityUpdateKey.value = 1 - labelVisibilityUpdateKey.value; // Without this, the label icon doesn't change between the two showing and not showing variants.
  // visibilityUpdateKey.value = labelVisibilityUpdateKey.value; // Without this, the display icon doesn't change between the two showing and not showing variants.
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
  // Compute the next valueDisplayMode so that we cycle through the different options (in earth mode it flips between km and mi)
  if (isEarthMode.value && !(props.node instanceof SEAngleMarker)) {
    // AngleMarkers units are never km or mi
    switch (oldValueDisplayMode) {
      case ValueDisplayMode.Number:
      case ValueDisplayMode.MultipleOfPi:
      case ValueDisplayMode.DegreeDecimals:
        newValueDisplayMode = (props.node as SEExpression)
          .postEarthModeValueDisplayMode;
        break;
      case ValueDisplayMode.EarthModeKilos:
        newValueDisplayMode = ValueDisplayMode.EarthModeMiles;
        break;
      case ValueDisplayMode.EarthModeMiles:
        newValueDisplayMode = ValueDisplayMode.EarthModeKilos;
        break;
    }
  } else {
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
      case ValueDisplayMode.EarthModeKilos:
      case ValueDisplayMode.EarthModeMiles:
        newValueDisplayMode = (props.node as SEExpression)
          .preEarthModeValueDisplayMode;
        break;
    }
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
  // visibilityUpdateKey.value += 1;
  // labelVisibilityUpdateKey.value += 1;
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

const isLabelHidden = (): boolean => {
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
};
const isExpressionAndNotCoordinateNotEarthMode = computed((): boolean => {
  if (isEarthMode) {
    return props.node instanceof SEExpression; // All measurement expressions are effect by Earth mode even point coordinates
  } else {
    return (
      props.node instanceof SEExpression &&
      !(props.node instanceof SEPointCoordinate)
    );
  }
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
  // visibilityUpdateKey.value += 1; // if we don't do this, then for a user created point, undoing/redoing doesn't update the icon between eye/slash eye. This issue is revealed when 1) Draw two lines 2) use point tool to create the intersection 3) hide the intersection with the object panel icon 4) undo button on sphere frame
  // labelVisibilityUpdateKey.value += 1; //
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

// const shortDisplayText = computed((): (() => string) => {
//   return () => props.node.noduleItemText;
// });

// const definitionText = computed((): (() => string) => {
//   return () => props.node.noduleDescription;
// });
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
