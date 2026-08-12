import * as THREE from "three/webgpu";
import { uniform } from "three/tsl";

interface CustomMaterialUserData {
  glowing: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>; //wrapping a boolean in a uniform doesn't currently work, so use number 1 = true and 0 = false. See https://github.com/mrdoob/three.js/issues/31479
}

interface CustomPointMaterialUserData extends CustomMaterialUserData {
  height: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  radius: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>;
  tubeAngle: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>; // the angle for the tube that points to ideal points, in radians
  position: THREE.TSL.ShaderNodeObject<THREE.UniformNode<THREE.Vector4>>;
  transformationMatrix: THREE.TSL.ShaderNodeObject<
    THREE.UniformNode<THREE.Matrix4>
  >;
}

interface CustomLabelMaterialUserData extends CustomMaterialUserData {
  xyOffSetVector: THREE.TSL.ShaderNodeObject<THREE.UniformNode<THREE.Vector2>>; // the offset for the text in multiples of unit
  scale: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>; //in multiples of the unit
  zOffsetVector: THREE.TSL.ShaderNodeObject<THREE.UniformNode<THREE.Vector3>>; // the z offset for the text so that the text is not displayed on both sides of the hyperboloid or cone, this is automatically set at the same time the transformationMatrix is set
  transformationMatrix: THREE.TSL.ShaderNodeObject<
    THREE.UniformNode<THREE.Matrix4>
  >; // This is the matrix that transforms the text from the default (z=0 in the first quadrant) to its final position facing the camera, it must be scaled first
  cornerImages: THREE.Vector3[]; // The columns in this array are the images of the corners from the default (z=0 in the first quadrant) in their final position facing the camera
  anchorPosition: THREE.TSL.ShaderNodeObject<THREE.UniformNode<THREE.Vector4>>;
}

interface CustomLineMaterialUserData extends CustomMaterialUserData {
  radius: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>; // radius of the tube for th e line
  upper: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>; //wrapping a boolean in a uniform doesn't currently work, so use number 1 = true and 0 = false
  mode: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>; // Mode is a number between 0 and 7, inclusive. The binary expansion of this number is three bits, the most significant tells whether the portion of the line before the start point is drawn, the second most significant bit tells whether the portion of the line between the start and end points is drawn, and the least significant bit tells whether the portion of the line after the end point is drawn. So 7 = 111 in binary means draw all portions of the line and 6 = 110 in binary means draw only the portion of the line before the start point and between the start and end points, but not after the end point, etc.
  startY: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>; // This is the y coordinate of inverseTransformationMatrix(start point). It is the y coordinate of point corresponding to the start point in the standard position. It is used to help determine which parts of the line to draw
  endY: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>>; // This is the y coordinate of inverseTransformationMatrix(end point). It is the y coordinate of point corresponding to the end point in the standard position. It is used to help determine which parts of the line to draw
  transformationMatrix: THREE.TSL.ShaderNodeObject<
    THREE.UniformNode<THREE.Matrix4>
  >;
  inverseTransformationMatrix: THREE.TSL.ShaderNodeObject<
    THREE.UniformNode<THREE.Matrix4>
  >; //useful for determining if a line/segment/ray is hit used in mesh.raycaster in createLine
  normalVector: THREE.Vector3;
}

export class CustomMaterial extends THREE.MeshStandardNodeMaterial {
  declare glowing: number;
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
  declare radius: number;
  declare height: number;
  declare tubeAngle: number;
  declare position: THREE.Vector4;
  declare transformationMatrix: THREE.Matrix4;

  declare userData: CustomPointMaterialUserData;

  constructor(parameters?: THREE.MeshStandardNodeMaterialParameters) {
    super(parameters);

    // Define the new uniforms unique to this child class
    const pointUniforms = {
      radius: uniform(1.0, "float"),
      height: uniform(1.0, "float"),
      tubeAngle: uniform(0.0, "float"),
      position: uniform(new THREE.Vector4(), "vec4"),
      transformationMatrix: uniform(new THREE.Matrix4(), "mat4")
    };

    Object.assign(this.userData, pointUniforms);

    this._bindUniforms(Object.keys(pointUniforms));
  }
}

export class CustomLabelMaterial extends CustomMaterial {
  declare xyOffSetVector: THREE.Vector2;
  declare scale: number;
  declare zOffsetVector: THREE.Vector3;
  declare anchorPosition: THREE.Vector4;
  declare transformationMatrix: THREE.Matrix4;
  declare cornerImages: THREE.Vector3[];

  declare userData: CustomLabelMaterialUserData;

  constructor(parameters?: THREE.MeshStandardNodeMaterialParameters) {
    super(parameters);

    const labelUniformVariables = {
      xyOffSetVector: uniform(new THREE.Vector2(0, 0), "vec2"),
      scale: uniform(1.0, "float"),
      zOffsetVector: uniform(new THREE.Vector3(0, 0, 0), "vec3"),
      transformationMatrix: uniform(new THREE.Matrix4(), "mat4"),
      anchorPosition: uniform(new THREE.Vector4())
    };

    const labelPlainVariables = { cornerImages: [] as THREE.Vector3[] };

    Object.assign(this.userData, labelUniformVariables, labelPlainVariables);
    this._bindUniforms(Object.keys(labelUniformVariables));
  }
}

export class CustomLineMaterial extends CustomMaterial {
  declare radius: number;
  declare upper: number;
  declare startY: number;
  declare endY: number;
  declare mode: number;
  declare transformationMatrix: THREE.Matrix4;
  declare inverseTransformationMatrix: THREE.Matrix4;
  declare normalVector: THREE.Vector3;

  declare userData: CustomLineMaterialUserData;

  constructor(parameters?: THREE.MeshStandardNodeMaterialParameters) {
    super(parameters);

    const lineUniformVariables = {
      radius: uniform(1.0, "float"),
      upper: uniform(0, "uint"),
      startY: uniform(1.0, "float"),
      endY: uniform(1.0, "float"),
      mode: uniform(0, "uint"),
      transformationMatrix: uniform(new THREE.Matrix4(), "mat4"),
      inverseTransformationMatrix: uniform(new THREE.Matrix4())
    };
    const linePlainVariables = {
      normalVector: new THREE.Vector3()
    };

    Object.assign(this.userData, lineUniformVariables, linePlainVariables);
    this._bindUniforms(Object.keys(lineUniformVariables)); // only bind the uniforms
  }
}
