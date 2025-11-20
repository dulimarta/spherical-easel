import { SEAngleMarker } from "@/models/SEAngleMarker";
import AngleMarker from "@/plottables/AngleMarker";
import SETTINGS from "@/global-settings";
import { Vector3 } from "three";
import {
  DEFAULT_ANGLE_MARKER_BACK_STYLE,
  DEFAULT_ANGLE_MARKER_FRONT_STYLE
} from "@/types/Styles";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { AngleMode, ValueDisplayMode } from "@/types";
import { LabelMoverVisitor } from "@/visitors/LabelMoverVisitor";
import { LineNormalVisitor } from "@/visitors/LineNormalVisitor";
import { PointMoverVisitor } from "@/visitors/PointMoverVisitor";
import { RotationVisitor } from "@/visitors/RotationVisitor";
import { SegmentNormalArcLengthVisitor } from "@/visitors/SegmentNormalArcLengthVisitor";

const createPoint = (): SEPoint => new SEPoint();
const createLine = (): SELine =>
  new SELine(createPoint(), new Vector3(), createPoint());
const createSegment = (): SESegment =>
  new SESegment(createPoint(), new Vector3(), Math.PI / 4, createPoint());

describe("SEAngleMarker: SE angleMarker constructor generates a valid angleMarker model", () => {
  let testSEAngleMarkerNone: any;
  let testSEAngleMarkerLines: any;
  let testSEAngleMarkerPoints: any;
  let testSEAngleMarkerSegments: any;
  let testSEAngleMarkerLineAndSegment: any;
  let testSEAngleMarkerSegmentsOrLineAndSegment: any;

  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );

    testSEAngleMarkerLines = new SEAngleMarker(
      AngleMode.LINES,
      1.0,
      createLine(),
      createLine()
    );

    testSEAngleMarkerPoints = new SEAngleMarker(
      AngleMode.POINTS,
      1.0,
      createPoint(),
      createPoint(),
      createPoint()
    );

    testSEAngleMarkerSegments = new SEAngleMarker(
      AngleMode.SEGMENTS,
      1.0,
      createSegment(),
      createSegment()
    );

    testSEAngleMarkerLineAndSegment = new SEAngleMarker(
      AngleMode.LINEANDSEGMENT,
      1.0,
      createLine(),
      createSegment()
    );

    testSEAngleMarkerSegmentsOrLineAndSegment = new SEAngleMarker(
      AngleMode.LINEANDSEGMENT,
      1.0,
      createLine(),
      createSegment()
    );
  });

  it("attaches an angleMarker plottable to ref", async () => {
    expectTypeOf(testSEAngleMarkerNone.ref).toEqualTypeOf({ a: AngleMarker });
    expectTypeOf(testSEAngleMarkerLines.ref).toEqualTypeOf({ a: AngleMarker });
    expectTypeOf(testSEAngleMarkerPoints.ref).toEqualTypeOf({ a: AngleMarker });
    expectTypeOf(testSEAngleMarkerSegments.ref).toEqualTypeOf({ a: AngleMarker });
    expectTypeOf(testSEAngleMarkerLineAndSegment.ref).toEqualTypeOf({ a: AngleMarker });
    expectTypeOf(testSEAngleMarkerSegmentsOrLineAndSegment.ref).toEqualTypeOf({ a: AngleMarker });
  });

  it("properly sets SEP parents", async () => {
    expectTypeOf(testSEAngleMarkerLines._firstSEPParent).toEqualTypeOf({ a: SELine });
    expectTypeOf(testSEAngleMarkerLines._secondSEPParent).toEqualTypeOf({ a: SELine });
    expect(testSEAngleMarkerLines._thirdSEPParent).toBeTypeOf("undefined");

    expectTypeOf(testSEAngleMarkerPoints._firstSEPParent).toEqualTypeOf({ a: SEPoint });
    expectTypeOf(testSEAngleMarkerPoints._secondSEPParent).toEqualTypeOf({ a: SEPoint });
    expectTypeOf(testSEAngleMarkerPoints._thirdSEPParent).toEqualTypeOf({ a: SEPoint });

    expectTypeOf(testSEAngleMarkerSegments._firstSEPParent).toEqualTypeOf({ a: SESegment });
    expectTypeOf(testSEAngleMarkerSegments._secondSEPParent).toEqualTypeOf({ a: SESegment });
    expect(testSEAngleMarkerSegments._thirdSEPParent).toBeTypeOf("undefined");

    expectTypeOf(testSEAngleMarkerLineAndSegment._firstSEPParent).toEqualTypeOf({ a: SELine });
    expectTypeOf(testSEAngleMarkerLineAndSegment._secondSEPParent).toEqualTypeOf({ a: SESegment });
    expect(testSEAngleMarkerLineAndSegment._thirdSEPParent).toBeTypeOf("undefined");
  });
});

describe("SEAngleMarker: customStyles returns the styleSet", () => {
  let testSEAngleMarkerNone: any;
  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );
  });

  it("returns a proper Set type with all style attributes", async () => {
    let styleReturn = testSEAngleMarkerNone.customStyles();
    expectTypeOf(styleReturn).toEqualTypeOf({ a: Set });
    for (const attr of Object.keys(DEFAULT_ANGLE_MARKER_FRONT_STYLE)) {
      expect(styleReturn).toContainEqual(attr);
    }
    for (const attr of Object.keys(DEFAULT_ANGLE_MARKER_BACK_STYLE)) {
      expect(styleReturn).toContainEqual(attr);
    }
  });
});

describe("SEAngleMarker: valueDisplayMode getter and setter properly read and update expression", () => {
  let testSEAngleMarkerNone: any;
  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );
  });

  it("gets a ValueDisplayMode enum", async () => {
    expectTypeOf(testSEAngleMarkerNone.valueDisplayMode).toEqualTypeOf({ a: ValueDisplayMode });
  });

  it("sets all ValueDisplayMode values properly", async () => {
    testSEAngleMarkerNone.valueDisplayMode = ValueDisplayMode.Number;
    expect(testSEAngleMarkerNone.valueDisplayMode).toEqual(ValueDisplayMode.Number);
    testSEAngleMarkerNone.valueDisplayMode = ValueDisplayMode.MultipleOfPi;
    expect(testSEAngleMarkerNone.valueDisplayMode).toEqual(ValueDisplayMode.MultipleOfPi);
    testSEAngleMarkerNone.valueDisplayMode = ValueDisplayMode.DegreeDecimals;
    expect(testSEAngleMarkerNone.valueDisplayMode).toEqual(ValueDisplayMode.DegreeDecimals);
    testSEAngleMarkerNone.valueDisplayMode = ValueDisplayMode.EarthModeMiles;
    expect(testSEAngleMarkerNone.valueDisplayMode).toEqual(ValueDisplayMode.EarthModeMiles);
    testSEAngleMarkerNone.valueDisplayMode = ValueDisplayMode.EarthModeKilos;
    expect(testSEAngleMarkerNone.valueDisplayMode).toEqual(ValueDisplayMode.EarthModeKilos);
  });
});

describe("SEAngleMarker: angleMarkerNumber getter properly reads angle marker number", () => {
  let testSEAngleMarkerNone: any;
  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );
  });

  it("gets a number", async () => {
    expectTypeOf(testSEAngleMarkerNone.angleMarkerNumber).toBeNumber();
  });
});

describe("SEAngleMarker: angleMode getter properly reads angle mode", () => {
  let testSEAngleMarkerNone: any;
  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );
  });

  it("gets an AngleMode enum", async () => {
    expectTypeOf(testSEAngleMarkerNone.angleMode).toEqualTypeOf({ a: AngleMode });
  });
});

describe("SEAngleMarker: value getter properly returns angle of angle marker", () => {
  let testSEAngleMarkerNone: any;
  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );
  });

  it("gets a number that is equal to the angle", async () => {
    expectTypeOf(testSEAngleMarkerNone.value).toBeNumber();
    expect(testSEAngleMarkerNone.value.toDegrees()).toEqual(testSEAngleMarkerNone._measure);
  });
});

