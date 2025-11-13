import { SEAngleMarker } from "@/models/SEAngleMarker";
import AngleMarker from "@/plottables/AngleMarker";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule from "../../plottables/Nodule";
import { Vector3 } from "three";
import {
  StyleOptions,
  StyleCategory,
  DEFAULT_ANGLE_MARKER_BACK_STYLE,
  DEFAULT_ANGLE_MARKER_FRONT_STYLE
} from "@/types/Styles";
import { SEPoint } from "@/models/SEPoint";
import { SELabel } from "@/models/SELabel";
import { SELine } from "@/models/SELine";
import { SESegment } from "@/models/SESegment";
import { AngleMode, ValueDisplayMode, LabelParentTypes } from "@/types";
//import { Path } from "two.js/src/path"
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

  it("gets a number", async () => {
    expectTypeOf(testSEAngleMarkerNone.value).toBeNumber();
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

  // TODO: angleMode.NONE defaults to line and segment
  //TODO: check if parent labels get called
  it("lines AngleMarker gets a string and accesses components", async () => {
    testSEAngleMarkerLines = new SEAngleMarker(
      AngleMode.LINES,
      1.0,
      createLine(),
      createLine()
    );
    //testSEAngleMarkerLines._firstSEParent.label = { ref: { _shortUserName: String } };
    //testSEAngleMarkerLines._secondSEParent.label = { ref: { _shortUserName: String } };
    const measureSpy = vi.spyOn(testSEAngleMarkerLines, "_measure", "get");
    //const firstParentSpy = vi.spyOn(testSEAngleMarkerLines._firstSEParent.label.ref, "_shortUserName", "get");
    //const secondParentSpy = vi.spyOn(testSEAngleMarkerLines._secondSEParent.label.ref, "_shortUserName", "get");

    expectTypeOf(testSEAngleMarkerLines.noduleDescription).toBeString();
    //expect(firstParentSpy).toHaveBeenCalled();
    //expect(secondParentSpy).toHaveBeenCalled();
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
/*
describe("SEAngleMarker: isHitAt properly detects if the unitIdealVector is very close to the vertex vector", () => {
    let testSEAngleMarkerNone: any;
    beforeEach(() => {
        testSEAngleMarkerNone = new SEAngleMarker(
            AngleMode.NONE,
            1.0
        );
    });
});
*/
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
/*
describe("SEAngleMarker: shallowUpdate properly updates angleMarker model", () => {
  let testSEAngleMarkerNone: any;
  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );
  });
});

describe("SEAngleMarker: closestVector returns the vector closest to the unitIdealVector", () => {
    let testSEAngleMarkerNone: any;
    beforeEach(() => {
        testSEAngleMarkerNone = new SEAngleMarker(
            AngleMode.NONE,
            1.0
        );
    });
});

describe("SEAngleMarker: closestLabelLocationVector returns the vector near the SEAngleMarkers that is closest to the idealUnitSphereVector", () => {
    let testSEAngleMarkerNone: any;
    beforeEach(() => {
        testSEAngleMarkerNone = new SEAngleMarker(
            AngleMode.NONE,
            1.0
        );
    });
});
*/
describe("SEAngleMarker: accept returns if an object can act on the angleMarker", () => {
  let testSEAngleMarkerNone: any;
  let testSEAngleMarkerLines: any;
  let testSEAngleMarkerPoints: any;
  let testSEAngleMarkerSegments: any;
  let testSEAngleMarkerLineAndSegment: any;
  let testSEAngleMarkerSegmentsOrLineAndSegment: any;
  let labelVisitor: LabelMoverVisitor;
  let lineVisitor: LineNormalVisitor;
  let pointVisitor: PointMoverVisitor;
  let rotationVisitor: RotationVisitor;
  let segmentVisitor: SegmentNormalArcLengthVisitor;

  beforeEach(() => {
    labelVisitor = new LabelMoverVisitor;
    lineVisitor = new LineNormalVisitor;
    pointVisitor = new PointMoverVisitor;
    rotationVisitor = new RotationVisitor;
    segmentVisitor = new SegmentNormalArcLengthVisitor;
  });

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
/*
describe("SEAngleMarker: measureAngle returns the angleMarker's angle", () => {
    let testSEAngleMarkerNone: any;
  beforeEach(() => {
    testSEAngleMarkerNone = new SEAngleMarker(
      AngleMode.NONE,
      1.0,
      createPoint(),
      createPoint()
    );
  });
});

describe("SEAngleMarker: inRegion returns if a test vector is within the angleMarker's angle", () => {
    let testSEAngleMarkerNone: any;
    beforeEach(() => {
        testSEAngleMarkerNone = new SEAngleMarker(
            AngleMode.NONE,
            1.0
        );
    });
});

describe("SEAngleMarker: projectToSegment projects a given vector to a given line segment", () => {
    let testSEAngleMarkerNone: any;
    beforeEach(() => {
        testSEAngleMarkerNone = new SEAngleMarker(
            AngleMode.NONE,
            1.0
        );
    });
});
*/
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
