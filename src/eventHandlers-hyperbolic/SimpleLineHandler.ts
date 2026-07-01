import { CKNodule } from "@/models/CKNodule";
import {
  DoubleSide,
  Mesh,
  MeshStandardNodeMaterial,
  PlaneGeometry,
  type Scene,
  SphereGeometry,
  Vector3,
  MeshStandardMaterial
} from "three/webgpu";
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";
import { CKLine } from "@/models/CKLine";
import { CKPoint } from "@/models/CKPoint";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointByObjectKommand } from "@/commands/AddPointKommand";
import { AddLineKommand } from "@/commands/AddLineKommand";
import { PoseTracker } from "./PoseTracker";
export class SimpleLineHandler extends PoseTracker {
  private previewPoints = [
    new Mesh(
      new SphereGeometry(0.05, 32, 32),
      new MeshStandardMaterial({ color: 0xff0000 })
    ),
    new Mesh(
      new SphereGeometry(0.05, 32, 32),
      new MeshStandardMaterial({
        color: 0x00ff00
      })
    )
  ];

  private previewLine = new Mesh(
    new PlaneGeometry(10, 10, 20, 20),
    new MeshStandardMaterial({
      color: 0xffff00,
      roughness: 0.5,
      metalness: 0.5,
      transparent: true,
      opacity: 0.5,
      side: DoubleSide
    })
  );
  private planeDirection = new Vector3(0, 0, 1);
  private currentPreviewPointIndex = 0;
  constructor(scene: Scene) {
    super(scene);
  }

  activate(): void {
    super.activate();
    console.debug("SimpleLineHandler::activate");
    this.previewPoints.forEach(point => {
      this.scene.add(point);
    });
    this.scene.add(this.previewLine);
    this.previewLine.visible = false;
  }

  deactivate(): void {
    super.deactivate();
    console.debug("SimpleLineHandler::deactivate");
    this.previewPoints.forEach(point => {
      this.scene.remove(point);
    });
    this.previewLine.removeFromParent();
    this.previewLine.visible = false;
  }

  mousePressed(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule | string>
  ): void {
    super.mousePressed(event, position, hitObjects);
    console.debug(
      "SimpleLineHandler::mousePressed",
      position,
      "index",
      this.currentPreviewPointIndex
    );
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
    hitObjects: Array<CKNodule | string>
  ): void {
    super.mouseMoved(event, position, hitObjects);
    console.debug(
      "SimpleLineHandler::mouseMoved",
      position,
      "index",
      this.currentPreviewPointIndex
    );
    this.previewPoints[this.currentPreviewPointIndex].position.copy(position);
    if (this.currentPreviewPointIndex === 1) {
      const start = this.previewPoints[0].position;
      const end = this.previewPoints[1].position;
      this.planeDirection.crossVectors(start, end).normalize();
      console.debug(
        "SimpleLineHandler::mouseMoved - lookAtDirection",
        this.planeDirection.toFixed(3)
      );
      this.previewLine.lookAt(this.planeDirection);
    }
  }
}