describe("SEAngleMarker: noduleDescription returns a proper text description of the angle marker model", () => {
  let testSEAngleMarkerLines: any;
  let testSEAngleMarkerPoints: any;
  let testSEAngleMarkerSegments: any;
  let testSEAngleMarkerLineAndSegment: any;
  let testSEAngleMarkerSegmentsOrLineAndSegment: any;

  afterEach(() => {
    vi.clearAllMocks();
  });

  // NOTE: AngleMode.NONE is excluded because it defaults to line and segment, as it's not accounted for.

  it("lines AngleMarker gets a string and accesses components", async () => {
    testSEAngleMarkerLines = new SEAngleMarker(
      AngleMode.LINES,
      1.0,
      createLine(),
      createLine()
    );
    const measureSpy = vi.spyOn(testSEAngleMarkerLines, "_measure", "get");

    expectTypeOf(testSEAngleMarkerLines.noduleDescription).toBeString();
    expect(measureSpy).toHaveBeenCalled();
  });

  it("points AngleMarker gets a string and accesses components", async () => {
    testSEAngleMarkerPoints = new SEAngleMarker(
      AngleMode.POINTS,
      1.0,
      createPoint(),
      createPoint(),
      createPoint()
    );
    const measureSpy = vi.spyOn(testSEAngleMarkerPoints, "_measure", "get");

    expectTypeOf(testSEAngleMarkerPoints.noduleDescription).toBeString();
    expect(measureSpy).toHaveBeenCalled();
  });

  it("segments AngleMarker gets a string and accesses components", async () => {
    testSEAngleMarkerSegments = new SEAngleMarker(
      AngleMode.SEGMENTS,
      1.0,
      createSegment(),
      createSegment()
    );
    const measureSpy = vi.spyOn(testSEAngleMarkerSegments, "_measure", "get");

    expectTypeOf(testSEAngleMarkerSegments.noduleDescription).toBeString();
    expect(measureSpy).toHaveBeenCalled();
  });

  it("line & segment AngleMarker gets a string and accesses components", async () => {
    testSEAngleMarkerLineAndSegment = new SEAngleMarker(
      AngleMode.LINEANDSEGMENT,
      1.0,
      createLine(),
      createSegment()
    );
    const measureSpy = vi.spyOn(testSEAngleMarkerLineAndSegment, "_measure", "get");

    expectTypeOf(testSEAngleMarkerLineAndSegment.noduleDescription).toBeString();
    expect(measureSpy).toHaveBeenCalled();
  });

  it("segments or line & segment AngleMarker gets a string and accesses components", async () => {
    testSEAngleMarkerSegmentsOrLineAndSegment = new SEAngleMarker(
      AngleMode.LINEANDSEGMENT,
      1.0,
      createLine(),
      createSegment()
    );
    const measureSpy = vi.spyOn(testSEAngleMarkerSegmentsOrLineAndSegment, "_measure", "get");

    expectTypeOf(testSEAngleMarkerSegmentsOrLineAndSegment.noduleDescription).toBeString();
    expect(measureSpy).toHaveBeenCalled();
  });
});

describe("SEAngleMarker: noduleItemText returns a proper model name", () => {
  let testSEAngleMarkerNone: any;
  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );
  });

  it("gets a string", async () => {
    expectTypeOf(testSEAngleMarkerNone.noduleItemText).toBeString();
  });
});

describe("SEAngleMarker: SEPParent getters properly read the model parent", () => {
  let testSEAngleMarkerNone: any;

  it("getters gets SEPoint object type when applicable", async () => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );

    expectTypeOf(testSEAngleMarkerNone.firstSEParent).toEqualTypeOf({ a: SEPoint });
    expectTypeOf(testSEAngleMarkerNone.secondSEParent).toEqualTypeOf({ a: SEPoint });
  });

  it("getters gets SELine object type when applicable", async () => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createLine(),
      createLine()
    );

    expectTypeOf(testSEAngleMarkerNone.firstSEParent).toEqualTypeOf({ a: SELine });
    expectTypeOf(testSEAngleMarkerNone.secondSEParent).toEqualTypeOf({ a: SELine });
  });

  it("getters gets SESegment object type when applicable", async () => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createSegment(),
      createSegment()
    );

    expectTypeOf(testSEAngleMarkerNone.firstSEParent).toEqualTypeOf({ a: SESegment });
    expectTypeOf(testSEAngleMarkerNone.secondSEParent).toEqualTypeOf({ a: SESegment });
  });
});

describe("SEAngleMarker: vertexVector getter properly reads the vertex vector", () => {
  let testSEAngleMarkerNone: any;
  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );
  });

  it("gets a vector", async () => {
    expectTypeOf(testSEAngleMarkerNone.vertexVector).toEqualTypeOf({ a: Vector3 });
  });
});

describe("SEAngleMarker: startVector getter properly reads the start vector", () => {
  let testSEAngleMarkerNone: any;
  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );
  });

  it("gets a vector", async () => {
    expectTypeOf(testSEAngleMarkerNone.startVector).toEqualTypeOf({ a: Vector3 });
  });
});

describe("SEAngleMarker: endVector getter properly reads the end vector", () => {
  let testSEAngleMarkerNone: any;
  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );
  });

  it("gets a vector", async () => {
    expectTypeOf(testSEAngleMarkerNone.endVector).toEqualTypeOf({ a: Vector3 });
  });
});

describe("SEAngleMarker: PointDirectionScalar getters properly read the angleMarker scalars", () => {
  let testSEAngleMarkerNone: any;
  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );
  });

  it("secondPointDirectionScalar gets a number", async () => {
    expectTypeOf(testSEAngleMarkerNone.secondPointDirectionScalar).toBeNumber();
  });

  it("firstPointDirectionScalar gets a number", async () => {
    expectTypeOf(testSEAngleMarkerNone.firstPointDirectionScalar).toBeNumber();
  });
});

