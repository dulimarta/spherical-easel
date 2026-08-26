import { CKNodule } from "@/models/CKNodule";
import {
  Mesh,
  type Scene,
  SphereGeometry,
  Vector3,
  MeshStandardMaterial,
  TubeGeometry
} from "three/webgpu";
// import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";
import { CKLine } from "@/models/CKLine";
import { CKPoint } from "@/models/CKPoint";
import { CommandGroup } from "@/commands/CommandGroup";
import { AddPointByObjectKommand } from "@/commands/AddPointKommand";
import { AddLineOrSegmentKommand } from "@/commands/AddLineKommand";
import { PoseTracker } from "./PoseTracker";
import { HyperbolicCurve } from "@/plottables-hyperbolic/HyperbolicCurve";
import { CKSegment } from "@/models/CKSegment";
import { SurfaceIntersection } from "./ToolStrategy";
import { MultiPointSelectionHandler } from "./MultiPointSelectionHandler";
export class SimpleLineHandler extends MultiPointSelectionHandler {
  // private previewPoints: Array<Mesh> = [];
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
  // private currentPreviewPointIndex = 0;
  constructor(
    scene: Scene,
    private infiniteLine
  ) {
    super(scene, 2);
    this.hyperbola = new HyperbolicCurve(this.infiniteLine);
    // for (let k = 0; k < 2; k++) {
    //   this.previewPoints.push(
    //     new Mesh(
    //       new SphereGeometry(0.05, 32, 32),
    //       new MeshStandardMaterial({
    //         color: 0x00ffff
    //       })
    //     )
    //   );
    // }
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
    this.previewLine.visible = false;
    this.scene.add(this.previewLine);
    // this.scene.add(this.previewChord);
    // this.scene.add(this.cuttingPlane);
    // this.scene.add(this.curveNormalArrow);
    // this.scene.add(this.curveTangentArrow);
    // this.cuttingPlane.visible = false;
  }

  deactivate(): void {
    super.deactivate();
    console.debug("SimpleLineHandler::deactivate");
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
    hitObjects: Array<CKNodule | SurfaceIntersection>
  ): void {
    super.mousePressed(event, position, hitObjects);
    console.debug(`Selected point count`, this.currentSelectedPoints.length);
    if (this.currentSelectedPoints.length === 1)
      this.previewLine.visible = true;
    else if (this.currentSelectedPoints.length == 2) {
      // Create the line here
      const startAt = this.currentSelectedPoints[0];
      let startPoint: CKPoint;
      if (startAt.pointOrPosition instanceof CKPoint)
        startPoint = startAt.pointOrPosition;
      else startPoint = new CKPoint(startAt.pointOrPosition);
      const endAt = this.currentSelectedPoints[1];
      let endPoint: CKPoint;
      if (endAt.pointOrPosition instanceof CKPoint)
        endPoint = endAt.pointOrPosition;
      else endPoint = new CKPoint(endAt.pointOrPosition);
      const cmdGroup = new CommandGroup();
      cmdGroup.addCommand(new AddPointByObjectKommand(startPoint));
      cmdGroup.addCommand(new AddPointByObjectKommand(endPoint));
      if (this.infiniteLine) {
        const aLine = new CKLine(
          this.previewPoints[0].position,
          this.previewPoints[1].position,
          this.infiniteLine
        );
        cmdGroup.addCommand(
          new AddLineOrSegmentKommand(aLine, startPoint, endPoint)
        );
      } else {
        const aSegment = new CKSegment(
          this.previewPoints[0].position,
          this.previewPoints[1].position
        );
        cmdGroup.addCommand(
          new AddLineOrSegmentKommand(aSegment, startPoint, endPoint)
        );
      }
      cmdGroup.execute();
      this.restart();
      this.previewLine.visible = false;
    }
  }

  mouseMoved(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule | SurfaceIntersection>
  ): void {
    super.mouseMoved(event, position, hitObjects);
    // console.debug(
    //   "SimpleLineHandler::mouseMoved",
    //   position,
    //   "index",
    //   this.currentPreviewPointIndex
    // );
    if (isNaN(position.x)) {
      this.previewLine.visible = false;
      return;
    }
    this.previewLine.visible = this.currentSelectedPoints.length == 1;
    // this.previewPoints[this.currentPreviewPointIndex].position.copy(position);
    if (this.previewLine.visible) {
      const start = this.previewPoints[0].position;
      const end = this.previewPoints[1].position;
      this.hyperbola.setPoints(start, end);
      this.previewLine.geometry.dispose();
      this.previewLine.geometry = new TubeGeometry(
        this.hyperbola,
        50, // tubular segment
        0.02,
        6
      );
    }
  }
}
