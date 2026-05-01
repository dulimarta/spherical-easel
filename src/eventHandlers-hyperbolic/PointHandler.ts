import { Scene } from "three";
import { CommandGroup } from "@/commands-spherical/CommandGroup";
import { HEAntipodalPoint } from "@/models-hyperbolic/HEAntipodalPoint";
import { HEIntersectionPoint } from "@/models-hyperbolic/HEIntersectionPoint";
import { PointSelectionHandler } from "./PointSelectionHandler";
import EventBus from "@/eventHandlers-spherical/EventBus";

export class PointHandler extends PointSelectionHandler {
  constructor(scene: Scene) {
    super(scene, 1);
    this.scene = scene;
  }

  mouseReleased(event: MouseEvent): void {
    super.mouseReleased(event);
    if (this.aSurfaceIsIntersected && this._allPointsSelected) {
      const selectedPoint = this._selectedPoints[0].HEPoint;
      if (selectedPoint) {
        if (
          !(
            (selectedPoint instanceof HEAntipodalPoint ||
              selectedPoint instanceof HEIntersectionPoint) &&
            !selectedPoint.isUserCreated
          )
        ) {
          EventBus.fire("show-alert", {
            key: `handlers.pointCreationAttemptDuplicate`,
            keyOptions: {},
            type: "error"
          });
          this.prepareForNextPointSelections(event);
          return;
        }
      }
      this.makePoint();
      this.prepareForNextPointSelections(event);
    }
  }

  makePoint(): void {
    const pointCommandGroup = new CommandGroup();
    this.createNewPointsAsNeeded(pointCommandGroup, []); // empty new points array because there are no intersections
    pointCommandGroup.execute();
  }
}