describe("SEAngleMarker: isHitAt properly detects if a given vector is on the angleMarker", () => {
  let testSEAngleMarkerNone: any;
  let hitVectorLocation: Vector3;

  let maxAngle = SETTINGS.angleMarker.defaultRadius + SETTINGS.angleMarker.hitIdealDistance;
  let maxAdjDistance = Math.cos(maxAngle);
  let maxOppDistance = Math.sin(maxAngle);

  let maxAngleMinZoom = maxAngle / SETTINGS.zoom.minMagnification;
  let maxAdjDistanceMinZoom = Math.cos(maxAngleMinZoom);
  let maxOppDistanceMinZoom = Math.sin(maxAngleMinZoom);

  let maxAngleMaxZoom = maxAngle / SETTINGS.zoom.maxMagnification;
  let maxAdjDistanceMaxZoom = Math.cos(maxAngleMaxZoom);
  let maxOppDistanceMaxZoom = Math.sin(maxAngleMaxZoom);

  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );
    testSEAngleMarkerNone._vertexVector = new Vector3(0, 0, 1);
    /* Creates a 90 degree angle facing positively x. */
    testSEAngleMarkerNone._startVector = new Vector3(Math.sin(SETTINGS.angleMarker.defaultRadius),
      -Math.sin(SETTINGS.angleMarker.defaultRadius), Math.cos(SETTINGS.angleMarker.defaultRadius)).normalize();
    testSEAngleMarkerNone._endVector = new Vector3(Math.sin(SETTINGS.angleMarker.defaultRadius),
      Math.sin(SETTINGS.angleMarker.defaultRadius), Math.cos(SETTINGS.angleMarker.defaultRadius)).normalize();
  });

  // NOTE: returns a non-hit if on border.

  it("returns true if within angle and max range at 1 zoom", async () => {
    /* Test x+ direction from vertex vector and vector itself. */
    hitVectorLocation = new Vector3(maxOppDistance * 0.99, 0, maxAdjDistance);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, 1)).toBeTruthy();

    hitVectorLocation = new Vector3(0, 0, 1);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, 1)).toBeTruthy();
  });

  it("returns false if outside of angle and max range at 1 zoom", async () => {
    /* Test four directions around vector and opposite vector. */
    hitVectorLocation = new Vector3(0, maxOppDistance, maxAdjDistance);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, 1)).toBeFalsy();
    hitVectorLocation = new Vector3(0, 0.1, 1);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, 1)).toBeFalsy();

    hitVectorLocation = new Vector3(0, -maxOppDistance, maxAdjDistance);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, 1)).toBeFalsy();
    hitVectorLocation = new Vector3(0, -0.1, 1);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, 1)).toBeFalsy();

    hitVectorLocation = new Vector3(maxOppDistance, 0, maxAdjDistance);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, 1)).toBeFalsy();

    hitVectorLocation = new Vector3(-maxOppDistance, 0, maxAdjDistance);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, 1)).toBeFalsy();
    hitVectorLocation = new Vector3(-0.1, 0, 1);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, 1)).toBeFalsy();

    hitVectorLocation = new Vector3(0, 0, -1);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, 1)).toBeFalsy();
  });

  // TODO FIX
  it("returns true if within angle and max range at minimum zoom", async () => {
    /* Test x+ direction from vertex vector and vector itself. */
    //hitVectorLocation = new Vector3(maxOppDistanceMinZoom * 0.99, 0, maxAdjDistanceMinZoom);
    //expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, SETTINGS.zoom.minMagnification)).toBeTruthy();

    hitVectorLocation = new Vector3(0, 0, 1);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, SETTINGS.zoom.minMagnification)).toBeTruthy();
  });

  it("returns false if outside of angle and max range at minimum zoom", async () => {
    /* Test four directions around vector and opposite vector. */
    hitVectorLocation = new Vector3(0, maxOppDistance, maxAdjDistance);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, SETTINGS.zoom.minMagnification)).toBeFalsy();
    hitVectorLocation = new Vector3(0, 0.1, 1);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, SETTINGS.zoom.minMagnification)).toBeFalsy();

    hitVectorLocation = new Vector3(0, -maxOppDistanceMinZoom, maxAdjDistanceMinZoom);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, SETTINGS.zoom.minMagnification)).toBeFalsy();
    hitVectorLocation = new Vector3(0, -0.1, 1);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, SETTINGS.zoom.minMagnification)).toBeFalsy();

    hitVectorLocation = new Vector3(maxOppDistanceMinZoom, 0, maxAdjDistanceMinZoom);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, 1)).toBeFalsy();

    hitVectorLocation = new Vector3(-maxOppDistanceMinZoom, 0, maxAdjDistanceMinZoom);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, SETTINGS.zoom.minMagnification)).toBeFalsy();
    hitVectorLocation = new Vector3(-0.1, 0, 1);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, SETTINGS.zoom.minMagnification)).toBeFalsy();

    hitVectorLocation = new Vector3(0, 0, -1);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, SETTINGS.zoom.minMagnification)).toBeFalsy();
  });

  it("returns true if within angle and max range at maximum zoom", async () => {
    /* Test x+ direction from vertex vector and vector itself. */
    hitVectorLocation = new Vector3(maxOppDistanceMaxZoom * 0.99, 0, maxAdjDistanceMaxZoom);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, SETTINGS.zoom.minMagnification)).toBeTruthy();

    hitVectorLocation = new Vector3(0, 0, 1);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, SETTINGS.zoom.minMagnification)).toBeTruthy();
  });

  // TODO FIX
  it("returns false if outside of angle and max range at maximum zoom", async () => {
    /* Test four directions around vector and opposite vector. */
    hitVectorLocation = new Vector3(0, maxOppDistanceMaxZoom, maxAdjDistanceMaxZoom);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, SETTINGS.zoom.maxMagnification)).toBeFalsy();
    hitVectorLocation = new Vector3(0, 0.1, 1);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, SETTINGS.zoom.maxMagnification)).toBeFalsy();

    hitVectorLocation = new Vector3(0, -maxOppDistanceMaxZoom, maxAdjDistanceMaxZoom);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, SETTINGS.zoom.maxMagnification)).toBeFalsy();
    hitVectorLocation = new Vector3(0, -0.1, 1);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, SETTINGS.zoom.maxMagnification)).toBeFalsy();

    //hitVectorLocation = new Vector3(maxOppDistanceMaxZoom, 0, maxAdjDistanceMaxZoom);
    //expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, 1)).toBeFalsy();

    hitVectorLocation = new Vector3(-maxOppDistanceMaxZoom, 0, maxAdjDistanceMaxZoom);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, SETTINGS.zoom.maxMagnification)).toBeFalsy();
    hitVectorLocation = new Vector3(-0.1, 0, 1);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, SETTINGS.zoom.maxMagnification)).toBeFalsy();

    hitVectorLocation = new Vector3(0, 0, -1);
    expect(testSEAngleMarkerNone.isHitAt(hitVectorLocation, SETTINGS.zoom.maxMagnification)).toBeFalsy();
  });
});

describe("SEAngleMarker: update properly updates angleMarker model", () => {
  let testSEAngleMarkerNone: any;
  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("runs update functions based on return of canUpdateNow", async () => {
    const shallowUpdateSpy = vi.spyOn(testSEAngleMarkerNone, 'shallowUpdate');
    const mockCanUpdateNow = vi.spyOn(testSEAngleMarkerNone, 'canUpdateNow');
    mockCanUpdateNow.mockImplementation(() => false);

    testSEAngleMarkerNone.update();
    expect(shallowUpdateSpy).not.toHaveBeenCalled();

    mockCanUpdateNow.mockImplementation(() => true);

    testSEAngleMarkerNone.update();
    expect(shallowUpdateSpy).toHaveBeenCalled();
  });

  it("runs update functions based on return of canUpdateNow", async () => {
    const shallowUpdateSpy = vi.spyOn(testSEAngleMarkerNone, 'shallowUpdate');
    const mockCanUpdateNow = vi.spyOn(testSEAngleMarkerNone, 'canUpdateNow');
    mockCanUpdateNow.mockImplementation(() => false);

    testSEAngleMarkerNone.update();
    expect(shallowUpdateSpy).not.toHaveBeenCalled();

    mockCanUpdateNow.mockImplementation(() => true);

    testSEAngleMarkerNone.update();
    expect(shallowUpdateSpy).toHaveBeenCalled();
  });

  it("runs expected update functions", async () => {
    const shallowUpdateSpy = vi.spyOn(testSEAngleMarkerNone, 'shallowUpdate');
    const updateKidsSpy = vi.spyOn(testSEAngleMarkerNone, 'updateKids');

    testSEAngleMarkerNone.update();
    expect(shallowUpdateSpy).toHaveBeenCalled();
    expect(updateKidsSpy).toHaveBeenCalled();
  });
});

