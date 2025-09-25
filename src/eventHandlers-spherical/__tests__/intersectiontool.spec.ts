import { vi } from "vitest";
import { createTestingPinia } from "@pinia/testing";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "$/vue-helper";
import { SEStoreType, useSEStore } from "@/stores/se";
import { VueWrapper } from "@vue/test-utils";
import { mouseClickOnSphere, drawOneDimensional } from "./sphereframe-helper";
import SETTINGS from "@/global-settings";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import { SENodule } from "@/models/SENodule";
import { SEPoint } from "@/models/SEPoint";
import { Command } from "@/commands-spherical/Command";
import Handler from "../IntersectionPointHandler";

function dumpPoints(arr: SEPoint[]) {
  arr.forEach((pt: SEPoint, pos: number) => {
    console.log(
      `At ${pos} Point ${pt.name}/${pt instanceof SEIntersectionPoint}::${
        pt.noduleDescription
      }`
    );
  });
}
describe("Intersection Tool", () => {
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
    // vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  it.each([
    { L1start: "fg", L1end: "fg", L2start: "fg", L2end: "fg" },
    { L1start: "fg", L1end: "fg", L2start: "fg", L2end: "bg" },
    { L1start: "fg", L1end: "fg", L2start: "bg", L2end: "fg" },
    { L1start: "fg", L1end: "fg", L2start: "bg", L2end: "bg" },
    { L1start: "fg", L1end: "bg", L2start: "fg", L2end: "fg" },
    { L1start: "fg", L1end: "bg", L2start: "fg", L2end: "bg" },
    { L1start: "fg", L1end: "bg", L2start: "bg", L2end: "fg" },
    { L1start: "fg", L1end: "bg", L2start: "bg", L2end: "bg" },
    { L1start: "bg", L1end: "fg", L2start: "fg", L2end: "fg" },
    { L1start: "bg", L1end: "fg", L2start: "fg", L2end: "bg" },
    { L1start: "bg", L1end: "fg", L2start: "bg", L2end: "fg" },
    { L1start: "bg", L1end: "fg", L2start: "bg", L2end: "bg" },
    { L1start: "bg", L1end: "bg", L2start: "fg", L2end: "fg" },
    { L1start: "bg", L1end: "bg", L2start: "fg", L2end: "bg" },
    { L1start: "bg", L1end: "bg", L2start: "bg", L2end: "fg" },
    { L1start: "bg", L1end: "bg", L2start: "bg", L2end: "bg" }
  ])(
    `creates intersection points of two lines ($L1start-$L1end) ($L2start-$L2end) after clicking near the intersection points`,
    async ({ L1start, L1end, L2start, L2end }) => {
      SEStore.setActionMode("line");
      await wrapper.vm.$nextTick();
      await drawOneDimensional(
        wrapper,
        71,
        97,
        L1start === "fg",
        147,
        181,
        L1end === "fg"
      );
      await drawOneDimensional(
        wrapper,
        71,
        136,
        L2start === "fg",
        179,
        53,
        L2end === "fg"
      );
      const pointCount = SEStore.sePoints.length;
      expect(pointCount).toBeGreaterThanOrEqual(6);
      // The last two should be intersection point candidates
      const x1 = SEStore.sePoints.find(p => p instanceof SEIntersectionPoint);
      const x2 = SEStore.sePoints.find(p => p instanceof SEIntersectionPoint);
      expect(x1).toBeDefined();
      expect(x1).toBeDefined();

      // Switch tool mode to intersection
      SEStore.setActionMode("intersect");
      await wrapper.vm.$nextTick();
      const R = SETTINGS.boundaryCircle.radius;
      // Line-vs-line creates two candidates (one foreground and one background)
      // click near the first intersection
      await mouseClickOnSphere(
        wrapper,
        x1!.locationVector.x * R,
        x1!.locationVector.y * R,
        x1!.locationVector.z < 0
      );
      // click near the second intersection
      await mouseClickOnSphere(
        wrapper,
        x2!.locationVector.x * R,
        x2!.locationVector.y * R,
        x2!.locationVector.z < 0
      );

      expect(x1!.isUserCreated).toBeTruthy();
      expect(x1!.showing).toBeTruthy();
      expect(x2!.isUserCreated).toBeTruthy();
      expect(x2!.showing).toBeTruthy();
    }
  );

  it.todo(
    "creates intersection points of two lines after clicking on both lines"
  );

  it.each([
    { lnStart: "fg", lnEnd: "fg", segStart: "fg", segEnd: "fg" },
    { lnStart: "fg", lnEnd: "fg", segStart: "fg", segEnd: "bg" },
    { lnStart: "fg", lnEnd: "fg", segStart: "bg", segEnd: "fg" },
    { lnStart: "fg", lnEnd: "fg", segStart: "bg", segEnd: "bg" },
    { lnStart: "fg", lnEnd: "bg", segStart: "fg", segEnd: "fg" },
    { lnStart: "fg", lnEnd: "bg", segStart: "fg", segEnd: "bg" },
    { lnStart: "fg", lnEnd: "bg", segStart: "bg", segEnd: "fg" },
    { lnStart: "fg", lnEnd: "bg", segStart: "bg", segEnd: "bg" },
    { lnStart: "bg", lnEnd: "fg", segStart: "fg", segEnd: "fg" },
    { lnStart: "bg", lnEnd: "fg", segStart: "fg", segEnd: "bg" },
    { lnStart: "bg", lnEnd: "fg", segStart: "bg", segEnd: "fg" },
    { lnStart: "bg", lnEnd: "fg", segStart: "bg", segEnd: "bg" },
    { lnStart: "bg", lnEnd: "bg", segStart: "fg", segEnd: "fg" },
    { lnStart: "bg", lnEnd: "bg", segStart: "fg", segEnd: "bg" },
    { lnStart: "bg", lnEnd: "bg", segStart: "bg", segEnd: "fg" },
    { lnStart: "bg", lnEnd: "bg", segStart: "bg", segEnd: "bg" }
  ])(
    "creates intersection points  of a line ($lnStart-$lnEnd) and a segment ($segStart-$segEnd) after clicking near the intersection points",
    async ({ lnStart, lnEnd, segStart, segEnd }) => {
      SEStore.setActionMode("line");
      await wrapper.vm.$nextTick();
      await drawOneDimensional(
        wrapper,
        71,
        97,
        lnStart === "fg",
        147,
        181,
        lnEnd === "fg"
      );
      SEStore.setActionMode("segment");
      await wrapper.vm.$nextTick();
      await drawOneDimensional(
        wrapper,
        71,
        136,
        segStart === "fg",
        179,
        53,
        segEnd === "fg"
      );
      const pointCount = SEStore.sePoints.length;
      /* 4 points from the line and segment, 1 point intersection candidate */
      expect(pointCount).toBeGreaterThanOrEqual(5);
      // The last two should be intersection point candidates
      const x1 = SEStore.sePoints.find(p => p instanceof SEIntersectionPoint);
      const x2 = SEStore.sePoints.findLast(
        p => p instanceof SEIntersectionPoint
      );
      expect(x1).toBeDefined();
      expect(x2).toBeDefined();
      SEStore.setActionMode("intersect");
      await wrapper.vm.$nextTick();
      const R = SETTINGS.boundaryCircle.radius;
      // Line-vs-segment creates only one intersection, the program
      // computes two candidates (the true intersection and its antipode)
      // click near the first intersection
      await mouseClickOnSphere(
        wrapper,
        x1!.locationVector.x * R,
        x1!.locationVector.y * R,
        x1!.locationVector.z < 0
      );
      // click near the second intersection
      await mouseClickOnSphere(
        wrapper,
        x2!.locationVector.x * R,
        x2!.locationVector.y * R,
        x2!.locationVector.z < 0
      );
      // One of the two candidates should be the true intersection
      expect(x1!.isUserCreated || x2!.isUserCreated).toBeTruthy();
      expect(x1!.showing || x2!.showing).toBeTruthy();
    }
  );

  it.each([
    { lnStart: "fg", lnEnd: "fg", segStart: "fg", segEnd: "fg" },
    { lnStart: "fg", lnEnd: "fg", segStart: "fg", segEnd: "bg" },
    { lnStart: "fg", lnEnd: "fg", segStart: "bg", segEnd: "fg" },
    { lnStart: "fg", lnEnd: "fg", segStart: "bg", segEnd: "bg" },
    { lnStart: "fg", lnEnd: "bg", segStart: "fg", segEnd: "fg" },
    { lnStart: "fg", lnEnd: "bg", segStart: "fg", segEnd: "bg" },
    { lnStart: "fg", lnEnd: "bg", segStart: "bg", segEnd: "fg" },
    { lnStart: "fg", lnEnd: "bg", segStart: "bg", segEnd: "bg" },
    { lnStart: "bg", lnEnd: "fg", segStart: "fg", segEnd: "fg" },
    { lnStart: "bg", lnEnd: "fg", segStart: "fg", segEnd: "bg" },
    { lnStart: "bg", lnEnd: "fg", segStart: "bg", segEnd: "fg" },
    { lnStart: "bg", lnEnd: "fg", segStart: "bg", segEnd: "bg" },
    { lnStart: "bg", lnEnd: "bg", segStart: "fg", segEnd: "fg" },
    { lnStart: "bg", lnEnd: "bg", segStart: "fg", segEnd: "bg" },
    { lnStart: "bg", lnEnd: "bg", segStart: "bg", segEnd: "fg" },
    { lnStart: "bg", lnEnd: "bg", segStart: "bg", segEnd: "bg" }
  ])(
    "does not create intersection points of non-intersecting line ($lnStart-$lnEnd) and segment ($segStart,$segEnd)",
    async ({ lnStart, lnEnd, segStart, segEnd }) => {
      const prevPointCount = SEStore.sePoints.length;
      SEStore.setActionMode("line");
      await wrapper.vm.$nextTick();
      await drawOneDimensional(
        wrapper,
        71,
        97,
        lnStart === "fg",
        179,
        101,
        lnEnd === "fg"
      );
      SEStore.setActionMode("segment");
      await wrapper.vm.$nextTick();
      await drawOneDimensional(
        wrapper,
        121,
        153,
        segStart === "fg",
        127,
        189,
        segEnd === "fg"
      );
      const pointCount = SEStore.sePoints.length;
      // The last two should be intersection point candidates
      const x1 = SEStore.sePoints.find(p => p instanceof SEIntersectionPoint);
      const x2 = SEStore.sePoints.findLast(
        p => p instanceof SEIntersectionPoint
      );
      expect(x1).toBeDefined();
      expect(x2).toBeDefined();
      SEStore.setActionMode("intersect");
      await wrapper.vm.$nextTick();
      const R = SETTINGS.boundaryCircle.radius;
      // Line-vs-segment creates only one intersection, the program
      // computes two candidates (the true intersection and its antipode)
      // click near the first intersection
      await mouseClickOnSphere(
        wrapper,
        x1!.locationVector.x * R,
        x1!.locationVector.y * R,
        x1!.locationVector.z < 0
      );
      // click near the second intersection
      await mouseClickOnSphere(
        wrapper,
        x2!.locationVector.x * R,
        x2!.locationVector.y * R,
        x2!.locationVector.z < 0
      );
      // None of the two candidates should be a true intersection
      expect(x1!.isUserCreated && x2!.isUserCreated).toBeFalsy();
      expect(x1!.showing && x2!.showing).toBeFalsy();
    }
  );

  it.each([
    {
      lineStart: "fg",
      lineEnd: "fg",
      circCtr: "fg",
      circPt: "fg"
    }
  ])(
    "creates intersection points of a line ($lineStart-$lineEnd) and a circle ($cirCtr,$circPt)",
    async ({ lineStart, lineEnd, circCtr, circPt }) => {
      SEStore.setActionMode("line");
      await wrapper.vm.$nextTick();
      await drawOneDimensional(
        wrapper,
        71,
        97,
        lineStart === "fg",
        147,
        181,
        lineEnd == "fg"
      );
      SEStore.setActionMode("circle");
      await wrapper.vm.$nextTick();
      await drawOneDimensional(
        wrapper,
        71,
        136,
        circCtr === "fg",
        179,
        53,
        circPt === "fg"
      );
      const pointCount = SEStore.sePoints.length;
      /* 4 points from the line and segment, 1 point intersection candidate */
      expect(pointCount).toBeGreaterThanOrEqual(5);
      // The last two should be intersection point candidates
      const x1 = SEStore.sePoints.find(pt => pt instanceof SEIntersectionPoint);
      const x2 = SEStore.sePoints.findLast(
        pt => pt instanceof SEIntersectionPoint
      );
      expect(x1).toBeDefined();
      expect(x2).toBeDefined();
      SEStore.setActionMode("intersect");
      await wrapper.vm.$nextTick();
      const R = SETTINGS.boundaryCircle.radius;
      // Line-vs-segment creates only one intersection, the program
      // computes two candidates (the true intersection and its antipode)
      // click near the first intersection
      await mouseClickOnSphere(
        wrapper,
        x1!.locationVector.x * R,
        x1!.locationVector.y * R,
        x1!.locationVector.z < 0
      );
      // click near the second intersection
      await mouseClickOnSphere(
        wrapper,
        x2!.locationVector.x * R,
        x2!.locationVector.y * R,
        x2!.locationVector.z < 0
      );
      // One of the two candidates should be the true intersection
      expect(x1!.isUserCreated || x2!.isUserCreated).toBeTruthy();
      expect(x1!.showing || x2!.showing).toBeTruthy();
    }
  );

  it.each([
    { lineStart: "fg", lineEnd: "fg" },
    { lineStart: "fg", lineEnd: "bg" },
    { lineStart: "bg", lineEnd: "fg" },
    { lineStart: "bg", lineEnd: "bg" }
  ])(
    "does not create intersection points of non-intersecting line ($lineStart-$lineEnd) and circle",
    async ({ lineStart, lineEnd }) => {
      SEStore.setActionMode("line");
      await wrapper.vm.$nextTick();
      await drawOneDimensional(
        wrapper,
        -171,
        97,
        lineStart === "fg",
        -147,
        181,
        lineEnd === "fg"
      );
      SEStore.setActionMode("circle");
      await wrapper.vm.$nextTick();
      await drawOneDimensional(wrapper, 111, -136, true, 130, -136, true);
      const pointCount = SEStore.sePoints.length;
      const p1 = SEStore.sePoints.find(p => p instanceof SEIntersectionPoint);
      const p2 = SEStore.sePoints.findLast(
        p => p instanceof SEIntersectionPoint
      );
      expect(p1).toBeDefined();
      expect(p2).toBeDefined();
      SEStore.setActionMode("intersect");
      await wrapper.vm.$nextTick();
      const R = SETTINGS.boundaryCircle.radius;
      // click near the first intersection
      await mouseClickOnSphere(
        wrapper,
        p1!.locationVector.x * R,
        p1!.locationVector.y * R,
        p1!.locationVector.z < 0
      );
      // click near the second intersection
      await mouseClickOnSphere(
        wrapper,
        p1!.locationVector.x * R,
        p2!.locationVector.y * R,
        p2!.locationVector.z < 0
      );
      expect(p1!.isUserCreated && p2!.isUserCreated).toBeFalsy();
      expect(p1!.showing && p2!.showing).toBeFalsy();
    }
  );

  it.each([
    { seg1End: "fg", seg2End: "fg" },
    { seg1End: "fg", seg2End: "bg" },
    { seg1End: "bg", seg2End: "fg" },
    { seg1End: "bg", seg2End: "bg" }
  ])(
    `creates intersection points of two segments ($seg1End) ($seg2End) after clicking near the intersection points`,
    async ({ seg1End, seg2End }) => {
      SEStore.setActionMode("segment");
      await wrapper.vm.$nextTick();

      await drawOneDimensional(
        wrapper,
        -71,
        97,
        true,
        147,
        -181,
        seg1End === "fg"
      );
      await drawOneDimensional(
        wrapper,
        -71,
        -136,
        true,
        179,
        53,
        seg2End === "fg"
      );
      const pointCount = SEStore.sePoints.length;
      /* 4 points from the line and segment, 1 point intersection candidate */
      expect(pointCount).toBeGreaterThanOrEqual(4);
      // The last two should be intersection point candidates
      const p1 = SEStore.sePoints.find(pt => pt instanceof SEIntersectionPoint);
      const p2 = SEStore.sePoints.findLast(
        pt => pt instanceof SEIntersectionPoint
      );

      expect(p1).toBeDefined();
      expect(p2).toBeDefined();

      SEStore.setActionMode("intersect");
      await wrapper.vm.$nextTick();
      const R = SETTINGS.boundaryCircle.radius;
      // Line-vs-segment creates only one intersection, the program
      // computes two candidates (the true intersection and its antipode)
      // click near the first intersection
      await mouseClickOnSphere(
        wrapper,
        p1!.locationVector.x * R,
        p1!.locationVector.y * R,
        p1!.locationVector.z < 0
      );
      // click near the second intersection
      await mouseClickOnSphere(
        wrapper,
        p2!.locationVector.x * R,
        p2!.locationVector.y * R,
        p2!.locationVector.z < 0
      );
      // One of the two candidates should be the true intersection
      expect(p1!.isUserCreated || p2!.isUserCreated).toBeTruthy();
      expect(p1!.showing || p2!.showing).toBeTruthy();
    }
  );

  it.each([
    { segStart: "fg", segEnd: "fg", circCtr: "fg", circPt: "fg" },
    { segStart: "fg", segEnd: "fg", circCtr: "fg", circPt: "bg" },
    { segStart: "fg", segEnd: "fg", circCtr: "bg", circPt: "fg" },
    { segStart: "fg", segEnd: "fg", circCtr: "bg", circPt: "bg" },
    { segStart: "fg", segEnd: "bg", circCtr: "fg", circPt: "fg" },
    { segStart: "fg", segEnd: "bg", circCtr: "fg", circPt: "bg" },
    { segStart: "fg", segEnd: "bg", circCtr: "bg", circPt: "fg" },
    { segStart: "fg", segEnd: "bg", circCtr: "bg", circPt: "bg" },
    { segStart: "bg", segEnd: "fg", circCtr: "fg", circPt: "fg" },
    { segStart: "bg", segEnd: "fg", circCtr: "fg", circPt: "bg" },
    { segStart: "bg", segEnd: "fg", circCtr: "bg", circPt: "fg" },
    { segStart: "bg", segEnd: "fg", circCtr: "bg", circPt: "bg" },
    { segStart: "bg", segEnd: "bg", circCtr: "fg", circPt: "fg" },
    { segStart: "bg", segEnd: "bg", circCtr: "fg", circPt: "bg" },
    { segStart: "bg", segEnd: "bg", circCtr: "bg", circPt: "fg" },
    { segStart: "bg", segEnd: "bg", circCtr: "bg", circPt: "bg" }
  ])(
    "creates intersection points of a segment ($segStart,$segEnd) and a circle ($circCtr,$circPt) after clicking near the intersection points",
    async ({ segStart, segEnd, circCtr, circPt }) => {
      SEStore.setActionMode("intersect");
      await wrapper.vm.$nextTick();
      await drawOneDimensional(
        wrapper,
        -71,
        97,
        segStart === "fg",
        147,
        -181,
        segEnd === "fg"
      );
      SEStore.setActionMode("circle");
      await wrapper.vm.$nextTick();
      await drawOneDimensional(
        wrapper,
        0,
        0,
        circCtr === "fg",
        71,
        87,
        circPt === "fg"
      );
      const pointCount = SEStore.sePoints.length;
      /* 4 points from the line and segment, 1 point intersection candidate */
      expect(pointCount).toBeGreaterThanOrEqual(4);
      dumpPoints(SEStore.sePoints);
      // The last two should be intersection point candidates
      const p1 = SEStore.sePoints.find(p => p instanceof SEIntersectionPoint);
      const p2 = SEStore.sePoints.findLast(
        p => p instanceof SEIntersectionPoint
      );
      expect(p1).toBeDefined();
      expect(p2).toBeDefined();
      SEStore.setActionMode("intersect");
      await wrapper.vm.$nextTick();
      const R = SETTINGS.boundaryCircle.radius;
      // Line-vs-segment creates only one intersection, the program
      // computes two candidates (the true intersection and its antipode)
      // click near the first intersection
      await mouseClickOnSphere(
        wrapper,
        p1!.locationVector.x * R,
        p1!.locationVector.y * R,
        p1!.locationVector.z < 0
      );
      // click near the second intersection
      await mouseClickOnSphere(
        wrapper,
        p2!.locationVector.x * R,
        p2!.locationVector.y * R,
        p2!.locationVector.z < 0
      );
      // One of the two candidates should be the true intersection
      expect(p1!.isUserCreated || p2!.isUserCreated).toBeTruthy();
      expect(p1!.showing || p2!.showing).toBeTruthy();
    }
  );

  it.each([
    { c1Ctr: "fg", c1Pt: "fg", c2Ctr: "fg", c2Pt: "fg" },
    { c1Ctr: "fg", c1Pt: "fg", c2Ctr: "fg", c2Pt: "bg" },
    { c1Ctr: "fg", c1Pt: "fg", c2Ctr: "bg", c2Pt: "fg" },
    { c1Ctr: "fg", c1Pt: "fg", c2Ctr: "bg", c2Pt: "bg" },
    { c1Ctr: "fg", c1Pt: "bg", c2Ctr: "fg", c2Pt: "fg" },
    { c1Ctr: "fg", c1Pt: "bg", c2Ctr: "fg", c2Pt: "bg" },
    { c1Ctr: "fg", c1Pt: "bg", c2Ctr: "bg", c2Pt: "fg" },
    { c1Ctr: "fg", c1Pt: "bg", c2Ctr: "bg", c2Pt: "bg" },
    { c1Ctr: "bg", c1Pt: "fg", c2Ctr: "fg", c2Pt: "fg" },
    { c1Ctr: "bg", c1Pt: "fg", c2Ctr: "fg", c2Pt: "bg" },
    { c1Ctr: "bg", c1Pt: "fg", c2Ctr: "bg", c2Pt: "fg" },
    { c1Ctr: "bg", c1Pt: "fg", c2Ctr: "bg", c2Pt: "bg" },
    { c1Ctr: "bg", c1Pt: "bg", c2Ctr: "fg", c2Pt: "fg" },
    { c1Ctr: "bg", c1Pt: "bg", c2Ctr: "fg", c2Pt: "bg" },
    { c1Ctr: "bg", c1Pt: "bg", c2Ctr: "bg", c2Pt: "fg" },
    { c1Ctr: "bg", c1Pt: "bg", c2Ctr: "bg", c2Pt: "bg" }
  ])(
    "creates intersection points of two circles ($c1Ctr-$c1Pt) ($c2Ctr,$c2Pt) after clicking near the intersection points",
    async ({ c1Ctr, c1Pt, c2Ctr, c2Pt }) => {
      const R = SETTINGS.boundaryCircle.radius;
      SEStore.setActionMode("circle");
      await wrapper.vm.$nextTick();
      await drawOneDimensional(
        wrapper,
        145 - R,
        159 - R,
        c1Ctr === "fg",
        248 - R,
        201 - R,
        c1Pt === "fg"
      );
      await drawOneDimensional(
        wrapper,
        306 - R,
        351 - R,
        c2Ctr === "fg",
        222 - R,
        180 - R,
        c2Pt === "fg"
      );
      const pointCount = SEStore.sePoints.length;
      /* 4 points from the line and segment, 1 point intersection candidate */
      expect(pointCount).toBeGreaterThanOrEqual(5);
      // The last two should be intersection point candidates
      const p1 = SEStore.sePoints.find(p => p instanceof SEIntersectionPoint);
      const p2 = SEStore.sePoints.findLast(
        p => p instanceof SEIntersectionPoint
      );
      expect(p1).toBeDefined();
      expect(p2).toBeDefined();
      SEStore.setActionMode("intersect");
      await wrapper.vm.$nextTick();
      // Circle-vs-circle creates two intersections, the program
      // computes four candidates (the true intersection and its antipode)
      // click near the first intersection
      await mouseClickOnSphere(
        wrapper,
        p1!.locationVector.x * R,
        p1!.locationVector.y * R,
        p1!.locationVector.z < 0
      );
      // click near the second intersection
      await mouseClickOnSphere(
        wrapper,
        p2!.locationVector.x * R,
        p2!.locationVector.y * R,
        p2!.locationVector.z < 0
      );
      // One of the two candidates should be the true intersection
      expect(p1!.isUserCreated && p2!.isUserCreated).toBeTruthy();
      expect(p1!.showing && p2!.showing).toBeTruthy();
    }
  );
});
