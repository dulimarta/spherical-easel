import {
  ArrowHelper,
  Vector2,
  Vector3,
  Scene,
  Mesh,
  TubeGeometry,
  MeshStandardMaterial,
  PlaneGeometry,
  DoubleSide,
  Matrix4
} from "three";
import { PoseTracker } from "./PoseTracker";
import { HyperbolicCurve } from "@/mesh/HyperbolicCurve";
import { CircularCurve } from "@/mesh/CircularCurve";
import { createPoint } from "@/mesh/MeshFactory";

const Z_AXIS = new Vector3(0, 0, 1);
const ORIGIN = new Vector3(0, 0, 0);
export class LineHandler extends PoseTracker {
  // The line is the intersection between a plane spanned by
  // the origin, the two points, and the hyperboloid
  private planeNormal = new Vector3();
  // private rotationAxis = new Vector3();
  private planeDir1 = new Vector3();
  private planeDir2 = new Vector3();
  private arrow1 = new ArrowHelper(this.planeDir1, new Vector3());
  private arrow2 = new ArrowHelper(this.planeDir2, new Vector3());
  private arrow3 = new ArrowHelper(this.planeDir2, new Vector3());
  private arrow4 = new ArrowHelper(this.planeDir2, new Vector3());
  private hyperbolaPath = new HyperbolicCurve();
  private hyperbolaTube = new Mesh(
    new TubeGeometry(this.hyperbolaPath, 50, 0.05, 12, false),
    new MeshStandardMaterial({ color: "springgreen" })
  );
  private circlePath = new CircularCurve();
  private circleTube = new Mesh(
    new TubeGeometry(this.circlePath, 50, 0.03, 12, false),
    new MeshStandardMaterial({ color: "springgreen" })
  );
  pr;
  private startPoint = createPoint(0.05, "yellow");
  private kleinStart = createPoint(0.05, "red");
  private kleinEnd = createPoint(0.05, "red");
  private hPlane = new Mesh(
    new PlaneGeometry(7.5, 10, 20, 20),
    new MeshStandardMaterial({
      transparent: true,
      opacity: 0.5,
      color: "darkred",
      roughness: 0.4,
      side: DoubleSide
    })
  );
  private hPlaneCF = new Matrix4();
  private infiniteLine = false;
  constructor(s: Scene) {
    super(s);
    this.arrow1.setColor(0xff1187);
    this.arrow2.setColor(0x34e1eb);
    this.arrow3.setColor(0xffcc00);
    this.arrow4.setColor(0xa641bf);
    this.hPlane.matrixAutoUpdate = false;
  }

  setInfiniteMode(onOff: boolean) {
    this.infiniteLine = onOff;
  }

