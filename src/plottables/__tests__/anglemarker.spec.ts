import AngleMarker from "@/plottables/AngleMarker.ts";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule, { DisplayStyle } from "../Nodule";
import {
    StyleOptions,
    StyleCategory,
    DEFAULT_ANGLE_MARKER_FRONT_STYLE,
    DEFAULT_ANGLE_MARKER_BACK_STYLE
} from "@/types/Styles";
import { Vector3 } from "three";
import { Arc } from "two.js/extras/jsm/arc";
import { Group } from "two.js/src/group";
import { Anchor } from "two.js/src/anchor";
import { Path } from "two.js/src/path";
import { Line } from "two.js/src/shapes/line";

Number.prototype.modTwoPi = function (): number {
    return ((Number(this) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
};

vi.mock("@/global-settings/LAYER", () => {
    enum mockLAYER {
        backgroundGlowing,
        backgroundFills,
        background,
        backgroundAngleMarkersGlowing,
        backgroundAngleMarkers,
        backgroundPointsGlowing,
        backgroundPoints,
        backgroundLabelGlowing,
        backgroundLabel,
        midground,
        foregroundGlowing,
        foregroundFills,
        foreground,
        foregroundAngleMarkersGlowing,
        foregroundAngleMarkers,
        foregroundPointsGlowing,
        foregroundPoints,
        foregroundLabelGlowing,
        foregroundLabel,
        foregroundText
    };
    return { LAYER: mockLAYER };
});

describe("AngleMarker: angleMarker constructor generates a valid angleMarker plottable", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("sets curved parts to Arc objects", async () => {
        expectTypeOf(testAngleMarker._frontCircle).toEqualTypeOf({ a: Arc });
        expectTypeOf(testAngleMarker._backCircle).toEqualTypeOf({ a: Arc });
        expectTypeOf(testAngleMarker._frontDouble).toEqualTypeOf({ a: Arc });
        expectTypeOf(testAngleMarker._backDouble).toEqualTypeOf({ a: Arc });
        expectTypeOf(testAngleMarker._glowingFrontCircle).toEqualTypeOf({ a: Arc });
        expectTypeOf(testAngleMarker._glowingBackCircle).toEqualTypeOf({ a: Arc });
        expectTypeOf(testAngleMarker._glowingFrontDouble).toEqualTypeOf({ a: Arc });
        expectTypeOf(testAngleMarker._glowingBackDouble).toEqualTypeOf({ a: Arc });
    });

    it("sets straight parts to Line objects", async () => {
        expectTypeOf(testAngleMarker._frontStraightVertexToStart).toEqualTypeOf({ a: Line });
        expectTypeOf(testAngleMarker._backStraightVertexToStart).toEqualTypeOf({ a: Line });
        expectTypeOf(testAngleMarker._glowingFrontStraightVertexToStart).toEqualTypeOf({ a: Line });
        expectTypeOf(testAngleMarker._glowingBackStraightVertexToStart).toEqualTypeOf({ a: Line });
        expectTypeOf(testAngleMarker._frontStraightEndToVertex).toEqualTypeOf({ a: Line });
        expectTypeOf(testAngleMarker._backStraightEndToVertex).toEqualTypeOf({ a: Line });
        expectTypeOf(testAngleMarker._glowingFrontStraightEndToVertex).toEqualTypeOf({ a: Line });
        expectTypeOf(testAngleMarker._glowingBackStraightEndToVertex).toEqualTypeOf({ a: Line });
        expectTypeOf(testAngleMarker._frontTick).toEqualTypeOf({ a: Line });
        expectTypeOf(testAngleMarker._backTick).toEqualTypeOf({ a: Line });
        expectTypeOf(testAngleMarker._glowingFrontTick).toEqualTypeOf({ a: Line });
        expectTypeOf(testAngleMarker._glowingBackTick).toEqualTypeOf({ a: Line });
    });

    it("gives the arrowhead path objects 4 lists of 4 anchors each", async () => {
        expect(Array.isArray(testAngleMarker._frontArrowHeadPath._collection)).toBeTruthy();
        expect(Array.isArray(testAngleMarker._glowingFrontArrowHeadPath._collection)).toBeTruthy();
        expect(Array.isArray(testAngleMarker._backArrowHeadPath._collection)).toBeTruthy();
        expect(Array.isArray(testAngleMarker._glowingBackArrowHeadPath._collection)).toBeTruthy();

        expect(testAngleMarker._frontArrowHeadPath._collection).toHaveLength(4);
        expect(testAngleMarker._glowingFrontArrowHeadPath._collection).toHaveLength(4);
        expect(testAngleMarker._backArrowHeadPath._collection).toHaveLength(4);
        expect(testAngleMarker._glowingBackArrowHeadPath._collection).toHaveLength(4);

        for (let i = 0; i < 4; i++) {
            expectTypeOf(testAngleMarker._frontArrowHeadPath._collection[i]).toEqualTypeOf({ a: Anchor });
            expectTypeOf(testAngleMarker._glowingFrontArrowHeadPath._collection[i]).toEqualTypeOf({ a: Anchor });
            expectTypeOf(testAngleMarker._backArrowHeadPath._collection[i]).toEqualTypeOf({ a: Anchor });
            expectTypeOf(testAngleMarker._glowingBackArrowHeadPath._collection[i]).toEqualTypeOf({ a: Anchor });
        }
    });

    it("sets paths to Path objects", async () => {
        expectTypeOf(testAngleMarker._frontArrowHeadPath).toEqualTypeOf({ a: Path });
        expectTypeOf(testAngleMarker._glowingFrontArrowHeadPath).toEqualTypeOf({ a: Path });
        expectTypeOf(testAngleMarker._backArrowHeadPath).toEqualTypeOf({ a: Path });
        expectTypeOf(testAngleMarker._glowingBackArrowHeadPath).toEqualTypeOf({ a: Path });
        expectTypeOf(testAngleMarker._frontFill).toEqualTypeOf({ a: Path });
        expectTypeOf(testAngleMarker._backFill).toEqualTypeOf({ a: Path });
    });

    it("gives fill objects lists with NUMCIRCLEVERTICES+1 anchors", async () => {
        expect(Array.isArray(testAngleMarker._frontFill._collection)).toBeTruthy();
        expect(Array.isArray(testAngleMarker._backFill._collection)).toBeTruthy();

        expect(testAngleMarker._frontFill._collection).toHaveLength(SETTINGS.angleMarker.numCirclePoints + 1);
        expect(testAngleMarker._backFill._collection).toHaveLength(SETTINGS.angleMarker.numCirclePoints + 1);

        for (let i = 0; i < SETTINGS.angleMarker.numCirclePoints + 1; i++) {
            expectTypeOf(testAngleMarker._frontFill._collection[i]).toEqualTypeOf({ a: Anchor });
            expectTypeOf(testAngleMarker._backFill._collection[i]).toEqualTypeOf({ a: Anchor });
        }
    });

    it("properly sets style options", async () => {
        expect(testAngleMarker.styleOptions.get(StyleCategory.Front)).toBe(DEFAULT_ANGLE_MARKER_FRONT_STYLE);
        expect(testAngleMarker.styleOptions.get(StyleCategory.Back)).toBe(DEFAULT_ANGLE_MARKER_BACK_STYLE);
    });
});

describe("AngleMarker: updateCurrentStrokeWidthAndRadiusForZoom properly updates all stroke widths", () => {
    it("properly multiplies AngleMarker variables by the given factor", async () => {
        const currentCircularStrokeWidthFront = AngleMarker.currentCircularStrokeWidthFront;
        const currentCircularStrokeWidthBack = AngleMarker.currentCircularStrokeWidthBack;
        const currentGlowingCircularStrokeWidthFront = AngleMarker.currentGlowingCircularStrokeWidthFront;
        const currentGlowingCircularStrokeWidthBack = AngleMarker.currentGlowingCircularStrokeWidthBack;
        const currentStraightStrokeWidthFront = AngleMarker.currentStraightStrokeWidthFront;
        const currentStraightStrokeWidthBack = AngleMarker.currentStraightStrokeWidthBack;
        const currentGlowingStraightStrokeWidthFront = AngleMarker.currentGlowingStraightStrokeWidthFront;
        const currentGlowingStraightStrokeWidthBack = AngleMarker.currentGlowingStraightStrokeWidthBack;
        const currentTickLength = AngleMarker.currentTickLength;
        const currentTickStrokeWidthFront = AngleMarker.currentTickStrokeWidthFront;
        const currentGlowingTickStrokeWidthFront = AngleMarker.currentGlowingTickStrokeWidthFront;
        const currentGlowingTickStrokeWidthBack = AngleMarker.currentGlowingTickStrokeWidthBack;
        const currentRadius = AngleMarker.currentRadius;
        const currentRadiusDoubleArc = AngleMarker.currentRadiusDoubleArc;
        const currentArrowHeadLength = AngleMarker.currentArrowHeadLength;

        AngleMarker.updateCurrentStrokeWidthAndRadiusForZoom(2);

        expect(AngleMarker.currentCircularStrokeWidthFront).toBe(2 * currentCircularStrokeWidthFront);
        expect(AngleMarker.currentCircularStrokeWidthBack).toBe(2 * currentCircularStrokeWidthBack);
        expect(AngleMarker.currentGlowingCircularStrokeWidthFront).toBe(2 * currentGlowingCircularStrokeWidthFront);
        expect(AngleMarker.currentGlowingCircularStrokeWidthBack).toBe(2 * currentGlowingCircularStrokeWidthBack);
        expect(AngleMarker.currentStraightStrokeWidthFront).toBe(2 * currentStraightStrokeWidthFront);
        expect(AngleMarker.currentStraightStrokeWidthBack).toBe(2 * currentStraightStrokeWidthBack);
        expect(AngleMarker.currentGlowingStraightStrokeWidthFront).toBe(2 * currentGlowingStraightStrokeWidthFront);
        expect(AngleMarker.currentGlowingStraightStrokeWidthBack).toBe(2 * currentGlowingStraightStrokeWidthBack);
        expect(AngleMarker.currentTickLength).toBe(2 * currentTickLength);
        expect(AngleMarker.currentTickStrokeWidthFront).toBe(2 * currentTickStrokeWidthFront);
        expect(AngleMarker.currentGlowingTickStrokeWidthFront).toBe(2 * currentGlowingTickStrokeWidthFront);
        expect(AngleMarker.currentGlowingTickStrokeWidthBack).toBe(2 * currentGlowingTickStrokeWidthBack);
        expect(AngleMarker.currentRadius).toBe(2 * currentRadius);
        expect(AngleMarker.currentRadiusDoubleArc).toBe(2 * currentRadiusDoubleArc);
        expect(AngleMarker.currentArrowHeadLength).toBe(2 * currentArrowHeadLength);

        AngleMarker.updateCurrentStrokeWidthAndRadiusForZoom(0.5);

        expect(AngleMarker.currentCircularStrokeWidthFront).toBe(currentCircularStrokeWidthFront);
        expect(AngleMarker.currentCircularStrokeWidthBack).toBe(currentCircularStrokeWidthBack);
        expect(AngleMarker.currentGlowingCircularStrokeWidthFront).toBe(currentGlowingCircularStrokeWidthFront);
        expect(AngleMarker.currentGlowingCircularStrokeWidthBack).toBe(currentGlowingCircularStrokeWidthBack);
        expect(AngleMarker.currentStraightStrokeWidthFront).toBe(currentStraightStrokeWidthFront);
        expect(AngleMarker.currentStraightStrokeWidthBack).toBe(currentStraightStrokeWidthBack);
        expect(AngleMarker.currentGlowingStraightStrokeWidthFront).toBe(currentGlowingStraightStrokeWidthFront);
        expect(AngleMarker.currentGlowingStraightStrokeWidthBack).toBe(currentGlowingStraightStrokeWidthBack);
        expect(AngleMarker.currentTickLength).toBe(currentTickLength);
        expect(AngleMarker.currentTickStrokeWidthFront).toBe(currentTickStrokeWidthFront);
        expect(AngleMarker.currentGlowingTickStrokeWidthFront).toBe(currentGlowingTickStrokeWidthFront);
        expect(AngleMarker.currentGlowingTickStrokeWidthBack).toBe(currentGlowingTickStrokeWidthBack);
        expect(AngleMarker.currentRadius).toBe(currentRadius);
        expect(AngleMarker.currentRadiusDoubleArc).toBe(currentRadiusDoubleArc);
        expect(AngleMarker.currentArrowHeadLength).toBe(currentArrowHeadLength);
    });
});

describe("AngleMarker: updateDisplay properly updates within parameters", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("sets the y components to 0", async () => {
        testAngleMarker.updateDisplay();
        expect(testAngleMarker._circleCenter.y).toBe(0);
    });

    it("properly updates display when angleMarker is on the front", async () => {
        testAngleMarker._vertexVector.z = 1;
        testAngleMarker.updateDisplay();
        expect(testAngleMarker._angleMarkerOnFront).toBeTruthy();
    });

    it("properly updates display when angleMarker is on the back", async () => {
        testAngleMarker._vertexVector.z = -1;
        testAngleMarker.updateDisplay();
        expect(testAngleMarker._angleMarkerOnFront).toBeFalsy();
    });
});

