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
            {{ model.noduleItemText }}
          </span>
        </div>
      </template>
      <span>{{ model.noduleDescription }} / {{ nodeName }}</span>
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
          :icon="model.showing ? 'mdi-eye-off' : 'mdi-eye'"
          :key="visibilityUpdateKey"
          :style="{ color: model.showing ? 'gray' : 'black' }" />
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
const model = defineModel<SENodule>({ required: true });
const emit = defineEmits(["object-select"]);
const { t } = useI18n({ useScope: "local" });

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
  const theLabel = model.value.getLabel();
  if (theLabel) {
    nodeName = theLabel.ref.shortUserName ?? "";
  } else {
    nodeName = model.value.name;
  }
  //NP find the north and south pole
  if (model.value instanceof SEPoint) {
    tempVec.copy(model.value.locationVector);
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
  } else if (model.value instanceof SEEarthPoint) {
    // All the point subclasses with SEPoint last
    iconName.value = "$earthPoint";
    nodeType = t(`point`);
  } else if (model.value instanceof SEAntipodalPoint) {
    iconName.value = "$antipodalPoint";
    nodeType = t(`point`);
  } else if (model.value instanceof SEIntersectionPoint) {
    iconName.value = "$intersect";
    nodeType = t(`point`);
  } else if (model.value instanceof SENSectPoint) {
    iconName.value = model.value.N === 2 ? "$midpoint" : "$nSectPoint";
    nodeType = t(`point`);
  } else if (model.value instanceof SEPolarPoint) {
    iconName.value = "$polar";
    nodeType = t(`point`);
  } else if (
    model.value instanceof SETransformedPoint ||
    model.value instanceof SEInversionCircleCenter
  ) {
    iconName.value = "$transformedPoint";
    nodeType = t(`point`);
  } else if (model.value instanceof SEPointOnOneOrTwoDimensional) {
    iconName.value = "$pointOnObject";
    nodeType = t(`point`);
  } else if (model.value instanceof SEPoint) {
    iconName.value = "$point";
    nodeType = t(`point`);
  } else if (
    model.value instanceof SEIsometryCircle ||
    (model.value instanceof SECircle &&
      model.value.circleSEPoint instanceof SETransformedPoint &&
      model.value.centerSEPoint instanceof SEInversionCircleCenter &&
      model.value.centerSEPoint.parentTransformation.name ===
        model.value.circleSEPoint.parentTransformation.name)
  ) {
    // All the SECircle subclasses with SECircle last
    iconName.value = "$transformedCircle";
    nodeType = t(`circle`);
  } else if (model.value instanceof SELatitude) {
    iconName.value = "$earthLatitude";
    nodeType = t(`circle`);
    if (model.value.latitude == 0) {
      isEquator = true;
    }
  } else if (model.value instanceof SECircle) {
    iconName.value = "$circle";
    nodeType = t(`circle`);
  } else if (model.value instanceof SEIsometryEllipse) {
    // All the SEEllipse subclasses with SEEllipse last
    iconName.value = "$transformedEllipse";
    nodeType = t(`ellipse`);
  } else if (model.value instanceof SEEllipse) {
    iconName.value = "$ellipse";
    nodeType = t(`ellipse`);
  } else if (model.value instanceof SEInversion) {
    // All the transformation classes
    iconName.value = "$inversion";
    nodeType = t(`transformation`);
  } else if (model.value instanceof SEPointReflection) {
    iconName.value = "$pointReflection";
    nodeType = t(`transformation`);
  } else if (model.value instanceof SEReflection) {
    iconName.value = "$reflection";
    nodeType = t(`transformation`);
  } else if (model.value instanceof SERotation) {
    iconName.value = "$rotation";
    nodeType = t(`transformation`);
  } else if (model.value instanceof SETranslation) {
    iconName.value = "$translation";
    nodeType = t(`transformation`);
  } // All the SELine subclasses with SELine last
  else if (model.value instanceof SEPerpendicularLineThruPoint) {
    iconName.value = "$perpendicular";
    nodeType = t(`line`);
  } else if (model.value instanceof SEIsometryLine) {
    iconName.value = "$transformedLine";
    nodeName = model.value.name;
    nodeType = t(`line`);
  } else if (model.value instanceof SENSectLine) {
    iconName.value = model.value.N === 2 ? "$angleBisector" : "$nSectLine";
    nodeType = t(`line`);
  } else if (model.value instanceof SEPolarLine) {
    iconName.value = "$polar";
    nodeType = t(`line`);
  } else if (model.value instanceof SETangentLineThruPoint) {
    iconName.value = "$tangent";
    nodeType = t(`line`);
  } else if (model.value instanceof SELine) {
    iconName.value = "$line";
    nodeType = t(`line`);
  } //All the SESegment subclasses with SESegment last
  else if (model.value instanceof SEIsometrySegment) {
    iconName.value = "$transformedSegment";
    nodeName = model.value.name;
    nodeType = t(`segment`);
  } else if (model.value instanceof SELongitude) {
    iconName.value = "$earthLongitude";
    nodeType = t(`segment`);
    if (model.value.longitude == 0) {
      isPrimeMeridian = true;
    }
  } else if (model.value instanceof SESegment) {
    iconName.value = "$segment";
    nodeType = t(`segment`);
  } // All the SEExpression subclasses with SEExpression last
  else if (model.value instanceof SEAngleMarker) {
    iconName.value = "$angle";
    nodeType = t(`angleMarker`);
  } else if (model.value instanceof SEPolygon) {
    iconName.value =
      model.value.seEdgeSegments.length === 3
        ? "$measureTriangle"
        : "$measurePolygon";
    nodeType = t(`triangle`);
  } else if (model.value instanceof SESegmentLength) {
    iconName.value = "$segmentLength";
    nodeType = t(`measurement`);
  } else if (model.value instanceof SEPointDistance) {
    iconName.value = "$pointDistance";
    nodeName = model.value.name;
    nodeType = t(`measurement`);
  } else if (model.value instanceof SECalculation) {
    iconName.value = "$calculationObject";
    nodeName = model.value.name;
    nodeType = t(`calculation`);
  } else if (model.value instanceof SEExpression) {
    iconName.value = "$measurementObject";
    nodeName = model.value.name;
    nodeType = t(`measurement`);
  }
  //TextTool Attempt
  else if (model.value instanceof SEText) {
    iconName.value = "$text";
    nodeName = model.value.name;
    nodeType = t(`text`);
  }
});

