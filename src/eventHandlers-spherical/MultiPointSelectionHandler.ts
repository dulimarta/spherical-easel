import type { Scene, Vector3 } from "three/webgpu";
import { MouseHandler } from "./NewMouseHandler";
import { CKNodule } from "@/models/CKNodule";
import { onKeyDown } from "@vueuse/core";
import { CKPoint } from "@/models/CKPoint";

// type PointInstance = {
//   point: CKPoint;
//   newInstance: boolean;
// };
export class MultiPointSelectionHandler extends MouseHandler {
  keyboardEventHandler!: () => void;
  protected currentSelectedPoints: Array<CKPoint | Vector3> = [];
  private selectedNameSet: Set<string> = new Set<string>();
  private maxPoints: number;
  constructor(scene: Scene, maxPoints: number) {
    super(scene);
    this.maxPoints = maxPoints;
  }

  override activate(): void {
    super.activate();
    // console.debug("MultiPointSelectionHandler::activate");
    this.keyboardEventHandler = onKeyDown("Escape", () => {
      // console.debug("MultiPointSelectionHandler::Escape key pressed");
      // Undo all the selections made so far when the Escape key is pressed.
      this.currentSelectedPoints
        .filter(p => p instanceof CKPoint)
        .forEach(hit => {
          hit.setHighlight(false);
        });
      this.currentSelectedPoints.splice(0);
      this.selectedNameSet.clear();
    });
  }

  override deactivate(): void {
    super.deactivate();
    this.keyboardEventHandler(); // stop listening for Escape key events
    // console.debug("MultiPointSelectionHandler::deactivate");
  }

  override mousePressed(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule>
  ): void {
    super.mousePressed(event, position, hitObjects);
    // console.debug("MultiPointSelectionHandler::mousePressed", position);
    if (isNaN(position.x)) {
      console.debug("Mouse pressed outside of sphere");
      return;
    }
    if (hitObjects.length === 0) {
      console.debug("Mouse pressed on sphere but no hit objects");
      this.currentSelectedPoints.push(position.clone());
      return;
    }
    const hitPoints = hitObjects.filter(z => z instanceof CKPoint);
    if (hitPoints.length === 0) {
      // console.debug("Mouse pressed on sphere but no hit points");
      return;
    }
    console.debug(
      "Hit points:",
      hitPoints.map(p => p.name)
    );
    if (this.currentSelectedPoints.length >= this.maxPoints) {
      console.debug(
        `Already selected ${this.maxPoints} points, cannot select more`
      );
      return;
    }
    if (this.selectedNameSet.has(hitPoints[0].name)) {
      console.debug(
        `Point ${hitPoints[0].name} already selected, cannot select again`
      );
      return;
    }
    this.selectedNameSet.add(hitPoints[0].name);
    this.currentSelectedPoints.push(hitPoints[0]);
  }
}
