import AngleMarker from "@/plottables/AngleMarker.ts";

describe("AngleMarker: angleMarker constructor generates a valid angleMarker plottable", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker("AngleMarker");
    });

    it("sets curved parts to Arc objects", async () => {

    });

    it("sets straight parts to Line objects", async () => {

    });

    it("creates 4 lists of 4 anchors each", async () => {

    });

    it("sets paths to Path objects", async () => {

    });

    it("sets fills to lists with NUMCIRCLEVERTICES+1 anchors", async () => {

    });

    it("properly sets style options", async () => {

    });
});

describe("AngleMarker: updateCurrentStrokeWidthAndRadiusForZoom properly updates all stroke widths", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("properly multiplies AngleMarker variables by the given factor", async () => {

    });
});

describe("AngleMarker: updateDisplay properly updates within parameters", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("sets the y components to 0", async () => {

    });

    it("properly updates display when angleMarker is on the front", async () => {

    });

    it("properly updates display when angleMarker is on the back", async () => {

    });
});

describe("AngleMarker: vertexVector getter and setter properly read and update angleMarker vertex vector", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("gets a vector type object", async () => {
        
    });

    it("sets the vertex vector to a valid vector type object", async () => {
        
    });
});

describe("AngleMarker: startVector getter and setter properly read and update angleMarker start vector", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("gets a vector type object", async () => {

    });

    it("sets the start vector to a valid vector type object", async () => {

    });
});

describe("AngleMarker: endVector getter and setter properly read and update angleMarker end vector", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("gets a vector type object", async () => {

    });

    it("sets the end vector to a valid vector type object", async () => {

    });
});

describe("AngleMarker: angleMarkerRadius getter properly reads the angleMarker radius", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("gets a number", async () => {

    });
});

describe("AngleMarker: angleMarkerValue setter properly updates the angleMarker value", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("sets angleMarkerValue to a valid number", async () => {

    });
});

describe("AngleMarker: setAngleMarkerFromThreeVectors", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });


});

describe("AngleMarker: frontGlowingDisplay properly sets visibility", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });
});

describe("AngleMarker: backGlowingDisplay properly sets visibility", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });
});

describe("AngleMarker: glowingDisplay calls both front and back display functions", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("calls frontGlowingDisplay and backGlowingDisplay", async () => {

    });
});

describe("AngleMarker: frontNormalDisplay properly sets visibility", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });
});

describe("AngleMarker: backNormalDisplay properly sets visibility", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });
});

describe("AngleMarker: normalDisplay calls both front and back display functions", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("calls frontNormalDisplay and backNormalDisplay", async () => {

    });
});

describe("AngleMarker: setVisible", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("sets all part visibilities to false if passed false", async () => {

    });

    it("calls normalDisplay if passed true", async () => {

    });
});

describe("AngleMarker: addToLayers", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("adds parts to the correct layers", async () => {

    });
});

describe("AngleMarker: removeFromLayers", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("removes all parts from their respective layers", async () => {

    });
});

describe("AngleMarker: toSVG", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("returns an array", async () => {
        
    });
});

describe("AngleMarker: angleMarkerRadiusPercent", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("returns a proper percent if frontStyle exists", async () => {

    });

    it("returns 100 if frontStyle doesn't exist", async () => {

    });
});

describe("AngleMarker: defaultStyleState", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("returns proper state based on panel type", async () => {

    });
});

describe("AngleMarker: adjustSize", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("correctly sets linewidths of all AngleMarker parts", async () => {
        
    });
});

describe("AngleMarker: stylize", () => {
    let testAngleMarker: any;
    beforeEach(() => {
        testAngleMarker = new AngleMarker();
    });

    it("correctly sets part visibility based on the passed style", async () => {

    });
});
