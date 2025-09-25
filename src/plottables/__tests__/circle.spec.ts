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
/* TODO
describe("Circle: updateDisplay properly updates TwoJS objects", () => {
    beforeEach(() => {

    });
    afterEach(() => {

    });
});
*/
describe("Circle: centerVector getter and setter properly read and update circle center vector", () => {
    let testCircle: any;
    beforeEach(() => {
        testCircle = new Circle();
    });

    it("gets a vector type object", async () => {
        expectTypeOf(testCircle.centerVector).toEqualTypeOf({ a: Vector3 });
    });

    it("sets the center vector to a valid vector type object", async () => {
        testCircle.centerVector = new Vector3(1, 1, 1);
        expectTypeOf(testCircle.centerVector).toEqualTypeOf({ a: Vector3 });
    });

    /*it("allows vector points on the unit sphere", async () => {
        
    });

    it("rejects vector points not on the unit sphere", async () => {
        
    });*/ // A comment appears in the code that this should be, but I didn't find actual implementation to check?
});

describe("Circle: circleRadius getter and setter properly read and update circle radius", () => {
    let testCircle: any;
    beforeEach(() => {
        testCircle = new Circle();
    });

    it("gets a valid number", async () => {
        expectTypeOf(testCircle.circleRadius).toBeNumber();
    });

    it("sets the circleRadius to a valid number", async () => {
        testCircle.circleRadius = 12;
        expectTypeOf(testCircle.circleRadius).toBeNumber();
    });
});

describe("Circle: setVisible sets circle visible or not", () => {
    let testCircle: any;
    beforeEach(() => {
        testCircle = new Circle();
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
/* TODO
describe("Circle: addToLayers properly arranges parts to correct layers", () => {
    let testCircle: any;
    let testLayer: any;
    beforeEach(() => {
        testCircle = new Circle();
        testLayer = new Group();
    });

    it("adds all Circle parts to the correct layer indices", async () => {
        testCircle.addToLayers(testLayer);
        expect(testLayer[LAYER.foregroundFills]).toBe(testCircle._frontFill);
        expect(testLayer[LAYER.foreground]).toBe(testCircle._frontPart);
        expect(testLayer[LAYER.foregroundGlowing]).toBe(testCircle._glowingFrontPart);
        expect(testLayer[LAYER.backgroundFills]).toBe(testCircle._backFill);
        expect(testLayer[LAYER.background]).toBe(testCircle._backPart);
        expect(testLayer[LAYER.backgroundGlowing]).toBe(testCircle._glowingBackPart);
    });

});
*//* TODO
describe("Circle: removeFromLayers properly removes parts from all layers", () => {
    beforeEach(() => {

    });
    afterEach(() => {

    });
});
*//* TODO, doesn't recognize adjustSize()
describe("Circle: adjustSize properly adjusts stroke width", () => {
    let testCircle: any;
    beforeEach(() => {
        testCircle = new Circle();
    });
    
    testCircle.adjustSize();
    expect(testCircle._frontPart.linewidth).toBe(Circle.currentCircleStrokeWidthFront * (testCircle.styleOptions.get(StyleCategory.Front)?.strokeWidthPercent ?? 100) / 100);
    expect(testCircle._backPart.linewidth).toBe((Circle.currentCircleStrokeWidthBack * (testCircle.styleOptions.get(StyleCategory.Back)?.dynamicBackStyle ? Nodule.contrastStrokeWidthPercent(testCircle.styleOptions.get(StyleCategory.Front)?.strokeWidthPercent ?? 100) : (testCircle.styleOptions.get(StyleCategory.Back)?.strokeWidthPercent ?? 100))) / 100);
    expect(testCircle._glowingFrontPart.linewidth).toBe(Circle.currentGlowingCircleStrokeWidthFront * (testCircle.styleOptions.get(StyleCategory.Front)?.strokeWidthPercent ?? 100) / 100);
    expect(testCircle._glowingBackPart.linewidth).toBe((Circle.currentGlowingCircleStrokeWidthBack * (testCircle.styleOptions.get(StyleCategory.Back)?.dynamicBackStyle ? Nodule.contrastStrokeWidthPercent(testCircle.styleOptions.get(StyleCategory.Front)?.strokeWidthPercent ?? 100) : (testCircle.styleOptions.get(StyleCategory.Back)?.strokeWidthPercent ?? 100))) / 100);
});
*//* TODO
describe("Circle: stylize sets proper style", () => {
    beforeEach(() => {

    });
    afterEach(() => {

    });
});
*/