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
    ),
    new Mesh(
      new SphereGeometry(0.05, 32, 32),
      new MeshStandardMaterial({
        color: 0x00ffff
      })
    ),
    new Mesh(
      new SphereGeometry(0.05, 32, 32),
      new MeshStandardMaterial({
        color: 0x00ffff
      })
    )
  ];

  private hyperbola: HyperbolicCurve;
  private previewLine: Mesh;
  // private cuttingPlane = new Mesh(
  //   new PlaneGeometry(10, 10),
  //   new MeshStandardMaterial({
  //     color: 0x0000ff,
  //     side: DoubleSide,
  //     transparent: true,
  //     opacity: 0.5
  //   })
  // );
  private currentPreviewPointIndex = 0;
  constructor(
    scene: Scene,
    private infiniteLine = false
  ) {
    super(scene);
    this.hyperbola = new HyperbolicCurve(this.infiniteLine);
    this.previewLine = new Mesh(
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
  }

  activate(): void {
    super.activate();
    console.debug("SimpleLineHandler::activate");
    this.previewPoints.forEach(point => {
      this.scene.add(point);
    });
    this.scene.add(this.previewLine);
    // this.scene.add(this.previewChord);
    // this.scene.add(this.cuttingPlane);
    // this.scene.add(this.curveNormalArrow);
    // this.scene.add(this.curveTangentArrow);
    this.previewLine.visible = false;
    // this.cuttingPlane.visible = false;
  }

  deactivate(): void {
    super.deactivate();
    console.debug("SimpleLineHandler::deactivate");
    this.previewPoints.forEach(point => {
      this.scene.remove(point);
    });
    // this.curveNormalArrow.removeFromParent();
    // this.curveTangentArrow.removeFromParent();
    this.previewLine.removeFromParent();
    // this.previewChord.removeFromParent();
    // this.cuttingPlane.removeFromParent();
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
        for (let k = 1; k < this.previewPoints.length; k++) {
          this.previewPoints[k].visible = true;
        }
        this.previewLine.visible = true;
        // this.previewChord.visible = true;
        // this.cuttingPlane.visible = true;
        // this.curveTangentArrow.visible = true;
        // this.curveNormalArrow.visible = true;
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
        for (let k = 1; k < this.previewPoints.length; k++) {
          this.previewPoints[k].visible = false;
        }
        this.previewLine.visible = false;
        this.currentPreviewPointIndex = 0;
        // this.cuttingPlane.visible = false;
        break;
    }
  }

  mouseMoved(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule | string>
  ): void {
    super.mouseMoved(event, position, hitObjects);
    // console.debug(
    //   "SimpleLineHandler::mouseMoved",
    //   position,
    //   "index",
    //   this.currentPreviewPointIndex
    // );
    if (isNaN(position.x)) return;
    this.previewPoints[this.currentPreviewPointIndex].position.copy(position);
    if (this.currentPreviewPointIndex === 1) {
      const start = this.previewPoints[0].position;
      const end = this.previewPoints[1].position;
      this.hyperbola.setPointsAndDirections(start, end);
      this.previewLine.geometry.dispose();
      this.previewLine.geometry = new TubeGeometry(
        this.hyperbola,
        50,
        0.025,
        12
      );
    }
  }
}