describe("AngleMarker: vertexVector getter and setter properly read and update angleMarker vertex vector", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("gets a vector type object", async () => {
        expectTypeOf(testAngleMarker.vertexVector).toEqualTypeOf({ a: Vector3 });
    });

    it("sets the vertex vector to a valid vector type object", async () => {
        testAngleMarker.vertexVector = new Vector3(1, 1, 1);
        expectTypeOf(testAngleMarker.vertexVector).toEqualTypeOf({ a: Vector3 });
    });
});

describe("AngleMarker: startVector getter and setter properly read and update angleMarker start vector", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("gets a vector type object", async () => {
        expectTypeOf(testAngleMarker.startVector).toEqualTypeOf({ a: Vector3 });
    });

    it("sets the start vector to a valid vector type object", async () => {
        testAngleMarker.startVector = new Vector3(1, 1, 1);
        expectTypeOf(testAngleMarker.startVector).toEqualTypeOf({ a: Vector3 });
    });
});

describe("AngleMarker: endVector getter and setter properly read and update angleMarker end vector", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("gets a vector type object", async () => {
        expectTypeOf(testAngleMarker.endVector).toEqualTypeOf({ a: Vector3 });
    });

    it("sets the end vector to a valid vector type object", async () => {
        testAngleMarker.endVector = new Vector3(1, 1, 1);
        expectTypeOf(testAngleMarker.endVector).toEqualTypeOf({ a: Vector3 });
    });
});

