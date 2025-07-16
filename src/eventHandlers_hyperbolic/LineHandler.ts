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
import { HyperbolaCurve } from "@/mesh/HyperbolaCurve";
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
  private hyperbolaPath = new HyperbolaCurve();
  private hyperbolaTube = new Mesh(
    new TubeGeometry(this.hyperbolaPath, 50, 0.05, 12, false),
    new MeshStandardMaterial({ color: "springgreen" })
  );

  private startPoint = createPoint(0.05, "yellow");
  private hPlane = new Mesh(
    new PlaneGeometry(6, 10, 20, 20),
    new MeshStandardMaterial({
      color: "darkred",
      roughness: 0.4,
      side: DoubleSide
    })
  );
  private hPlaneCF = new Matrix4();
  constructor(s: Scene) {
    super(s);
    this.arrow1.setColor(0xff1187);
    this.arrow2.setColor(0x34e1eb);
    this.arrow3.setColor(0xffcc00);
    this.arrow4.setColor(0xa641bf);
    this.hPlane.matrixAutoUpdate = false;
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
      !isNaN(this.second.position.x)
    ) {
      console.debug(
        `Mouse was dragged from ${this.first.position.toFixed(
          2
        )} to ${this.second.position.toFixed(2)}`
      );
      // Compute the normal vector of the plane that intersects the
      // paraboloid
      this.planeNormal
        .crossVectors(this.first.position, this.second.position)
        .normalize();
      this.hPlaneCF.lookAt(ORIGIN, this.planeNormal, Z_AXIS);
      console.debug("HPlane CF", this.hPlaneCF.elements);
      this.hPlane.matrix.copy(this.hPlaneCF);
      this.hPlane.updateMatrixWorld();
      const xyHypotenuse = Math.sqrt(
        this.planeNormal.x * this.planeNormal.x +
          this.planeNormal.y * this.planeNormal.y
      );
      const pitchAngle = Math.atan2(this.planeNormal.z, xyHypotenuse);
      const rotationAngle =
        Math.PI / 2 + Math.atan2(this.planeNormal.y, this.planeNormal.x);

      console.debug(
        `Pitch angle is ${pitchAngle.toDegrees().toFixed(2)}, ` +
          `Rotation angle is ${rotationAngle.toDegrees().toFixed(2)}`
      );
      this.planeDir1
        .set(0, Math.sin(pitchAngle), Math.cos(pitchAngle))
        .normalize();
      this.hyperbolaPath.setDirection(this.planeDir1);
      this.hyperbolaTube.geometry.dispose();
      this.hyperbolaTube.material.dispose();
      this.scene.remove(this.hyperbolaTube);
      this.hyperbolaTube = new Mesh(
        new TubeGeometry(this.hyperbolaPath, 50, 0.03, 12, false),
        new MeshStandardMaterial({ color: "springgreen" })
      );
      this.hyperbolaTube.rotation.z = rotationAngle;
      this.scene.add(this.hyperbolaTube);
      console.debug(
        `Plane spanned by ${this.planeDir1.toFixed(
          2
        )} and ${this.planeDir2.toFixed(2)}`
      );
      // this.scene.remove(this.hyperbolaTube);
      // this.hyperbolaPath.setPlaneDirection(this.planeDir1, this.planeDir2);
      // this.hyperbolaTube = new Mesh(
      //   new TubeGeometry(this.hyperbolaPath, 50, 0.05, 12, false),
      //   new MeshStandardMaterial({ color: "greenyellow" })
      // );
      // this.scene.add(this.hyperbolaTube);
    } else {
      this.scene.remove(this.hyperbolaTube);
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