describe("SEAngleMarker: shallowUpdate properly updates angleMarker model", () => {
  let testSEAngleMarkerNone: any;
  let testSEAngleMarkerLines: any;
  let testSEAngleMarkerPoints: any;
  let testSEAngleMarkerSegments: any;
  let testSEAngleMarkerLineAndSegment: any;

  /* Creates a 90 degree angle between x+ and y+ centered on z+. */
  const sampleVertex = new Vector3(0, 0, 1);
  const sampleStart = new Vector3(1, 0, 0);
  const sampleEnd = new Vector3(0, 1, 0);
  
  it("updates vectors and angle on points angleMarker", async () => {
    testSEAngleMarkerPoints = new SEAngleMarker(
      AngleMode.POINTS,
      1.0,
      createPoint(),
      createPoint(),
      createPoint()
    );

    testSEAngleMarkerPoints._firstSEParent.locationVector = sampleStart;
    testSEAngleMarkerPoints._firstSEParent.update();
    testSEAngleMarkerPoints._secondSEParent.locationVector = sampleVertex;
    testSEAngleMarkerPoints._secondSEParent.update();
    testSEAngleMarkerPoints._thirdSEParent.locationVector = sampleEnd;
    testSEAngleMarkerPoints._thirdSEParent.update();

    testSEAngleMarkerPoints.shallowUpdate();
    expect(testSEAngleMarkerPoints._vertexVector).toEqual(sampleVertex);
    expect(testSEAngleMarkerPoints._startVector.x).toBeGreaterThan(0);
    expect(testSEAngleMarkerPoints._startVector.y).toBe(0);
    expect(testSEAngleMarkerPoints._endVector.x).toBe(0);
    expect(testSEAngleMarkerPoints._endVector.y).toBeGreaterThan(0);

    expect(testSEAngleMarkerPoints._measure.toDegrees()).toBeCloseTo(90);
    expect(testSEAngleMarkerPoints.ref._angleMarkerValue.toDegrees()).toBeCloseTo(90);
  });

  it("updates vectors and angle on lines angleMarker", async () => {
    testSEAngleMarkerLines = new SEAngleMarker(
      AngleMode.LINES,
      1.0,
      createLine(),
      createLine()
    );

    /* Forces angle to form on front of sphere, towards z+ instead of z-. */
    testSEAngleMarkerLines._lineClickLocation1 = new Vector3(0.5, 0, 0.5).normalize();
    testSEAngleMarkerLines._lineClickLocation2 = new Vector3(0, 0.5, 0.5).normalize();

    testSEAngleMarkerLines._firstSEParent.startSEPoint.locationVector = sampleStart;
    testSEAngleMarkerLines._firstSEParent.endSEPoint.locationVector = sampleVertex;
    testSEAngleMarkerLines._firstSEParent.normalVector = new Vector3(0, 1, 0);
    testSEAngleMarkerLines._firstSEParent.update();
    testSEAngleMarkerLines._secondSEParent.startSEPoint.locationVector = sampleVertex;
    testSEAngleMarkerLines._secondSEParent.endSEPoint.locationVector = sampleEnd;
    testSEAngleMarkerLines._secondSEParent.normalVector = new Vector3(1, 0, 0);
    testSEAngleMarkerLines._secondSEParent.update();

    testSEAngleMarkerLines.shallowUpdate();
    expect(testSEAngleMarkerLines._vertexVector).toEqual(sampleVertex);
    expect(testSEAngleMarkerLines._startVector.x).toBeGreaterThan(0);
    expect(testSEAngleMarkerLines._startVector.y).toBe(0);
    expect(testSEAngleMarkerLines._endVector.x).toBe(0);
    expect(testSEAngleMarkerLines._endVector.y).toBeGreaterThan(0);

    expect(testSEAngleMarkerLines._measure.toDegrees()).toBeCloseTo(90);
    expect(testSEAngleMarkerLines.ref._angleMarkerValue.toDegrees()).toBeCloseTo(90);
  });

  it("updates vectors and angle on segments angleMarker", async () => {
    testSEAngleMarkerSegments = new SEAngleMarker(
      AngleMode.SEGMENTS,
      1.0,
      createSegment(),
      createSegment()
    );

    testSEAngleMarkerSegments._firstSEParent.startSEPoint.locationVector = sampleStart;
    testSEAngleMarkerSegments._firstSEParent.endSEPoint.locationVector = sampleVertex;
    testSEAngleMarkerSegments._firstSEParent.update();
    testSEAngleMarkerSegments._secondSEParent.startSEPoint.locationVector = sampleVertex;
    testSEAngleMarkerSegments._secondSEParent.endSEPoint.locationVector = sampleEnd;
    testSEAngleMarkerSegments._secondSEParent.update();

    testSEAngleMarkerSegments.shallowUpdate();
    expect(testSEAngleMarkerSegments._vertexVector).toEqual(sampleVertex);
    expect(testSEAngleMarkerSegments._startVector.x).toBeGreaterThan(0);
    expect(testSEAngleMarkerSegments._startVector.y).toBe(0);
    expect(testSEAngleMarkerSegments._endVector.x).toBe(0);
    expect(testSEAngleMarkerSegments._endVector.y).toBeGreaterThan(0);

    expect(testSEAngleMarkerSegments._measure.toDegrees()).toBeCloseTo(90);
    expect(testSEAngleMarkerSegments.ref._angleMarkerValue.toDegrees()).toBeCloseTo(90);
  });

  it("updates vectors and angle on segment and line angleMarker", async () => {
    testSEAngleMarkerLineAndSegment = new SEAngleMarker(
      AngleMode.LINEANDSEGMENT,
      1.0,
      createLine(),
      createSegment()
    );

    testSEAngleMarkerLineAndSegment._firstSEParent.startSEPoint.locationVector = sampleStart;
    testSEAngleMarkerLineAndSegment._firstSEParent.endSEPoint.locationVector = sampleVertex;
    testSEAngleMarkerLineAndSegment._firstSEParent.normalVector = new Vector3(0, 1, 0);
    testSEAngleMarkerLineAndSegment._firstSEParent.update();
    testSEAngleMarkerLineAndSegment._secondSEParent.startSEPoint.locationVector = sampleVertex;
    testSEAngleMarkerLineAndSegment._secondSEParent.endSEPoint.locationVector = sampleEnd;
    testSEAngleMarkerLineAndSegment._secondSEParent.update();

    testSEAngleMarkerLineAndSegment.shallowUpdate();
    expect(testSEAngleMarkerLineAndSegment._vertexVector).toEqual(sampleVertex);
    expect(testSEAngleMarkerLineAndSegment._startVector.x).toBeGreaterThan(0);
    expect(testSEAngleMarkerLineAndSegment._startVector.y).toBe(0);
    expect(testSEAngleMarkerLineAndSegment._endVector.x).toBe(0);
    expect(testSEAngleMarkerLineAndSegment._endVector.y).toBeGreaterThan(0);

    expect(testSEAngleMarkerLineAndSegment._measure.toDegrees()).toBeCloseTo(90);
    expect(testSEAngleMarkerLineAndSegment.ref._angleMarkerValue.toDegrees()).toBeCloseTo(90);

    /* Swap order of segment and line. */
    testSEAngleMarkerLineAndSegment = new SEAngleMarker(
      AngleMode.LINEANDSEGMENT,
      1.0,
      createSegment(),
      createLine()
    );

    testSEAngleMarkerLineAndSegment._firstSEParent.startSEPoint.locationVector = sampleStart;
    testSEAngleMarkerLineAndSegment._firstSEParent.endSEPoint.locationVector = sampleVertex;
    testSEAngleMarkerLineAndSegment._firstSEParent.update();
    testSEAngleMarkerLineAndSegment._secondSEParent.startSEPoint.locationVector = sampleVertex;
    testSEAngleMarkerLineAndSegment._secondSEParent.endSEPoint.locationVector = sampleEnd;
    testSEAngleMarkerLineAndSegment._secondSEParent.normalVector = new Vector3(1, 0, 0);
    testSEAngleMarkerLineAndSegment._secondSEParent.update();

    testSEAngleMarkerLineAndSegment.shallowUpdate();
    expect(testSEAngleMarkerLineAndSegment._vertexVector).toEqual(sampleVertex);
    expect(testSEAngleMarkerLineAndSegment._startVector.x).toBeGreaterThan(0);
    expect(testSEAngleMarkerLineAndSegment._startVector.y).toBe(0);
    expect(testSEAngleMarkerLineAndSegment._endVector.x).toBe(0);
    expect(testSEAngleMarkerLineAndSegment._endVector.y).toBeGreaterThan(0);

    expect(testSEAngleMarkerLineAndSegment._measure.toDegrees()).toBeCloseTo(90);
    expect(testSEAngleMarkerLineAndSegment.ref._angleMarkerValue.toDegrees()).toBeCloseTo(90);
  });

  it("updates plottable, display, and visibility", async () => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );

    let plottableUpdateSpy = vi.spyOn(testSEAngleMarkerNone.ref, "updateDisplay");
    let visibleSpy = vi.spyOn(testSEAngleMarkerNone.ref, "setVisible");
    testSEAngleMarkerNone.showing = true;
    testSEAngleMarkerNone.shallowUpdate();

    expect(testSEAngleMarkerNone.ref._startVector).toEqual(testSEAngleMarkerNone._startVector);
    expect(testSEAngleMarkerNone.ref._vertexVector).toEqual(testSEAngleMarkerNone._vertexVector);
    expect(testSEAngleMarkerNone.ref._endVector).toEqual(testSEAngleMarkerNone._endVector);
    expect(plottableUpdateSpy).toHaveBeenCalled();
    expect(visibleSpy).toHaveBeenCalledWith(true);

    testSEAngleMarkerNone.showing = false;
    testSEAngleMarkerNone.shallowUpdate();

    expect(visibleSpy).toHaveBeenCalledWith(false);
  });
});