onMounted((): void => {
  if (model.value instanceof SEParametric) {
    curve = model.value;
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
watch(() => model.value.noduleItemText, updateVisibilityKeys);
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
    model.value.glowing = flag;
  } else if (model.value instanceof SESegmentLength) {
    const target = model.value.parents[0] as SESegment;
    target.glowing = flag;
  } else if (model.value instanceof SEPointDistance) {
    model.value.parents
      .map(n => n as SEPoint)
      .forEach((p: SEPoint) => {
        p.glowing = flag;
      });
  } else if (model.value instanceof SEPolygon) {
    model.value.seEdgeSegments
      .map(n => n as SESegment)
      .forEach((p: SESegment) => {
        p.glowing = flag;
      });
  } else if (model.value instanceof SEPointCoordinate) {
    const target = model.value.point as SEPoint;
    target.glowing = flag;
  } else if (model.value instanceof SETranslation) {
    const target = model.value.seLineOrSegment as SESegment;
    target.glowing = flag;
  } else if (model.value instanceof SEPointReflection) {
    const target = model.value.sePointOfReflection as SEPoint;
    target.glowing = flag;
  } else if (model.value instanceof SEReflection) {
    const target = model.value.seLineOrSegment as SESegment;
    target.glowing = flag;
  } else if (model.value instanceof SERotation) {
    const target = model.value.seRotationPoint as SEPoint;
    target.glowing = flag;
  } else if (model.value instanceof SEInversion) {
    const target = model.value.seCircleOfInversion as SECircle;
    target.glowing = flag;
  }

  if (model.value instanceof SEExpression) {
    EventBus.fire("measured-circle-set-temporary-radius", {
      display: flag,
      radius: model.value.value
    });
  }
}

function selectMe(): void {
  // console.log("Clicked", model.value.name);
  if (model.value instanceof SEExpression) {
    emit("object-select", { id: model.value.id });
    EventBus.fire("set-expression-for-tool", {
      expression: model.value
    });
  } else if (model.value instanceof SETransformation) {
    EventBus.fire("set-transformation-for-tool", {
      transformation: model.value
    });
  }
}

function toggleVisibility(): void {
  const cmdGroup = new CommandGroup();
  // console.log(`${model.value.name} is showing? ${model.value.showing}`)
  // if (
  //   (model.value instanceof SEPolygon|| model.value instanceof SECircle) &&
  //   Nodule.getFillStyle() == FillStyle.NoFill && !model.value.showing
  // ) {
  //   // turn on the fill
  //   cmdGroup.addCommand(
  //     new ChangeFillStyleCommand(FillStyle.ShadeFill, FillStyle.NoFill)
  //   );
  // }
  cmdGroup
    .addCommand(new SetNoduleDisplayCommand(model.value, !model.value.showing))
    .execute();
  updateVisibilityKeys(); // Without this, the display/label icon doesn't change between the two showing and not showing variants.
  //NP
  if (isNorthPole) {
    EventBus.fire("update-pole-switch", {
      pole: Poles.NORTH,
      val: model.value.showing
    });
  } else if (isSouthPole) {
    EventBus.fire("update-pole-switch", {
      pole: Poles.SOUTH,
      val: model.value.showing
    });
  } else if (isEquator) {
    EventBus.fire("update-equator-switch", { val: model.value.showing });
  } else if (isPrimeMeridian) {
    EventBus.fire("update-prime-meridian-switch", {
      val: model.value.showing
    });
  }
}

function toggleLabelDisplay(): void {
  if (
    model.value instanceof SEPoint ||
    model.value instanceof SELine ||
    model.value instanceof SESegment ||
    model.value instanceof SECircle ||
    model.value instanceof SEEllipse ||
    model.value instanceof SEAngleMarker ||
    model.value instanceof SEParametric ||
    model.value instanceof SEPolygon
  ) {
    if (model.value.label) {
      new SetNoduleDisplayCommand(
        model.value.label,
        !model.value.label.showing
      ).execute();
    }
  }
  updateVisibilityKeys(); // Without this, the display/label icon doesn't change between the two showing and not showing variants.
}

function copyToClipboard(): void {
  if (model.value instanceof SEExpression) {
    navigator.clipboard.writeText(String(model.value.value)).then(() =>
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
    victim: model.value,
    victimName: nodeName,
    victimType: nodeType
  });
  // when deleting mesurements, the measure object(if any) must be unglowed
  seStore.unglowAllSENodules();
}

function cycleValueDisplayMode(): void {
  // If the user clicks this they the want to have the label showing so turn it on
  if (model.value instanceof SEAngleMarker) {
    if (model.value.label) {
      if (!model.value.label.showing) {
        new SetNoduleDisplayCommand(model.value.label, true).execute();
      }
    }
  } else if (model.value instanceof SESegmentLength) {
    if (model.value.seSegment.label) {
      if (!model.value.seSegment.label.showing) {
        new SetNoduleDisplayCommand(
          model.value.seSegment.label,
          true
        ).execute();
      }
    }
  } else if (model.value instanceof SEPolygon) {
    if (model.value.label) {
      if (!model.value.label.showing) {
        new SetNoduleDisplayCommand(model.value.label, true).execute();
      }
    }
  }
  const oldValueDisplayMode = (model.value as SEExpression).valueDisplayMode;
  let newValueDisplayMode: ValueDisplayMode;
  // Compute the next valueDisplayMode so that we cycle through the different options (in earth mode it flips between km and mi)
  if (isEarthMode.value && !(model.value instanceof SEAngleMarker)) {
    // AngleMarkers units are never km or mi
    switch (oldValueDisplayMode) {
      case ValueDisplayMode.Number:
      case ValueDisplayMode.MultipleOfPi:
      case ValueDisplayMode.DegreeDecimals:
        newValueDisplayMode = (model.value as SEExpression)
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
        newValueDisplayMode = (model.value as SEExpression)
          .preEarthModeValueDisplayMode;
        break;
    }
  }
  new SetValueDisplayModeCommand(
    model.value as SEExpression,
    oldValueDisplayMode,
    newValueDisplayMode
  ).execute();
  // update a parent (who is parent to both this measurement and the label) to update the display on the sphere canvas
  // if (!(model.value instanceof SECalculation)) {
  //   model.value.parents[0].markKidsOutOfDate();
  //   model.value.parents[0].update();
  // }
  // console.debug(
  //   `Cycle display mode: node ${model.value.name}, new mode: ${newValueDisplayMode}`
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
  return !model.value.showing;
});