describe("AngleMarker: angleMarkerRadius getter properly reads the angleMarker radius", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("gets a number", async () => {
        expectTypeOf(testAngleMarker.angleMarkerRadius).toBeNumber();
    });
});

describe("AngleMarker: angleMarkerValue setter properly updates the angleMarker value", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("sets angleMarkerValue to a valid number", async () => {
        testAngleMarker.angleMarkerValue = 90;
        expectTypeOf(testAngleMarker.angleMarkerValue).toBeNumber();
    });
});

describe("AngleMarker: setAngleMarkerFromThreeVectors", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("returns a proper array of vectors", async () => {
        const returnArray = testAngleMarker.setAngleMarkerFromThreeVectors([1, 1, 1], [1, 1, 1], [1, 1, 1], testAngleMarker.angleMarkerRadius);
        expect(Array.isArray(returnArray)).toBeTruthy();
        expect(returnArray).toHaveLength(3);
        expect(returnArray[0]).toBe(testAngleMarker._startVector);
        expect(returnArray[1]).toBe(testAngleMarker._vertexVector);
        expect(returnArray[2]).toBe(testAngleMarker._endVector);
    });
});

describe("AngleMarker: frontGlowingDisplay properly sets visibility", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("sets the proper parts visible", async () => {
        testAngleMarker.frontGlowingDisplay();

        expect(testAngleMarker._frontStraightVertexToStart.visible).toBeTruthy();
        expect(testAngleMarker._glowingFrontStraightVertexToStart.visible).toBeTruthy();
        expect(testAngleMarker._frontCircle.visible).toBeTruthy();
        expect(testAngleMarker._glowingFrontCircle.visible).toBeTruthy();
        expect(testAngleMarker._frontStraightEndToVertex.visible).toBeTruthy();
        expect(testAngleMarker._glowingFrontStraightEndToVertex.visible).toBeTruthy();
        expect(testAngleMarker._frontFill.visible).toBeTruthy();
    });

    it("sets visibility correctly based on the frontStyle", async () => {
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerDoubleArc = true;
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerArrowHeads = true;
        testAngleMarker._angleIsBigEnoughToDrawArrowHeads = true;
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerTickMark = true;

        testAngleMarker.frontGlowingDisplay();

        expect(testAngleMarker._frontDouble.visible).toBeTruthy();
        expect(testAngleMarker._glowingFrontDouble.visible).toBeTruthy();
        expect(testAngleMarker._frontArrowHeadPath.visible).toBeTruthy();
        expect(testAngleMarker._glowingFrontArrowHeadPath.visible).toBeTruthy();
        expect(testAngleMarker._frontTick.visible).toBeTruthy();
        expect(testAngleMarker._glowingFrontTick.visible).toBeTruthy();

        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerDoubleArc = false;
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerArrowHeads = false;
        testAngleMarker._angleIsBigEnoughToDrawArrowHeads = false;
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerTickMark = false;

        testAngleMarker.frontGlowingDisplay();

        expect(testAngleMarker._frontDouble.visible).toBeFalsy();
        expect(testAngleMarker._glowingFrontDouble.visible).toBeFalsy();
        expect(testAngleMarker._frontArrowHeadPath.visible).toBeFalsy();
        expect(testAngleMarker._glowingFrontArrowHeadPath.visible).toBeFalsy();
        expect(testAngleMarker._frontTick.visible).toBeFalsy();
        expect(testAngleMarker._glowingFrontTick.visible).toBeFalsy();
    });
});

