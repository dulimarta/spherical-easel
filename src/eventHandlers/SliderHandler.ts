import Two from "two.js";
import MouseHandler from "./MouseHandler";
import EventBus from "./EventBus";
import { SESlider } from "@/models/SESlider";
import { AddMeasurementCommand } from "@/commands/AddMeasurementCommand";
import AppStore from "@/store";
export default class SliderHandler extends MouseHandler {
  readonly store = AppStore;
  constructor(layers: Two.Group[]) {
    super(layers);
  }

  // mouseMoved(event: MouseEvent): void {
  // super.mouseMoved(event);
  // console.debug(this.currentSphereVector);
  // }
  mousePressed(event: MouseEvent): void {
    // No code yet
  }

  mouseReleased(event: MouseEvent): void {
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

  createSlider(sliderParams: any): void {
    console.debug(sliderParams, "at", this.currentSphereVector.toFixed(3));

    const slider = new SESlider(sliderParams);
    new AddMeasurementCommand(slider, []).execute();
  }
}