const isLabelHidden = (): boolean => {
  if (
    model.value instanceof SEPoint ||
    model.value instanceof SELine ||
    model.value instanceof SESegment ||
    model.value instanceof SECircle ||
    model.value instanceof SEEllipse ||
    model.value instanceof SEAngleMarker ||
    model.value instanceof SEParametric ||
    model.value instanceof SEPolygon
  ) {
    return !model.value.label?.showing;
  }
  return false;
};
const isExpressionAndNotCoordinateNotEarthMode = computed((): boolean => {
  if (isEarthMode) {
    return model.value instanceof SEExpression; // All measurement expressions are effect by Earth mode even point coordinates
  } else {
    return (
      model.value instanceof SEExpression &&
      !(model.value instanceof SEPointCoordinate)
    );
  }
});

const isMeasurement = computed((): boolean => {
  return model.value instanceof SEExpression;
});
// const isSlider = computed((): boolean { // Not needed as SESlider items are sorted in SENoduleList
//   return model.value instanceof SESlider;
// }

const isParametric = computed((): boolean => {
  // return model.value instanceof SEParametric;
  if (model.value instanceof SEParametric) {
    nodeName = model.value.label?.ref.shortUserName ?? "";
    nodeType = t(`objects.parametric`);
    return true;
  }
  return false;
});