describe("AngleMarker: backGlowingDisplay properly sets visibility", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("sets the proper parts visible", async () => {
        testAngleMarker.backGlowingDisplay();

        expect(testAngleMarker._backStraightVertexToStart.visible).toBeTruthy();
        expect(testAngleMarker._glowingBackStraightVertexToStart.visible).toBeTruthy();
        expect(testAngleMarker._backCircle.visible).toBeTruthy();
        expect(testAngleMarker._glowingBackCircle.visible).toBeTruthy();
        expect(testAngleMarker._backStraightEndToVertex.visible).toBeTruthy();
        expect(testAngleMarker._glowingBackStraightEndToVertex.visible).toBeTruthy();
        expect(testAngleMarker._backFill.visible).toBeTruthy();
    });

    it("sets visibility correctly based on the frontStyle", async () => {
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerDoubleArc = true;
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerArrowHeads = true;
        testAngleMarker._angleIsBigEnoughToDrawArrowHeads = true;
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerTickMark = true;

        testAngleMarker.backGlowingDisplay();

        expect(testAngleMarker._backDouble.visible).toBeTruthy();
        expect(testAngleMarker._glowingBackDouble.visible).toBeTruthy();
        expect(testAngleMarker._backArrowHeadPath.visible).toBeTruthy();
        expect(testAngleMarker._glowingBackArrowHeadPath.visible).toBeTruthy();
        expect(testAngleMarker._backTick.visible).toBeTruthy();
        expect(testAngleMarker._glowingBackTick.visible).toBeTruthy();

        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerDoubleArc = false;
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerArrowHeads = false;
        testAngleMarker._angleIsBigEnoughToDrawArrowHeads = false;
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerTickMark = false;

        testAngleMarker.backGlowingDisplay();

        expect(testAngleMarker._backDouble.visible).toBeFalsy();
        expect(testAngleMarker._glowingBackDouble.visible).toBeFalsy();
        expect(testAngleMarker._backArrowHeadPath.visible).toBeFalsy();
        expect(testAngleMarker._glowingBackArrowHeadPath.visible).toBeFalsy();
        expect(testAngleMarker._backTick.visible).toBeFalsy();
        expect(testAngleMarker._glowingBackTick.visible).toBeFalsy();
    });
});

