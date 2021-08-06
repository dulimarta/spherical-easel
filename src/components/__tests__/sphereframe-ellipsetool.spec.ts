import Vue from "*.vue";
import SphereFrame from "@/components/SphereFrame.vue";
import { createWrapper } from "@/../tests/vue-helper";
import { SEStore } from "@/store";
import { Wrapper } from "@vue/test-utils";
import { drawEllipse } from "./sphereframe-helper";

describe("SphereFrame: Ellipse Tool", () => {
  let wrapper: Wrapper<Vue>;
  beforeEach(async () => {
    wrapper = createWrapper(SphereFrame);
  });
  async function runEllipseTest(
    isFocus1Foreground: boolean,
    isFocus2Foreground: boolean,
    isPoint3Foreground: boolean
  ): Promise<void> {
    const prevEllipseCount = SEStore.seEllipses.length;
    await drawEllipse(
      wrapper,
      101,
      87,
      isFocus1Foreground,
      200,
      113,
      isFocus2Foreground,
      150,
      190,
      isPoint3Foreground
    );
    expect(SEStore.seEllipses.length).toEqual(prevEllipseCount + 1);
  }

  it("adds a new ellipse while in EllipseTool", async () => {
    for (const focal1 of [true, false])
      for (const focal2 of [true, false])
        for (const boundaryPt of [true, false]) {
          SEStore.init();
          await runEllipseTest(focal1, focal2, boundaryPt);
        }
  });
});
