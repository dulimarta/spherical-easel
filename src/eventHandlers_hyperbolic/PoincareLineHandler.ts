import {
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Scene,
  TorusGeometry,
  Vector2,
  Vector3
} from "three";
import { PoseTracker } from "./PoseTracker";
import { createPoint } from "@/mesh/MeshFactory";
import { HYPERBOLIC_LAYER } from "@/global-settings";

export class PoincareLineHandler extends PoseTracker {
  disk: Object3D;
  private poincareStart = createPoint(0.05, "red");
  private poincareEnd = createPoint(0.05, "green");
  private poincareInverse = new Vector3();
  private circleCenter = createPoint(0.06, "orange");
  private boundaryStart = createPoint(0.05, "yellow");
  private boundaryEnd = createPoint(0.05, "cyan");
  private torus: Mesh;
  // private poincareLine = create2DLine(0.02);
  private pointsAdded = false;
  private infiniteLine = false;
  constructor(s: Scene, d: Object3D) {
    super(s);
    this.disk = d;
    this.poincareStart.layers.set(HYPERBOLIC_LAYER.poincareDisk);
    this.poincareEnd.layers.set(HYPERBOLIC_LAYER.poincareDisk);
    this.circleCenter.layers.set(HYPERBOLIC_LAYER.poincareDisk);
    this.boundaryStart.layers.set(HYPERBOLIC_LAYER.poincareDisk);
    this.boundaryEnd.layers.set(HYPERBOLIC_LAYER.poincareDisk);
    this.torus = new Mesh(
      new TorusGeometry(1, 0.02),
      new MeshStandardMaterial({ color: "brown" })
    );
    this.torus.layers.set(HYPERBOLIC_LAYER.poincareDisk);
  }

  setInfiniteMode(onOff: boolean) {
    this.infiniteLine = onOff;
  }
  mousePressed(
    event: MouseEvent,
    pos2D: Vector2,
    pos3D: Vector3 | null,
    n: Vector3 | null
  ): void {
    super.mousePressed(event, pos2D, pos3D, n);
    if (pos3D) {
      const d = PoseTracker.hyperStore.$state.kleinDiskElevation;
      // const poincareZ = diskRadius - 1;
      const { x, y, z } = pos3D;
      const poincareScale = d / (Math.abs(z) + 1);
      this.poincareStart.position
        .set(x, y, 0)
        .multiplyScalar(poincareScale * Math.sign(z));
    }
  }

  mouseMoved(
    event: MouseEvent,
    scrPos: Vector2,
    position: Vector3 | null,
    direction: Vector3 | null
  ): void {
    super.mouseMoved(event, scrPos, position, direction);
    if (!this.isDragging) return;
    let { x: x1, y: y1, z: z1 } = this.first.position;
    let { x: x2, y: y2, z: z2 } = this.second.position;
    // console.debug(`Dragging in Poincare P1 ${x1 * x1 + y1 * y1} vs ${z1 * z1}`);
    // console.debug(`Dragging in Poincare P2 ${x2 * x2 + y2 * y2} vs ${z2 * z2}`);
    if (x1 * x1 + y1 * y1 <= z1 * z1 && x2 * x2 + y2 * y2 <= z2 * z2) {
      const kleinRadius = PoseTracker.hyperStore.$state.kleinDiskElevation;
      const poincareRadius = (kleinRadius * kleinRadius) / (kleinRadius + 1);
      const poincareScale = kleinRadius / (Math.abs(z2) + 1);
      this.poincareEnd.position
        .set(x2, y2, 0)
        .multiplyScalar(poincareScale * Math.sign(z2));
      const { x: xe, y: ye } = this.poincareEnd.position;
      this.poincareInverse
        .copy(this.poincareEnd.position)
        .multiplyScalar(
          (poincareRadius * poincareRadius) / (xe * xe + ye * ye)
        );
      this.computePoincareCircle(
        this.poincareStart.position,
        this.poincareEnd.position,
        this.poincareInverse
      );
      if (!this.pointsAdded) {
        this.disk.add(this.poincareStart);
        this.disk.add(this.poincareEnd);
        // this.disk.add(this.circleCenter);
        this.disk.add(this.torus);
        // this.disk.add(this.poincareLine);
        if (this.infiniteLine) {
          // this.disk.add(this.boundaryStart);
          // this.disk.add(this.boundaryEnd);
        }
        this.pointsAdded = true;
      }
    } else {
      this.disk.remove(this.poincareStart);
      this.disk.remove(this.poincareEnd);
      // this.disk.remove(this.circleCenter);
      this.disk.remove(this.torus);
      this.disk.remove(this.boundaryStart);
      this.disk.remove(this.boundaryEnd);
      this.pointsAdded = false;
    }
  }