describe("AngleMarker: glowingDisplay calls both front and back display functions", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("calls frontGlowingDisplay and backGlowingDisplay", async () => {
        const frontSpy = vi.spyOn(testAngleMarker, "frontGlowingDisplay");
        const backSpy = vi.spyOn(testAngleMarker, "backGlowingDisplay");
        testAngleMarker.glowingDisplay();

        expect(frontSpy).toHaveBeenCalled();
        expect(backSpy).toHaveBeenCalled();
    });
});

describe("AngleMarker: frontNormalDisplay properly sets visibility", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("sets the proper parts visible", async () => {
        testAngleMarker.frontNormalDisplay();

        expect(testAngleMarker._frontStraightVertexToStart.visible).toBeTruthy();
        expect(testAngleMarker._frontCircle.visible).toBeTruthy();
        expect(testAngleMarker._frontStraightEndToVertex.visible).toBeTruthy();
        expect(testAngleMarker._frontFill.visible).toBeTruthy();
    });

    it("sets visibility correctly based on the frontStyle", async () => {
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerDoubleArc = true;
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerArrowHeads = true;
        testAngleMarker._angleIsBigEnoughToDrawArrowHeads = true;
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerTickMark = true;

        testAngleMarker.frontNormalDisplay();

        expect(testAngleMarker._frontDouble.visible).toBeTruthy();
        expect(testAngleMarker._frontArrowHeadPath.visible).toBeTruthy();
        expect(testAngleMarker._frontTick.visible).toBeTruthy();

        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerDoubleArc = false;
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerArrowHeads = false;
        testAngleMarker._angleIsBigEnoughToDrawArrowHeads = false;
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerTickMark = false;

        testAngleMarker.frontNormalDisplay();

        expect(testAngleMarker._frontDouble.visible).toBeFalsy();
        expect(testAngleMarker._frontArrowHeadPath.visible).toBeFalsy();
        expect(testAngleMarker._frontTick.visible).toBeFalsy();
    });
});

describe("AngleMarker: backNormalDisplay properly sets visibility", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("sets the proper parts visible", async () => {
        testAngleMarker.backNormalDisplay();

        expect(testAngleMarker._backStraightVertexToStart.visible).toBeTruthy();
        expect(testAngleMarker._backCircle.visible).toBeTruthy();
        expect(testAngleMarker._backStraightEndToVertex.visible).toBeTruthy();
        expect(testAngleMarker._backFill.visible).toBeTruthy();
    });

    it("sets visibility correctly based on the frontStyle", async () => {
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerDoubleArc = true;
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerArrowHeads = true;
        testAngleMarker._angleIsBigEnoughToDrawArrowHeads = true;
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerTickMark = true;

        testAngleMarker.backNormalDisplay();

        expect(testAngleMarker._backDouble.visible).toBeTruthy();
        expect(testAngleMarker._backArrowHeadPath.visible).toBeTruthy();
        expect(testAngleMarker._backTick.visible).toBeTruthy();

        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerDoubleArc = false;
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerArrowHeads = false;
        testAngleMarker._angleIsBigEnoughToDrawArrowHeads = false;
        testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerTickMark = false;

        testAngleMarker.backNormalDisplay();

        expect(testAngleMarker._backDouble.visible).toBeFalsy();
        expect(testAngleMarker._backArrowHeadPath.visible).toBeFalsy();
        expect(testAngleMarker._backTick.visible).toBeFalsy();
    });
});

