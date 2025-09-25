import {
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  TubeGeometry,
  Vector3
} from "three";
import { HENodule } from "./HENodule";
import { HYPERBOLIC_LAYER } from "@/global-settings";
import { CircularCurve } from "@/plottables-hyperbolic/CircularCurve";

const ORIGIN = new Vector3();
const Z_AXIS = new Vector3(0, 0, 1);
export class SphericalLine extends HENodule {
  startPoint = new Vector3();
  endPoint = new Vector3();
  planeNormal = new Vector3();
  planeDir1 = new Vector3();
  planeDir2 = new Vector3();
  planeCoordinateFrame = new Matrix4();
  circlePath = new CircularCurve();
  normalColor = "yellow";
  isInfinite: boolean;
  private circleTube = new Mesh(
    new TubeGeometry(this.circlePath, 50, 0.05, 12, false),
    new MeshStandardMaterial({ color: this.normalColor })
  );
  constructor(
    startPos: Vector3 = new Vector3(),
    endPos: Vector3 = new Vector3(),
    isInfinite: boolean = false
  ) {
    super();
    this.startPoint.copy(startPos);
    this.endPoint.copy(endPos);
    this.isInfinite = isInfinite;
    this.group.add(this.circleTube);
    if (isInfinite) {
      HENodule.LINE_COUNT++;
      this.name = `Li${HENodule.LINE_COUNT}`;
    } else {
      HENodule.SEGMENT_COUNT++;
      this.name = `Ls${HENodule.SEGMENT_COUNT}`;
    }
    this.circleTube.name = this.name;
    this.circleTube.layers.set(HYPERBOLIC_LAYER.unitSphere);
    this.shallowUpdate();
  }

  public markInfinite(onOff: boolean) {
    this.isInfinite = onOff;
  }
  public setPoints(startPos: Vector3, endPos: Vector3) {
    this.startPoint.copy(startPos);
    this.endPoint.copy(endPos);
    this.shallowUpdate();
  }
  public update(): void {
    // throw new Error("Method not implemented.");
  }
  public shallowUpdate(): void {
    this.planeNormal.crossVectors(this.endPoint, this.startPoint).normalize();
    this.planeCoordinateFrame.lookAt(ORIGIN, this.planeNormal, Z_AXIS);
    this.planeCoordinateFrame.extractBasis(
      this.planeDir1,
      this.planeDir2,
      this.planeNormal
    );

    this.circlePath.setPointsAndDirections(
      this.startPoint,
      this.endPoint,
      this.planeDir1,
      this.planeDir2,
      this.isInfinite
    );
    this.circleTube.geometry.dispose();
    // this.circleTube.material.dispose();
    // this.circleTube.clear();
    this.circleTube.geometry = new TubeGeometry(
      this.circlePath,
      50,
      0.03,
      12,
      false
    );
  }
  public glowingDisplay(): void {
    const material = this.circleTube.material as MeshStandardMaterial;
    // if (this.group.children.length > 0) {
    //   const mesh = this.group.children[0] as Mesh;
    // const material = mesh.material as MeshBasicMaterial;
    this.normalColor = "#" + material.color.getHexString();
    material.color.set("springgreen");
    // }
  }
  public normalDisplay(): void {
    const material = this.circleTube.material as MeshStandardMaterial;
    material.color.set(this.normalColor);
  }
}
