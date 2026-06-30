import {
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type Scene
} from "three/webgpu";
import { MultiPointSelectionHandler } from "./MultiPointSelectionHandler";
import type { CKNodule } from "@/models/CKNodule";
import { onKeyDown } from "@vueuse/core";
import { CKLine } from "@/models/CKLine";
import { CKPoint } from "@/models/CKPoint";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointByObjectKommand } from "@/commands/AddPointKommand";
import { AddLineKommand } from "@/commands/AddLineKommand";

// Two ways to create a line: 1) two distinct mouse down events or 2) click-drag-release
export class LineHandler extends MultiPointSelectionHandler {
  private kbEventHandler!: () => void;
  private torusLookAtDirection = new Vector3(0, 0, 0);
  private previewPoints = [
    new Mesh(
      new SphereGeometry(0.01, 32, 32),
      new MeshStandardMaterial({ color: 0xff0000 })
    ),
    new Mesh(
      new SphereGeometry(0.01, 32, 32),
      new MeshStandardMaterial({ color: 0x00ff00 })
    )
  ];
  private previewLine = new Mesh(
    new TorusGeometry(1, 0.006, 16, 100),
    new MeshStandardMaterial({ color: 0x0000ff })
  );
  private currentPreviewPointIndex = 0;
  constructor(scene: Scene) {
    super(scene, 2);
  }

  activate(): void {
    super.activate();
    console.debug("LineHandler::activate");
    this.previewPoints.forEach(point => {
      this.scene.add(point);
    });
    this.previewLine.visible = false;
    this.scene.add(this.previewLine);
    this.kbEventHandler = onKeyDown("Escape", () => {
      console.debug("LineHandler::Escape key pressed");
      this.currentPreviewPointIndex = 0;
      this.previewPoints[1].visible = false;
      this.previewLine.visible = false;
    });
  }

  deactivate(): void {
    super.deactivate();
    console.debug("LineHandler::deactivate");
    this.previewPoints.forEach(point => {
      this.scene.remove(point);
    });
    this.scene.remove(this.previewLine);
    this.kbEventHandler();
  }

  mousePressed(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule>
  ): void {
    super.mousePressed(event, position, hitObjects);
    // console.debug(
    //   "LineHandler::mousePressed",
    //   position,
    //   "index",
    //   this.currentPreviewPointIndex
    // );
    switch (this.currentPreviewPointIndex) {
      case 0:
        this.previewPoints[1].position.copy(position);
        this.previewPoints[1].visible = true;
        this.previewLine.visible = true;
        this.currentPreviewPointIndex++;
        break;
      case 1:
        // Create the line here
        const aLine = new CKLine(
          this.previewPoints[0].position,
          this.previewPoints[1].position
        );
        const startPoint = new CKPoint(this.previewPoints[0].position);
        const endPoint = new CKPoint(this.previewPoints[1].position);
        const lineCmdGroup = new CommandGroup();
        lineCmdGroup.addCommand(new AddPointByObjectKommand(startPoint));
        lineCmdGroup.addCommand(new AddPointByObjectKommand(endPoint));
        lineCmdGroup.addCommand(
          new AddLineKommand(aLine, startPoint, endPoint)
        );
        lineCmdGroup.execute();
        this.previewPoints[1].visible = false;
        this.previewLine.visible = false;
        this.currentPreviewPointIndex = 0;
        break;
    }

    // switch (this.currentSelectedPoints.length) {
    //   case 0:
    //     this.startPosition.copy(position);
    //   case 1:
    //     // Do nothing, wait for the second point
    //     break;
    // }
    // if (this.currentSelectedPoints.length === 2) {
    //   console.debug(
    //     "LineHandler::mousePressed - two points selected, create line"
    //   );
    // }
  }

  mouseMoved(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule>
  ): void {
    super.mouseMoved(event, position, hitObjects);
    // console.debug(
    //   "LineHandler::mouseMoved",
    //   position,
    //   "index",
    //   this.currentPreviewPointIndex
    // );
    this.previewPoints[this.currentPreviewPointIndex].position.copy(position);
    if (this.currentPreviewPointIndex === 1) {
      const start = this.previewPoints[0].position;
      const end = this.previewPoints[1].position;
      this.torusLookAtDirection.crossVectors(start, end).normalize();
      console.debug(
        "LineHandler::mouseMoved - lookAtDirection",
        this.torusLookAtDirection.toFixed(3)
      );
      this.previewLine.lookAt(this.torusLookAtDirection);
    }
  }
}