describe("AngleMarker: normalDisplay calls both front and back display functions", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("calls frontNormalDisplay and backNormalDisplay", async () => {
        const frontSpy = vi.spyOn(testAngleMarker, "frontNormalDisplay");
        const backSpy = vi.spyOn(testAngleMarker, "backNormalDisplay");

        testAngleMarker._angleMarkerOnFront = true;
        testAngleMarker.normalDisplay();
        expect(frontSpy).toHaveBeenCalled();
        
        testAngleMarker._angleMarkerOnFront = false;
        testAngleMarker.normalDisplay();
        expect(backSpy).toHaveBeenCalled();
    });
});

describe("AngleMarker: setVisible", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("sets all part visibilities to false if passed false", async () => {
        testAngleMarker.setVisible(false);

        expect(testAngleMarker._frontStraightVertexToStart.visible).toBeFalsy();
        expect(testAngleMarker._glowingFrontStraightVertexToStart.visible).toBeFalsy();
        expect(testAngleMarker._frontCircle.visible).toBeFalsy();
        expect(testAngleMarker._glowingFrontCircle.visible).toBeFalsy();
        expect(testAngleMarker._frontStraightEndToVertex.visible).toBeFalsy();
        expect(testAngleMarker._glowingFrontStraightEndToVertex.visible).toBeFalsy();
        expect(testAngleMarker._frontFill.visible).toBeFalsy();
        expect(testAngleMarker._frontDouble.visible).toBeFalsy();
        expect(testAngleMarker._glowingFrontDouble.visible).toBeFalsy();
        expect(testAngleMarker._frontArrowHeadPath.visible).toBeFalsy();
        expect(testAngleMarker._glowingFrontArrowHeadPath.visible).toBeFalsy();
        expect(testAngleMarker._frontTick.visible).toBeFalsy();
        expect(testAngleMarker._glowingFrontTick.visible).toBeFalsy();
        expect(testAngleMarker._backStraightVertexToStart.visible).toBeFalsy();
        expect(testAngleMarker._glowingBackStraightVertexToStart.visible).toBeFalsy();
        expect(testAngleMarker._backCircle.visible).toBeFalsy();
        expect(testAngleMarker._glowingBackCircle.visible).toBeFalsy();
        expect(testAngleMarker._backStraightEndToVertex.visible).toBeFalsy();
        expect(testAngleMarker._glowingBackStraightEndToVertex.visible).toBeFalsy();
        expect(testAngleMarker._backFill.visible).toBeFalsy();
        expect(testAngleMarker._backDouble.visible).toBeFalsy();
        expect(testAngleMarker._glowingBackDouble.visible).toBeFalsy();
        expect(testAngleMarker._backArrowHeadPath.visible).toBeFalsy();
        expect(testAngleMarker._glowingBackArrowHeadPath.visible).toBeFalsy();
        expect(testAngleMarker._backTick.visible).toBeFalsy();
        expect(testAngleMarker._glowingBackTick.visible).toBeFalsy();
    });

    it("calls normalDisplay if passed true", async () => {
        const normalSpy = vi.spyOn(testAngleMarker, "normalDisplay");
        testAngleMarker.setVisible(true);
        expect(normalSpy).toHaveBeenCalled();
    });
});

describe("AngleMarker: addToLayers", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("adds all AngleMarker parts to the correct layer indices", async () => {
        // Creates a generic array, fills in target indices with mocks listening for proper arguments.
        const addMocks = [vi.fn(), vi.fn(), vi.fn(), vi.fn()];
        const testLayer = Array(14).fill({});

        testLayer[LAYER.foregroundAngleMarkers] = { add: addMocks[0] };
        testLayer[LAYER.foregroundAngleMarkersGlowing] = { add: addMocks[1] };
        testLayer[LAYER.backgroundAngleMarkers] = { add: addMocks[2] };
        testLayer[LAYER.backgroundAngleMarkersGlowing] = { add: addMocks[3] };

        testAngleMarker.addToLayers(testLayer);

        expect(addMocks[0]).toHaveBeenCalledWith(testAngleMarker._frontFill);
        expect(addMocks[0]).toHaveBeenCalledWith(testAngleMarker._frontCircle);
        expect(addMocks[0]).toHaveBeenCalledWith(testAngleMarker._frontStraightVertexToStart);
        expect(addMocks[0]).toHaveBeenCalledWith(testAngleMarker._frontStraightEndToVertex);
        expect(addMocks[0]).toHaveBeenCalledWith(testAngleMarker._frontArrowHeadPath);
        expect(addMocks[0]).toHaveBeenCalledWith(testAngleMarker._frontDouble);
        expect(addMocks[0]).toHaveBeenCalledWith(testAngleMarker._frontTick);

        expect(addMocks[1]).toHaveBeenCalledWith(testAngleMarker._glowingFrontCircle);
        expect(addMocks[1]).toHaveBeenCalledWith(testAngleMarker._glowingFrontStraightVertexToStart);
        expect(addMocks[1]).toHaveBeenCalledWith(testAngleMarker._glowingFrontStraightEndToVertex);
        expect(addMocks[1]).toHaveBeenCalledWith(testAngleMarker._glowingFrontArrowHeadPath);
        expect(addMocks[1]).toHaveBeenCalledWith(testAngleMarker._glowingFrontDouble);
        expect(addMocks[1]).toHaveBeenCalledWith(testAngleMarker._glowingFrontTick);

        expect(addMocks[2]).toHaveBeenCalledWith(testAngleMarker._backFill);
        expect(addMocks[2]).toHaveBeenCalledWith(testAngleMarker._backStraightVertexToStart);
        expect(addMocks[2]).toHaveBeenCalledWith(testAngleMarker._backCircle);
        expect(addMocks[2]).toHaveBeenCalledWith(testAngleMarker._backStraightEndToVertex);
        expect(addMocks[2]).toHaveBeenCalledWith(testAngleMarker._backArrowHeadPath);
        expect(addMocks[2]).toHaveBeenCalledWith(testAngleMarker._backDouble);
        expect(addMocks[2]).toHaveBeenCalledWith(testAngleMarker._backTick);

        expect(addMocks[3]).toHaveBeenCalledWith(testAngleMarker._glowingBackStraightVertexToStart);
        expect(addMocks[3]).toHaveBeenCalledWith(testAngleMarker._glowingBackCircle);
        expect(addMocks[3]).toHaveBeenCalledWith(testAngleMarker._glowingBackStraightEndToVertex);
        expect(addMocks[3]).toHaveBeenCalledWith(testAngleMarker._glowingBackArrowHeadPath);
        expect(addMocks[3]).toHaveBeenCalledWith(testAngleMarker._glowingBackDouble);
        expect(addMocks[3]).toHaveBeenCalledWith(testAngleMarker._glowingBackTick);
    });
});

