import TestComponent from "../SENoduleItem.vue";
import { Vector3 } from "three";
import { Wrapper } from "@vue/test-utils";
import { createWrapper } from "@/../tests/vue-helper";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { SECircle } from "@/models/SECircle";
import { SENodule } from "@/models/SENodule";
import { SEIntersectionPoint } from "@/models/SEIntersectionPoint";
import Point from "@/plottables/Point";
import Label from "@/plottables/Label";
import Segment from "@/plottables/Segment";
import Line from "@/plottables/Line";
import Circle from "@/plottables/Circle";
import { SEAngleMarker } from "@/models/SEAngleMarker";
import AngleMarker from "@/plottables/AngleMarker";
import { AngleMode } from "@/types";
import { SESegmentLength } from "@/models/SESegmentLength";
import { SEPointDistance } from "@/models/SEPointDistance";
import { SESlider } from "@/models/SESlider";
import { SetNoduleDisplayCommand } from "@/commands/SetNoduleDisplayCommand";
import { SEExpression } from "@/models/SEExpression";
import { SECalculation } from "@/models/SECalculation";
describe("SENoduleItem.vue", () => {
  let glowingSpy: jest.SpyInstance;
  let visibilitySpy = jest.fn();

  // Common routine for testing label and glowing behavior
  const runTest = async (
    w: Wrapper<Vue>,
    se: SENodule,
    isPlottable = true,
    numberOfChildren = 1
  ) => {
    expect(w).toBeDefined();
    expect(w.text()).toContain(se.name);
    const n = w.find(".node");
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
      const showhide = n.find("#_test_toggle_visibility");
      await showhide.trigger("click"); // hide
      expect(SetNoduleDisplayCommand.prototype.do).toHaveBeenCalled();
    }

    if (n instanceof SEExpression) {
      const selectIt = n.find("#_test_selection");
      await selectIt.trigger("click");
      expect(w.emitted()["object-select"]).toBeTruthy();
    }
  };

  const createPoint = (): SEPoint => new SEPoint(new Point());
  const createLine = (): SELine =>
    new SELine(new Line(), createPoint(), new Vector3(), createPoint());

  const createSegment = (): SESegment =>
    new SESegment(
      new Segment(),
      createPoint(),
      new Vector3(),
      Math.PI / 4,
      createPoint()
    );

  const createLabelFor = (n: SENodule): SELabel => new SELabel(new Label(), n);

  beforeAll(() => {
    // Set a Jest spy for the glowing setter function in the parent class
    glowingSpy = jest.spyOn(SENodule.prototype, "glowing", "set");
  });

  beforeEach(() => {
    SetNoduleDisplayCommand.prototype.do = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Reset all spied calls
  });

  it("displays points with label, glows on mouseover/leave", async () => {
    const aPoint = createPoint();
    const label = createLabelFor(aPoint);
    aPoint.label = label;
    const wrapper = createWrapper(TestComponent, {
      mountOptions: {
        propsData: { node: aPoint }
      }
    });
    await runTest(wrapper, aPoint);
  });

  it("displays line segments with label, glows on mouseover/leave", async () => {
    const aSegment = createSegment();
    const label = createLabelFor(aSegment);
    aSegment.label = label;
    const wrapper = createWrapper(TestComponent, {
      mountOptions: {
        propsData: { node: aSegment }
      }
    });
    await runTest(wrapper, aSegment);
  });

  it("displays lines with label, glows on mouseover/leave", async () => {
    const aLine = createLine();
    const label = createLabelFor(aLine);
    aLine.label = label;
    const wrapper = createWrapper(TestComponent, {
      mountOptions: {
        propsData: { node: aLine }
      }
    });
    await runTest(wrapper, aLine);
  });

  it("displays circles with label, glows on mouse hover", async () => {
    const firstPoint = createPoint();
    const secondPoint = createPoint();
    const aCircle = new SECircle(new Circle(), firstPoint, secondPoint);
    const label = createLabelFor(aCircle);
    aCircle.label = label;
    const wrapper = createWrapper(TestComponent, {
      mountOptions: {
        propsData: { node: aCircle }
      }
    });

    await runTest(wrapper, aCircle);
  });

  it("displays intersection points with label, glows on mouse hover", async () => {
    const iPt = new SEIntersectionPoint(
      new Point(),
      createLine(),
      createLine(),
      0,
      true
    );
    const label = createLabelFor(iPt);
    iPt.label = label;
    const wrapper = createWrapper(TestComponent, {
      mountOptions: {
        propsData: { node: iPt }
      }
    });
    await runTest(wrapper, iPt);
  });

  it("displays sliders with the current value", () => {
    const slider = new SESlider({ min: 0, max: 1, step: 0.01, value: 0.29 });
    slider.showing = true;
    const wrapper = createWrapper(TestComponent, {
      mountOptions: {
        propsData: {
          node: slider
        }
      }
    });
    expect(wrapper.text()).toContain("0.29");
  });

  it("displays angles between three points with label, glows on mouse hover", async () => {
    const angle = new SEAngleMarker(
      new AngleMarker(),
      AngleMode.POINTS,
      createPoint(),
      createPoint(),
      createPoint()
    );
    const label = createLabelFor(angle);
    angle.label = label;
    const wrapper = createWrapper(TestComponent, {
      mountOptions: {
        propsData: {
          node: angle
        }
      }
    });

    await runTest(wrapper, angle);
  });

  it("displays angles between two lines with label, glows on mouse hover", async () => {
    const angle = new SEAngleMarker(
      new AngleMarker(),
      AngleMode.LINES,
      createLine(),
      createLine()
    );
    const label = createLabelFor(angle);
    angle.label = label;
    const wrapper = createWrapper(TestComponent, {
      mountOptions: {
        propsData: {
          node: angle
        }
      }
    });

    await runTest(wrapper, angle);
  });

  it("displays angles between two segments with label, glows on mouse hover", async () => {
    const angle = new SEAngleMarker(
      new AngleMarker(),
      AngleMode.SEGMENTS,
      createSegment(),
      createSegment()
    );
    const label = createLabelFor(angle);
    angle.label = label;
    const wrapper = createWrapper(TestComponent, {
      mountOptions: {
        propsData: {
          node: angle
        }
      }
    });

    await runTest(wrapper, angle);
  });

  it("displays angles between a line and a segment with label, glows on mouse hover", async () => {
    const angle = new SEAngleMarker(
      new AngleMarker(),
      AngleMode.LINEANDSEGMENT,
      createLine(),
      createSegment()
    );
    const label = createLabelFor(angle);
    angle.label = label;
    const wrapper = createWrapper(TestComponent, {
      mountOptions: {
        propsData: {
          node: angle
        }
      }
    });

    await runTest(wrapper, angle);
  });

  it("displays segment lengths, glows on mouse hover", async () => {
    const aSegment = createSegment();
    const label = createLabelFor(aSegment);
    aSegment.label = label;
    const aSegLen = new SESegmentLength(aSegment);
    aSegment.registerChild(aSegLen);
    const wrapper = createWrapper(TestComponent, {
      mountOptions: {
        propsData: {
          node: aSegLen
        }
      }
    });
    await runTest(wrapper, aSegLen, false);
  });

  it("displays segment distances, glows on mouse hover", async () => {
    const point1 = createPoint();
    const label1 = createLabelFor(point1);
    point1.label = label1;
    const point2 = createPoint();
    const label2 = createLabelFor(point2);
    point2.label = label2;
    const aSegDistance = new SEPointDistance(point1, point2);
    point1.registerChild(aSegDistance);
    point2.registerChild(aSegDistance);
    const wrapper = createWrapper(TestComponent, {
      mountOptions: {
        propsData: {
          node: aSegDistance
        }
      }
    });
    // A segment distance has two children
    await runTest(wrapper, aSegDistance, false, 2);
  });

  xit("displays expressions", async () => {
    const VALUE = 2.134;
    const expr = new SECalculation(VALUE.toString());
    const wrapper = createWrapper(TestComponent, {
      mountOptions: {
        propsData: {
          node: expr
        }
      }
    });
    const toggle = wrapper.find("#_test_toggle_format");
    expect(wrapper.text()).toContain(VALUE.toString());
    await toggle.trigger("click"); // switch display format to multiple of Pi
    expect(wrapper.text()).toContain((VALUE / Math.PI).toFixed(3));
    /* TODO: add a test case for SECalculation */
  });
});
