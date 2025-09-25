import TestComponent from "../SENoduleItem.vue";
import { vi, describe, MockInstance } from "vitest";
import { Vector3 } from "three";
import { VueWrapper } from "@vue/test-utils";
import { createWrapper } from "$/vue-helper";
import { SEPoint } from "@/models-spherical/SEPoint";
import { SELabel } from "@/models-spherical/SELabel";
import { SELine } from "@/models-spherical/SELine";
import { SESegment } from "@/models-spherical/SESegment";
import { SECircle } from "@/models-spherical/SECircle";
import { SENodule } from "@/models-spherical/SENodule";
import { SEIntersectionPoint } from "@/models-spherical/SEIntersectionPoint";
// import Point from "@/plottables-spherical/Point";
// import Label from "@/plottables-spherical/Label";
// import Segment from "@/plottables-spherical/Segment";
// import Line from "@/plottables-spherical/Line";
// import Circle from "@/plottables-spherical/Circle";
import { SEAngleMarker } from "@/models-spherical/SEAngleMarker";
// import AngleMarker from "@/plottables-spherical/AngleMarker";
import { AngleMode, LabelParentTypes } from "@/types";
import { SESegmentLength } from "@/models-spherical/SESegmentLength";
import { SEPointDistance } from "@/models-spherical/SEPointDistance";
import { SESlider } from "@/models-spherical/SESlider";
// import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { SEExpression } from "@/models-spherical/SEExpression";
import { createTestingPinia, TestingPinia } from "@pinia/testing";
import { useSEStore } from "@/stores/se";
import { setActivePinia } from "pinia";
// import type { SECalculation } from "@/models-spherical/SECalculation";