describe("AngleMarker: removeFromLayers", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("removes all parts from their respective layers", async () => {
        const frontFillSpy = vi.spyOn(testAngleMarker._frontFill, "remove");
        const frontCircleSpy = vi.spyOn(testAngleMarker._frontCircle, "remove");
        const frontStraightVertexToStartSpy = vi.spyOn(testAngleMarker._frontStraightVertexToStart, "remove");
        const frontStraightEndToVertexSpy = vi.spyOn(testAngleMarker._frontStraightEndToVertex, "remove");
        const frontArrowHeadPathSpy = vi.spyOn(testAngleMarker._frontArrowHeadPath, "remove");
        const frontDoubleSpy = vi.spyOn(testAngleMarker._frontDouble, "remove");
        const frontTickSpy = vi.spyOn(testAngleMarker._frontTick, "remove");
        const glowingFrontCircleSpy = vi.spyOn(testAngleMarker._glowingFrontCircle, "remove");
        const glowingFrontStraightVertexToStartSpy = vi.spyOn(testAngleMarker._glowingFrontStraightVertexToStart, "remove");
        const glowingFrontStraightEndToVertexSpy = vi.spyOn(testAngleMarker._glowingFrontStraightEndToVertex, "remove");
        const glowingFrontArrowHeadPathSpy = vi.spyOn(testAngleMarker._glowingFrontArrowHeadPath, "remove");
        const glowingFrontDoubleSpy = vi.spyOn(testAngleMarker._glowingFrontDouble, "remove");
        const glowingFrontTickSpy = vi.spyOn(testAngleMarker._glowingFrontTick, "remove");
        const backFillSpy = vi.spyOn(testAngleMarker._backFill, "remove");
        const backStraightVertexToStartSpy = vi.spyOn(testAngleMarker._backStraightVertexToStart, "remove");
        const backCircleSpy = vi.spyOn(testAngleMarker._backCircle, "remove");
        const backStraightEndToVertexSpy = vi.spyOn(testAngleMarker._backStraightEndToVertex, "remove");
        const backArrowHeadPathSpy = vi.spyOn(testAngleMarker._backArrowHeadPath, "remove");
        const backDoubleSpy = vi.spyOn(testAngleMarker._backDouble, "remove");
        const backTickSpy = vi.spyOn(testAngleMarker._backTick, "remove");
        const glowingBackStraightVertexToStartSpy = vi.spyOn(testAngleMarker._glowingBackStraightVertexToStart, "remove");
        const glowingBackCircleSpy = vi.spyOn(testAngleMarker._glowingBackCircle, "remove");
        const glowingBackStraightEndToVertexSpy = vi.spyOn(testAngleMarker._glowingBackStraightEndToVertex, "remove");
        const glowingBackArrowHeadPathSpy = vi.spyOn(testAngleMarker._glowingBackArrowHeadPath, "remove");
        const glowingBackDoubleSpy = vi.spyOn(testAngleMarker._glowingBackDouble, "remove");
        const glowingBackTickSpy = vi.spyOn(testAngleMarker._glowingBackTick, "remove");

        testAngleMarker.removeFromLayers();

        expect(frontFillSpy).toHaveBeenCalled();
        expect(frontCircleSpy).toHaveBeenCalled();
        expect(frontStraightVertexToStartSpy).toHaveBeenCalled();
        expect(frontStraightEndToVertexSpy).toHaveBeenCalled();
        expect(frontArrowHeadPathSpy).toHaveBeenCalled();
        expect(frontDoubleSpy).toHaveBeenCalled();
        expect(frontTickSpy).toHaveBeenCalled();
        expect(glowingFrontCircleSpy).toHaveBeenCalled();
        expect(glowingFrontStraightVertexToStartSpy).toHaveBeenCalled();
        expect(glowingFrontStraightEndToVertexSpy).toHaveBeenCalled();
        expect(glowingFrontArrowHeadPathSpy).toHaveBeenCalled();
        expect(glowingFrontDoubleSpy).toHaveBeenCalled();
        expect(glowingFrontTickSpy).toHaveBeenCalled();
        expect(backFillSpy).toHaveBeenCalled();
        expect(backStraightVertexToStartSpy).toHaveBeenCalled();
        expect(backCircleSpy).toHaveBeenCalled();
        expect(backStraightEndToVertexSpy).toHaveBeenCalled();
        expect(backArrowHeadPathSpy).toHaveBeenCalled();
        expect(backDoubleSpy).toHaveBeenCalled();
        expect(backTickSpy).toHaveBeenCalled();
        expect(glowingBackStraightVertexToStartSpy).toHaveBeenCalled();
        expect(glowingBackCircleSpy).toHaveBeenCalled();
        expect(glowingBackStraightEndToVertexSpy).toHaveBeenCalled();
        expect(glowingBackArrowHeadPathSpy).toHaveBeenCalled();
        expect(glowingBackDoubleSpy).toHaveBeenCalled();
        expect(glowingBackTickSpy).toHaveBeenCalled();
    });
});

