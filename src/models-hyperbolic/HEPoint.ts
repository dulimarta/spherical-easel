import { MeshStandardMaterial, SphereGeometry, Vector3, Mesh } from "three";
import { HENodule } from "./HENodule";
// import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import { Text } from "troika-three-text";
import { HYPERBOLIC_LAYER } from "@/global-settings-hyperbolic";
import * as THREE from "three/webgpu";
import { CustomPointMaterial } from "@/plottables-hyperbolic/MeshFactory";

export class HEPoint extends HENodule {
  private _pointMesh: Mesh;
  private _pointMaterial: CustomPointMaterial;

  constructor(mesh: Mesh) {
    super();
    this._pointMesh = mesh;
    this._pointMaterial = mesh.material as CustomPointMaterial;

    // this.group.add(this._pointMesh);
    // console.debug("Text font", HENodule.hyperStore.font);
    // const textGeo = new TextGeometry(`Point${HENodule.POINT_COUNT}`, {
    //   font: HENodule.hyperStore.font!,
    //   size: 0.1,
    //   depth: 3
    // });

    // const textMesh = new Mesh(textGeo, material);
    // this._pointMesh.add(textMesh);
    // this.group.add(textMesh);
    // textMesh.position.copy(pos);

    HENodule.POINT_COUNT++;
    this._pointMesh.name = `P${HENodule.POINT_COUNT}`;
    this.name = `P${HENodule.POINT_COUNT}`;
    // const txtObject = new Text();
    // // console.debug("Text object material", txtObject.material);
    // txtObject.name = `La${HENodule.POINT_COUNT}`;
    // txtObject.text = `P${HENodule.POINT_COUNT}`;
    // txtObject.anchorX = "center";
    // txtObject.anchorY = normal.z > 0 ? "bottom" : "top";
    // // Add extra offset for the label in the direction of the surface normal
    // txtObject.position.copy(normal).multiplyScalar(0.05);
    // txtObject.fontSize = 0.3;
    // txtObject.color = "black"; //0x000000;

    // Copy the camera quaternion so the text is always facing the camera
    // txtObject.quaternion.copy(HENodule.hyperStore.cameraQuaternion);
    // // Disable depthTest so the text is not occluded by other objects?
    // // But the sideeffect is that text objects will never get occluded
    // // txtObject.material.depthTest = false;
    // txtObject.sync();
    // this.pointMesh.add(txtObject);
    // this.pointMesh.layers.set(
    //   pos.z > 0
    //     ? HYPERBOLIC_LAYER.upperSheetPoints
    //     : HYPERBOLIC_LAYER.lowerSheetPoints
    // );

    // const scale = pos.length();
    // let apppliedScale = -1;
    // if (scale > 1) {
    //   // clicked position is on the hyperboloid sheet, by scaling down with the length
    //   // from the origin, we compute the position of the point on the sphere
    //   apppliedScale = scale;
    // } else {
    //   // clicked position is on the sphere
    //   const hscale = pos.x * pos.x + pos.y * pos.y - pos.z * pos.z;
    //   // When hscale is positive, the projective line does not intersect the hyperboloid
    //   apppliedScale = hscale < 0 ? Math.sqrt(-hscale) : -1;
    // }
    // if (apppliedScale > 0) {
    //   const extraPointMesh = new Mesh(
    //     new SphereGeometry(0.05),
    //     new MeshStandardMaterial({ color: "white" })
    //   );
    //   extraPointMesh.name = `EP${HENodule.POINT_COUNT}`;
    //   extraPointMesh.layers.set(HYPERBOLIC_LAYER.unitSphere);
    //   // We have a secondary point to add
    //   this.group.add(extraPointMesh);
    //   extraPointMesh.position.copy(pos);
    //   extraPointMesh.position.divideScalar(apppliedScale);
    // } else {
    //   // Points on sphere with no associated hyperbolic counterpart are colored red
    //   material.color.setColorName("red");
    // }
  }

  public update(): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) return;
    this.setOutOfDate(false);
    this.shallowUpdate();
    this.updateKids();
  }
  public shallowUpdate(): void {
    this._pointMesh.visible = this.showing;
  }
  public glowingDisplay(): void {
    this._pointMaterial.glowing = true;
  }
  public normalDisplay(): void {
    this._pointMaterial.glowing = false;
  }
  get pointMaterial(): CustomPointMaterial {
    return this._pointMaterial;
  }
  get pointMesh(): Mesh {
    return this._pointMesh;
  }
}
