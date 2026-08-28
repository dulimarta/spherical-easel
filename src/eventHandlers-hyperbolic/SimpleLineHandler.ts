import { CKNodule } from "@/models/CKNodule";
import {
  Mesh,
  type Scene,
  SphereGeometry,
  Vector3,
  MeshStandardMaterial,
  TubeGeometry,
  ArrowHelper
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
  private hyperbola1: HyperbolicCurve;
  private hyperbola2: HyperbolicCurve;
  private previewLine1: Mesh;
  private previewLine2: Mesh;
  // private currentPreviewPointIndex = 0;
  constructor(
    scene: Scene,
    private infiniteLine
  ) {
    super(scene, 2);
    this.hyperbola1 = new HyperbolicCurve(this.infiniteLine, false, scene);
    this.hyperbola2 = new HyperbolicCurve(this.infiniteLine, true, scene);
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
    const materialProps = {
      color: 0xffff00
      // roughness: 0.5,
      // metalness: 0.5,
      // transparent: true,
      // opacity: 0.5,
      // side: DoubleSide
    };
    this.previewLine1 = new Mesh(
      new TubeGeometry(this.hyperbola1),
      new MeshStandardMaterial(materialProps)
    );
    this.previewLine2 = new Mesh(
      new TubeGeometry(this.hyperbola2),
      new MeshStandardMaterial(materialProps)
    );
  }

  activate(): void {
    super.activate();
    console.debug("SimpleLineHandler::activate");
    this.previewLine1.visible = false;
    this.previewLine2.visible = false;
    this.scene.add(this.previewLine1);
    this.scene.add(this.previewLine2);
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
    this.previewLine1.removeFromParent();
    this.previewLine2.removeFromParent();
    // this.previewChord.removeFromParent();
    // this.cuttingPlane.removeFromParent();
    this.previewLine1.visible = false;
    this.previewLine2.visible = false;
    this.hyperbola1.dispose();
    this.hyperbola2.dispose();
  }

  mousePressed(
    event: MouseEvent,
    position: Vector3,
    hitObjects: Array<CKNodule | SurfaceIntersection>
  ): void {
    super.mousePressed(event, position, hitObjects);
    console.debug(`Selected point count`, this.currentSelectedPoints.length);
    if (this.currentSelectedPoints.length === 1) {
      // this.previewLine1.visible = true;
    } else if (this.currentSelectedPoints.length == 2) {
      // Create the line here
      const startAt = this.currentSelectedPoints[0];
      let startPoint: CKPoint;
      if (startAt.onObject instanceof CKPoint) startPoint = startAt.onObject;
      else startPoint = new CKPoint(startAt.position);
      const endAt = this.currentSelectedPoints[1];
      let endPoint: CKPoint;
      if (endAt.onObject instanceof CKPoint) endPoint = endAt.onObject;
      else endPoint = new CKPoint(endAt.position);
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
      this.previewLine1.visible = false;
      this.previewLine2.visible = false;
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
      this.previewLine1.visible = false;
      this.previewLine2.visible = false;
      return;
    }
    if (this.currentSelectedPoints.length == 0) {
      this.previewLine1.visible = false;
      this.previewLine2.visible = false;
      return;
    }
    const startSurface = this.currentSelectedPoints[0].surface;
    const regexIdeal = /ideal/i;
    this.previewLine1.visible =
      startSurface == this.onSurfaceName ||
      regexIdeal.test(startSurface) ||
      regexIdeal.test(this.onSurfaceName!!);

    const regexUltra = /ultra/i;
    const oneSheet =
      regexUltra.test(startSurface) || regexUltra.test(this.onSurfaceName!!);
    this.previewLine2.visible = this.previewLine1.visible && oneSheet;
    // this.previewPoints[this.currentPreviewPointIndex].position.copy(position);
    if (this.previewLine1.visible) {
      // console.debug(
      //   `Hyperbola curve visible as ${oneSheet ? "one" : "two"}-sheet`
      // );
      const start = this.previewPoints[0].position;
      const end = this.previewPoints[1].position;
      this.hyperbola1.setPoints(start, end, oneSheet);
      this.previewLine1.geometry.dispose();
      this.previewLine1.geometry = new TubeGeometry(
        this.hyperbola1,
        50, // tubular segment
        0.02,
        6
      );
      if (this.previewLine2.visible) {
        this.hyperbola2.setPoints(start, end, oneSheet);
        this.previewLine2.geometry.dispose();
        this.previewLine2.geometry = new TubeGeometry(
          this.hyperbola2,
          50, // tubular segment
          0.02,
          6
        );
      }
    }
  }
}