describe("SENoduleItem.vue", () => {
  let glowingSpy: MockInstance;
  // let visibilitySpy = vi.fn();

  // Common routine for testing label and glowing behavior
  const runTest = async (
    w: VueWrapper,
    se: SENodule,
    isPlottable = true,
    numberOfChildren = 1
  ) => {
    expect(w).toBeDefined();
    expect(se.showing).toBeTruthy();
    expect(w.exists()).toBeTruthy();
    const n = w.find(".nodeItem");
    expect(n.exists()).toBeTruthy();
    // Hover the mouse on the selected item
    await n.trigger("mouseenter");
    await n.trigger("mouseleave");

    // First half of N calls are glowing on, second half of N calls are glowing off
    for (let k = 1; k <= numberOfChildren; k++) {
      expect(glowingSpy).toHaveBeenNthCalledWith(k, true);
      expect(glowingSpy).toHaveBeenNthCalledWith(numberOfChildren + k, false);
    }

    // Click on the "eye" icon to hide/show selected item
    if (isPlottable) {
      const showhide = n.find("[data-testid=toggle_visibility]");
      expect(showhide.exists()).toBeTruthy();
      await showhide.trigger("click"); // hide
      await w.vm.$nextTick();
      expect(se.showing).toBeFalsy();
    }

    if (n instanceof SEExpression) {
      const selectIt = n.find("[data-testid=selection]");
      expect(selectIt.exists()).toBeTruthy();
      assert.fail("incomplete test");
      //   await selectIt.trigger("click");
      //   expect(w.emitted()["object-select"]).toBeTruthy();
    }
  };

  const createPoint = (): SEPoint => new SEPoint();
  const createLine = (): SELine =>
    new SELine(createPoint(), new Vector3(), createPoint());

  const createSegment = (): SESegment =>
    new SESegment(createPoint(), new Vector3(), Math.PI / 4, createPoint());

  // const createLabelFor = (n: SENodule): SELabel => new SELabel("", n);

  beforeAll(() => {
    // Set a spy for the glowing setter function in the parent class
    glowingSpy = vi.spyOn(SENodule.prototype, "glowing", "set");
  });

  beforeEach(() => {
    // SetNoduleDisplayCommand.prototype.do = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks(); // Reset all spied calls
  });

  it("displays points with label, glows on mouseover/leave", async () => {
    const aPoint = createPoint();
    const label = new SELabel("point", aPoint);
    aPoint.label = label;

    const { wrapper } = createWrapper(TestComponent, {
      componentProps: {
        node: aPoint
      },
      stubOptions: {
        VIcon: true
      }
    });
    expect(wrapper.text()).toContain(aPoint.noduleItemText);
    await runTest(wrapper, aPoint);
  });

  it("displays line segments with label, glows on mouseover/leave", async () => {
    const aSegment = createSegment();
    const label = new SELabel("segment", aSegment);
    aSegment.label = label;
    const { wrapper } = createWrapper(TestComponent, {
      componentProps: {
        node: aSegment
      },
      stubOptions: {
        VIcon: true
      }
    });
    expect(wrapper.text()).toContain(aSegment.noduleItemText);
    await runTest(wrapper, aSegment);
  });

  it("displays lines with label, glows on mouseover/leave", async () => {
    const aLine = createLine();
    const label = new SELabel("line", aLine);
    aLine.label = label;
    const { wrapper } = createWrapper(TestComponent, {
      componentProps: {
        node: aLine
      },
      stubOptions: {
        VIcon: true
      }
    });
    expect(wrapper.text()).toContain(aLine.noduleItemText);
    await runTest(wrapper, aLine);
  });

  it("displays circles with label, glows on mouse hover", async () => {
    const firstPoint = createPoint();
    const secondPoint = createPoint();
    const aCircle = new SECircle(firstPoint, secondPoint, false);
    const label = new SELabel("circle", aCircle);
    aCircle.label = label;
    const { wrapper } = createWrapper(TestComponent, {
      componentProps: {
        node: aCircle
      },
      stubOptions: {
        VIcon: true
      }
    });

    expect(wrapper.text()).toContain(aCircle.noduleItemText);
    await runTest(wrapper, aCircle);
  });

  it("displays intersection points with label, glows on mouse hover", async () => {
    const iPt = new SEIntersectionPoint(createLine(), createLine(), 0, true);
    const label = new SELabel("point", iPt);
    iPt.label = label;
    const { wrapper } = createWrapper(TestComponent, {
      componentProps: {
        node: iPt
      },
      stubOptions: {
        VIcon: true
      }
    });
    expect(wrapper.text()).toContain(iPt.noduleItemText);
    await runTest(wrapper, iPt);
  });

  it("displays sliders with the current value", () => {
    const slider = new SESlider({ min: 0, max: 1, step: 0.01, value: 0.29 });
    slider.showing = true;
    const { wrapper } = createWrapper(TestComponent, {
      componentProps: {
        node: slider
      },
      stubOptions: {
        VIcon: true
      }
    });
    expect(wrapper.text()).toContain("0.29");
  });

  it("displays angles between three points with label, glows on mouse hover", async () => {
    const angle = new SEAngleMarker(
      // new AngleMarker(),
      AngleMode.POINTS,
      1.0,
      createPoint(),
      createPoint(),
      createPoint()
    );
    const parentType: LabelParentTypes = "angleMarker";
    const label = new SELabel(parentType, angle);
    angle.label = label;
    const { wrapper } = createWrapper(TestComponent, {
      componentProps: {
        node: angle
      },
      stubOptions: { VIcon: true }
    });
    expect(wrapper.text()).toContain(angle.noduleItemText);

    await runTest(wrapper, angle);
  });

  it("displays angles between two lines with label, glows on mouse hover", async () => {
    const angle = new SEAngleMarker(
      // new AngleMarker(),
      1.0,
      AngleMode.LINES,
      createLine(),
      createLine()
    );
    const label = new SELabel("angleMarker", angle);
    angle.label = label;
    const { wrapper } = createWrapper(TestComponent, {
      componentProps: {
        node: angle
      },
      stubOptions: {
        VIcon: true
      }
    });

    await runTest(wrapper, angle);
  });

  it("displays angles between two segments with label, glows on mouse hover", async () => {
    const angle = new SEAngleMarker(
      // new AngleMarker(),
      1.0,
      AngleMode.SEGMENTS,
      createSegment(),
      createSegment()
    );
    const label = new SELabel("angleMarker", angle);
    angle.label = label;
    const { wrapper } = createWrapper(TestComponent, {
      componentProps: {
        node: angle
      },
      stubOptions: {
        VIcon: true
      }
    });
    expect(wrapper.text()).toContain(angle.noduleItemText);
    await runTest(wrapper, angle);
  });

  it("displays angles between a line and a segment with label, glows on mouse hover", async () => {
    const angle = new SEAngleMarker(
      // new AngleMarker(),
      1.0,
      AngleMode.LINEANDSEGMENT,
      createLine(),
      createSegment()
    );
    const label = new SELabel("angleMarker", angle);
    angle.label = label;
    const { wrapper } = createWrapper(TestComponent, {
      componentProps: {
        node: angle
      },
      stubOptions: {
        VIcon: true
      }
    });
    expect(wrapper.text()).toContain(angle.noduleItemText);
    await runTest(wrapper, angle);
  });

  it("displays segment lengths, glows on mouse hover", async () => {
    const testPinia = createTestingPinia({
      stubActions: false,
      createSpy: vi.fn
    });
    setActivePinia(testPinia);
    const seStore = useSEStore(testPinia);
    SENodule.setGlobalStore(seStore);

    const aSegment = createSegment();
    const parentType: LabelParentTypes = "segment";
    const label = new SELabel(parentType, aSegment);
    aSegment.label = label;
    const aSegLen = new SESegmentLength(aSegment);
    aSegment.registerChild(aSegLen);
    const { wrapper } = createWrapper(TestComponent, {
      componentProps: {
        node: aSegLen
      },
      stubOptions: {
        VIcon: true
      }
    });
    // wrapper.setProps({ node: aSegLen })
    // await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain(aSegment.noduleItemText);
    await runTest(wrapper, aSegment, false);
  });

  it("displays segment distances, glows on mouse hover", async () => {
    const point1 = createPoint();
    const label1 = new SELabel("point", point1);
    point1.label = label1;
    const point2 = createPoint();
    const label2 = new SELabel("point", point2);
    point2.label = label2;
    const aSegDistance = new SEPointDistance(point1, point2);
    point1.registerChild(aSegDistance);
    point2.registerChild(aSegDistance);
    const { wrapper } = createWrapper(TestComponent, {
      componentProps: {
        node: aSegDistance
      },
      stubOptions: {
        VIcon: true
      }
    });
    // expect(wrapper.text()).toContain(aSegDistance.noduleItemText);

    // Run the test for both points, a point distance has two children
    await runTest(wrapper, point1, false, 2);
    await runTest(wrapper, point2, false, 2);
  });

  // xit("displays expressions", async () => {
  //   const VALUE = 2.134;
  //   const expr = new SECalculation(VALUE.toString());
  //   const wrapper = createWrapper(TestComponent, {
  //     mountOptions: {
  //       propsData: {
  //         node: expr
  //       }
  //     }
  //   });
  //   const toggle = wrapper.find("#_test_toggle_format");
  //   expect(wrapper.text()).toContain(VALUE.toString());
  //   await toggle.trigger("click"); // switch display format to multiple of Pi
  //   expect(wrapper.text()).toContain((VALUE / Math.PI).toFixed(3));
  //   /* TODO: add a test case for SECalculation */
  // });
});
