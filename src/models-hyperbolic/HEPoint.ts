import { MeshStandardMaterial, SphereGeometry, Vector3, Mesh } from "three";
import { HENodule } from "./HENodule";
// import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import { Text } from "troika-three-text";
import { HYPERBOLIC_LAYER } from "@/global-settings-spherical";
export class HEPoint extends HENodule {
  private pointMesh: Mesh;
  constructor(pos: Vector3, normal: Vector3) {
    super();
    const material = new MeshStandardMaterial({ color: "white" });
    this.pointMesh = new Mesh(new SphereGeometry(0.05), material);
    this.pointMesh.position.copy(pos);
    this.group.add(this.pointMesh);
    // console.debug("Text font", HENodule.hyperStore.font);
    // const textGeo = new TextGeometry(`Point${HENodule.POINT_COUNT}`, {
    //   font: HENodule.hyperStore.font!,
    //   size: 0.1,
    //   depth: 3
    // });

    // const textMesh = new Mesh(textGeo, material);
    // this.pointMesh.add(textMesh);
    // this.group.add(textMesh);
    // textMesh.position.copy(pos);

    HENodule.POINT_COUNT++;
    this.pointMesh.name = `P${HENodule.POINT_COUNT}`;
    this.name = `P${HENodule.POINT_COUNT}`;
    const txtObject = new Text();
    // console.debug("Text object material", txtObject.material);
    txtObject.name = `La${HENodule.POINT_COUNT}`;
    txtObject.text = `P${HENodule.POINT_COUNT}`;
    txtObject.anchorX = "center";
    txtObject.anchorY = normal.z > 0 ? "bottom" : "top";
    // Add extra offset for the label in the direction of the surface normal
    txtObject.position.copy(normal).multiplyScalar(0.05);
    txtObject.fontSize = 0.3;
    txtObject.color = "black"; //0x000000;

    // Copy the camera quaternion so the text is always facing the camera
    txtObject.quaternion.copy(HENodule.hyperStore.cameraQuaternion);
    // Disable depthTest so the text is not occluded by other objects?
    // But the sideeffect is that text objects will never get occluded
    // txtObject.material.depthTest = false;
    txtObject.sync();
    this.pointMesh.add(txtObject);
    this.pointMesh.layers.set(
      pos.z > 0
        ? HYPERBOLIC_LAYER.upperSheetPoints
        : HYPERBOLIC_LAYER.lowerSheetPoints
    );

    const scale = pos.length();
    let apppliedScale = -1;
    if (scale > 1) {
      // clicked position is on the hyperboloid sheet, by scaling down with the length
      // from the origin, we compute the position of the point on the sphere
      apppliedScale = scale;
    } else {
      // clicked position is on the sphere
      const hscale = pos.x * pos.x + pos.y * pos.y - pos.z * pos.z;
      // When hscale is positive, the projective line does not intersect the hyperboloid
      apppliedScale = hscale < 0 ? Math.sqrt(-hscale) : -1;
    }
    if (apppliedScale > 0) {
      const extraPointMesh = new Mesh(
        new SphereGeometry(0.05),
        new MeshStandardMaterial({ color: "white" })
      );
      extraPointMesh.name = `EP${HENodule.POINT_COUNT}`;
      extraPointMesh.layers.set(HYPERBOLIC_LAYER.unitSphere);
      // We have a secondary point to add
      this.group.add(extraPointMesh);
      extraPointMesh.position.copy(pos);
      extraPointMesh.position.divideScalar(apppliedScale);
    } else {
      // Points on sphere with no associated hyperbolic counterpart are colored red
      material.color.setColorName("red");
    }
  }

  public update(): void {
    throw new Error("Method not implemented.");
  }
  public shallowUpdate(): void {
    throw new Error("Method not implemented.");
  }
  public glowingDisplay(): void {
    // console.debug(`Attempt to glow ${this.name}`);
    (this.pointMesh.material as MeshStandardMaterial).color.set("blue");
    this.pointMesh.scale.set(1.25, 1.25, 1.25);
  }
  public normalDisplay(): void {
    // console.debug(`Attempt to unglow ${this.name}`);
    (this.pointMesh.material as MeshStandardMaterial).color.set("white");
    this.pointMesh.scale.set(1.0, 1.0, 1.0);
  }
}
