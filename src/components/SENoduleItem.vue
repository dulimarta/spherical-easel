<template>
  <div @mouseenter="glowMe(true)" @mouseleave="glowMe(false)" class="nodeItem">
    <v-icon size="medium" :icon="iconName" :class="animationClassName"></v-icon>
    <v-tooltip location="end">
      <template v-slot:activator="{ props }">
        <div
          data-testid="_test_selection"
          class="contentText"
          @click="selectMe"
          v-bind="props"
          :class="[
            showClass,
            shakeMeasurementDisplay,
            shakeTransformationDisplay
          ]">
          <span class="text-truncate ml-1" :key="displayCycleValueUpdateKey">
            {{ node.noduleItemText }}
          </span>
        </div>
      </template>
      <span>{{ node.noduleDescription }} / {{ nodeName }}</span>
    </v-tooltip>
    <span style="flex-grow: 1">
      <!-- This is a spacer to push both groups to the left and right-->
    </span>
    <v-tooltip location="end">
      <template v-slot:activator="{ props }">
        <div
          id="_test_copy_to_clipboard"
          v-if="isMeasurement && supportsClipboard"
          v-bind="props"
          @click="copyToClipboard">
          <v-icon size="small">mdi-content-copy</v-icon>
        </div>
      </template>
      <span>{{ t("copyToClipboard") }}</span>
    </v-tooltip>
    <v-tooltip location="end">
      <template v-slot:activator="{ props }">
        <div
          id="_test_toggle_format"
          v-if="isExpressionAndNotCoordinateNotEarthMode"
          v-bind="props"
          @click="cycleValueDisplayMode">
          <v-icon size="small">mdi-autorenew</v-icon>
        </div>
      </template>
      <span>{{ t("cycleValueDisplayMode") }}</span>
    </v-tooltip>
    <v-tooltip location="end">
      <template v-slot:activator="{ props }">
        <v-icon
          data-testid="toggle_visibility"
          v-if="isPlottable && isNotPolygonWithNoFill"
          v-bind="props"
          @click="toggleVisibility"
          size="small"
          :icon="node.showing ? 'mdi-eye-off' : 'mdi-eye'"
          :key="visibilityUpdateKey"
          :style="{ color: node.showing ? 'gray' : 'black' }" />
      </template>
      <span>{{ t("toggleDisplay") }}</span>
    </v-tooltip>
    <v-tooltip location="end">
      <template v-slot:activator="{ props }">
        <v-icon
          id="_toggle_label_display"
          v-if="isPlottable && isNotText"
          v-bind="props"
          @click="toggleLabelDisplay"
          size="small"
          :icon="
            isLabelHidden() ? 'mdi-label-outline' : 'mdi-label-off-outline'
          "
          :style="{ color: isLabelHidden() ? 'inherit' : 'gray' }"
          :key="labelVisibilityUpdateKey"></v-icon>
      </template>
      <span>{{ t("toggleLabelDisplay") }}</span>
    </v-tooltip>
    <v-tooltip location="end">
      <template v-slot:activator="{ props }">
        <div id="_delete_node" v-bind="props" @click="deleteNode">
          <v-icon size="small" icon="mdi-delete" />
        </div>
      </template>
      <span>{{ t("deleteNode") }}</span>
    </v-tooltip>
    <!--v-icon v-else-if="isParametric" medium>
            $parametric
          </v-icon>
          <v-slider
            v-model="parametricTime"
            :min="parametricTMin"
            :max="parametricTMax"
            :step="parametricTStep" />
          <v-icon @click="animateCurvePoint">mdi-run</v-icon-->
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
import { FillStyle, ValueDisplayMode } from "@/types";
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
import { Vector3 } from "three";
import { SEText } from "@/models/SEText";
import Nodule from "../plottables/Nodule";
import { CommandGroup } from "@/commands/CommandGroup";
import { ChangeFillStyleCommand } from "@/commands/ChangeFillStyleCommand";
const seStore = useSEStore();
const { actionMode, isEarthMode, inverseTotalRotationMatrix } =
  storeToRefs(seStore);
const props = defineProps<{
  node: SENodule;
}>();
const emit = defineEmits(["object-select"]);
const { t } = useI18n();

const visibilityUpdateKey = ref(1); //If we don't use this even in Vue 3, the the icons for visibility do not alternate between a closed eye and an open eye. It would only display the initial icon.
const labelVisibilityUpdateKey = ref(1); //If we don't use this even in Vue 3, the the icons for visibility do not alternate between a label and a label with a slash. It would only display the initial icon.
const displayCycleValueUpdateKey = ref(1); //If we don't use this even in Vue 3, the the clicking the cycle display mode icon doesn't update display type of the value (it would change in the canvas, but not in the object tree). It would only display in the initial display mode.

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
const tempVec = new Vector3();