describe("SEAngleMarker: closestVector returns the vector on the angleMarker closest to the given vector", () => {
  let testSEAngleMarkerNone: any;
  let testVector: Vector3;
  let returnVector: Vector3;
  let maxAngle = SETTINGS.angleMarker.defaultRadius + SETTINGS.angleMarker.hitIdealDistance;
  let maxAdjDistance = Math.cos(maxAngle);
  let maxOppDistance = Math.sin(maxAngle);

  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );

    /* Creates a 90 degree angle facing positively x. */
    testSEAngleMarkerNone._vertexVector = new Vector3(0, 0, 1);
    testSEAngleMarkerNone._startVector = new Vector3(Math.cos(SETTINGS.angleMarker.defaultRadius),
      -Math.cos(SETTINGS.angleMarker.defaultRadius), 1).normalize();
    testSEAngleMarkerNone._endVector = new Vector3(Math.cos(SETTINGS.angleMarker.defaultRadius),
      Math.cos(SETTINGS.angleMarker.defaultRadius), 1).normalize();
  });

  it("returns the given vector when on it is on angleMarker", async () => {
    let adjDistance: number;
    let oppDistance: number;

    /* Test through vertex to edge. */
    for (let i = -maxAngle * 1.5; i <= maxAngle * 1.5; i += 0.01) {
      adjDistance = Math.cos(i);
      oppDistance = Math.sin(i);
      testVector = new Vector3(oppDistance, 0, adjDistance);
      if (testSEAngleMarkerNone.isHitAt(testVector, 1)) {
        expect(testSEAngleMarkerNone.closestVector(testVector)).toEqual(testVector);
      } else {
        expect(testSEAngleMarkerNone.closestVector(testVector)).not.toEqual(testVector);
      }
    }

    /* Test across angle away from vertex. */
    for (let i = -0.5; i <= 0.5; i += 0.05) {
      testVector = new Vector3(maxOppDistance / 2, i, maxAdjDistance);
      if (testSEAngleMarkerNone.isHitAt(testVector, 1)) {
        expect(testSEAngleMarkerNone.closestVector(testVector)).toEqual(testVector);
      } else {
        expect(testSEAngleMarkerNone.closestVector(testVector)).not.toEqual(testVector);
      }
    }
  });

  it("returns the correct vector when given vector not on angleMarker", async () => {
    /* Test just outside of vertex vector. */
    testVector = new Vector3(-0.1, 0, 1);
    returnVector = testSEAngleMarkerNone.closestVector(testVector);
    expect(returnVector.x).toBeCloseTo(0);
    expect(returnVector.y).toBeCloseTo(0);
    expect(returnVector.z).toBeCloseTo(1);

    /* Test just past angle marker in the middle. */
    testVector = new Vector3(maxOppDistance * 1.1, 0, maxAdjDistance);
    returnVector = testSEAngleMarkerNone.closestVector(testVector);
    expect(returnVector.x).toBeCloseTo(SETTINGS.angleMarker.defaultRadius);
    expect(returnVector.y).toBeCloseTo(0);
    expect(returnVector.z).toBeCloseTo(1);

    /* Test just past negative side of angle marker. */
    testVector = new Vector3(maxOppDistance / 2, -0.5, maxAdjDistance);
    returnVector = testSEAngleMarkerNone.closestVector(testVector);
    expect(returnVector.x).toBeCloseTo(-returnVector.y);
    expect(returnVector.z).toBeLessThan(maxAdjDistance);

    /* Test just past positive side of angle marker. */
    testVector = new Vector3(maxOppDistance / 2, 0.5, maxAdjDistance);
    returnVector = testSEAngleMarkerNone.closestVector(testVector);
    expect(returnVector.x).toBeCloseTo(returnVector.y);
    expect(returnVector.z).toBeLessThan(maxAdjDistance);
  });
});

describe("SEAngleMarker: closestLabelLocationVector returns a label vector within range", () => {
  let testSEAngleMarkerNone: any;
  let proposedVectorLocation: Vector3;

  /* "maxDist" in the function is the max angle away. maxAdjDistance is the max distance 
  away we can go on the axis we are already on (these tests start fully along x, y, or 
  z). maxOppDistance is just the rest we can attribute to the unit vector. */
  let maxAngle = SETTINGS.angleMarker.maxLabelDistance + AngleMarker.currentRadiusDoubleArc;
  let maxAdjDistance = Math.cos(maxAngle);
  let maxOppDistance = Math.sin(maxAngle);

  let maxAngleMinZoom = maxAngle / SETTINGS.zoom.minMagnification;
  let maxAdjDistanceMinZoom = Math.cos(maxAngleMinZoom);
  let maxOppDistanceMinZoom = Math.sin(maxAngleMinZoom);

  let maxAngleMaxZoom = maxAngle / SETTINGS.zoom.maxMagnification;
  let maxAdjDistanceMaxZoom = Math.cos(maxAngleMaxZoom);
  let maxOppDistanceMaxZoom = Math.sin(maxAngleMaxZoom);

  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );
  });
  
  it("does not return a new label location if within max distance at 1 zoom", async () => {
    /* Test four directions around vector and vector itself. */
    testSEAngleMarkerNone._vertexVector = new Vector3(0, 0, 1);

    proposedVectorLocation = new Vector3(0, maxOppDistance, maxAdjDistance);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, 1)).toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(0, -maxOppDistance, maxAdjDistance);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, 1)).toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(maxOppDistance, 0, maxAdjDistance);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, 1)).toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(-maxOppDistance, 0, maxAdjDistance);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, 1)).toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(0, 0, 1);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, 1)).toEqual(proposedVectorLocation);
  });
  
  it("returns a new label location if outside of max distance at 1 zoom", async () => {
    /* Test four directions around vector and opposite vector. */
    testSEAngleMarkerNone._vertexVector = new Vector3(0, 0, 1);

    proposedVectorLocation = new Vector3(0, maxOppDistance * 1.1, maxAdjDistance);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, 1)).not.toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(0, -maxOppDistance * 1.1, maxAdjDistance);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, 1)).not.toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(maxOppDistance * 1.1, 0, maxAdjDistance);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, 1)).not.toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(-maxOppDistance * 1.1, 0, maxAdjDistance);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, 1)).not.toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(0, 0, -1);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, 1)).not.toEqual(proposedVectorLocation);
  });
  
  it("does not return a new label location if within max distance at minimum zoom", async () => {
    /* Test four directions around vector and vector itself. */
    testSEAngleMarkerNone._vertexVector = new Vector3(0, 0, 1);

    proposedVectorLocation = new Vector3(0, maxOppDistanceMinZoom, maxAdjDistanceMinZoom);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.minMagnification))
      .toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(0, -maxOppDistanceMinZoom, maxAdjDistanceMinZoom);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.minMagnification))
      .toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(maxOppDistanceMinZoom, 0, maxAdjDistanceMinZoom);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.minMagnification))
      .toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(-maxOppDistanceMinZoom, 0, maxAdjDistanceMinZoom);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.minMagnification))
      .toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(0, 0, 1);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.minMagnification))
      .toEqual(proposedVectorLocation);
  });

  it("returns a new label location if outside of max distance at minimum zoom", async () => {
    /* Test four directions around vector and opposite veector. */
    testSEAngleMarkerNone._vertexVector = new Vector3(0, 0, 1);

    proposedVectorLocation = new Vector3(0, maxOppDistanceMinZoom * 1.1, maxAdjDistanceMinZoom);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.minMagnification))
      .not.toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(0, -maxOppDistanceMinZoom * 1.1, maxAdjDistanceMinZoom);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.minMagnification))
      .not.toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(maxOppDistanceMinZoom * 1.1, 0, maxAdjDistanceMinZoom);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.minMagnification))
      .not.toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(-maxOppDistanceMinZoom * 1.1, 0, maxAdjDistanceMinZoom);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.minMagnification))
      .not.toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(0, 0, -1);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.minMagnification))
      .not.toEqual(proposedVectorLocation);
  });

  it("does not return a new label location if within max distance at maximum zoom", async () => {
    /* Test four directions around vector and vector itself. */
    testSEAngleMarkerNone._vertexVector = new Vector3(0, 0, 1);

    proposedVectorLocation = new Vector3(0, maxOppDistanceMaxZoom, maxAdjDistanceMaxZoom);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.maxMagnification))
      .toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(0, -maxOppDistanceMaxZoom, maxAdjDistanceMaxZoom);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.maxMagnification))
      .toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(maxOppDistanceMaxZoom, 0, maxAdjDistanceMaxZoom);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.maxMagnification))
      .toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(-maxOppDistanceMaxZoom, 0, maxAdjDistanceMaxZoom);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.maxMagnification))
      .toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(0, 0, 1);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.maxMagnification))
      .toEqual(proposedVectorLocation);
  });

  it("returns a new label location if outside of max distance at maximum zoom", async () => {
    /* Test four directions around vector and opposite veector. */
    testSEAngleMarkerNone._vertexVector = new Vector3(0, 0, 1);

    proposedVectorLocation = new Vector3(0, maxOppDistanceMaxZoom * 1.1, maxAdjDistanceMaxZoom);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.maxMagnification))
      .not.toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(0, -maxOppDistanceMaxZoom * 1.1, maxAdjDistanceMaxZoom);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.maxMagnification))
      .not.toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(maxOppDistanceMaxZoom * 1.1, 0, maxAdjDistanceMaxZoom);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.maxMagnification))
      .not.toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(-maxOppDistanceMaxZoom * 1.1, 0, maxAdjDistanceMaxZoom);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.maxMagnification))
      .not.toEqual(proposedVectorLocation);

    proposedVectorLocation = new Vector3(0, 0, -1);
    expect(testSEAngleMarkerNone.closestLabelLocationVector(proposedVectorLocation, SETTINGS.zoom.maxMagnification))
      .not.toEqual(proposedVectorLocation);
  });
});

