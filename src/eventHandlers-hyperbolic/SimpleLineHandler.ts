import { CKNodule } from "@/models/CKNodule";
import {
  AxesHelper,
  DoubleSide,
  Mesh,
  MeshStandardNodeMaterial,
  PlaneGeometry,
  type Scene,
  SphereGeometry,
  Vector3,
  MeshStandardMaterial,
  ArrowHelper,
  TubeGeometry,
  CylinderGeometry
} from "three/webgpu";
// import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";
import { CKLine } from "@/models/CKLine";
import { CKPoint } from "@/models/CKPoint";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointByObjectKommand } from "@/commands/AddPointKommand";
import { AddLineKommand } from "@/commands/AddLineKommand";
import { PoseTracker } from "./PoseTracker";
import { HyperbolicCurve } from "@/plottables-hyperbolic/HyperbolicCurve";
const Z_AXIS = new Vector3(0, 0, 1);
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
    ),
    new Mesh(
      new SphereGeometry(0.05, 32, 32),
      new MeshStandardMaterial({
        color: 0x00ffff
      })
    )
  ];

  private hyperbola = new HyperbolicCurve();
  private previewLine = new Mesh(
    new TubeGeometry(this.hyperbola),
    new MeshStandardMaterial({
      color: 0xffff00
      // roughness: 0.5,
      // metalness: 0.5,
      // transparent: true,
      // opacity: 0.5,
      // side: DoubleSide
    })
  );
  private previewChord = new Mesh(
    new CylinderGeometry(0.02, 0.02, 1, 32),
    new MeshStandardMaterial({
      color: 0xff00ff
      // roughness: 0.5,
      // metalness: 0.5,
      // transparent: true,
      // opacity: 0.5,
      // side: DoubleSide
    })
  );
  private cuttingPlaneNormal = new Vector3(0, 0, 1);
  private curveTangent = new Vector3();
  private curveNormal = new Vector3();
  private curveTangentArrow = new ArrowHelper(new Vector3());
  private curveNormalArrow = new ArrowHelper(new Vector3());
  private currentPreviewPointIndex = 0;
  constructor(scene: Scene) {
    super(scene);
    this.curveNormalArrow.setLength(3);
    this.curveNormalArrow.setColor(0xff0000);
    this.curveTangentArrow.setLength(3);
    this.curveTangentArrow.setColor(0x00ff00);
    this.previewChord.add(new AxesHelper(3));
    this.previewChord.geometry.rotateX(Math.PI / 2);
  }

  activate(): void {
    super.activate();
    console.debug("SimpleLineHandler::activate");
    this.previewPoints.forEach(point => {
      this.scene.add(point);
    });
    this.scene.add(this.previewLine);
    this.scene.add(this.previewChord);
    // this.scene.add(this.curveNormalArrow);
    // this.scene.add(this.curveTangentArrow);
    this.previewLine.visible = false;
  }

  deactivate(): void {
    super.deactivate();
    console.debug("SimpleLineHandler::deactivate");
    this.previewPoints.forEach(point => {
      this.scene.remove(point);
    });
    this.curveNormalArrow.removeFromParent();
    this.curveTangentArrow.removeFromParent();
    this.previewLine.removeFromParent();
    this.previewChord.removeFromParent();
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
        this.previewPoints[2].visible = true;
        this.previewLine.visible = true;
        this.previewChord.visible = true;
        this.curveTangentArrow.visible = true;
        this.curveNormalArrow.visible = true;
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
        this.previewChord.visible = false;
        this.curveTangentArrow.visible = false;
        this.curveNormalArrow.visible = false;
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
      this.cuttingPlaneNormal.crossVectors(start, end).normalize();
      this.curveTangent
        .crossVectors(Z_AXIS, this.cuttingPlaneNormal)
        .normalize();
      this.curveTangentArrow.setDirection(this.curveTangent);
      this.curveNormal
        .crossVectors(this.cuttingPlaneNormal, this.curveTangent)
        .normalize();
      this.curveNormalArrow.setDirection(this.curveNormal);
      // this.previewLine.lookAt(this.cuttingPlaneNormal);
      this.previewPoints[2].position
        .copy(this.curveNormal)
        .multiplyScalar(2 / this.curveNormal.z);
      this.hyperbola.setPointsAndDirections(
        start,
        end,
        this.curveTangent,
        this.curveNormal,
        false
      );
      this.previewLine.geometry.dispose();
      this.previewLine.geometry = new TubeGeometry(
        this.hyperbola,
        50,
        0.025,
        12
      );
      this.previewChord.lookAt(this.curveTangent);
      this.previewChord.position.copy(this.previewPoints[2].position);
    }
  }
}
