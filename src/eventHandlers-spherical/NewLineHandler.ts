import {
  AxesHelper,
  Matrix4,
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
import { a } from "node_modules/vitest/dist/chunks/suite.d.udJtyAgw";

const X_AXIS = new Vector3(1, 0, 0);
const Y_AXIS = new Vector3(0, 1, 0);
const Z_AXIS = new Vector3(0, 1, 0);
// Two ways to create a line: 1) two distinct mouse down events or 2) click-drag-release
export class LineHandler extends MultiPointSelectionHandler {
  private kbEventHandler!: () => void;
  private cuttingPlaneNormal = new Vector3(0, 0, 0);
  private rotationAxis = new Vector3();
  private tmpMatrix = new Matrix4();
  private xHolder = new Vector3();
  private yHolder = new Vector3();
  private zHolder = new Vector3();
  private previewPoints = [
    new Mesh(
      new SphereGeometry(0.01, 32, 32),
      new MeshStandardMaterial({ color: 0xff0000 })
    ),
    new Mesh(
      new SphereGeometry(0.01, 32, 32),
      new MeshStandardMaterial({ color: 0x00ff00 })
    ),
    new Mesh(
      new SphereGeometry(0.02, 32, 32),
      new MeshStandardMaterial({ color: 0xffffff })
    )
  ];
  private previewLine = new Mesh(
    new TorusGeometry(1, 0.006, 16, 120),
    new MeshStandardMaterial({ color: 0x0000ff })
  );
  private currentPreviewPointIndex = 0;
  private lastZRotation = 0;

  constructor(
    scene: Scene,
    private infiniteLine = true
  ) {
    super(scene, 2);
    this.previewLine.add(new AxesHelper(1.5));
  }

  activate(): void {
    super.activate();
    console.debug("LineHandler::activate");
    this.previewPoints.forEach(point => {
      this.scene.add(point);
    });
    this.previewLine.visible = false;
    this.previewLine.matrixAutoUpdate = false;
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
        this.previewPoints[2].visible = true;
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
    if (isNaN(position.x)) return;
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
      this.cuttingPlaneNormal.crossVectors(start, end).normalize();
      if (!this.infiniteLine) {
        // Extra work needed for a line segment. We have to lineup the the arc
        // The arc (portion of the torus) is drawn CCW on the XY-plane starting
        // at (1,0,0)
        const arcLength = start.angleTo(end);
        this.previewLine.geometry.dispose();
        this.previewLine.geometry = new TorusGeometry(
          1,
          0.01,
          12,
          120,
          arcLength
        );
        this.previewLine.matrix.identity(); // reset its internal coordinate frame
        // Rotate the torus X-axis to the start point
        this.rotationAxis.crossVectors(X_AXIS, start).normalize();
        const angle1 = X_AXIS.angleTo(start);
        this.tmpMatrix.makeRotationAxis(this.rotationAxis, angle1);
        this.previewLine.matrix.multiply(this.tmpMatrix);

        // Extract the new Z-axis of the torus
        this.previewLine.matrix.extractBasis(
          this.xHolder,
          this.yHolder,
          this.zHolder
        );
        // Rotate on the X-axis to lineup the Z-axis of the torus
        // with the normal of the cutting plane
        const angle2 = this.zHolder.angleTo(this.cuttingPlaneNormal);
        this.yHolder.crossVectors(this.zHolder, this.cuttingPlaneNormal);
        this.tmpMatrix.makeRotationX(angle2 * Math.sign(this.yHolder.x));
        this.previewLine.matrix.multiply(this.tmpMatrix);
      } else this.previewLine.lookAt(this.cuttingPlaneNormal);
    }
  }
}
