import {
  Curve,
  Mesh,
  MeshStandardMaterial,
  Scene,
  TubeGeometry,
  Vector2,
  Vector3
} from "three";
import { PoseTracker } from "./PoseTracker";
import { createPoint } from "@/mesh/MeshFactory";
import { HYPERBOLIC_LAYER } from "@/global-settings";

/* Techniques used here

   Hyp points |-> Klein points |-> Poincare Points |-> Poincare Circle |-> Klein Circle |-> Hyp Circles

   1. The coordinates of the input circle points (C:center & P:perimeter) on the hyperboloid are projected 
      to the Klein disk as D & Q
   2. D & Q are transformed into Poincare points (E & R)
   3. Generate a Euclidean circle S using center point E and perimeter point R
   4. Transform points on S to a circle T on Klein disk
   5. Project back T to to the hyperboloid surface
 */
export class CircleHandler extends PoseTracker {
  centerPointH = createPoint();
  centerPointP = createPoint(0.08, "SaddleBrown");
  circlePointP = createPoint(0.08, "SandyBrown");
  centerPointKl = createPoint(0.08, "DarkGreen");
  circlePointKl = createPoint(0.08, "LimeGreen");

  pathP = new HyperbolicCircle();
  pCircle = new Mesh(
    new TubeGeometry(),
    new MeshStandardMaterial({
      color: "gold"
    })
  );
  pathK = new HyperbolicCircle("toKlein");
  kCircle = new Mesh(
    new TubeGeometry(),
    new MeshStandardMaterial({
      color: "green",
      transparent: true,
      opacity: 0.5
    })
  );
  pathH = new HyperbolicCircle("toHyperboloid");
  hCircle = new Mesh(
    new TubeGeometry(),
    new MeshStandardMaterial({
      color: "white",
      transparent: true,
      opacity: 0.5
    })
  );
  constructor(s: Scene) {
    super(s);
    this.centerPointP.layers.set(HYPERBOLIC_LAYER.poincareDisk);
    this.circlePointP.layers.set(HYPERBOLIC_LAYER.poincareDisk);
    this.centerPointKl.layers.set(HYPERBOLIC_LAYER.poincareDisk);
    this.circlePointKl.layers.set(HYPERBOLIC_LAYER.poincareDisk);
    this.kCircle.layers.set(HYPERBOLIC_LAYER.poincareDisk);
    this.pCircle.layers.set(HYPERBOLIC_LAYER.poincareDisk);
    this.hCircle.layers.set(HYPERBOLIC_LAYER.upperSheet);
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
      this.centerPointH.position.set(x1, y1, z1);
      this.scene.add(this.centerPointH);
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
      // Show Poincare Points and Circles

      this.centerPointP.position.set(x1, y1, 0).multiplyScalar(pd1 * R);
      this.circlePointP.position.set(x2, y2, 0).multiplyScalar(pd2 * R);
      this.pathP.setPoints(
        this.centerPointP.position,
        this.circlePointP.position
      );
      this.pCircle.geometry.dispose();
      this.pCircle.geometry = new TubeGeometry(this.pathP, 100, 0.03);

      // Show the Klein points
      this.centerPointKl.position.set(x1, y1, 0).multiplyScalar(R);
      this.circlePointKl.position.set(x2, y2, 0).multiplyScalar(R);
      // Show the Klein circle via transformation from Poincare points
      this.pathK.setPoints(
        this.centerPointP.position,
        this.circlePointP.position
      );
      this.kCircle.geometry.dispose();
      this.kCircle.geometry = new TubeGeometry(this.pathK, 100, 0.03);

      // Show the hyperbolic circle via transformation from Poincare points
      this.pathH.setPoints(
        this.centerPointP.position,
        this.circlePointP.position
      );
      this.hCircle.geometry.dispose();
      this.hCircle.geometry = new TubeGeometry(this.pathH, 100, 0.03);
      this.scene.add(this.pCircle);
      this.scene.add(this.kCircle);
      this.scene.add(this.hCircle);
      this.scene.add(this.circlePointP);
      this.scene.add(this.centerPointP);
      this.scene.add(this.centerPointKl);
      this.scene.add(this.circlePointKl);
    } else {
      this.scene.remove(this.pCircle);
      this.scene.remove(this.kCircle);
      this.scene.remove(this.hCircle);
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
  transform: "toKlein" | "toHyperboloid" | null;

  constructor(applyTransform: null | "toKlein" | "toHyperboloid" = null) {
    super();
    this.transform = applyTransform;
  }

  setPoints(ctr: Vector3, circ: Vector3) {
    // The center and circumference points must be given in Poincare disk
    const dx = circ.x - ctr.x;
    const dy = circ.y - ctr.y;
    // The radius must be the Poincare radius
    this.radius = Math.sqrt(dx * dx + dy * dy);
    this.ctrX = ctr.x;
    this.ctrY = ctr.y;

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
      optTarget.set(x, y, 0).multiplyScalar(scale);
    } else if (this.transform === "toHyperboloid") {
      scale = 2 / (1 + d * d);
      // console.debug(
      //   `t=${tInput.toFixed(3)} => (${x.toFixed(2)},${y.toFixed(2)}) Scale ${
      //     this.transform ?? "Identity"
      //   } from ${d.toFixed(2)} to  ${scale.toFixed(2)}`
      // );
      const kx = (x * scale) / R;
      const ky = (y * scale) / R;
      const denom = Math.sqrt(1 - kx * kx - ky * ky);
      // console.debug(
      //   `(${x.toFixed(2)},${y.toFixed(2)}) (${kx.toFixed(2)},${ky.toFixed(
      //     2
      //   )}) ==> ${d.toFixed(4)} ${denom.toFixed(4)}`
      // );
      optTarget.set(kx, ky, 1).multiplyScalar(1 / denom);
    } else {
      optTarget.set(x, y, 0).multiplyScalar(scale);
    }
    return optTarget;
  }
}
