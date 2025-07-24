import { Vector3 } from "three";
import { HENodule } from "./HENodule";
import { Text } from "troika-three-text";
export class HELabel extends HENodule {
  // private txtObject: Text;
  constructor(pos: Vector3) {
    super();
    const txtObject = new Text();
    txtObject.name = `La${HENodule.POINT_COUNT}`;
    txtObject.text = `P${HENodule.POINT_COUNT}`;
    txtObject.anchorX = "center";
    txtObject.anchorY = "bottom";
    // txtObject.position.set(0, 0, 0);
    txtObject.fontSize = 0.03;
    txtObject.color = "black"; //0x000000;
    console.debug(`Creating text at ${pos.toFixed(2)}`);
    txtObject.position.copy(pos);
    // Copy the camera quaternion so the text is always facing the camera
    // txtObject.quaternion.copy(HENodule.hyperStore.cameraQuaternion);
    // Disable depthTest so the text is not occluded by other objects?
    // But the sideeffect is that text objects will never get occluded
    // txtObject.material.depthTest = false;
    txtObject.sync();
    this.group.add(txtObject);
    // this.txtObject = txtObject;
  }
  public update(): void {
    throw new Error("Method not implemented.");
  }
  public shallowUpdate(): void {
    throw new Error("Method not implemented.");
  }
  public glowingDisplay(): void {
    throw new Error("Method not implemented.");
  }
  public normalDisplay(): void {
    throw new Error("Method not implemented.");
  }
}
