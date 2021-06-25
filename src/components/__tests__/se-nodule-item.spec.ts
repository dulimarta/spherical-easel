import TestComponent from "../SENoduleItem.vue";
import store from "@/store";
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
describe("SENoduleItem.vue", () => {
  let glowingSpy: jest.SpyInstance;

  // Common routine for testing label and glowing behavior
  const runTest = async (w: Wrapper<TestComponent>, se: SENodule) => {
    expect(w).toBeDefined();
    expect(w.text()).toContain(se.name);
    const n = w.find(".node");
    await n.trigger("mouseenter");
    await n.trigger("mouseleave");

    // First call is glowing on, second call is glowing off
    expect(glowingSpy).toHaveBeenNthCalledWith(1, true);
    expect(glowingSpy).toHaveBeenNthCalledWith(2, false);
  };

  const createPoint = () => new SEPoint(new Point());
  const createLine = () =>
    new SELine(new Line(), createPoint(), new Vector3(), createPoint());

  const createSegment = () =>
    new SESegment(
      new Segment(),
      createPoint(),
      new Vector3(),
      Math.PI / 4,
      createPoint()
    );

  const createLabelFor = (n: SENodule) => new SELabel(new Label(), n);

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

  it("shows circles with label, glows on mouseenter/leave", () => {
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

  it("shows intersection points with label, glows on mouseenter/leave", () => {
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

  it("shows angles between three points with label, glows on mouseenter/leave", () => {
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

  it("shows angles between two lines with label, glows on mouseenter/leave", () => {
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

  it("shows angles between two segments with label, glows on mouseenter/leave", () => {
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

  it("shows angles between a line and a segment with label, glows on mouseenter/leave", () => {
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
});
