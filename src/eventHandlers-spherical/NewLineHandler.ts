import {
  ArrowHelper,
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
import { AddLineOrSegmentKommand } from "@/commands/AddLineKommand";
import { CKSegment } from "@/models/CKSegment";

const X_AXIS = new Vector3(1, 0, 0);
// Two ways to create a line: 1) two distinct mouse down events or 2) click-drag-release
export class LineHandler extends MultiPointSelectionHandler {
  private kbEventHandler!: () => void;

  private previousPlaneNormal: Vector3 | null = null;
  private currentPlaneNormal = new Vector3();
  private tempPlaneNormal = new Vector3();
  private rotationAxis = new Vector3();
  private tmpMatrix = new Matrix4();
  private xHolder = new Vector3();
  private yHolder = new Vector3();
  private zHolder = new Vector3();
  private longerThanPi = false;
  private normalIsLocked = false;
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
  // private arrow1 = new ArrowHelper(
  //   new Vector3(1, 0, 0),
  //   new Vector3(0, 0, 0),
  //   1.2,
  //   0x000000
  // );
  // private arrow2 = new ArrowHelper(
  //   new Vector3(1, 0, 0),
  //   new Vector3(0, 0, 0),
  //   1.2,
  //   0x777777
  // );
  // private arrow3 = new ArrowHelper(
  //   new Vector3(1, 0, 0),
  //   new Vector3(0, 0, 0),
  //   1.2,
  //   0xff0000
  // );
  constructor(
    scene: Scene,
    private infiniteLine = true
  ) {
    super(scene, 2);
    // this.previewLine.add(new AxesHelper(1.5));
    this.previewLine.matrixAutoUpdate = this.infiniteLine;
  }

  activate(): void {
    super.activate();
    console.debug("LineHandler::activate");
    this.previewPoints.forEach(point => {
      this.scene.add(point);
      point.visible = false;
    });
    this.previewLine.visible = false;
    // Disable matrix auto update when drawing line segments
    this.scene.add(this.previewLine);
    this.kbEventHandler = onKeyDown("Escape", () => {
      console.debug("LineHandler::Escape key pressed");
      this.currentPreviewPointIndex = 0;
      this.previewPoints[1].visible = false;
      this.previewLine.visible = false;
      // this.arrow2.visible = false;
      this.previousPlaneNormal = null;
    });
    // this.scene.add(this.arrow1);
    // this.scene.add(this.arrow2);
    // this.scene.add(this.arrow3);
    // this.arrow2.visible = false;
    // this.arrow3.visible = false;
  }

  deactivate(): void {
    super.deactivate();
    console.debug("LineHandler::deactivate");
    this.previewPoints.forEach(point => {
      this.scene.remove(point);
    });
    this.scene.remove(this.previewLine);
    this.kbEventHandler();
    // this.arrow1.removeFromParent();
    // this.arrow2.removeFromParent();
    // this.arrow3.removeFromParent();
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
        // this.arrow2.visible = true;
        this.currentPreviewPointIndex++;
        this.longerThanPi = false;
        break;
      case 1:
        // Create the line here
        const startPoint = new CKPoint(this.previewPoints[0].position);
        const endPoint = new CKPoint(this.previewPoints[1].position);
        const cmdGroup = new CommandGroup();
        cmdGroup.addCommand(new AddPointByObjectKommand(startPoint));
        cmdGroup.addCommand(new AddPointByObjectKommand(endPoint));
        let aLineOrSegment: CKLine | CKSegment;
        if (this.infiniteLine) {
          aLineOrSegment = new CKLine(
            this.previewPoints[0].position,
            this.previewPoints[1].position
          );
        } else {
          aLineOrSegment = new CKSegment(
            this.previewPoints[0].position,
            this.previewPoints[1].position,
            this.longerThanPi
          );
        }
        this.previewPoints[1].visible = false;
        this.previewLine.visible = false;
        cmdGroup.addCommand(
          new AddLineOrSegmentKommand(aLineOrSegment, startPoint, endPoint)
        );
        cmdGroup.execute();
        this.currentPreviewPointIndex = 0;
        this.previousPlaneNormal = null;
        // this.arrow2.visible = false;
        break;
    }
  }

  mouseMoved(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule>
  ): void {
    super.mouseMoved(event, position, hitObjects);
    if (isNaN(position.x)) return;
    this.previewPoints[this.currentPreviewPointIndex].position.copy(position);
    if (this.currentPreviewPointIndex === 1) {
      /**
       * To handle arcs longer than PI, we have to keep track of the previous plane normal and the current plane normal.
       * To avoid jitter, we take the exponential moving average of the previous plane normal and the current plane normal.
       *
       * When the arch length is close to PI, we lock the normal to the smoothed average and watch for a flip in the normal
       *
       * Four cases to consider:
       *
       * NormalLocked | LongerThanPi | Action
       *     No       |      No      |  Update the plane normal to the current plane normal
       *    Yes       |      No      |  Don't update the smoothed normal, don't use current normal, computer temporary normal and check for a flip.
       *                                If a flip is detected, set LongerThanPi to true and unlock the normal
       *     Yes      |      Yes     |  Don't update the smoothed normal, adjust the arch length to 2*PI - arch length
       *   No       |      Yes     |  Update the plane normal to the current plane normal, adjust the arch length to 2*PI - arch length
       *
       */
      const start = this.previewPoints[0].position;
      const end = this.previewPoints[1].position;

      let arcLength = start.angleTo(end);
      if (!this.infiniteLine) {
        this.normalIsLocked = Math.abs(arcLength.toDegrees() - 180) < 10;
        // this.arrow3.visible = this.normalIsLocked;
        this.currentPlaneNormal.crossVectors(start, end).normalize();
        if (this.longerThanPi) {
          this.currentPlaneNormal.multiplyScalar(-1);
        }
        if (!this.previousPlaneNormal) {
          this.previousPlaneNormal = new Vector3();
          this.previousPlaneNormal.copy(this.currentPlaneNormal);
        }
        if (!this.normalIsLocked) {
          this.previousPlaneNormal
            .multiplyScalar(0.85)
            .addScaledVector(this.currentPlaneNormal, 0.15)
            .normalize();
        } else {
          this.tempPlaneNormal.crossVectors(start, end).normalize();
          this.currentPlaneNormal.copy(this.previousPlaneNormal);
          // this.arrow3.setDirection(this.tempPlaneNormal);
          const normalFlip = this.previousPlaneNormal.dot(this.tempPlaneNormal);
          this.longerThanPi = normalFlip < 0;
        }
        if (this.longerThanPi) arcLength = 2 * Math.PI - arcLength;

        // console.debug(
        //   `Arc length ${this.longerThanPi ? "Longer than PI" : ""} ${arcLength.toDegrees().toFixed(2)} degrees`
        // );
        // this.arrow1.setDirection(this.currentPlaneNormal);
        // this.arrow2.setDirection(this.previousPlaneNormal);
        this.previewLine.geometry.dispose();
        this.previewLine.geometry = new TorusGeometry(
          1,
          0.01,
          12,
          120,
          arcLength
        );
        // Extra work needed for a line segment. We have to lineup the the arc
        // The arc (portion of the torus) is drawn CCW on the XY-plane starting
        // at (1,0,0)
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
        const angle2 = this.zHolder.angleTo(this.currentPlaneNormal);
        this.yHolder.crossVectors(this.zHolder, this.currentPlaneNormal);
        this.tmpMatrix.makeRotationX(angle2 * Math.sign(this.yHolder.x));
        this.previewLine.matrix.multiply(this.tmpMatrix);
      } else {
        this.currentPlaneNormal.crossVectors(start, end).normalize();
        this.previewLine.lookAt(this.currentPlaneNormal);
      }
    }
  }
}
