import { HENodule } from "@/models-hyperbolic/HENodule";
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

export class CustomMaterial extends THREE.MeshStandardNodeMaterial {
  declare glowing: boolean;
  declare userData: CustomMaterialUserData;

  constructor(parameters?: THREE.MeshStandardNodeMaterialParameters) {
    super(parameters);

    const baseUniforms = {
      glowing: uniform(0, "uint")
    };

    this.userData = {
      ...baseUniforms,
      heNodule: null
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
  declare upper: boolean;
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
