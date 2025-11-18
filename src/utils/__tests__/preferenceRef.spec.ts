import { PreferenceRef } from "@/utils/preferenceRef";

describe("Singleton instance initializes properly", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should create an instance of the singleton if easel precision has been called", async () => {
    let testVar = PreferenceRef.instance.easelDecimalPrecision;
    expect(PreferenceRef.instance).not.toBeNull();
  });

  it("should create an instance of the singleton if hierarchy precision has been called", async () => {
    let testVar = PreferenceRef.instance.hierarchyDecimalPrecision;
    expect(PreferenceRef.instance).not.toBeNull();
  });
});

describe("Singleton attributes get assigned properly", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should give decimal precision attributes a number value if initialized", async () => {
    expectTypeOf(PreferenceRef.instance.easelDecimalPrecision).toBeNumber();
    expectTypeOf(PreferenceRef.instance.hierarchyDecimalPrecision).toBeNumber();
  });

  it("assign the values from given object", async () => {
    PreferenceRef.update({ easelDecimalPrecision: 4, hierarchyDecimalPrecision: 5 })
    expect(PreferenceRef.instance.easelDecimalPrecision).toBe(4);
    expect(PreferenceRef.instance.hierarchyDecimalPrecision).toBe(5);
  });
});

describe("Singleton attributes update properly", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should update decimal precisions", async () => {
    PreferenceRef.update({ easelDecimalPrecision: 4, hierarchyDecimalPrecision: 5 })
    expect(PreferenceRef.instance.easelDecimalPrecision).toBe(4);
    expect(PreferenceRef.instance.hierarchyDecimalPrecision).toBe(5);

    PreferenceRef.update({ easelDecimalPrecision: 5, hierarchyDecimalPrecision: 4 })
    expect(PreferenceRef.instance.easelDecimalPrecision).toBe(5);
    expect(PreferenceRef.instance.hierarchyDecimalPrecision).toBe(4);
  });
});