describe("SEAngleMarker: accept returns if an object can act on the angleMarker", () => {
  let testSEAngleMarkerNone: any;
  let testSEAngleMarkerLines: any;
  let testSEAngleMarkerPoints: any;
  let testSEAngleMarkerSegments: any;
  let testSEAngleMarkerLineAndSegment: any;
  let testSEAngleMarkerSegmentsOrLineAndSegment: any;

  const labelVisitor = new LabelMoverVisitor;
  const lineVisitor = new LineNormalVisitor;
  const pointVisitor = new PointMoverVisitor;
  const rotationVisitor = new RotationVisitor;
  const segmentVisitor = new SegmentNormalArcLengthVisitor;

  it("none AngleMarker returns correct bool with all Visitors", async () => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );

    expect(testSEAngleMarkerNone.accept(labelVisitor)).toEqual(
      labelVisitor.actionOnAngleMarker(testSEAngleMarkerNone));
    expect(testSEAngleMarkerNone.accept(lineVisitor)).toEqual(
      lineVisitor.actionOnAngleMarker(testSEAngleMarkerNone));
    expect(testSEAngleMarkerNone.accept(pointVisitor)).toEqual(
      pointVisitor.actionOnAngleMarker(testSEAngleMarkerNone));
    expect(testSEAngleMarkerNone.accept(rotationVisitor)).toEqual(
      rotationVisitor.actionOnAngleMarker(testSEAngleMarkerNone));
    expect(testSEAngleMarkerNone.accept(segmentVisitor)).toEqual(
      segmentVisitor.actionOnAngleMarker(testSEAngleMarkerNone));
  });

  it("lines AngleMarker returns correct bool with all Visitors", async () => {
    testSEAngleMarkerLines = new SEAngleMarker(
      AngleMode.LINES,
      1.0,
      createLine(),
      createLine()
    );

    expect(testSEAngleMarkerLines.accept(labelVisitor)).toEqual(
      labelVisitor.actionOnAngleMarker(testSEAngleMarkerLines));
    expect(testSEAngleMarkerLines.accept(lineVisitor)).toEqual(
      lineVisitor.actionOnAngleMarker(testSEAngleMarkerLines));
    expect(testSEAngleMarkerLines.accept(pointVisitor)).toEqual(
      pointVisitor.actionOnAngleMarker(testSEAngleMarkerLines));
    expect(testSEAngleMarkerLines.accept(rotationVisitor)).toEqual(
      rotationVisitor.actionOnAngleMarker(testSEAngleMarkerLines));
    expect(testSEAngleMarkerLines.accept(segmentVisitor)).toEqual(
      segmentVisitor.actionOnAngleMarker(testSEAngleMarkerLines));
  });

  it("points AngleMarker returns correct bool with all Visitors", async () => {
    testSEAngleMarkerPoints = new SEAngleMarker(
      AngleMode.POINTS,
      1.0,
      createPoint(),
      createPoint(),
      createPoint()
    );

    expect(testSEAngleMarkerPoints.accept(labelVisitor)).toEqual(
      labelVisitor.actionOnAngleMarker(testSEAngleMarkerPoints));
    expect(testSEAngleMarkerPoints.accept(lineVisitor)).toEqual(
      lineVisitor.actionOnAngleMarker(testSEAngleMarkerPoints));
    expect(testSEAngleMarkerPoints.accept(pointVisitor)).toEqual(
      pointVisitor.actionOnAngleMarker(testSEAngleMarkerPoints));
    expect(testSEAngleMarkerPoints.accept(rotationVisitor)).toEqual(
      rotationVisitor.actionOnAngleMarker(testSEAngleMarkerPoints));
    expect(testSEAngleMarkerPoints.accept(segmentVisitor)).toEqual(
      segmentVisitor.actionOnAngleMarker(testSEAngleMarkerPoints));
  });

  it("segments AngleMarker returns correct bool with all Visitors", async () => {
    testSEAngleMarkerSegments = new SEAngleMarker(
      AngleMode.SEGMENTS,
      1.0,
      createSegment(),
      createSegment()
    );

    expect(testSEAngleMarkerSegments.accept(labelVisitor)).toEqual(
      labelVisitor.actionOnAngleMarker(testSEAngleMarkerSegments));
    expect(testSEAngleMarkerSegments.accept(lineVisitor)).toEqual(
      lineVisitor.actionOnAngleMarker(testSEAngleMarkerSegments));
    expect(testSEAngleMarkerSegments.accept(pointVisitor)).toEqual(
      pointVisitor.actionOnAngleMarker(testSEAngleMarkerSegments));
    expect(testSEAngleMarkerSegments.accept(rotationVisitor)).toEqual(
      rotationVisitor.actionOnAngleMarker(testSEAngleMarkerSegments));
    expect(testSEAngleMarkerSegments.accept(segmentVisitor)).toEqual(
      segmentVisitor.actionOnAngleMarker(testSEAngleMarkerSegments));
  });

  it("line & segment AngleMarker returns correct bool with all Visitors", async () => {
    testSEAngleMarkerLineAndSegment = new SEAngleMarker(
      AngleMode.LINEANDSEGMENT,
      1.0,
      createLine(),
      createSegment()
    );

    expect(testSEAngleMarkerLineAndSegment.accept(labelVisitor)).toEqual(
      labelVisitor.actionOnAngleMarker(testSEAngleMarkerLineAndSegment));
    expect(testSEAngleMarkerLineAndSegment.accept(lineVisitor)).toEqual(
      lineVisitor.actionOnAngleMarker(testSEAngleMarkerLineAndSegment));
    expect(testSEAngleMarkerLineAndSegment.accept(pointVisitor)).toEqual(
      pointVisitor.actionOnAngleMarker(testSEAngleMarkerLineAndSegment));
    expect(testSEAngleMarkerLineAndSegment.accept(rotationVisitor)).toEqual(
      rotationVisitor.actionOnAngleMarker(testSEAngleMarkerLineAndSegment));
    expect(testSEAngleMarkerLineAndSegment.accept(segmentVisitor)).toEqual(
      segmentVisitor.actionOnAngleMarker(testSEAngleMarkerLineAndSegment));
  });

  it("segments or line & segment AngleMarker returns correct bool with all Visitors", async () => {
    testSEAngleMarkerSegmentsOrLineAndSegment = new SEAngleMarker(
      AngleMode.LINEANDSEGMENT,
      1.0,
      createLine(),
      createSegment()
    );

    expect(testSEAngleMarkerSegmentsOrLineAndSegment.accept(labelVisitor)).toEqual(
      labelVisitor.actionOnAngleMarker(testSEAngleMarkerSegmentsOrLineAndSegment));
    expect(testSEAngleMarkerSegmentsOrLineAndSegment.accept(lineVisitor)).toEqual(
      lineVisitor.actionOnAngleMarker(testSEAngleMarkerSegmentsOrLineAndSegment));
    expect(testSEAngleMarkerSegmentsOrLineAndSegment.accept(pointVisitor)).toEqual(
      pointVisitor.actionOnAngleMarker(testSEAngleMarkerSegmentsOrLineAndSegment));
    expect(testSEAngleMarkerSegmentsOrLineAndSegment.accept(rotationVisitor)).toEqual(
      rotationVisitor.actionOnAngleMarker(testSEAngleMarkerSegmentsOrLineAndSegment));
    expect(testSEAngleMarkerSegmentsOrLineAndSegment.accept(segmentVisitor)).toEqual(
      segmentVisitor.actionOnAngleMarker(testSEAngleMarkerSegmentsOrLineAndSegment));
  });
});

