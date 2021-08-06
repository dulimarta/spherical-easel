import Vue from "*.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import SETTINGS from "@/global-settings";
import { Wrapper } from "@vue/test-utils";
import {
  drawOneDimensional,
  drawPointAt,
  mouseClickOnSphere
} from "./sphereframe-helper";
import { SEPoint } from "@/models/SEPoint";
import { Vector3 } from "three";
import { SEExpression } from "@/models/SEExpression";
const R = SETTINGS.boundaryCircle.radius;

describe("SphereFrame: Segment Length Measurement Tool", () => {
  let wrapper: Wrapper<Vue>;
  beforeEach(async () => {
    wrapper = createWrapper(SphereFrame);
    SEStore.init();
  });

  it("measures length of segment", async () => {
    const v1 = new Vector3(0, 0, 1);
    const v2 = new Vector3(0, 0, 1);
    v2.applyAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
    const prevSegmentCount = SEStore.seSegments.length;
    await drawOneDimensional(
      wrapper,
      "segment",
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
    SEStore.setActionMode({
      id: "segmentLength",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    const prevMeasurementCount = SEStore.expressions.length;
    const targetPosition = aSegment.closestVector(new Vector3(0, 0, 1));
    await mouseClickOnSphere(
      wrapper,
      targetPosition.x * R,
      targetPosition.y * R
    );
    const newMeasurementCount = SEStore.expressions.length;
    expect(newMeasurementCount).toBe(prevMeasurementCount + 1);
    const angle = aSegment.startSEPoint.locationVector.angleTo(
      aSegment.endSEPoint.locationVector
    );
    const length = SEStore.expressions[prevMeasurementCount] as SEExpression;
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
    SEStore.setActionMode({
      id: "pointDistance",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();
    const prevMeasurementCount = SEStore.expressions.length;
    await mouseClickOnSphere(wrapper, v1.x * R, v1.y * R);
    await mouseClickOnSphere(wrapper, v2.x * R, v2.y * R);
    const newMeasurementCount = SEStore.expressions.length;
    expect(newMeasurementCount).toBe(prevMeasurementCount + 1);
    const angle = p1.locationVector.angleTo(p2.locationVector);
    const distance = SEStore.expressions[prevMeasurementCount] as SEExpression;
    expect(distance.value).toBeCloseTo(angle, 5);
  });

  it("measures coordinates of a point", async () => {
    const prevPointCount = SEStore.sePoints.length;
    await drawPointAt(wrapper, 147, 191);
    expect(SEStore.sePoints.length).toEqual(prevPointCount + 1);
    const pt = SEStore.sePoints[prevPointCount];
    const prevMeasurementCount = SEStore.expressions.length;
    SEStore.setActionMode({
      id: "coordinate",
      name: "Tool Name does not matter"
    });
    await wrapper.vm.$nextTick();

    await mouseClickOnSphere(
      wrapper,
      pt.locationVector.x * R,
      pt.locationVector.y * R,
      pt.locationVector.z < 0
    );
    expect(SEStore.expressions.length).toEqual(prevMeasurementCount + 3);
    const xCoord = SEStore.expressions[prevMeasurementCount];
    const yCoord = SEStore.expressions[prevMeasurementCount + 1];
    const zCoord = SEStore.expressions[prevMeasurementCount + 2];
    expect(xCoord.value).toBeCloseTo(pt.locationVector.x, 5);
    expect(yCoord.value).toBeCloseTo(pt.locationVector.y, 5);
    expect(zCoord.value).toBeCloseTo(pt.locationVector.z, 5);
  });
});
