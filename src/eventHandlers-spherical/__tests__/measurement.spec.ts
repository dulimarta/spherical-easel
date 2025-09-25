import { vi } from "vitest";
import { createTestingPinia } from "@pinia/testing";

import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "$/vue-helper";
import { SEStoreType, useSEStore } from "@/stores/se";
import { VueWrapper } from "@vue/test-utils";
import {
  TEST_MOUSE_X,
  TEST_MOUSE_Y,
  mouseClickOnSphere,
  drawOneDimensional,
  drawPointAt
} from "./sphereframe-helper";
import SETTINGS from "@/global-settings-spherical";
import { SEExpression } from "@/models-spherical/SEExpression";
import { SENodule } from "@/models-spherical/SENodule";
import { SEPoint } from "@/models-spherical/SEPoint";
import { Command } from "@/commands-spherical/Command";
import { Vector3 } from "three";
import Handler from "../SegmentLengthHandler";
const R = SETTINGS.boundaryCircle.radius;

describe("Segment Length Measurement Tool", () => {
  let wrapper: VueWrapper;
  let testPinia;
  let SEStore: SEStoreType;
  beforeEach(async () => {
    vi.clearAllMocks();
    testPinia = createTestingPinia({ stubActions: false });
    const out = createWrapper(SphereFrame, {
      componentProps: {
        availableHeight: 512,
        availableWidth: 512,
        isEarthMode: false
      }
    });
    SEStore = useSEStore(testPinia);
    // useAccountStore(testPinia)
    SEStore.init();
    SENodule.setGlobalStore(SEStore);
    Command.setGlobalStore(SEStore);
    Handler.setGlobalStore(SEStore);
    wrapper = out.wrapper;
    SEStore.setActionMode("select");
    await wrapper.vm.$nextTick();
  });

  it("measures length of segment", async () => {
    const v1 = new Vector3(0, 0, 1);
    const v2 = new Vector3(0, 0, 1);
    v2.applyAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
    const prevSegmentCount = SEStore.seSegments.length;
    SEStore.setActionMode("segment");
    await drawOneDimensional(
      wrapper,
      v1.x * R,
      v1.y * R,
      true,
      v2.x * R,
      v2.y * R,
      true
    );
    const newPointCount = SEStore.sePoints.length;
    // expect(newPointCount).toBeGreaterThanOrEqual(2);
    // const p1: SEPoint = SEStore.sePoints[newPointCount - 2];
    // const p2: SEPoint = SEStore.sePoints[newPointCount - 1];
    const newSegmentCount = SEStore.seSegments.length;
    expect(newSegmentCount).toEqual(prevSegmentCount + 1);
    const aSegment = SEStore.seSegments[prevSegmentCount];
    SEStore.setActionMode("segmentLength");
    await wrapper.vm.$nextTick();
    const prevMeasurementCount = SEStore.seExpressions.length;
    const targetPosition = aSegment.closestVector(new Vector3(0, 0, 1));
    await mouseClickOnSphere(
      wrapper,
      targetPosition.x * R,
      targetPosition.y * R
    );
    const newMeasurementCount = SEStore.seExpressions.length;
    expect(newMeasurementCount).toBe(prevMeasurementCount + 1);
    const angle = aSegment.startSEPoint.locationVector.angleTo(
      aSegment.endSEPoint.locationVector
    );
    const length = SEStore.seExpressions[prevMeasurementCount] as SEExpression;
    expect(length.value).toBeCloseTo(angle, 5);
  });

  it("measures distance of two points", async () => {
    const v1 = new Vector3(0, 0, 1);
    const v2 = new Vector3(0, 0, 1);
    v2.applyAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
    await drawPointAt(wrapper, v1.x * R, v1.y * R);
    await drawPointAt(wrapper, v2.x * R, v2.y * R);
    const newPointCount = SEStore.sePoints.length;
    expect(newPointCount).toBeGreaterThanOrEqual(2);
    const p1: SEPoint = SEStore.sePoints[newPointCount - 2];
    const p2: SEPoint = SEStore.sePoints[newPointCount - 1];
    SEStore.setActionMode("pointDistance");
    await wrapper.vm.$nextTick();
    const prevMeasurementCount = SEStore.seExpressions.length;
    await mouseClickOnSphere(wrapper, v1.x * R, v1.y * R);
    await mouseClickOnSphere(wrapper, v2.x * R, v2.y * R);
    const newMeasurementCount = SEStore.seExpressions.length;
    expect(newMeasurementCount).toBe(prevMeasurementCount + 1);
    const angle = p1.locationVector.angleTo(p2.locationVector);
    const distance = SEStore.seExpressions[
      prevMeasurementCount
    ] as SEExpression;
    expect(distance.value).toBeCloseTo(angle, 5);
  });

  it("measures coordinates of a point", async () => {
    const prevPointCount = SEStore.sePoints.length;
    await drawPointAt(wrapper, 147, 191);
    expect(SEStore.sePoints.length).toBeGreaterThanOrEqual(prevPointCount + 1);
    const pt = SEStore.sePoints[prevPointCount];
    const prevMeasurementCount = SEStore.seExpressions.length;
    SEStore.setActionMode("coordinate");
    await wrapper.vm.$nextTick();

    await mouseClickOnSphere(
      wrapper,
      pt.locationVector.x * R,
      pt.locationVector.y * R,
      pt.locationVector.z < 0
    );
    expect(SEStore.seExpressions.length).toEqual(prevMeasurementCount + 3);
    const xCoord = SEStore.seExpressions[prevMeasurementCount];
    const yCoord = SEStore.seExpressions[prevMeasurementCount + 1];
    const zCoord = SEStore.seExpressions[prevMeasurementCount + 2];
    expect(xCoord.value).toBeCloseTo(pt.locationVector.x, 5);
    expect(yCoord.value).toBeCloseTo(pt.locationVector.y, 5);
    expect(zCoord.value).toBeCloseTo(pt.locationVector.z, 5);
  });

  it("measures segment length", async () => {
    const v1 = new Vector3(0.053, 0.683, 0.729);
    const v2 = new Vector3(0.667, 0.162, 0.727);

    v2.applyAxisAngle(v1, 47.485);

    const prevSegmentCount = SEStore.seSegments.length;
    SEStore.setActionMode("segment");
    await drawOneDimensional(
      wrapper,
      v1.x * R,
      v1.y * R,
      true,
      v2.x * R,
      v2.y * R,
      true
    );
    const newSegmentCount = SEStore.seSegments.length;
    expect(newSegmentCount).toEqual(prevSegmentCount + 1);
    const aSegment = SEStore.seSegments[prevSegmentCount];
    SEStore.setActionMode("segmentLength");
    await wrapper.vm.$nextTick();
    const prevMeasurementCount = SEStore.seExpressions.length;
    const targetPosition = aSegment.closestVector(v1);
    await mouseClickOnSphere(
      wrapper,
      targetPosition.x * R,
      targetPosition.y * R
    );
    const newMeasurementCount = SEStore.seExpressions.length;
    expect(newMeasurementCount).toBe(prevMeasurementCount + 1);
    const angle = aSegment.startSEPoint.locationVector.angleTo(
      aSegment.endSEPoint.locationVector
    );

    const length = SEStore.seExpressions[prevMeasurementCount] as SEExpression;
    expect(length.value).toBeCloseTo(angle, 5);

    // //tests line measurment value
    // console.log("Observed:\t" + SEStore.seExpressions[prevMeasurementCount].value + "\nExpected:\t" + 0.828774);
    const measurement = SEStore.seExpressions[prevMeasurementCount].value;
    expect(measurement).toBeCloseTo(0.828774, 2);
  });

  it("measures point distance", async () => {
    const v1 = new Vector3(-0.18307169, -0.65771072, 0.73068553);
    const v2 = new Vector3(-0.3599409, -0.63803888, 0.68069738);

    v2.applyAxisAngle(v1, 10.606);

    await drawPointAt(wrapper, v1.x * R, v1.y * R);
    await drawPointAt(wrapper, v2.x * R, v2.y * R);
    const newPointCount = SEStore.sePoints.length;
    expect(newPointCount).toBeGreaterThanOrEqual(2);
    const p1: SEPoint = SEStore.sePoints[newPointCount - 2];
    const p2: SEPoint = SEStore.sePoints[newPointCount - 1];
    SEStore.setActionMode("pointDistance");
    await wrapper.vm.$nextTick();
    const prevMeasurementCount = SEStore.seExpressions.length;
    await mouseClickOnSphere(wrapper, v1.x * R, v1.y * R);
    await mouseClickOnSphere(wrapper, v2.x * R, v2.y * R);
    const newMeasurementCount = SEStore.seExpressions.length;
    expect(newMeasurementCount).toBe(prevMeasurementCount + 1);
    const angle = p1.locationVector.angleTo(p2.locationVector);
    const distance = SEStore.seExpressions[
      prevMeasurementCount
    ] as SEExpression;
    expect(distance.value).toBeCloseTo(angle, 5);

    //tests point measurment value
    console.log(
      "Observed point dist:\t" +
        SEStore.seExpressions[prevMeasurementCount].value +
        "\nExpected point dist:\t" +
        0.185111
    );
    const measurment = SEStore.seExpressions[prevMeasurementCount].value;
    expect(measurment).toBeCloseTo(0.185111, 2);
  });

  it("measures triangle sides", async () => {
    const v1 = new Vector3(-0.24811, 0.816699, 0.520998);
    const v2 = new Vector3(-0.284624, 0.3027012, 0.9095936);
    const v3 = new Vector3(0.3120889, 0.6020246, 0.7349604);

    v1.applyAxisAngle(v1, 37.141);
    v2.applyAxisAngle(v2, 37.652);
    v3.applyAxisAngle(v3, 40.366);

    const prevSegmentCount = SEStore.seSegments.length;
    SEStore.setActionMode("segment");
    await drawOneDimensional(
      wrapper,
      v1.x * R,
      v1.y * R,
      true,
      v2.x * R,
      v2.y * R,
      true
    );
    await drawOneDimensional(
      wrapper,
      v1.x * R,
      v1.y * R,
      true,
      v3.x * R,
      v3.y * R,
      true
    );
    await drawOneDimensional(
      wrapper,
      v3.x * R,
      v3.y * R,
      true,
      v2.x * R,
      v2.y * R,
      true
    );

    const newSegmentCount = SEStore.seSegments.length;
    expect(newSegmentCount).toEqual(prevSegmentCount + 3);
    const aSegment = SEStore.seSegments[prevSegmentCount];
    SEStore.setActionMode("segmentLength");
    await wrapper.vm.$nextTick();
    const prevMeasurementCount = SEStore.seExpressions.length;
    const targetPosition1 = aSegment.closestVector(v1);
    await mouseClickOnSphere(
      wrapper,
      targetPosition1.x * R,
      targetPosition1.y * R
    );
    const newMeasurementCount = SEStore.seExpressions.length;
    expect(newMeasurementCount).toBe(prevMeasurementCount + 1);

    const aSegment2 = SEStore.seSegments[prevSegmentCount + 1];
    SEStore.setActionMode("segmentLength");
    await wrapper.vm.$nextTick();
    const prevMeasurementCount2 = SEStore.seExpressions.length;
    const targetPosition2 = aSegment2.closestVector(v2);
    await mouseClickOnSphere(
      wrapper,
      targetPosition2.x * R,
      targetPosition2.y * R
    );
    const newMeasurementCount2 = SEStore.seExpressions.length;
    expect(newMeasurementCount2).toBe(prevMeasurementCount2 + 1);

    const aSegment3 = SEStore.seSegments[prevSegmentCount + 2];
    SEStore.setActionMode("segmentLength");
    await wrapper.vm.$nextTick();
    const prevMeasurementCount3 = SEStore.seExpressions.length;
    const targetPosition3 = aSegment3.closestVector(v3);
    await mouseClickOnSphere(
      wrapper,
      (targetPosition3.x + 0.01) * R,
      (targetPosition3.y + 0.01) * R
    );
    const newMeasurementCount3 = SEStore.seExpressions.length;
    expect(newMeasurementCount3).toBe(prevMeasurementCount3 + 1);

    //tests line measurment value
    console.log(
      "Observed tri side1:\t" +
        SEStore.seExpressions[prevMeasurementCount].value +
        "\nExpected tri side1:\t" +
        0.657155
    );
    console.log(
      "Observed tri side2:\t" +
        SEStore.seExpressions[prevMeasurementCount2].value +
        "\nExpected tri side2:\t" +
        0.648233
    );
    console.log(
      "Observed tri side3:\t" +
        SEStore.seExpressions[prevMeasurementCount3].value +
        "\nExpected tri side3:\t" +
        0.704522
    );

    const measurment = SEStore.seExpressions[prevMeasurementCount].value;
    const measurment2 = SEStore.seExpressions[prevMeasurementCount2].value;
    const measurment3 = SEStore.seExpressions[prevMeasurementCount3].value;

    expect(measurment).toBeCloseTo(0.657155, 2);
    expect(measurment2).toBeCloseTo(0.648233, 2);
    expect(measurment3).toBeCloseTo(0.704522, 2);
  });
});
