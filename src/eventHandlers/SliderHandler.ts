import Two from "two.js";
import MouseHandler from "./MouseHandler";
import EventBus from "./EventBus";
import { SESlider } from "@/models/SESlider";
import { AddSliderMeasurementCommand } from "@/commands/AddSliderMeasurementCommand";
import AppStore from "@/store";
import SETTINGS from "@/global-settings";

export default class SliderHandler extends MouseHandler {
  readonly store = AppStore;
  constructor(layers: Two.Group[]) {
    super(layers);
  }

  // mouseMoved(event: MouseEvent): void {
  // super.mouseMoved(event);
  // console.debug(this.currentSphereVector);
  // }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mousePressed(_event: MouseEvent): void {
    // No code yet
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mouseReleased(_event: MouseEvent): void {
    // TODO: this event has not listener
    if (this.isOnSphere) EventBus.fire("new-slider-requested", {});
  }

  activate(): void {
    super.activate();
    EventBus.listen("new-slider-confirmed", this.createSlider.bind(this));
  }

  deactivate(): void {
    super.deactivate();
    EventBus.unlisten("new-slider-confirmed");
  }

  createSlider(sliderParams: {
    min: number;
    max: number;
    step: number;
    value: number;
  }): void {
    console.debug(
      sliderParams,
      "at",
      this.currentSphereVector.toFixed(SETTINGS.decimalPrecision)
    );

    const slider = new SESlider(sliderParams);
    new AddSliderMeasurementCommand(slider).execute();
  }
}
