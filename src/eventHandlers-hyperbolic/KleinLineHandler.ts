import { Object3D, Scene, Vector2, Vector3 } from "three";
import { PoseTracker } from "./PoseTracker";
import { create2DLine, createPoint } from "@/plottables-hyperbolic/MeshFactory";
import { HYPERBOLIC_LAYER } from "@/global-settings-spherical";

export class KleinLineHandler extends PoseTracker {
  disk: Object3D;
  private kleinStart = createPoint(0.05, "red");
  private kleinEnd = createPoint(0.05, "green");
  private boundaryStart = createPoint(0.05, "yellow");
  private boundaryEnd = createPoint(0.05, "cyan");
  private kleinLine = create2DLine(0.02);
  private pointsAdded = false;
  private infiniteLine = false;
  constructor(s: Scene, d: Object3D, useInfiniteLine: boolean) {
    super(s);
    this.disk = d;
    this.infiniteLine = useInfiniteLine;
    this.kleinStart.layers.set(HYPERBOLIC_LAYER.kleinDisk);
    this.kleinEnd.layers.set(HYPERBOLIC_LAYER.kleinDisk);
    this.boundaryStart.layers.set(HYPERBOLIC_LAYER.kleinDisk);
    this.boundaryEnd.layers.set(HYPERBOLIC_LAYER.kleinDisk);
    this.kleinLine.layers.set(HYPERBOLIC_LAYER.kleinDisk);
  }

  mousePressed(
    event: MouseEvent,
    pos2D: Vector2,
    pos3D: Vector3 | null,
    n: Vector3 | null
  ): void {
    super.mousePressed(event, pos2D, pos3D, n);
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
    if (x1 * x1 + y1 * y1 <= z1 * z1 && x2 * x2 + y2 * y2 <= z2 * z2) {
      const kleinDiskRadius = PoseTracker.hyperStore.$state.kleinDiskElevation;
      x1 /= z1;
      y1 /= z1;
      x2 /= z2;
      y2 /= z2;
      this.kleinStart.position.set(x1, y1, 0).multiplyScalar(kleinDiskRadius);
      this.kleinEnd.position.set(x2, y2, 0).multiplyScalar(kleinDiskRadius);
      if (!this.pointsAdded) {
        this.disk.add(this.kleinStart);
        this.disk.add(this.kleinEnd);
        this.disk.add(this.kleinLine);
        if (this.infiniteLine) {
          this.disk.add(this.boundaryStart);
          this.disk.add(this.boundaryEnd);
        }
        this.pointsAdded = true;
      }
      let dx: number = 0;
      let dy: number = 0;
      let midX: number, midY: number;
      if (this.infiniteLine) {
        //
        this.computeKleinIntersections(
          this.kleinStart.position,
          this.kleinEnd.position,
          this.boundaryStart.position,
          this.boundaryEnd.position
        );
        dx = this.boundaryEnd.position.x - this.boundaryStart.position.x;
        dy = this.boundaryEnd.position.y - this.boundaryStart.position.y;
        midX =
          (this.boundaryStart.position.x + this.boundaryEnd.position.x) / 2;
        midY =
          (this.boundaryStart.position.y + this.boundaryEnd.position.y) / 2;
      } else {
        dx = this.kleinEnd.position.x - this.kleinStart.position.x;
        dy = this.kleinEnd.position.y - this.kleinStart.position.y;
        midX = (this.kleinStart.position.x + this.kleinEnd.position.x) / 2;
        midY = (this.kleinStart.position.y + this.kleinEnd.position.y) / 2;
      }
      const len = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      this.kleinLine.position.set(midX, midY, 0);
      this.kleinLine.rotation.z = angle + Math.PI / 2;
      this.kleinLine.scale.set(1, len, 1);
    } else {
      this.disk.remove(this.kleinStart);
      this.disk.remove(this.kleinEnd);
      this.disk.remove(this.kleinLine);
      this.disk.remove(this.boundaryStart);
      this.disk.remove(this.boundaryEnd);
      this.pointsAdded = false;
    }
  }

  mouseReleased(event: MouseEvent, p: Vector3, d: Vector3): void {
    super.mouseReleased(event, p, d);
    this.disk.remove(this.kleinStart);
    this.disk.remove(this.kleinEnd);
    this.disk.remove(this.boundaryStart);
    this.disk.remove(this.boundaryEnd);
    this.disk.remove(this.kleinLine);
    this.pointsAdded = false;
  }

  private computeKleinIntersections(
    p: Vector3,
    q: Vector3,
    bp: Vector3,
    bq: Vector3
  ) {
    // Compute the intersection points between line PQ with the Klein circle
    const px = p.x;
    const py = p.y;
    const qx = q.x;
    const qy = q.y;
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    // Setup the quadratic equation
    const aCoeff = dx * dx + dy * dy;
    const bCoeff = 2 * (p.x * dx + p.y * dy);
    const kleinRadius = PoseTracker.hyperStore.$state.kleinDiskElevation;
    const cCoeff = p.x * p.x + p.y * p.y - kleinRadius * kleinRadius;
    const disc = bCoeff * bCoeff - 4 * aCoeff * cCoeff;
    const lambda1 = (-bCoeff + Math.sqrt(disc)) / (2 * aCoeff);
    const lambda2 = (-bCoeff - Math.sqrt(disc)) / (2 * aCoeff);
    bp.set(
      lambda1 * qx + (1 - lambda1) * px,
      lambda1 * qy + (1 - lambda1) * py,
      0
    );
    bq.set(
      lambda2 * qx + (1 - lambda2) * px,
      lambda2 * qy + (1 - lambda2) * py,
      0
    );
  }
}