describe("SEAngleMarker: measureAngle returns the angleMarker's angle", () => {
  let testSEAngleMarkerNone: any;
  let testVectorLocation: Vector3;

  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );

    testSEAngleMarkerNone._startVector = new Vector3(1, 0, 0);
    testSEAngleMarkerNone._vertexVector = new Vector3(0, 1, 0);
  });

  /* Note: Vertex vector determines plane boundary, start vector determines active side of boundary. */
  /* Each test checks the 45 degree marks around the plane, starting in the positive direction. */
  it("returns correct angles when basing from x+", async () => {
    testSEAngleMarkerNone._startVector = new Vector3(1, 0, 0);
    testSEAngleMarkerNone._vertexVector = new Vector3(0, 1, 0);

    testVectorLocation = new Vector3(1, 0, -1);
    expect(testSEAngleMarkerNone.measureAngle(testSEAngleMarkerNone._startVector,
      testSEAngleMarkerNone._vertexVector, testVectorLocation).toDegrees()).toBeCloseTo(45);

    testVectorLocation = new Vector3(-1, 0, -1);
    expect(testSEAngleMarkerNone.measureAngle(testSEAngleMarkerNone._startVector,
      testSEAngleMarkerNone._vertexVector, testVectorLocation).toDegrees()).toBeCloseTo(135);

    testVectorLocation = new Vector3(-1, 0, 1);
    expect(testSEAngleMarkerNone.measureAngle(testSEAngleMarkerNone._startVector,
      testSEAngleMarkerNone._vertexVector, testVectorLocation).toDegrees()).toBeCloseTo(225);

    testVectorLocation = new Vector3(1, 0, 1);
    expect(testSEAngleMarkerNone.measureAngle(testSEAngleMarkerNone._startVector,
      testSEAngleMarkerNone._vertexVector, testVectorLocation).toDegrees()).toBeCloseTo(315);
  });

  it("returns correct angles when basing from y+", async () => {
    testSEAngleMarkerNone._startVector = new Vector3(0, 1, 0);
    testSEAngleMarkerNone._vertexVector = new Vector3(1, 0, 0);

    testVectorLocation = new Vector3(0, 1, 1);
    expect(testSEAngleMarkerNone.measureAngle(testSEAngleMarkerNone._startVector,
      testSEAngleMarkerNone._vertexVector, testVectorLocation).toDegrees()).toBeCloseTo(45);

    testVectorLocation = new Vector3(0, -1, 1);
    expect(testSEAngleMarkerNone.measureAngle(testSEAngleMarkerNone._startVector,
      testSEAngleMarkerNone._vertexVector, testVectorLocation).toDegrees()).toBeCloseTo(135);

    testVectorLocation = new Vector3(0, -1, -1);
    expect(testSEAngleMarkerNone.measureAngle(testSEAngleMarkerNone._startVector,
      testSEAngleMarkerNone._vertexVector, testVectorLocation).toDegrees()).toBeCloseTo(225);

    testVectorLocation = new Vector3(0, 1, -1);
    expect(testSEAngleMarkerNone.measureAngle(testSEAngleMarkerNone._startVector,
      testSEAngleMarkerNone._vertexVector, testVectorLocation).toDegrees()).toBeCloseTo(315);
  });

  it("returns correct angles when basing from z+", async () => {
    testSEAngleMarkerNone._startVector = new Vector3(0, 0, 1);
    testSEAngleMarkerNone._vertexVector = new Vector3(1, 0, 0);

    testVectorLocation = new Vector3(0, -1, 1);
    expect(testSEAngleMarkerNone.measureAngle(testSEAngleMarkerNone._startVector,
      testSEAngleMarkerNone._vertexVector, testVectorLocation).toDegrees()).toBeCloseTo(45);

    testVectorLocation = new Vector3(0, -1, -1);
    expect(testSEAngleMarkerNone.measureAngle(testSEAngleMarkerNone._startVector,
      testSEAngleMarkerNone._vertexVector, testVectorLocation).toDegrees()).toBeCloseTo(135);

    testVectorLocation = new Vector3(0, 1, -1);
    expect(testSEAngleMarkerNone.measureAngle(testSEAngleMarkerNone._startVector,
      testSEAngleMarkerNone._vertexVector, testVectorLocation).toDegrees()).toBeCloseTo(225);

    testVectorLocation = new Vector3(0, 1, 1);
    expect(testSEAngleMarkerNone.measureAngle(testSEAngleMarkerNone._startVector,
      testSEAngleMarkerNone._vertexVector, testVectorLocation).toDegrees()).toBeCloseTo(315);
  });
});

describe("SEAngleMarker: inRegion returns if a test vector is within the triangle of the given vectors", () => {
  let testSEAngleMarkerNone: any;
  let boundaryVectorOne: Vector3;
  let boundaryVectorTwo: Vector3;
  let boundaryVectorThree: Vector3;
  let testVectorLocation: Vector3;

  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );

    /* Set positive hit zone to be positive x, y, and z. */
    boundaryVectorOne = new Vector3(1, 0, 0);
    boundaryVectorTwo = new Vector3(0, 1, 0);
    boundaryVectorThree = new Vector3(0, 0, 1);
  });

  it("returns true if test vector is inside boundary", async () => {
    /* Test just inside each point and in the middle. */
    testVectorLocation = new Vector3(1, 0.1, 0.1).normalize();
    expect(testSEAngleMarkerNone.inRegion(boundaryVectorOne, boundaryVectorTwo, boundaryVectorThree, testVectorLocation)).toBeTruthy();

    testVectorLocation = new Vector3(0.1, 1, 0.1).normalize();
    expect(testSEAngleMarkerNone.inRegion(boundaryVectorOne, boundaryVectorTwo, boundaryVectorThree, testVectorLocation)).toBeTruthy();

    testVectorLocation = new Vector3(0.1, 0.1, 1).normalize();
    expect(testSEAngleMarkerNone.inRegion(boundaryVectorOne, boundaryVectorTwo, boundaryVectorThree, testVectorLocation)).toBeTruthy();

    testVectorLocation = new Vector3(1, 1, 1).normalize();
    expect(testSEAngleMarkerNone.inRegion(boundaryVectorOne, boundaryVectorTwo, boundaryVectorThree, testVectorLocation)).toBeTruthy();
  });

  it("returns true if test vector is on boundary line", async () => {
    /* Test on each point and on each line. */
    testVectorLocation = new Vector3(1, 0, 0);
    expect(testSEAngleMarkerNone.inRegion(boundaryVectorOne, boundaryVectorTwo, boundaryVectorThree, testVectorLocation)).toBeTruthy();

    testVectorLocation = new Vector3(0, 1, 0);
    expect(testSEAngleMarkerNone.inRegion(boundaryVectorOne, boundaryVectorTwo, boundaryVectorThree, testVectorLocation)).toBeTruthy();

    testVectorLocation = new Vector3(0, 0, 1);
    expect(testSEAngleMarkerNone.inRegion(boundaryVectorOne, boundaryVectorTwo, boundaryVectorThree, testVectorLocation)).toBeTruthy();

    testVectorLocation = new Vector3(0.5, 0.5, 0);
    expect(testSEAngleMarkerNone.inRegion(boundaryVectorOne, boundaryVectorTwo, boundaryVectorThree, testVectorLocation)).toBeTruthy();

    testVectorLocation = new Vector3(0.5, 0, 0.5);
    expect(testSEAngleMarkerNone.inRegion(boundaryVectorOne, boundaryVectorTwo, boundaryVectorThree, testVectorLocation)).toBeTruthy();

    testVectorLocation = new Vector3(0, 0.5, 0.5);
    expect(testSEAngleMarkerNone.inRegion(boundaryVectorOne, boundaryVectorTwo, boundaryVectorThree, testVectorLocation)).toBeTruthy();
  });

  it("returns false if test vector is outside boundary", async () => {
    /* Test just outside each point and opposite the middle. */
    testVectorLocation = new Vector3(1, -0.1, -0.1).normalize();
    expect(testSEAngleMarkerNone.inRegion(boundaryVectorOne, boundaryVectorTwo, boundaryVectorThree, testVectorLocation)).toBeFalsy();

    testVectorLocation = new Vector3(-0.1, 1, -0.1).normalize();
    expect(testSEAngleMarkerNone.inRegion(boundaryVectorOne, boundaryVectorTwo, boundaryVectorThree, testVectorLocation)).toBeFalsy();

    testVectorLocation = new Vector3(-0.1, -0.1, 1).normalize();
    expect(testSEAngleMarkerNone.inRegion(boundaryVectorOne, boundaryVectorTwo, boundaryVectorThree, testVectorLocation)).toBeFalsy();

    testVectorLocation = new Vector3(-1, -1, -1).normalize();
    expect(testSEAngleMarkerNone.inRegion(boundaryVectorOne, boundaryVectorTwo, boundaryVectorThree, testVectorLocation)).toBeFalsy();
  });
});