const isNotPolygonWithNoFill = computed((): boolean => {
  return !(
    model.value instanceof SEPolygon &&
    Nodule.getFillStyle() == FillStyle.NoFill
  );
});

const isPlottable = computed((): boolean => {
  return (
    model.value instanceof SEPoint ||
    model.value instanceof SELine ||
    model.value instanceof SESegment ||
    model.value instanceof SECircle ||
    model.value instanceof SEEllipse ||
    model.value instanceof SEAngleMarker ||
    model.value instanceof SEParametric ||
    model.value instanceof SEPolygon ||
    model.value instanceof SEText
  );
});

const isNotText = computed((): boolean => {
  return !(model.value instanceof SEText);
});

const showClass = computed((): string => {
  // visibilityUpdateKey.value += 1; // if we don't do this, then for a user created point, undoing/redoing doesn't update the icon between eye/slash eye. This issue is revealed when 1) Draw two lines 2) use point tool to create the intersection 3) hide the intersection with the object panel icon 4) undo button on sphere frame
  // labelVisibilityUpdateKey.value += 1; //
  return model.value.showing ? "visibleNode" : "invisibleNode";
});

//only shake the measurement icons initially when the measured circle tool is selected (There should also be a message displayed telling the user to select a measurement)
const animationClassName = computed((): string => {
  if (actionMode.value === "measuredCircle" && model.value instanceof SEEllipse)
    return "shake";
  if (
    actionMode.value === "applyTransformation" &&
    model.value instanceof SETransformation
  )
    return "shake";
  return "";
});
const shakeMeasurementDisplay = computed((): string => {
  return actionMode.value === "measuredCircle" &&
    model.value instanceof SEExpression
    ? "shake"
    : "";
});

//only shake the transformation icons initially when the apply transformations tool is selected (There should also be a message displayed telling the user to select a translation)
const shakeTransformationDisplay = computed((): string => {
  return actionMode.value === "applyTransformation" &&
    model.value instanceof SETransformation
    ? "shake"
    : "";
});

// const shortDisplayText = computed((): (() => string) => {
//   return () => model.value.noduleItemText;
// });

// const definitionText = computed((): (() => string) => {
//   return () => model.value.noduleDescription;
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
