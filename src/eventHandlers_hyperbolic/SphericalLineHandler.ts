import {
  Vector2,
  Vector3,
  Scene,
  Mesh,
  TubeGeometry,
  MeshStandardMaterial
} from "three";
import { PoseTracker } from "./PoseTracker";
import { CircularCurve } from "@/mesh/CircularCurve";
import { createPoint } from "@/mesh/MeshFactory";
// import { AddHyperbolicLineCommand } from "@/commands/AddHyperbolicLineCommand";
import { SphericalLine } from "@/models-hyperbolic/SphericalLine";

const Z_AXIS = new Vector3(0, 0, 1);
const ORIGIN = new Vector3(0, 0, 0);
export class SphericalLineHandler extends PoseTracker {
  prototypeLine = new SphericalLine();
  // The line is the intersection between a plane spanned by
  // the origin, the two points, and the hyperboloid
  private planeNormal = new Vector3();
  // private rotationAxis = new Vector3();

  private planeDir1 = new Vector3();
  private planeDir2 = new Vector3();
  private projectUp1 = new Vector3();
  private projectUp2 = new Vector3();
  private circlePath = new CircularCurve();
  private circleTube = new Mesh(
    new TubeGeometry(this.circlePath, 50, 0.03, 12, false),
    new MeshStandardMaterial({ color: "springgreen" })
  );

  private startPoint = createPoint(0.05, "aqua");
  private infiniteLine = false;
  constructor(s: Scene) {
    super(s);
  }

  setInfiniteMode(onOff: boolean) {
    this.prototypeLine.markInfinite(onOff);
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
    const len1 = this.first.position.lengthSq();
    const len2 = this.second.position.lengthSq();
    const onHyperboloid = len1 > 1 && len2 > 1;
    if (
      this.isDragging &&
      // both points must be on the hyperboloid or sphere
      !isNaN(this.first.position.x) &&
      !isNaN(this.second.position.x)
    ) {
      this.planeNormal
        .crossVectors(this.second.position, this.first.position)
        .normalize();
      // With the lookAt() function below, the coordinate frame of hPlane would be as follows:
      // - Its X-axis is on the XY plane (i.e. its z component is zero)
      // - Its Y-axis is on a plane perpendicular to the XY-plane]
      // - Its Z-axis is the normal vector computed from both mouse points

      const angleFromZ = Z_AXIS.angleTo(this.planeDir2);
      // console.debug(
      //   `Angle of plane from Z ${angleFromZ.toDegrees().toFixed(2)}`
      // );

      const intersectsHyperboloid =
        // If both points are on the hyperboloid they must be on the same sheet
        (onHyperboloid && this.first.position.z * this.second.position.z > 0) ||
        // If the points are on the sphere, the plane must be within 45 degrees from the Z axis
        (!onHyperboloid && angleFromZ < Math.PI / 4);
      this.scene.remove(this.prototypeLine.group);
      if (intersectsHyperboloid) {
        // console.debug("Draw hyperbola and circle");
        if (onHyperboloid) {
          // both points are on the hyperboloid, draw the hyperbola using
          // the two original points
          this.prototypeLine.setPoints(
            this.first.position,
            this.second.position
          );
        } else {
          // At most one point is on the hyperboloid
          // If necessary, project the points to the hyperboloid
          const { x: x1, y: y1, z: z1 } = this.first.position;
          const { x: x2, y: y2, z: z2 } = this.second.position;
          let scale1 = -1 / (x1 * x1 + y1 * y1 - z1 * z1);
          let scale2 = -1 / (x2 * x2 + y2 * y2 - z2 * z2);
          this.projectUp1.copy(this.first.position);
          this.projectUp2.copy(this.second.position);
          if (scale1 > 0) {
            this.projectUp1.multiplyScalar(Math.sqrt(scale1));
          }
          if (scale2 > 0) {
            this.projectUp2.multiplyScalar(Math.sqrt(scale2));
          }
          // Draw the hyperbola using the projected points
          this.prototypeLine.setPoints(this.projectUp1, this.projectUp2);
        }
        this.scene.add(this.prototypeLine.group);
      }
    } else {
      this.scene.remove(this.prototypeLine.group);
      this.scene.remove(this.circleTube);
    }
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
    this.startPoint.position.copy(position);
    this.scene.add(this.startPoint);
  }
  mouseReleased(
    event: MouseEvent,
    position: Vector3,
    normalDirection: Vector3
  ): void {
    super.mouseReleased(event, position, normalDirection);
    this.scene.remove(this.startPoint);
    if (position) {
      // const cmd = new AddHyperbolicLineCommand(
      //   this.first.position,
      //   this.first.normal,
      //   this.second.position,
      //   this.second.normal,
      //   this.infiniteLine
      // );
      // cmd.execute();
    }
  }
  activate(): void {
    // throw new Error("Method not implemented.");
  }
  deactivate(): void {
    // throw new Error("Method not implemented.");
  }
}