describe("AngleMarker: toSVG", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("returns an array", async () => {
        expect(Array.isArray(testAngleMarker.toSVG())).toBeTruthy();
    });
});

describe("AngleMarker: angleMarkerRadiusPercent", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("returns a proper percent if frontStyle exists", async () => {
        expect(testAngleMarker.angleMarkerRadiusPercent).toBe(testAngleMarker.styleOptions.get(StyleCategory.Front).angleMarkerRadiusPercent);
    });

    it("returns 100 if frontStyle doesn't exist", async () => {
        testAngleMarker.styleOptions.set(
            StyleCategory.Front,
            undefined
        );
        expect(testAngleMarker.angleMarkerRadiusPercent).toBe(100);
    });
});

describe("AngleMarker: defaultStyleState", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("returns proper state based on panel type", async () => {
        expect(testAngleMarker.defaultStyleState(StyleCategory.Front)).toBe(DEFAULT_ANGLE_MARKER_FRONT_STYLE);
        if (!SETTINGS.angleMarker.dynamicBackStyle) {
            expect(testAngleMarker.defaultStyleState(StyleCategory.Back)).toBe(DEFAULT_ANGLE_MARKER_BACK_STYLE);
        }
    });
});

describe("AngleMarker: adjustSize", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("calls updateDisplay", async () => {
        const updateSpy = vi.spyOn(testAngleMarker, "updateDisplay");
        testAngleMarker.adjustSize();
        expect(updateSpy).toHaveBeenCalled();
    });
});

describe("AngleMarker: stylize", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("correctly sets part visibility based on the passed style", async () => {
        testAngleMarker.stylize(DisplayStyle.ApplyTemporaryVariables);

        expect(testAngleMarker._glowingFrontStraightVertexToStart.visible).toBeFalsy();
        expect(testAngleMarker._glowingFrontCircle.visible).toBeFalsy();
        expect(testAngleMarker._glowingFrontStraightEndToVertex.visible).toBeFalsy();
        expect(testAngleMarker._glowingFrontArrowHeadPath.visible).toBeFalsy();
        expect(testAngleMarker._glowingFrontDouble.visible).toBeFalsy();
        expect(testAngleMarker._glowingFrontTick.visible).toBeFalsy();
        expect(testAngleMarker._glowingBackStraightVertexToStart.visible).toBeFalsy();
        expect(testAngleMarker._glowingBackCircle.visible).toBeFalsy();
        expect(testAngleMarker._glowingBackStraightEndToVertex.visible).toBeFalsy();
        expect(testAngleMarker._glowingBackDouble.visible).toBeFalsy();
        expect(testAngleMarker._glowingBackArrowHeadPath.visible).toBeFalsy();
        expect(testAngleMarker._glowingBackTick.visible).toBeFalsy();
        expect(testAngleMarker._backDouble.visible).toBeFalsy();
        expect(testAngleMarker._frontDouble.visible).toBeFalsy();
    });
});
