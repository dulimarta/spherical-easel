import { Mesh, Scene, Vector3 } from "three";
import { PoseTracker } from "./PoseTracker";
import * as THREE from "three/webgpu";
import {
  createBoundaryCone,
  createIdealPointTube
} from "@/plottables-hyperbolic/MeshFactory";
import { CustomPointMaterial } from "@/plottables-hyperbolic/MaterialFactory";
import { HEPoint } from "@/models-hyperbolic/HEPoint";
import { CommandGroup } from "@/commands-spherical/CommandGroup";
import { SetPointUserCreatedValueCommand } from "@/commands-hyperbolic/SetPointUserCreatedValueCommand";
import { HEOneOrTwoDimensional } from "@/types";
import { HEAntipodalPoint } from "@/models-hyperbolic/HEAntipodalPoint";
import { HEIntersectionPoint } from "@/models-hyperbolic/HEIntersectionPoint";
import { AddPointCommand } from "@/commands-hyperbolic/AddPointCommand";
import { HELabel } from "@/models-hyperbolic/HELabel";
import { PointSelectionHandler } from "./PointSelectionHandler";
import SETTINGS from "@/global-settings-hyperbolic";
import EventBus from "@/eventHandlers-spherical/EventBus";

export class PointHandler extends PointSelectionHandler {
  constructor(scene: Scene) {
    super(scene, 1);
    this.scene = scene;
  }

  mousePressed(event: MouseEvent): void {
    super.mousePressed(event);
  }
  mouseMoved(event: MouseEvent): void {
    super.mouseMoved(event);
  }

  mouseReleased(event: MouseEvent): void {
    super.mouseReleased(event);

    if (this.aSurfaceIsIntersected && this._allPointsSelected) {
      const selectedPoint = this._selectedPoints[0].HEPoint;
      if (selectedPoint) {
        if (
          (selectedPoint instanceof HEAntipodalPoint ||
            selectedPoint instanceof HEIntersectionPoint) &&
          !selectedPoint.isUserCreated
        ) {
          new SetPointUserCreatedValueCommand(
            selectedPoint as HEIntersectionPoint | HEAntipodalPoint,
            true
          ).execute();
          super.prepareForNextPointSelections();
          return;
        }
        EventBus.fire("show-alert", {
          key: `handlers.pointCreationAttemptDuplicate`,
          keyOptions: {},
          type: "error"
        });
      } else if (this._selectedPoints[0].oneOrTwoDimParent) {
        // create point on this._selectedPoints[0].oneOrTwoDimParent
        // not implemented yet
      } else {
        // Released over empty location
        const pointCommandGroup = new CommandGroup();
        // create a new Point
        let vtx: /*HEPointOnOneOrTwoDimensional |*/ HEPoint | null = null;
        let newHELabel: HELabel | null = null;
        // mouse press on empty location so create a free point
        // Create the model object for the new point and link them
        // this over either the ideal point's strip or the hyperboloid

        const releaseLocation =
          this._selectedPoints[this._N - 1].locationVector;
        vtx = new HEPoint(releaseLocation);
        newHELabel = new HELabel("point", vtx, releaseLocation, vtx.name);
        vtx.setLabel(newHELabel);

        if (vtx && newHELabel) {
          pointCommandGroup.addCommand(new AddPointCommand(vtx, newHELabel));
          // Create the antipode of the new point, vtx
          PointHandler.addCreateAntipodeCommand(
            vtx as HEPoint,
            pointCommandGroup
          );
        }
        pointCommandGroup.execute();
      }
      super.prepareForNextPointSelections();
    }
  }

  mouseLeave(event: MouseEvent): void {
    super.mouseLeave(event);
  }

  activate(): void {
    super.activate();
  }
  deactivate(): void {
    super.deactivate();
  }
}
