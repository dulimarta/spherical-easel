import * as THREE from "three/webgpu";
import { uniform } from "three/tsl";

interface CustomMaterialUserData {
  glowing: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>; //wrapping a boolean in a uniform doesn't currently work, so use number 1 = true and 0 = false
}

interface CustomPointMaterialUserData extends CustomMaterialUserData {
  angle: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  radius: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  height: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  upper: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>; //wrapping a boolean in a uniform doesn't currently work, so use number 1 = true and 0 = false
  position: THREE.TSL.ShaderNodeObject<THREE.UniformNode<THREE.Vector3>>;
}

interface CustomTextMaterialUserData extends CustomMaterialUserData {
  angle: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>; // used if the point is at infinity
  upper: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>; //wrapping a boolean in a uniform doesn't currently work, so use number 1 = true and 0 = false
  position: THREE.TSL.ShaderNodeObject<THREE.UniformNode<THREE.Vector3>>; // used if the point is not at infinity
  offsetX: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>; // the offset for the text in multiples of unit from the center of the text object
  offsetY: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>; // the offset for the text in multiples of unit from the center of the text object
  scale: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>; //in multiples of the unit
  unitCameraDirection: THREE.TSL.ShaderNodeObject<
    THREE.UniformNode<THREE.Vector3>
  >; // used instead of quaternion because setting the quaternion doesn't work for WebGPU node material
  labelDisplayInside: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>; // label the label on the inside ( value 1 = true) or outside( value = 0 false)
}

export class CustomMaterial extends THREE.MeshStandardNodeMaterial {
  declare glowing: boolean;
  declare userData: CustomMaterialUserData;

  constructor(parameters?: THREE.MeshStandardNodeMaterialParameters) {
    super(parameters);

    const baseUniforms = {
      glowing: uniform(0, "uint")
    };

    this.userData = {
      ...baseUniforms
    };

    this._bindUniforms(Object.keys(baseUniforms));
  }

  // Automates the getter/setter logic for any uniform key provided
  protected _bindUniforms(keys: string[]) {
    for (const key of keys) {
      Object.defineProperty(this, key, {
        get: () => {
          const node = this.userData[key];
          // Logic for Boolean/Uint conversion (0/2)
          return node.nodeType === "uint" ? node.value >= 1 : node.value;
        },
        set: v => {
          const node = this.userData[key];
          // Automatically handle boolean to uint conversion
          if (typeof v === "boolean" && node.nodeType === "uint") {
            node.value = v ? 1 : 0;
          } else {
            node.value = v;
          }
        },
        configurable: true
      });
    }
  }
}

export class CustomPointMaterial extends CustomMaterial {
  declare angle: number;
  declare radius: number;
  declare height: number;
  declare upper: number;
  declare position: THREE.Vector3;

  declare userData: CustomPointMaterialUserData;

  constructor(parameters?: THREE.MeshStandardNodeMaterialParameters) {
    super(parameters);

    // Define the new uniforms unique to this child class
    const pointUniforms = {
      angle: uniform(0.0, "float"),
      radius: uniform(1.0, "float"),
      height: uniform(1.0, "float"),
      upper: uniform(1, "uint"),
      position: uniform(new THREE.Vector3(0, 0, 0), "vec3")
    };

    Object.assign(this.userData, pointUniforms);

    this._bindUniforms(Object.keys(pointUniforms));
  }
}

export class CustomTextMaterial extends CustomMaterial {
  declare angle: number;
  declare upper: number;
  declare position: THREE.Vector3;
  declare offsetX: number;
  declare offsetY: number;
  declare scale: number;
  declare unitCameraDirection: THREE.Vector3;
  declare labelDisplayInside: number;

  declare userData: CustomTextMaterialUserData;

  constructor(parameters?: THREE.MeshStandardNodeMaterialParameters) {
    super(parameters);

    const textUniforms = {
      angle: uniform(0.0, "float"),
      upper: uniform(1, "uint"),
      position: uniform(new THREE.Vector3(0, 0, 0), "vec3"),
      offsetX: uniform(0.0, "float"),
      offsetY: uniform(0.0, "float"),
      scale: uniform(0.0, "float"),
      unitCameraDirection: uniform(new THREE.Vector3(1, 1, 1), "vec3"),
      labelDisplayInside: uniform(1, "uint")
    };

    Object.assign(this.userData, textUniforms);

    this._bindUniforms(Object.keys(textUniforms));
  }
}