onBeforeMount(() => {
  if (navigator.clipboard) {
    supportsClipboard.value = true;
  }
  const theLabel = props.node.getLabel();
  if (theLabel) {
    nodeName = theLabel.ref.shortUserName ?? "";
  } else {
    nodeName = props.node.name;
  }
  //NP find the north and south pole
  if (props.node instanceof SEPoint) {
    tempVec.copy(props.node.locationVector);
    // transform the pt back to standard position
    tempVec.applyMatrix4(inverseTotalRotationMatrix.value);
    if (Math.abs(tempVec.y - 1) < SETTINGS.tolerance) {
      console.log("object tree - found north pole");
      isNorthPole = true;
    } else if (Math.abs(tempVec.y + 1) < SETTINGS.tolerance) {
      console.log("object tree - found south pole");
      isSouthPole = true;
    }
  }
  if (false) {
  } else if (props.node instanceof SEEarthPoint) {
    // All the point subclasses with SEPoint last
    iconName.value = "$earthPoint";
    nodeType = t(`point`);
  } else if (props.node instanceof SEAntipodalPoint) {
    iconName.value = "$antipodalPoint";
    nodeType = t(`point`);
  } else if (props.node instanceof SEIntersectionPoint) {
    iconName.value = "$intersect";
    nodeType = t(`point`);
  } else if (props.node instanceof SENSectPoint) {
    iconName.value = props.node.N === 2 ? "$midpoint" : "$nSectPoint";
    nodeType = t(`point`);
  } else if (props.node instanceof SEPolarPoint) {
    iconName.value = "$polar";
    nodeType = t(`point`);
  } else if (
    props.node instanceof SETransformedPoint ||
    props.node instanceof SEInversionCircleCenter
  ) {
    iconName.value = "$transformedPoint";
    nodeType = t(`point`);
  } else if (props.node instanceof SEPointOnOneOrTwoDimensional) {
    iconName.value = "$pointOnObject";
    nodeType = t(`point`);
  } else if (props.node instanceof SEPoint) {
    iconName.value = "$point";
    nodeType = t(`point`);
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
    nodeType = t(`circle`);
  } else if (props.node instanceof SELatitude) {
    iconName.value = "$earthLatitude";
    nodeType = t(`circle`);
    if (props.node.latitude == 0) {
      isEquator = true;
    }
  } else if (props.node instanceof SECircle) {
    iconName.value = "$circle";
    nodeType = t(`circle`);
  } else if (props.node instanceof SEIsometryEllipse) {
    // All the SEEllipse subclasses with SEEllipse last
    iconName.value = "$transformedEllipse";
    nodeType = t(`ellipse`);
  } else if (props.node instanceof SEEllipse) {
    iconName.value = "$ellipse";
    nodeType = t(`ellipse`);
  } else if (props.node instanceof SEInversion) {
    // All the transformation classes
    iconName.value = "$inversion";
    nodeType = t(`transformation`);
  } else if (props.node instanceof SEPointReflection) {
    iconName.value = "$pointReflection";
    nodeType = t(`transformation`);
  } else if (props.node instanceof SEReflection) {
    iconName.value = "$reflection";
    nodeType = t(`transformation`);
  } else if (props.node instanceof SERotation) {
    iconName.value = "$rotation";
    nodeType = t(`transformation`);
  } else if (props.node instanceof SETranslation) {
    iconName.value = "$translation";
    nodeType = t(`transformation`);
  } // All the SELine subclasses with SELine last
  else if (props.node instanceof SEPerpendicularLineThruPoint) {
    iconName.value = "$perpendicular";
    nodeType = t(`line`);
  } else if (props.node instanceof SEIsometryLine) {
    iconName.value = "$transformedLine";
    nodeName = props.node.name;
    nodeType = t(`line`);
  } else if (props.node instanceof SENSectLine) {
    iconName.value = props.node.N === 2 ? "$angleBisector" : "$nSectLine";
    nodeType = t(`line`);
  } else if (props.node instanceof SEPolarLine) {
    iconName.value = "$polar";
    nodeType = t(`line`);
  } else if (props.node instanceof SETangentLineThruPoint) {
    iconName.value = "$tangent";
    nodeType = t(`line`);
  } else if (props.node instanceof SELine) {
    iconName.value = "$line";
    nodeType = t(`line`);
  } //All the SESegment subclasses with SESegment last
  else if (props.node instanceof SEIsometrySegment) {
    iconName.value = "$transformedSegment";
    nodeName = props.node.name;
    nodeType = t(`segment`);
  } else if (props.node instanceof SELongitude) {
    iconName.value = "$earthLongitude";
    nodeType = t(`segment`);
    if (props.node.longitude == 0) {
      isPrimeMeridian = true;
    }
  } else if (props.node instanceof SESegment) {
    iconName.value = "$segment";
    nodeType = t(`segment`);
  } // All the SEExpression subclasses with SEExpression last
  else if (props.node instanceof SEAngleMarker) {
    iconName.value = "$angle";
    nodeType = t(`angleMarker`);
  } else if (props.node instanceof SEPolygon) {
    iconName.value =
      props.node.seEdgeSegments.length === 3
        ? "$measureTriangle"
        : "$measurePolygon";
    nodeType = t(`triangle`);
  } else if (props.node instanceof SESegmentLength) {
    iconName.value = "$segmentLength";
    nodeType = t(`measurement`);
  } else if (props.node instanceof SEPointDistance) {
    iconName.value = "$pointDistance";
    nodeName = props.node.name;
    nodeType = t(`measurement`);
  } else if (props.node instanceof SECalculation) {
    iconName.value = "$calculationObject";
    nodeName = props.node.name;
    nodeType = t(`calculation`);
  } else if (props.node instanceof SEExpression) {
    iconName.value = "$measurementObject";
    nodeName = props.node.name;
    nodeType = t(`measurement`);
  }
  //TextTool Attempt
  else if (props.node instanceof SEText) {
    iconName.value = "$text";
    nodeName = props.node.name;
    nodeType = t(`text`);
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
  EventBus.listen(
    "update-label-and-showing-and-measurement-display",
    updateVisibilityKeys
  );
});

// noduleItemText is abstract, need to override it. (SEText.ts)
watch(() => props.node.noduleItemText, updateVisibilityKeys);
// Without this, the display/label icon doesn't change between the two showing and not showing variants and the display cycle mode doesn't update
function updateVisibilityKeys() {
  // console.log("UPDATE seNoduleItem Visibility keys");
  visibilityUpdateKey.value = 1 - visibilityUpdateKey.value;
  labelVisibilityUpdateKey.value = visibilityUpdateKey.value;
  displayCycleValueUpdateKey.value = visibilityUpdateKey.value;
}

onBeforeUnmount((): void => {
  EventBus.unlisten("update-label-and-showing-and-measurement-display");
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
  const cmdGroup = new CommandGroup();
  // console.log(`${props.node.name} is showing? ${props.node.showing}`)
  // if (
  //   (props.node instanceof SEPolygon|| props.node instanceof SECircle) &&
  //   Nodule.getFillStyle() == FillStyle.NoFill && !props.node.showing
  // ) {
  //   // turn on the fill
  //   cmdGroup.addCommand(
  //     new ChangeFillStyleCommand(FillStyle.ShadeFill, FillStyle.NoFill)
  //   );
  // }
  cmdGroup
    .addCommand(new SetNoduleDisplayCommand(props.node, !props.node.showing))
    .execute();
  updateVisibilityKeys(); // Without this, the display/label icon doesn't change between the two showing and not showing variants.
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
  updateVisibilityKeys(); // Without this, the display/label icon doesn't change between the two showing and not showing variants.
}

function copyToClipboard(): void {
  if (props.node instanceof SEExpression) {
    navigator.clipboard.writeText(String(props.node.value)).then(() =>
      EventBus.fire("show-alert", {
        key: t("copiedMeasurementSuccessfullyToClipboard"),
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
  updateVisibilityKeys();
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
    nodeType = t(`objects.parametric`);
    return true;
  }
  return false;
});

const isNotPolygonWithNoFill = computed((): boolean => {
  return !(
    props.node instanceof SEPolygon && Nodule.getFillStyle() == FillStyle.NoFill
  );
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
    props.node instanceof SEPolygon ||
    props.node instanceof SEText
  );
});

const isNotText = computed((): boolean => {
  return !(props.node instanceof SEText);
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
// @use "../scss/settings.scss";

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
  color: rgb(0, 0, 0);
  padding-left: 8px;
  padding-top: 2px;
  padding-bottom: 2px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.nodeItem,
.visibleNode {
  padding-left: 8px;
  padding-top: 2px;
  padding-bottom: 2px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  // align-items: center;
  // margin: 0 0.25em;
  // .contentText {
  //   // Expand to fill in the remaining available space
  //   // flex-grow: 1;
  // }
  // v-icon {
  //   // Icons should not grow, just fit to content
  //   // flex-grow: 0;
  // }
  &:hover {
    /* Change background on mouse hover only for nodes
       i.e. do not change background on labels */
    // background-color: var(--v-theme-primary);
    background-color: lightgray;
  }
}
.nodeItem :hover {
  // background-color: green;
}
</style>
<i18n lang="json" locale="en">
{
  "copyToClipboard": "Copy the value of the measurement to the clipboard.",
  "copiedMeasurementSuccessfullyToClipboard": "Successfully copied the measurement value to the clipboard!",
  "cycleValueDisplayMode": "Click to cycle to the next value display mode including multiples of pi and degrees.",
  "deleteNode": "Delete the selected object.",
  "toggleLabelDisplay": "Toggle the display of the corresponding label.",
  "toggleDisplay": "Toggle the display of the corresponding object.",
  "circle": "Circle",
  "line": "Line",
  "point": "Point",
  "ellipse": "Ellipse",
  "segment": "Segment",
  "transformation": "Transformation",
  "text": "Text",
  "angleMarker": "Angle Marker",
  "triangle": "Triangle",
  "measurement": "Measurement",
  "polygon": "Polygon",
  "calculation": "Calculation"
}
</i18n>