// NOTE: projectToSegment (from what I understand) projects to a plane, not a segment.
describe("SEAngleMarker: projectToSegment projects a given vector to a given \"line segment\"", () => {
  let testSEAngleMarkerNone: any;
  let segmentVectorOne: Vector3;
  let segmentVectorTwo: Vector3;
  let testVectorLocation: Vector3;
  let resultVector: Vector3;

  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );
  });

  /* Note: Using toBeCloseTo because of rounding calculations and 0 vs -0. */
  /* This is the same reason (along with other rounding) this is used elsewhere in the tests. */
  /* Sometimes toBeVector3CloseTo would always return true? But when I originally wrote these
    tests I got the numbers from what that function returned?? So I left it as individual checks. */
  it("returns correct vector if plane is XY", async () => {
    /* Set plane to be X/Y plane. */
    segmentVectorOne = new Vector3(1, 0, 0);
    segmentVectorTwo = new Vector3(0, 1, 0);

    testVectorLocation = new Vector3(0, 1, 1);
    resultVector = testSEAngleMarkerNone.projectToSegment(segmentVectorOne, segmentVectorTwo, testVectorLocation);
    expect(resultVector.x).toBeCloseTo(0);
    expect(resultVector.y).toBeCloseTo(1);
    expect(resultVector.z).toBeCloseTo(0);

    testVectorLocation = new Vector3(0, -1, 1);
    resultVector = testSEAngleMarkerNone.projectToSegment(segmentVectorOne, segmentVectorTwo, testVectorLocation);
    expect(resultVector.x).toBeCloseTo(0);
    expect(resultVector.y).toBeCloseTo(-1);
    expect(resultVector.z).toBeCloseTo(0);

    testVectorLocation = new Vector3(1, 0, 1);
    resultVector = testSEAngleMarkerNone.projectToSegment(segmentVectorOne, segmentVectorTwo, testVectorLocation);
    expect(resultVector.x).toBeCloseTo(1);
    expect(resultVector.y).toBeCloseTo(0);
    expect(resultVector.z).toBeCloseTo(0);

    testVectorLocation = new Vector3(-1, 0, 1);
    resultVector = testSEAngleMarkerNone.projectToSegment(segmentVectorOne, segmentVectorTwo, testVectorLocation);
    expect(resultVector.x).toBeCloseTo(-1);
    expect(resultVector.y).toBeCloseTo(0);
    expect(resultVector.z).toBeCloseTo(0);
  });

  it("returns correct vector if plane is XZ", async () => {
    /* Set plane to be X/Z plane. */
    segmentVectorOne = new Vector3(1, 0, 0);
    segmentVectorTwo = new Vector3(0, 0, 1);

    testVectorLocation = new Vector3(0, 1, 1);
    resultVector = testSEAngleMarkerNone.projectToSegment(segmentVectorOne, segmentVectorTwo, testVectorLocation);
    expect(resultVector.x).toBeCloseTo(0);
    expect(resultVector.y).toBeCloseTo(0);
    expect(resultVector.z).toBeCloseTo(1);

    testVectorLocation = new Vector3(0, 1, -1);
    resultVector = testSEAngleMarkerNone.projectToSegment(segmentVectorOne, segmentVectorTwo, testVectorLocation);
    expect(resultVector.x).toBeCloseTo(0);
    expect(resultVector.y).toBeCloseTo(0);
    expect(resultVector.z).toBeCloseTo(-1);

    testVectorLocation = new Vector3(1, 1, 0);
    resultVector = testSEAngleMarkerNone.projectToSegment(segmentVectorOne, segmentVectorTwo, testVectorLocation);
    expect(resultVector.x).toBeCloseTo(1);
    expect(resultVector.y).toBeCloseTo(0);
    expect(resultVector.z).toBeCloseTo(0);


    testVectorLocation = new Vector3(-1, 1, 0);
    resultVector = testSEAngleMarkerNone.projectToSegment(segmentVectorOne, segmentVectorTwo, testVectorLocation);
    expect(resultVector.x).toBeCloseTo(-1);
    expect(resultVector.y).toBeCloseTo(0);
    expect(resultVector.z).toBeCloseTo(0);
  });

  it("returns correct vector if plane is YZ", async () => {
    /* Set plane to be Y/Z plane. */
    segmentVectorOne = new Vector3(0, 1, 0);
    segmentVectorTwo = new Vector3(0, 0, 1);

    testVectorLocation = new Vector3(1, 0, 1);
    resultVector = testSEAngleMarkerNone.projectToSegment(segmentVectorOne, segmentVectorTwo, testVectorLocation);
    expect(resultVector.x).toBeCloseTo(0);
    expect(resultVector.y).toBeCloseTo(0);
    expect(resultVector.z).toBeCloseTo(1);

    testVectorLocation = new Vector3(1, 0, -1);
    resultVector = testSEAngleMarkerNone.projectToSegment(segmentVectorOne, segmentVectorTwo, testVectorLocation);
    expect(resultVector.x).toBeCloseTo(0);
    expect(resultVector.y).toBeCloseTo(0);
    expect(resultVector.z).toBeCloseTo(-1);

    testVectorLocation = new Vector3(1, 1, 0);
    resultVector = testSEAngleMarkerNone.projectToSegment(segmentVectorOne, segmentVectorTwo, testVectorLocation);
    expect(resultVector.x).toBeCloseTo(0);
    expect(resultVector.y).toBeCloseTo(1);
    expect(resultVector.z).toBeCloseTo(0);

    testVectorLocation = new Vector3(1, -1, 0);
    resultVector = testSEAngleMarkerNone.projectToSegment(segmentVectorOne, segmentVectorTwo, testVectorLocation);
    expect(resultVector.x).toBeCloseTo(0);
    expect(resultVector.y).toBeCloseTo(-1);
    expect(resultVector.z).toBeCloseTo(0);
  });
});

describe("SEAngleMarker: getLabel getter properly reads the model's label", () => {
  let testSEAngleMarkerNone: any;
  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );
  });

  it("returns an SELabel", async () => {
    expectTypeOf(testSEAngleMarkerNone.getLabel).toEqualTypeOf({ a: SELabel });
  });
});

describe("SEAngleMarker: isMeasurable returns if the angleMarker model is measurable", () => {
  let testSEAngleMarkerNone: any;
  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );
  });

    it("returns true", async () => {
      expect(testSEAngleMarkerNone.isMeasurable()).toBeTruthy();
    });
});