import {
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  TubeGeometry,
  Vector3
} from "three";
import { HENodule } from "./HENodule";
import { HyperbolicCurve } from "@/plottables-hyperbolic/HyperbolicCurve";
import { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";

const ORIGIN = new Vector3();
const Z_AXIS = new Vector3(0, 0, 1);
export class HELine extends HENodule {
  startPoint = new Vector3();
  endPoint = new Vector3();
  planeNormal = new Vector3();
  planeDir1 = new Vector3();
  planeDir2 = new Vector3();
  planeCoordinateFrame = new Matrix4();
  hyperbolaPath = new HyperbolicCurve();
  normalColor = "yellow";
  isInfinite: boolean;
  private hyperbolaTube = new Mesh(
    new TubeGeometry(this.hyperbolaPath, 50, 0.05, 12, false),
    new MeshStandardMaterial({ color: this.normalColor })
  );
  constructor(
    startPos: Vector3 = new Vector3(0, 0, 1),
    endPos: Vector3 = new Vector3(0, 0, 1),
    isInfinite: boolean = false
  ) {
    super();
    this.startPoint.copy(startPos);
    this.endPoint.copy(endPos);
    this.isInfinite = isInfinite;
    this.group.add(this.hyperbolaTube);
    if (isInfinite) {
      HENodule.LINE_COUNT++;
      this.name = `Li${HENodule.LINE_COUNT}`;
    } else {
      HENodule.SEGMENT_COUNT++;
      this.name = `Ls${HENodule.SEGMENT_COUNT}`;
    }
    this.hyperbolaTube.name = this.name;
    this.hyperbolaTube.layers.set(
      this.startPoint.z > 0
        ? HYPERBOLIC_LAYER.upperSheetLines
        : HYPERBOLIC_LAYER.lowerShettLines
    );
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
    if (this.planeNormal.isZero()) return;
    this.planeCoordinateFrame.lookAt(ORIGIN, this.planeNormal, Z_AXIS);
    this.planeCoordinateFrame.extractBasis(
      this.planeDir1,
      this.planeDir2,
      this.planeNormal
    );

    this.hyperbolaPath.setPointsAndDirections(
      this.startPoint,
      this.endPoint,
      this.planeDir1,
      this.planeDir2,
      this.isInfinite
    );
    this.hyperbolaTube.geometry.dispose();
    // this.hyperbolaTube.material.dispose();
    // this.hyperbolaTube.clear();
    this.hyperbolaTube.geometry = new TubeGeometry(
      this.hyperbolaPath,
      50,
      0.03,
      12,
      false
    );
  }
  public glowingDisplay(): void {
    const material = this.hyperbolaTube.material as MeshStandardMaterial;
    // if (this.group.children.length > 0) {
    //   const mesh = this.group.children[0] as Mesh;
    // const material = mesh.material as MeshBasicMaterial;
    this.normalColor = "#" + material.color.getHexString();
    material.color.set("springgreen");
    // }
  }
  public normalDisplay(): void {
    const material = this.hyperbolaTube.material as MeshStandardMaterial;
    material.color.set(this.normalColor);
  }
}
