import {
  Vector2,
  Vector3,
  Scene,
  Mesh,
  TubeGeometry,
  MeshStandardMaterial,
  Object3D
} from "three";
import { PoseTracker } from "./PoseTracker";
import { CircularCurve } from "@/mesh/CircularCurve";
import { createPoint } from "@/mesh/MeshFactory";
// import { AddHyperbolicLineCommand } from "@/commands/AddHyperbolicLineCommand";
import { SphericalLine } from "@/models-hyperbolic/SphericalLine";

// const Z_AXIS = new Vector3(0, 0, 1);
// const ORIGIN = new Vector3(0, 0, 0);
export class SphericalLineHandler extends PoseTracker {
  prototypeLine = new SphericalLine();
  // The line is the intersection between a plane spanned by
  // the origin, the two points, and the hyperboloid
  private circlePath = new CircularCurve();
  private circleTube = new Mesh(
    new TubeGeometry(this.circlePath, 50, 0.03, 12, false),
    new MeshStandardMaterial({ color: "springgreen" })
  );

  private startPoint = createPoint(0.05, "aqua");
  private infiniteLine = false;
  private sphere: Object3D;
  constructor(s: Scene, sph: Object3D) {
    super(s);
    this.sphere = sph;
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
    if (
      this.isDragging &&
      // both points must be on the hyperboloid or sphere
      !isNaN(this.first.position.x) &&
      !isNaN(this.second.position.x)
    ) {
      // this.planeNormal
      //   .crossVectors(this.second.position, this.first.position)
      //   .normalize();
      this.prototypeLine.setPoints(this.first.position, this.second.position);
      // With the lookAt() function below, the coordinate frame of hPlane would be as follows:
      // - Its X-axis is on the XY plane (i.e. its z component is zero)
      // - Its Y-axis is on a plane perpendicular to the XY-plane]
      // - Its Z-axis is the normal vector computed from both mouse points

      this.sphere.add(this.prototypeLine.group);
    } else {
      this.sphere.remove(this.prototypeLine.group);
      this.sphere.remove(this.circleTube);
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
    this.sphere.add(this.startPoint);
  }
  mouseReleased(
    event: MouseEvent,
    position: Vector3,
    normalDirection: Vector3
  ): void {
    super.mouseReleased(event, position, normalDirection);
    this.sphere.remove(this.startPoint);
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