  mouseReleased(event: MouseEvent, p: Vector3, d: Vector3): void {
    super.mouseReleased(event, p, d);
    this.disk.remove(this.poincareStart);
    this.disk.remove(this.poincareEnd);
    // this.disk.remove(this.circleCenter);
    this.disk.remove(this.torus);
    this.disk.remove(this.boundaryStart);
    this.disk.remove(this.boundaryEnd);
    this.pointsAdded = false;
  }

  private computePoincareCircle(
    p: Vector3,
    q: Vector3,
    r: Vector3
    // bp: Vector3,
    // bq: Vector3
  ) {
    const { x: x1, y: y1 } = p;
    const { x: x2, y: y2 } = q;
    const { x: x3, y: y3 } = r;
    // console.debug(
    //   `Circle points R(${x1.toFixed(2)},${y1.toFixed(2)})` +
    //     ` G(${x2.toFixed(2)},${y2.toFixed(2)})` +
    //     ` B(${x3.toFixed(2)},${y3.toFixed(2)})`
    // );
    // https://math.stackexchange.com/questions/213658/get-the-equation-of-a-circle-when-given-3-points
    const x1sq = x1 * x1;
    const y1sq = y1 * y1;
    const x2sq = x2 * x2;
    const y2sq = y2 * y2;
    const x3sq = x3 * x3;
    const y3sq = y3 * y3;
    // M-jk is the (j,k) minor of the 4x4 matrix
    const M11 = x1 * (y2 - y3) - y1 * (x2 - x3) + x2 * y3 - x3 * y2;
    const M12 =
      (x1sq + y1sq) * (y3 - y2) +
      (x2sq + y2sq) * (y1 - y3) +
      (x3sq + y3sq) * (y2 - y1);
    const M13 =
      (x1sq + y1sq) * (x2 - x3) +
      (x2sq + y2sq) * (x3 - x1) +
      (x3sq + y3sq) * (x1 - x2);
    const M14 =
      (x1sq + y1sq) * (x3 * y2 - x2 * y3) +
      (x2sq + y2sq) * (x1 * y3 - x3 * y1) +
      (x3sq + y3sq) * (x2 * y1 - x1 * y2);
    const ctrX = -M12 / (2 * M11);
    const ctrY = -M13 / (2 * M11);
    const radius =
      Math.sqrt(M12 * M12 + M13 * M13 - 4 * M11 * M14) / (2 * Math.abs(M11));
    this.circleCenter.position.set(ctrX, ctrY, 0);
    this.torus.position.set(ctrX, ctrY, 0);

    // Determine the start and end angles of the arc
    const dx1 = x1 - ctrX;
    const dx2 = x2 - ctrX;
    const dy1 = y1 - ctrY;
    const dy2 = y2 - ctrY;
    const cross = dx1 * dy2 - dx2 * dy1; // Z component of cross product
    let angle1 = Math.atan2(dy1, dx1);
    let angle2 = Math.atan2(dy2, dx2);
    let arcSpan = cross > 0 ? angle2 - angle1 : angle1 - angle2;
    console.debug(
      `Angle range ${angle1.toDegrees().toFixed(0)} ${angle2
        .toDegrees()
        .toFixed(0)} ${arcSpan > Math.PI ? "Wide" : "Normal"} Arc span ${arcSpan
        .toDegrees()
        .toFixed(0)}`
    );
    if (arcSpan < 0) arcSpan += 2 * Math.PI;

    // Replace the torus with a new one
    this.torus.geometry.dispose();
    this.torus.geometry = new TorusGeometry(radius, 0.02, 24, 90, arcSpan);
    this.torus.geometry.rotateZ(cross > 0 ? angle1 : angle2);
  }
}
