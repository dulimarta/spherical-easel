import {
  Curve,
  Mesh,
  MeshStandardMaterial,
  Scene,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3
} from "three";
import { PoseTracker } from "./PoseTracker";
import { createPoint } from "@/mesh/MeshFactory";

export class CircleHandler extends PoseTracker {
  centerPointP = createPoint(0.08, "SaddleBrown");
  circlePointP = createPoint(0.08, "SandyBrown");
  centerPointKl = createPoint(0.08, "DarkGreen");
  circlePointKl = createPoint(0.08, "LimeGreen");

  // tempCircle = new Mesh(
  //   new TorusGeometry(1, 0.2),
  //   new MeshStandardMaterial({ color: "white" })
  // );
  pathP = new HyperbolicCircle("toKlein");
  pCircle = new Mesh(
    new TubeGeometry(),
    new MeshStandardMaterial({
      color: "gold"
    })
  );
  pathK = new HyperbolicCircle();
  kCircle = new Mesh(
    new TubeGeometry(),
    new MeshStandardMaterial({
      color: "green",
      transparent: true,
      opacity: 0.5
    })
  );
  constructor(s: Scene) {
    super(s);
  }

  mouseMoved(
    event: MouseEvent,
    scrPos: Vector2,
    position: Vector3 | null,
    direction: Vector3 | null
  ): void {
    super.mouseMoved(event, scrPos, position, direction);
    if (position && this.isDragging) {
      console.debug("Circle Handler");
      let { x: x1, y: y1, z: z1 } = this.first.position;
      let { x: x2, y: y2, z: z2 } = this.second.position;

      // Convert the input positions to points on Klein disk
      x1 /= z1;
      y1 /= z1;
      x2 /= z2;
      y2 /= z2;
      // Compute Klein distance
      const kd1 = Math.sqrt(x1 * x1 + y1 * y1);
      const kd2 = Math.sqrt(x2 * x2 + y2 * y2);
      // Calculate the Poincare scaling factor for both points
      const pd1 = kd1 / (1 + Math.sqrt(1 - kd1 * kd1));
      const pd2 = kd2 / (1 + Math.sqrt(1 - kd2 * kd2));
      const R = PoseTracker.hyperStore.$state.kleinDiskElevation;
      // Show the Klein points & circles
      this.centerPointKl.position.set(x1, y1, 0).multiplyScalar(R);
      this.circlePointKl.position.set(x2, y2, 0).multiplyScalar(R);
      this.pathK.setPoints(
        this.centerPointKl.position,
        this.circlePointKl.position
      );
      this.kCircle.geometry.dispose();
      this.kCircle.geometry = new TubeGeometry(this.pathK, 60, 0.05);
      // Poincare Setup
      this.centerPointP.position.set(x1, y1, 0).multiplyScalar(pd1 * R);
      this.circlePointP.position.set(x2, y2, 0).multiplyScalar(pd2 * R);
      this.pathP.setPoints(
        this.centerPointP.position,
        this.circlePointP.position
      );
      this.pCircle.geometry.dispose();
      this.pCircle.geometry = new TubeGeometry(this.pathP, 60, 0.05);
      // this.scene.add(this.kCircle);
      this.scene.add(this.pCircle);
      this.scene.add(this.kCircle);
      this.scene.add(this.circlePointP);
      this.scene.add(this.centerPointP);
      this.scene.add(this.centerPointKl);
      this.scene.add(this.circlePointKl);
    } else {
      this.scene.remove(this.pCircle);
      this.scene.remove(this.kCircle);
      this.scene.remove(this.circlePointP);
      this.scene.remove(this.centerPointP);
      this.scene.remove(this.circlePointKl);
      this.scene.remove(this.centerPointKl);
    }
  }
}

// Generate a Klein circle by transforming a Poincare counterpart
class HyperbolicCircle extends Curve<Vector3> {
  ctrX: number = 0;
  ctrY: number = 0;
  radius: number = 1;
  transform: "toKlein" | null;

  constructor(applyTransform: null | "toKlein" = null) {
    super();
    this.transform = applyTransform;
  }

  setPoints(ctr: Vector3, circ: Vector3) {
    // The center and circumference points must be given in Poincare disk
    const dx = circ.x - ctr.x;
    const dy = circ.y - ctr.y;
    // The radius must be the Poincare radius
    this.radius = Math.sqrt(dx * dx + dy * dy);
    // if (this.transform === "toKlein") {
    //   // Move the center to coordinates in klein Disk
    //   const d =
    //     Math.sqrt(ctr.x * ctr.x + ctr.y * ctr.y) /
    //     PoseTracker.hyperStore.$state.kleinDiskElevation;
    //   const scale = (2 * d) / (1 + d * d);
    //   console.debug(`Circle center is scaled up from ${d} to ${scale}`);
    //   this.ctrX *= ctr.x * scale;
    //   this.ctrY *= ctr.y * scale;
    // } else {
    this.ctrX = ctr.x;
    this.ctrY = ctr.y;
    // }

    this.updateArcLengths();
  }

  getPoint(tInput: number, optTarget: Vector3 = new Vector3()) {
    const x = this.ctrX + this.radius * Math.cos(tInput * Math.PI * 2);
    const y = this.ctrY + this.radius * Math.sin(tInput * Math.PI * 2);
    // console.debug(
    //   `t=${tInput.toFixed(3)} => (${x.toFixed(2)},${y.toFixed(2)})`
    // );
    const R = PoseTracker.hyperStore.$state.kleinDiskElevation;

    const d = Math.sqrt(x * x + y * y) / R;
    let scale: number = 1;
    if (this.transform === "toKlein") {
      scale = 2 / (1 + d * d);
    }
    if (this.transform) {
      console.debug(
        `t=${tInput.toFixed(3)} => (${x.toFixed(2)},${y.toFixed(2)}) Scale ${
          this.transform ?? "Identity"
        } from ${d.toFixed(2)} to  ${scale.toFixed(2)}`
      );
    }
    optTarget.set(x, y, 0).multiplyScalar(scale);
    return optTarget;
  }
}
