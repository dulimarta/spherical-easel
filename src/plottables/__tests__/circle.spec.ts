import Circle from "@/plottables/Circle.ts";
import SETTINGS, { LAYER } from "@/global-settings";
import Nodule from "../Nodule";
import { Vector3 } from "three";
import { Group } from "two.js/src/group";
import {
    StyleOptions,
    StyleCategory,
    DEFAULT_CIRCLE_FRONT_STYLE,
    DEFAULT_CIRCLE_BACK_STYLE
} from "@/types/Styles";

Array.prototype.rotate = function (count: number) {
    const len = this.length >>> 0;
    let _count = count >> 0;
    _count = ((_count % len) + len) % len;

    Array.prototype.push.apply(
        this,
        Array.prototype.splice.call(this, 0, _count)
    );
    return this;
};

Number.prototype.toDegrees = function (): number {
    return (Number(this) / Math.PI) * 180;
};

Number.prototype.modTwoPi = function (): number {
    return ((Number(this) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
};

Number.prototype.zeroOut = function (tol?: number): number {
    if (tol == undefined) {
        tol = 10 ** -10;
    }
    if (Math.abs(Number(this)) < tol) {
        return 0;
    } else return Number(this);
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

describe("Circle: circle constructor generates a valid circle plottable", () => {
    let testCircle: any;
    beforeEach(() => {
        testCircle = new Circle("Circle");
    });

    it("sets the correct number of boundary vertices on the circle", async () => {
        expect(Circle.boundaryVertices.length).toBe(SETTINGS.circle.numPoints);
    });

    it("prevents the boundary vertices from being populated more than once", async () => {
        expect(Circle.setBoundaryVerticesHasBeenCalled).toBe(true);
    });

    it("sets the circle to be visible", async () => {
        expect(testCircle._frontPart.visible).toBe(true);
        expect(testCircle._backPart.visible).toBe(true);
    });

    it("sets the glowing display to be initially invisible", async () => {
        expect(testCircle._glowingFrontPart.visible).toBe(false);
        expect(testCircle._glowingBackPart.visible).toBe(false);
    });
    /*
    it("sets a maximum of 3 * SUBDIVISIONS + 2 anchors to the anchor list", async () => {
        expect(testCircle.fillStorageAnchors.length).toBeLessThanOrEqual(3 * /*SUBDIVISIONS*//*SETTINGS.circle.numPoints + 2);
    });*/

    it("properly sets gradient and style settings", async () => {
        expect(testCircle.frontGradientColor.color).toBe(SETTINGS.circle.drawn.fillColor.front);
        if (SETTINGS.circle.dynamicBackStyle) {
            expect(testCircle.backGradientColor.color).toBe(Nodule.contrastFillColor(SETTINGS.circle.drawn.fillColor.front));
        } else {
            expect(testCircle.backGradientColor.color).toBe(SETTINGS.circle.drawn.fillColor.back);
        }
        expect(testCircle.styleOptions.get(StyleCategory.Front)).toBe(DEFAULT_CIRCLE_FRONT_STYLE);
        expect(testCircle.styleOptions.get(StyleCategory.Back)).toBe(DEFAULT_CIRCLE_BACK_STYLE);
    });
});

describe("Circle: updateDisplay properly updates within parameters", () => {
    let testCircle: any;
    beforeEach(() => {
        testCircle = new Circle("Circle");
        Nodule.setFillStyle(2);
    });

    afterEach(() => {
        Nodule.setFillStyle(0);
    })

    it("doesn't set widths or heights to 0", async () => {
        testCircle.updateDisplay();
        expect(testCircle._frontPart.height).not.toBe(0);
        expect(testCircle._frontPart.width).not.toBe(0);
        expect(testCircle._backPart.height).not.toBe(0);
        expect(testCircle._backPart.width).not.toBe(0);
        expect(testCircle._glowingFrontPart.height).not.toBe(0);
        expect(testCircle._glowingFrontPart.width).not.toBe(0);
        expect(testCircle._glowingBackPart.height).not.toBe(0);
        expect(testCircle._glowingBackPart.width).not.toBe(0);
    });

    it("properly updates display when circle is entirely on the front", async () => {
        testCircle._circleRadius = 2;
        testCircle.centerVector.z = -1;
        testCircle.updateDisplay();
        expect(testCircle._frontPartInUse).toBe(true);
        expect(testCircle._backPartInUse).toBe(false);
        expect(testCircle._frontFillInUse).toBe(true);
        expect(testCircle._frontFillIsEntireFront).toBe(false);
        expect(testCircle._backFillIsEntireBack).toBe(true);
        expect(testCircle._frontPart.closed).toBe(true);
        expect(testCircle._glowingFrontPart.closed).toBe(true);

        testCircle.centerVector.z = 1;
        testCircle.updateDisplay();
        expect(testCircle._frontPartInUse).toBe(false);
        expect(testCircle._backPartInUse).toBe(true);
        expect(testCircle._frontFillInUse).toBe(true);
        expect(testCircle._backFillInUse).toBe(true);
        expect(testCircle._frontFillIsEntireFront).toBe(true);
        expect(testCircle._backPart.closed).toBe(true);
        expect(testCircle._glowingBackPart.closed).toBe(true);
    });
    
    it("properly updates display when circle is entirely on the back", async () => {
        testCircle._circleRadius = -1;
        testCircle.centerVector.z = -1;
        testCircle.updateDisplay();
        expect(testCircle._frontPartInUse).toBe(false);
        expect(testCircle._backPartInUse).toBe(true);
        expect(testCircle._frontFillInUse).toBe(false);
        expect(testCircle._backFillInUse).toBe(true);
        expect(testCircle._frontFillIsEntireFront).toBe(false);
        expect(testCircle._backPart.closed).toBe(true);
        expect(testCircle._glowingBackPart.closed).toBe(true);

        testCircle.centerVector.z = 1;
        testCircle.updateDisplay();
        expect(testCircle._frontPartInUse).toBe(true);
        expect(testCircle._backPartInUse).toBe(false);
        expect(testCircle._frontFillInUse).toBe(true);
        expect(testCircle._backFillInUse).toBe(false);
        expect(testCircle._frontFillIsEntireFront).toBe(false);
        expect(testCircle._backFillIsEntireBack).toBe(false);
        expect(testCircle._frontPart.closed).toBe(true);
        expect(testCircle._glowingFrontPart.closed).toBe(true);
    });
    
    it("properly updates display when circle edge intersects boundary circle", async () => {
        testCircle._circleRadius = 1;
        testCircle.updateDisplay();
        expect(testCircle._frontPartInUse).toBe(true);
        expect(testCircle._backPartInUse).toBe(true);
        expect(testCircle._frontFillInUse).toBe(true);
        expect(testCircle._backFillInUse).toBe(true);
        expect(testCircle._frontFillIsEntireFront).toBe(false);
        expect(testCircle._backFillIsEntireBack).toBe(false);
        expect(testCircle._frontPart.closed).toBe(false);
        expect(testCircle._backPart.closed).toBe(false);
        expect(testCircle._glowingFrontPart.closed).toBe(false);
        expect(testCircle._glowingBackPart.closed).toBe(false);
    });
});

describe("Circle: centerVector getter and setter properly read and update circle center vector", () => {
    let testCircle: any;
    beforeEach(() => {
        testCircle = new Circle("Circle");
    });

    it("gets a vector type object", async () => {
        expectTypeOf(testCircle.centerVector).toEqualTypeOf({ a: Vector3 });
    });

    it("sets the center vector to a valid vector type object", async () => {
        testCircle.centerVector = new Vector3(1, 1, 1);
        expectTypeOf(testCircle.centerVector).toEqualTypeOf({ a: Vector3 });
    });
});

describe("Circle: circleRadius getter and setter properly read and update circle radius", () => {
    let testCircle: any;
    beforeEach(() => {
        testCircle = new Circle("Circle");
    });

    it("gets a valid number", async () => {
        expectTypeOf(testCircle.circleRadius).toBeNumber();
    });

    it("sets the circleRadius to a valid number", async () => {
        testCircle.circleRadius = 12;
        expectTypeOf(testCircle.circleRadius).toBeNumber();
    });
});

describe("Circle: glowingDisplay properly sets visibility", () => {
    let testCircle: any;
    beforeEach(() => {
        testCircle = new Circle("Circle");
    });

    it("sets parts visible when in use", async () => {
        testCircle._frontPartInUse = true;
        testCircle._frontFillInUse = true;
        testCircle._backPartInUse = true;
        testCircle._backFillInUse = true;
        testCircle.glowingDisplay();
        expect(testCircle._frontPart.visible).toBe(true);
        expect(testCircle._glowingFrontPart.visible).toBe(true);
        expect(testCircle._frontFill.visible).toBe(true);
        expect(testCircle._backPart.visible).toBe(true);
        expect(testCircle._glowingBackPart.visible).toBe(true);
        expect(testCircle._backFill.visible).toBe(true);
    });

    it("sets parts invisible when not in use", async () => {
        testCircle._frontPartInUse = false;
        testCircle._frontFillInUse = false;
        testCircle._backPartInUse = false;
        testCircle._backFillInUse = false;
        testCircle.glowingDisplay();
        expect(testCircle._frontPart.visible).toBe(false);
        expect(testCircle._glowingFrontPart.visible).toBe(false);
        expect(testCircle._frontFill.visible).toBe(false);
        expect(testCircle._backPart.visible).toBe(false);
        expect(testCircle._glowingBackPart.visible).toBe(false);
        expect(testCircle._backFill.visible).toBe(false);
    });
});

describe("Circle: normalDisplay properly sets visibility", () => {
    let testCircle: any;
    beforeEach(() => {
        testCircle = new Circle("Circle");
    });

    it("sets parts (minus glowing parts) visible when in use", async () => {
        testCircle._frontPartInUse = true;
        testCircle._frontFillInUse = true;
        testCircle._backPartInUse = true;
        testCircle._backFillInUse = true;
        testCircle.normalDisplay();
        expect(testCircle._frontPart.visible).toBe(true);
        expect(testCircle._glowingFrontPart.visible).toBe(false);
        expect(testCircle._frontFill.visible).toBe(true);
        expect(testCircle._backPart.visible).toBe(true);
        expect(testCircle._glowingBackPart.visible).toBe(false);
        expect(testCircle._backFill.visible).toBe(true);
    });

    it("sets parts (minus glowing parts) invisible when not in use", async () => {
        testCircle._frontPartInUse = false;
        testCircle._frontFillInUse = false;
        testCircle._backPartInUse = false;
        testCircle._backFillInUse = false;
        testCircle.normalDisplay();
        expect(testCircle._frontPart.visible).toBe(false);
        expect(testCircle._glowingFrontPart.visible).toBe(false);
        expect(testCircle._frontFill.visible).toBe(false);
        expect(testCircle._backPart.visible).toBe(false);
        expect(testCircle._glowingBackPart.visible).toBe(false);
        expect(testCircle._backFill.visible).toBe(false);
    });
});

describe("Circle: setVisible sets circle visible or not", () => {
    let testCircle: any;
    beforeEach(() => {
        testCircle = new Circle("Circle");
    });

    it("sets circle to normal display if passed true", async () => {
        testCircle.setVisible(true);
        let visibleTest = [testCircle._frontPart.visible, testCircle._backPart.visible, testCircle._frontFill.visible, testCircle._backFill.visible, testCircle._glowingBackPart.visible, testCircle._glowingFrontPart.visible];
        let altCircle = new Circle();
        testCircle.normalDisplay();
        let visibleCompare = [testCircle._frontPart.visible, testCircle._backPart.visible, testCircle._frontFill.visible, testCircle._backFill.visible, testCircle._glowingBackPart.visible, testCircle._glowingFrontPart.visible];
        expect(visibleTest).toEqual(visibleCompare);
    });

    it("sets all components invisible if passed false", async () => {
        testCircle.setVisible(false);
        expect(testCircle._frontPart.visible).toBe(false);
        expect(testCircle._backPart.visible).toBe(false);
        expect(testCircle._frontFill.visible).toBe(false);
        expect(testCircle._backFill.visible).toBe(false);
        expect(testCircle._glowingBackPart.visible).toBe(false);
        expect(testCircle._glowingFrontPart.visible).toBe(false);
    });
});

describe("Circle: addToLayers properly arranges parts to correct layers", () => {
    let testCircle: any;
    beforeEach(() => {
        testCircle = new Circle("Circle");
    });
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("adds all Circle parts to the correct layer indices", async () => {
        // Creates a generic array, fills in target indices with mocks listening for proper arguments.
        const addMocks = [vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn()];
        const testLayer = Array(12).fill({});

        testLayer[LAYER.foregroundFills] = { add: addMocks[0] };
        testLayer[LAYER.foreground] = { add: addMocks[1] };
        testLayer[LAYER.foregroundGlowing] = { add: addMocks[2] };
        testLayer[LAYER.backgroundFills] = { add: addMocks[3] };
        testLayer[LAYER.background] = { add: addMocks[4] };
        testLayer[LAYER.backgroundGlowing] = { add: addMocks[5] };

        testCircle.addToLayers(testLayer);

        expect(addMocks[0]).toHaveBeenCalledWith(testCircle._frontFill);
        expect(addMocks[1]).toHaveBeenCalledWith(testCircle._frontPart);
        expect(addMocks[2]).toHaveBeenCalledWith(testCircle._glowingFrontPart);
        expect(addMocks[3]).toHaveBeenCalledWith(testCircle._backFill);
        expect(addMocks[4]).toHaveBeenCalledWith(testCircle._backPart);
        expect(addMocks[5]).toHaveBeenCalledWith(testCircle._glowingBackPart);
    });
});
/* TODO: Possible fix in Circle.ts:887-894 to match other plottables?
describe("Circle: removeFromLayers properly removes parts from all layers", () => {
    let testCircle: any;
    beforeEach(() => {
        testCircle = new Circle("Circle");
    });
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("removes all Circle parts", async () => {
        // Creates a generic array, fills in target indices with mocks listening for proper arguments.
        const removeMocks = [vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn()];
        const testLayer = Array(12).fill({});

        testLayer[LAYER.foregroundFills] = { remove: removeMocks[0] };
        testLayer[LAYER.foreground] = { remove: removeMocks[1] };
        testLayer[LAYER.foregroundGlowing] = { remove: removeMocks[2] };
        testLayer[LAYER.backgroundFills] = { remove: removeMocks[3] };
        testLayer[LAYER.background] = { remove: removeMocks[4] };
        testLayer[LAYER.backgroundGlowing] = { remove: removeMocks[5] };

        testCircle.removeFromLayers(testLayer);

        expect(removeMocks[0]).toHaveBeenCalledWith(testCircle._frontFill);
        expect(removeMocks[1]).toHaveBeenCalledWith(testCircle._frontPart);
        expect(removeMocks[2]).toHaveBeenCalledWith(testCircle._glowingFrontPart);
        expect(removeMocks[3]).toHaveBeenCalledWith(testCircle._backFill);
        expect(removeMocks[4]).toHaveBeenCalledWith(testCircle._backPart);
        expect(removeMocks[5]).toHaveBeenCalledWith(testCircle._glowingBackPart);
    });
});*/

describe("Circle: toSVG returns proper types", () => {
    let testCircle: any;
    beforeEach(() => {
        testCircle = new Circle("Circle");
    });

    it("returns an array", async () => {
        expect(Array.isArray(testCircle.toSVG())).toBe(true);
    });
});

describe("Circle: adjustSize properly adjusts stroke width", () => {
    let testCircle: any;
    beforeEach(() => {
        testCircle = new Circle("Circle");
    });

    it("correctly sets linewidths of all Circle parts", async () => {
        testCircle.adjustSize();
        expect(testCircle._frontPart.linewidth).toBe(Circle.currentCircleStrokeWidthFront * (testCircle.styleOptions.get(StyleCategory.Front)?.strokeWidthPercent ?? 100) / 100);
        expect(testCircle._backPart.linewidth).toBe((Circle.currentCircleStrokeWidthBack * (testCircle.styleOptions.get(StyleCategory.Back)?.dynamicBackStyle ? Nodule.contrastStrokeWidthPercent(testCircle.styleOptions.get(StyleCategory.Front)?.strokeWidthPercent ?? 100) : (testCircle.styleOptions.get(StyleCategory.Back)?.strokeWidthPercent ?? 100))) / 100);
        expect(testCircle._glowingFrontPart.linewidth).toBe(Circle.currentGlowingCircleStrokeWidthFront * (testCircle.styleOptions.get(StyleCategory.Front)?.strokeWidthPercent ?? 100) / 100);
        expect(testCircle._glowingBackPart.linewidth).toBe((Circle.currentGlowingCircleStrokeWidthBack * (testCircle.styleOptions.get(StyleCategory.Back)?.dynamicBackStyle ? Nodule.contrastStrokeWidthPercent(testCircle.styleOptions.get(StyleCategory.Front)?.strokeWidthPercent ?? 100) : (testCircle.styleOptions.get(StyleCategory.Back)?.strokeWidthPercent ?? 100))) / 100);
    });
});
/* TODO
describe("Circle: stylize sets proper style", () => {
    beforeEach(() => {

    });
    afterEach(() => {

    });
});
*/