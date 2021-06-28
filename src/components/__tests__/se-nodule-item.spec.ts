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
import { SESegmentDistance } from "@/models/SESegmentDistance";
import { SESlider } from "@/models/SESlider";
describe("SENoduleItem.vue", () => {
  let glowingSpy: jest.SpyInstance;

  // Common routine for testing label and glowing behavior
  const runTest = async (
    w: Wrapper<Vue>,
    se: SENodule,
    numberOfChildren = 1
  ) => {
    expect(w).toBeDefined();
    expect(w.text()).toContain(se.name);
    const n = w.find(".node");
    await n.trigger("mouseenter");
    await n.trigger("mouseleave");

    // First half of N calls are glowing on, second half of N calls are glowing off
    for (let k = 1; k <= numberOfChildren; k++) {
      expect(glowingSpy).toHaveBeenNthCalledWith(k, true);
      expect(glowingSpy).toHaveBeenNthCalledWith(numberOfChildren + k, false);
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

  afterEach(() => {
    jest.clearAllMocks(); // Reset all spied calls
  });

  it("shows points with label, glows on mouseover/leave", async () => {
    const aPoint = createPoint();
    const label = createLabelFor(aPoint);
    aPoint.label = label;
    const wrapper = createWrapper(TestComponent, {
      mountOptions: {
        propsData: { node: aPoint }
      }
    });
    runTest(wrapper, aPoint);
  });

  it("shows line segments with label, glows on mouseover/leave", () => {
    const aSegment = createSegment();
    const label = createLabelFor(aSegment);
    aSegment.label = label;
    const wrapper = createWrapper(TestComponent, {
      mountOptions: {
        propsData: { node: aSegment }
      }
    });
    runTest(wrapper, aSegment);
  });

  it("shows lines with label, glows on mouseover/leave", () => {
    const aLine = createLine();
    const label = createLabelFor(aLine);
    aLine.label = label;
    const wrapper = createWrapper(TestComponent, {
      mountOptions: {
        propsData: { node: aLine }
      }
    });
    runTest(wrapper, aLine);
  });

  it("shows circles with label, glows on mouse hover", () => {
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

    runTest(wrapper, aCircle);
  });

  it("shows intersection points with label, glows on mouse hover", () => {
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
    runTest(wrapper, iPt);
  });

  it("shows sliders with the current value", () => {
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
  it("shows angles between three points with label, glows on mouse hover", () => {
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

    runTest(wrapper, angle);
  });

  it("shows angles between two lines with label, glows on mouse hover", () => {
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

    runTest(wrapper, angle);
  });

  it("shows angles between two segments with label, glows on mouse hover", () => {
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

    runTest(wrapper, angle);
  });

  it("shows angles between a line and a segment with label, glows on mouse hover", () => {
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

    runTest(wrapper, angle);
  });

  it("shows segment lengths, glows on mouse hover", () => {
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
    runTest(wrapper, aSegLen);
  });

  it("shows segment distances, glows on mouse hover", () => {
    const point1 = createPoint();
    const label1 = createLabelFor(point1);
    point1.label = label1;
    const point2 = createPoint();
    const label2 = createLabelFor(point2);
    point2.label = label2;
    const aSegDistance = new SESegmentDistance(point1, point2);
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
    runTest(wrapper, aSegDistance, 2);
  });

  /* TODO: add a test case for SEExpression */
});