  mouseMoved(
    event: MouseEvent,
    normalizedScreenPosition: Vector2,
    position: Vector3,
    normalDirection: Vector3
  ): void {
    super.mouseMoved(
      event,
      normalizedScreenPosition,
      position,
      normalDirection
    );
    if (
      this.isDragging &&
      !isNaN(this.first.position.x) &&
      !isNaN(this.second.position.x) &&
      this.first.position.z * this.second.position.z > 0 // Both points must be on the same sheet
    ) {
      // console.debug(
      //   `Mouse was dragged from ${this.first.position.toFixed(
      //     2
      //   )} to ${this.second.position.toFixed(2)}`
      // );
      // Compute the normal vector of the plane that intersects the
      // paraboloid
      this.planeNormal
        .crossVectors(this.second.position, this.first.position)
        .normalize();
      // console.debug(`Plane Normal before ${this.planeNormal.toFixed(2)}`);
      // With this setup the coordinate from of hPlane would be as follows:
      // - Its X-axis is on the XY plane (i.e. its z component is zero)
      // - Its Y-axis is on a plane perpendicular to the XY-plane]
      // - Its Z-axis is the normal vector computed from both mouse points
      this.hPlaneCF.lookAt(ORIGIN, this.planeNormal, Z_AXIS);
      this.hPlane.matrix.copy(this.hPlaneCF);
      this.hPlaneCF.extractBasis(
        this.planeDir1,
        this.planeDir2,
        this.planeNormal
      );
      this.hyperbolaPath.setPointsAndDirections(
        this.first.position,
        this.second.position,
        this.planeDir1,
        this.planeDir2,
        this.infiniteLine
      );
      this.hyperbolaTube.geometry.dispose();
      this.hyperbolaTube.material.dispose();
      this.scene.remove(this.hyperbolaTube);
      this.hyperbolaTube = new Mesh(
        new TubeGeometry(this.hyperbolaPath, 50, 0.03, 12, false),
        new MeshStandardMaterial({ color: "springgreen" })
      );
      this.scene.add(this.hyperbolaTube);
      this.circlePath.setPointsAndDirections(
        this.first.position,
        this.second.position,
        this.planeDir1,
        this.planeDir2,
        this.infiniteLine
      );
      this.circleTube.geometry.dispose();
      this.circleTube.material.dispose();
      this.scene.remove(this.circleTube);
      this.circleTube = new Mesh(
        new TubeGeometry(this.circlePath, 50, 0.03, 12, false),
        new MeshStandardMaterial({ color: "springgreen" })
      );
      this.scene.add(this.circleTube);
      this.scene.add(this.hPlane);
      this.kleinStart.position.set(
        this.first.position.x / this.first.position.z,
        this.first.position.y / this.first.position.z,
        1
      );
      this.kleinEnd.position.set(
        this.second.position.x / this.second.position.z,
        this.second.position.y / this.second.position.z,
        1
      );
      this.scene.add(this.kleinStart);
      this.scene.add(this.kleinEnd);
      // When we are drawing an "infinite line", move the two points
      // to the edge of the Klein disk
      if (this.infiniteLine)
        this.computeKleinIntersections(
          this.kleinStart.position,
          this.kleinEnd.position
        );
    } else {
      this.scene.remove(this.hyperbolaTube);
      this.scene.remove(this.circleTube);
      this.scene.remove(this.hPlane);
      this.scene.remove(this.kleinStart);
      this.scene.remove(this.kleinEnd);
    }
  }

  private computeKleinIntersections(p: Vector3, q: Vector3) {
    // Compute the intersection points between line PQ with the Klein circle
    const px = p.x;
    const py = p.y;
    const qx = q.x;
    const qy = q.y;
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    // Setup quadratic equation
    const aCoeff = dx * dx + dy * dy;
    const bCoeff = 2 * (p.x * dx + p.y * dy);
    const cCoeff = p.x * p.x + p.y * p.y - 1;
    const disc = bCoeff * bCoeff - 4 * aCoeff * cCoeff;
    const lambda1 = (-bCoeff + Math.sqrt(disc)) / (2 * aCoeff);
    const lambda2 = (-bCoeff - Math.sqrt(disc)) / (2 * aCoeff);
    this.kleinStart.position.set(
      lambda1 * qx + (1 - lambda1) * px,
      lambda1 * qy + (1 - lambda1) * py,
      1
    );
    this.kleinEnd.position.set(
      lambda2 * qx + (1 - lambda2) * px,
      lambda2 * qy + (1 - lambda2) * py,
      1
    );
  }
  mousePressed(
    event: MouseEvent,
    normalizedScreenPosition: Vector2,
    position: Vector3,
    normalDirection: Vector3
  ): void {
    super.mousePressed(
      event,
      normalizedScreenPosition,
      position,
      normalDirection
    );
    this.scene.add(this.hPlane);
    this.startPoint.position.copy(position);
    this.scene.add(this.startPoint);
    // this.planeNormal.copy(this.first.position).normalize();
    // this.arrow1.setDirection(this.planeNormal);
    // this.arrow1.setLength(this.first.position.length());
    // this.scene.add(this.arrow1);
  }
  mouseReleased(
    event: MouseEvent,
    position: Vector3,
    normalDirection: Vector3
  ): void {
    super.mouseReleased(event, position, normalDirection);
    this.scene.remove(this.arrow1);
    this.scene.remove(this.arrow2);
    this.scene.remove(this.arrow3);
    this.scene.remove(this.arrow4);
    this.scene.remove(this.hPlane);
    this.scene.remove(this.startPoint);
  }
  mouseLeave(event: MouseEvent): void {
    throw new Error("Method not implemented.");
  }
  activate(): void {
    // throw new Error("Method not implemented.");
  }
  deactivate(): void {
    // throw new Error("Method not implemented.");
  }
}
