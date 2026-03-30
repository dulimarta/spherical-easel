import SETTINGS from "@/global-settings-hyperbolic";
import * as THREE from "three/webgpu";
import {
  uniform,
  float,
  vec3,
  vec4,
  Fn,
  positionLocal,
  varying,
  smoothstep,
  attribute,
  uv,
  mix,
  color,
  modelWorldMatrix,
  sin,
  cos,
  mat3,
  select,
  oscSine,
  oscSawtooth,
  If,
  time,
  cross,
  dot,
  acos,
  atan,
  PI,
  abs,
  array,
  min,
  max,
  negate,
  mat4,
  Loop,
  int,
  Var,
  normalize,
  sqrt,
  Return,
  vec2,
  storage,
  instancedArray
} from "three/tsl";
// import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { Line2 } from "three/addons/lines/Line2.js";
import {
  Vector3,
  Mesh,
  DoubleSide,
  SphereGeometry,
  CylinderGeometry,
  LineCurve3,
  ConeGeometry
} from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";
import { LineGeometry } from "three/examples/jsm/Addons.js";
import { CustomPointMaterial, CustomLabelMaterial } from "./MaterialFactory";
import {
  intersectWithHyperboloid,
  intersectWithPointAtInfinityStrip
} from "@/utils/helpingHEFunctions";

const pulseRate = 0.3; // selected objects pulse and this set the rate oscSine(pulseRate*time)
const pulseSizePercent = 0.8; // selected objects grow between 1 and 1+pulseSizePercent times there size

// The z coordinate of all points on the hyperboloid(s) are between zUpperClip and zLowerClip and their negations
export const zUpperClip = uniform(1.0, "float");
export const zLowerClip = uniform(-1.0, "float");

// The z coordinate of all point of the upperPointsAtInfinity are between zUpperPAIClipPlus and zUpperPAIClipMinus,
export const zUpperPAIClipPlus = uniform(2.0, "float");
export const zUpperPAIClipMinus = uniform(1.5, "float");

// The z coordinate of all point of the lowerPointsAtInfinity are between zLowerPAIClipPlus and zLowerPAIClipMinus,
export const zLowerPAIClipPlus = uniform(-1.5, "float");
export const zLowerPAIClipMinus = uniform(-2.0, "float");

export const unitLength: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>> =
  uniform(1.0, "float");

export async function createLabel({
  textGeometry,
  name,
  atInfinity,
  upper,
  angle,
  position,
  myColor = 0xffffff //0x808080,
}: {
  textGeometry: THREE.BufferGeometry<THREE.NormalBufferAttributes>;
  name: string;
  atInfinity: boolean;
  upper: boolean;
  angle: number;
  position: THREE.Vector3;
  myColor?: number;
}) {
  const labelMaterial = new CustomLabelMaterial({ color: myColor });
  const glowingUniform = labelMaterial.userData.glowing;
  const zOffsetVectorUniform = labelMaterial.userData.zOffsetVector;
  const transformationMatrixUniform =
    labelMaterial.userData.transformationMatrix;
  const xyOffsetUniform = labelMaterial.userData.xyOffSetVector;
  const scaleUniform = labelMaterial.userData.scale;

  const positionFunction = Fn(() => {
    const myScale = select(
      glowingUniform.greaterThan(0.5),
      scaleUniform.mul(
        oscSine(time.mul(pulseRate)).mul(pulseSizePercent).add(1)
      ),
      scaleUniform
    );

    const scaleAndOffsetMatrix = mat4(
      vec4(myScale.mul(unitLength), float(0), float(0), float(0)), // column 0
      vec4(float(0), myScale.mul(unitLength), float(0), float(0)), // column 1
      vec4(float(0), float(0), myScale.mul(unitLength), float(0)), // column 2
      vec4(
        xyOffsetUniform.x.mul(unitLength),
        xyOffsetUniform.y.mul(unitLength),
        0,
        1.0
      ) // column 3
    );

    return transformationMatrixUniform
      .mul(scaleAndOffsetMatrix.mul(vec4(positionLocal, 1)))
      .xyz.add(zOffsetVectorUniform);
  });
  labelMaterial.positionNode = positionFunction();

  const colorFunction = Fn(() => {
    const returnColor = select(
      glowingUniform.greaterThan(0.5),
      color(labelMaterial.color).mul(
        oscSine(time.mul(pulseRate)).mul(pulseSizePercent).add(1)
      ),
      color(labelMaterial.color).mul(1.0)
    );

    return returnColor;
  });
  labelMaterial.colorNode = colorFunction();

  const returnMesh = new Mesh(textGeometry, labelMaterial);
  returnMesh.name = name;

  // override raycaster so that the translated label can be hit
  returnMesh.raycast = function (raycaster, intersects) {
    if (atInfinity) {
      const tempIntersections = intersectWithPointAtInfinityStrip(
        raycaster.ray.origin,
        raycaster.ray.direction,
        raycaster.near,
        raycaster.far,
        upper
      );
      tempIntersections.forEach(intersection => {
        // check to make sure that the angle of intersection is close to the angle of the label AND the upper/lower is correct
        if (
          Math.abs(
            angle - Math.atan2(intersection.point.y, intersection.point.x)
          ) < 0.1 &&
          upper === intersection.point.z > 0
        ) {
          // console.log("label hit", this.name, angle);
          intersects.push({
            distance: intersection.distance,
            point: intersection.point.clone(),
            normal: intersection.normal,
            object: this
          });
        }
      });
    } else {
      const tempIntersections = intersectWithHyperboloid(
        raycaster.ray.origin,
        raycaster.ray.direction,
        raycaster.near,
        raycaster.far,
        upper
      );
      tempIntersections.forEach(intersection => {
        if (position.distanceTo(intersection.point) < unitLength.value * 2.5) {
          // console.log(
          //   "label hit",
          //   this.name,
          //   position.distanceTo(intersection.point),
          //   unitLength.value * 0.5
          // );
          intersects.push({
            distance: intersection.distance,
            point: intersection.point.clone(),
            normal: intersection.normal,
            object: this
          });
        }
      });
    }
  };
  return returnMesh;
}

export function createPoint({
  radius: radius = 0.15,
  myColor = 0xff8080, //ffb3b3, //ff8080, //"white", //"0xBEBFC5",
  name,
  upper,
  position,
  temporary = false //used in handlers,flag so that temporary objects are never hit with ray casting
}: {
  radius?: number;
  myColor?: number; //"0xBEBFC5",
  name: string;
  upper: boolean;
  position: Vector3;
  temporary?: boolean;
}): Mesh {
  const sphereMaterial = new CustomPointMaterial({
    color: myColor,
    roughness: 0.3
  });
  const positionUniform = sphereMaterial.userData.position;
  const radiusUniform = sphereMaterial.userData.radius;
  const glowingUniform = sphereMaterial.userData.glowing;
  const upperUniform = sphereMaterial.userData.upper;
  radiusUniform.value = radius;
  upperUniform.value = upper ? 1 : 0;
  positionUniform.value = position;

  const positionFunction = Fn(() => {
    // Glowing points size pulses
    const returnNode = select(
      glowingUniform.greaterThan(0.5),
      positionLocal
        .mul(unitLength)
        .mul(oscSine(time.mul(pulseRate)).mul(pulseSizePercent).add(1))
        .mul(radiusUniform)
        .add(positionUniform),
      positionLocal.mul(unitLength).mul(radiusUniform).add(positionUniform)
    );

    return returnNode;
  });

  sphereMaterial.positionNode = positionFunction();

  const colorFunction = Fn(() => {
    // Clip points to the visible part of the hyperboloid
    if (upperUniform.value > 0.5) {
      positionLocal.z
        .add(unitLength.mul(radiusUniform))
        .greaterThan(zUpperClip)
        .discard();
    } else {
      positionLocal.z
        .sub(unitLength.mul(radiusUniform))
        .lessThan(zLowerClip)
        .discard();
    }
    // // Glowing points color pulses
    const returnColor = select(
      glowingUniform.greaterThan(0.5),
      color(sphereMaterial.color).mul(
        oscSine(time.mul(pulseRate)).mul(pulseSizePercent).add(1)
      ),
      color(sphereMaterial.color).mul(1.0)
    );

    return returnColor;
  });
  sphereMaterial.colorNode = colorFunction();

  const returnMesh = new Mesh(new SphereGeometry(), sphereMaterial);

  returnMesh.name = name;

  returnMesh.raycast = function (raycaster, intersects) {
    const myUpper = positionUniform.value.z > 0;
    if (temporary) return; //temporary objects are never hit
    const tempIntersections = intersectWithHyperboloid(
      raycaster.ray.origin,
      raycaster.ray.direction,
      raycaster.near,
      raycaster.far,
      myUpper
    );
    tempIntersections.forEach(intersection => {
      // If the raycaster origin is the camera position, then if we are within the apparent radius (plus 150%) of the point, it is hit by the raycaster
      if (
        positionUniform.value.distanceTo(intersection.point) <
        radiusUniform.value * unitLength.value * 2.5
      ) {
        intersects.push({
          distance: intersection.distance,
          point: intersection.point.clone(),
          normal: intersection.normal,
          object: this
        });
      }
    });
  };

  return returnMesh;
}

export function createPointAtInfinity({
  angle,
  radius = 0.18, // in multiples of the unit length
  height = 0.33, //  in multiples of the unit length
  myColor = 0xff8080, //"white", //"0xBEBFC5",
  name,
  upper,
  temporary = false //used in handlers,flag so that temporary objects are never hit with ray casting
}: {
  angle: number;
  radius?: number;
  height?: number;
  myColor?: number;
  name: string;
  upper: boolean;
  temporary?: boolean;
}): Mesh {
  const coneMaterial = new CustomPointMaterial({
    color: myColor,
    opacity: 1.0
  });
  const angleUniform = coneMaterial.userData.angle;
  const radiusUniform = coneMaterial.userData.radius;
  const heightUniform = coneMaterial.userData.height;
  const upperUniform = coneMaterial.userData.upper;
  const glowingUniform = coneMaterial.userData.glowing;
  angleUniform.value = angle;
  radiusUniform.value = radius;
  heightUniform.value = height;
  upperUniform.value = upper ? 1 : 0; // we use 1/0 because uniform wrapping boolean doesn't work

  coneMaterial.positionNode = Fn(() => {
    const scaleAndTranslate = positionLocal
      .add(vec3(0, 0.5, 0))
      .mul(
        vec3(
          select(
            glowingUniform.greaterThan(0.5), // selected nodes pulse in size
            radiusUniform
              .mul(unitLength)
              .mul(oscSine(time.mul(pulseRate)).mul(pulseSizePercent).add(1)),
            radiusUniform.mul(unitLength)
          ),
          heightUniform.mul(unitLength),
          select(
            glowingUniform.greaterThan(0.5),
            radiusUniform
              .mul(unitLength)
              .mul(oscSine(time.mul(pulseRate)).mul(pulseSizePercent).add(1)),
            radiusUniform.mul(unitLength)
          )
        )
      )
      .add(vec3(0, zUpperPAIClipMinus.mul(Math.SQRT2), 0));

    const minusPlusOne = select(
      upperUniform.greaterThan(0.5),
      float(-1.0),
      float(1.0)
    );
    // ca -sa 0        1   0     0
    // sa  ca 0    *   0  c+/-45   -s+/-45
    // 0   0  1        0  s+/-45    c+/-45

    const rotationMatrixAboutZAxis = zAxisRotationMatrix(
      float(Math.PI / 2).sub(angleUniform)
    );

    const rotationMatrixAboutXAxis = xAxisRotationMatrix(
      float(Math.PI / 4).mul(minusPlusOne)
    );

    return rotationMatrixAboutZAxis
      .mul(rotationMatrixAboutXAxis)
      .mul(scaleAndTranslate);
  })();

  const colorFunction = Fn(() => {
    // Glowing points color pulses
    const returnColor = select(
      glowingUniform.greaterThan(0.5),
      color(coneMaterial.color).mul(
        oscSine(time.mul(pulseRate)).mul(pulseSizePercent).add(1)
      ),
      color(coneMaterial.color).mul(1.0)
    );

    return returnColor;
  });
  coneMaterial.colorNode = colorFunction();

  const returnMesh = new Mesh(new ConeGeometry(), coneMaterial);
  returnMesh.name = name;

  returnMesh.raycast = function (raycaster, intersects) {
    if (temporary) return; // temporary objects are never hit
    const myUpper = upperUniform.value > 0.5 ? true : false;
    const tempIntersections = intersectWithPointAtInfinityStrip(
      raycaster.ray.origin,
      raycaster.ray.direction,
      raycaster.near,
      raycaster.far,
      myUpper
    );
    tempIntersections.forEach(intersection => {
      const hitAngle = Math.atan2(intersection.point.y, intersection.point.x);
      // If the angle is within the apparent radius of the base (plus 10%), it is hit by the raycaster
      // console.log("PAI check", hitAngle - angleUniform.value);
      if (
        Math.abs(hitAngle - angleUniform.value) <
        radiusUniform.value * unitLength.value * 1.1
      ) {
        intersects.push({
          distance: intersection.distance,
          point: intersection.point.clone(),
          normal: intersection.normal,
          object: this
        });
      }
    });
  };

  return returnMesh;
}

export function createPointAtInfinityTube(
  upper: number = 1, // we must use 1/0 for true/false because TSL doesn't recognize boolean wrapped uniforms
  angle: number = 0,
  radius: number = 0.05, // in multiples of the unit length
  myColor: number = 0xffbbbb, // 0xffbbbb, // 0xff9999, //"white",
  name: string = "tempPointAtInfinityTube"
): Mesh {
  const coneMaterial = new CustomPointMaterial({
    color: myColor,
    opacity: 1.0,
    side: DoubleSide
  });
  const angleUniform = coneMaterial.userData.angle;
  const radiusUniform = coneMaterial.userData.radius;
  const upperUniform = coneMaterial.userData.upper;
  angleUniform.value = angle;
  radiusUniform.value = radius;
  upperUniform.value = upper;

  coneMaterial.positionNode = Fn(() => {
    // return positionLocal;
    const scaleAndTranslate = positionLocal.mul(
      vec3(
        radiusUniform.mul(unitLength),
        zUpperPAIClipMinus.mul(Math.SQRT2),
        radiusUniform.mul(unitLength)
      )
    );
    // .mul(vec3(0, float(Math.SQRT2), 0));
    // .mul(vec3(0, zUpperPAIClipMinus.mul(Math.SQRT2), 0));
    // return scaleAndTranslate;
    const minusPlusOne = select(upperUniform.equal(1), float(-1.0), float(1.0));
    // ca -sa 0        1   0     0
    // sa  ca 0    *   0  c+/-45   -s+/-45
    // 0   0  1        0  s+/-45    c+/-45

    const rotationMatrixAboutZAxis = zAxisRotationMatrix(
      float(Math.PI / 2).sub(angleUniform)
    );

    const rotationMatrixAboutXAxis = xAxisRotationMatrix(
      float(Math.PI / 4).mul(minusPlusOne)
    );
    // return scaleAndTranslate;
    // return rotationMatrixAboutXAxis.mul(scaleAndTranslate);

    return rotationMatrixAboutZAxis
      .mul(rotationMatrixAboutXAxis)
      .mul(scaleAndTranslate);
  })();

  const absOfLocalPositionZ = varying(positionLocal.z).abs();
  // const baseColor = color(coneMaterial.color);
  const percentPad = 0.1; // percent of the total length of the tube that is not dashed at the ends.
  const numberOfIntervals = 3; // same as the number of dashes traveling up the shank.
  const rateOfOscillation = 0.4; // controls the speed of the dash movement along the shank.
  const percentOfEachIntervalThatIsDash = 0.5;
  const totalLengthOfShank = zUpperPAIClipMinus;
  const lengthOfPad = totalLengthOfShank.mul(percentPad);
  const lengthOfEachInterval = totalLengthOfShank
    .sub(lengthOfPad.mul(2))
    .div(numberOfIntervals);
  const lengthOfDash = lengthOfEachInterval.mul(
    percentOfEachIntervalThatIsDash
  );
  const totalLengthOfGaps = lengthOfEachInterval.sub(lengthOfDash); //This lengths is split into before and after the dash, with offset being the length before the dash that is determined by a sawtooth function.

  const clippingLogic = Fn(() => {
    const result = color(coneMaterial.color);
    If(
      absOfLocalPositionZ
        .greaterThan(lengthOfPad)
        .and(absOfLocalPositionZ.lessThan(totalLengthOfShank.sub(lengthOfPad))),
      () => {
        const lengthOfPositionInInterval = absOfLocalPositionZ
          .sub(lengthOfPad.mul(2))
          .mod(lengthOfEachInterval);
        const startOfDash = oscSawtooth(time.mul(rateOfOscillation)).mul(
          lengthOfEachInterval
        );
        If(startOfDash.lessThan(totalLengthOfGaps), () => {
          lengthOfPositionInInterval
            .lessThan(startOfDash)
            .or(
              lengthOfPositionInInterval.greaterThan(
                startOfDash.add(lengthOfDash)
              )
            )
            .discard();
        }).Else(() => {
          lengthOfPositionInInterval
            .greaterThan(startOfDash.sub(totalLengthOfGaps))
            .and(lengthOfPositionInInterval.lessThan(startOfDash))
            .discard();
        });
      }
    );

    return result;
  });

  coneMaterial.colorNode = clippingLogic();

  // path is the center line of the initial(untransformed) tube.
  const path = new LineCurve3(new Vector3(0, 0, 0), new Vector3(0, 1, 0));
  const geometry = new THREE.TubeGeometry(path, 64, 1, 128, false);

  const returnMesh = new Mesh(geometry, coneMaterial);
  returnMesh.name = name;
  returnMesh.raycast = () => {}; // this object is never intersected
  return returnMesh;
}

export function create2DLine(width: number = 0.03, color: string = "white") {
  return new Mesh(
    new CylinderGeometry(width, width, 1),
    new THREE.MeshStandardNodeMaterial({ color })
  );
}
/**
 * Creates the cone on which the points at infinity lie, the  portion of the cone representing the points at infinity are between the given clipping planes.
 * @param param0
 * @returns
 */
export function createPointsAtInfinityStrip({
  upper
}: {
  upper: boolean;
}): Mesh {
  const pointAtInfinityMaterial = new THREE.MeshPhysicalNodeMaterial({
    color: 0x8c92ac,
    side: DoubleSide,
    transparent: true
  });

  const posFunc = Fn(() => {
    // Scale and translate the original tube segment {(x,y,z) | x^2 + y^2 = 1, 0<=z<=1 } to
    //  {(x,y,z) | x^2 + y^2 = z^2, lowerZValue <= z <= upperZValue}
    const upperZValue = upper ? zUpperPAIClipPlus : zLowerPAIClipPlus;
    const lowerZValue = upper ? zUpperPAIClipMinus : zLowerPAIClipMinus;
    const transformedZ = positionLocal.z
      .mul(upperZValue.sub(lowerZValue))
      .add(lowerZValue);

    return vec3(
      positionLocal.x.mul(transformedZ),
      positionLocal.y.mul(transformedZ),
      transformedZ
    );
  });

  pointAtInfinityMaterial.positionNode = posFunc();

  // Add opacity to the edges of the points at infinity strip
  const opacityAtEdges = 0.7;
  const percentOfEdgeReduceInOpacity = 0.005;

  if (upper) {
    pointAtInfinityMaterial.opacityNode = smoothstep(
      zUpperPAIClipMinus,
      zUpperPAIClipMinus.mul(1 + percentOfEdgeReduceInOpacity),
      positionLocal.z
    )
      .mul(1 - opacityAtEdges)
      .sub(
        smoothstep(
          zUpperPAIClipPlus.mul(1 - percentOfEdgeReduceInOpacity),
          zUpperPAIClipPlus,
          positionLocal.z
        ).mul(1 - opacityAtEdges)
      )
      .add(opacityAtEdges);
  } else {
    pointAtInfinityMaterial.opacityNode = smoothstep(
      zLowerPAIClipPlus,
      zLowerPAIClipPlus.mul(1 + percentOfEdgeReduceInOpacity),
      positionLocal.z
    )
      .mul(1 - opacityAtEdges)
      .sub(
        smoothstep(
          zLowerPAIClipMinus.mul(1 - percentOfEdgeReduceInOpacity),
          zLowerPAIClipMinus,
          positionLocal.z
        ).mul(1 - opacityAtEdges)
      )
      .add(opacityAtEdges);
  }

  // path is the center line of the initial(untransformed) tube.
  const path = new LineCurve3(new Vector3(0, 0, 0), new Vector3(0, 0, 1));
  const geometry = new THREE.TubeGeometry(path, 64, 1, 128, false);

  const pointAtInfinityMesh = new Mesh(geometry, pointAtInfinityMaterial);

  // --- Override the raycast for the mesh otherwise the ray caster detects only the untransformed mesh---
  pointAtInfinityMesh.raycast = function (raycaster, intersects) {
    const partialIntersects = intersectWithPointAtInfinityStrip(
      raycaster.ray.origin,
      raycaster.ray.direction,
      raycaster.near,
      raycaster.far,
      upper
    );
    partialIntersects.forEach(obj =>
      intersects.push({
        distance: obj.distance,
        point: obj.point,
        normal: obj.normal,
        object: this
      })
    );
  };

  return pointAtInfinityMesh;
}

export function createPolarGridCircle({
  intrinsicRadius, // The intrinsic hyperbolic radius
  upper,
  thickness = 3 //pixels
}: {
  intrinsicRadius: number;
  upper: boolean;
  thickness?: number;
}): Mesh {
  const circlePoints: number[] = [];
  // Calculate number of points needed to achieve the desired maximum error in linear approximation of circle
  const error = 0.004; // maximum allowable error (as a world space distance) in the linear segments approximating the circle
  const numPoints = Math.ceil(
    Math.PI / Math.acos(1 - error / Math.sinh(intrinsicRadius))
  );

  // Build the path
  for (let angle = 0; angle < 2 * Math.PI; angle += (2 * Math.PI) / numPoints) {
    circlePoints.push(
      Math.sinh(intrinsicRadius) * Math.cos(angle),
      Math.sinh(intrinsicRadius) * Math.sin(angle),
      upper ? Math.cosh(intrinsicRadius) : -Math.cosh(intrinsicRadius)
    );
  }
  // Close the circle
  circlePoints.push(circlePoints[0], circlePoints[1], circlePoints[2]);

  const geometry = new LineGeometry();
  geometry.setPositions(circlePoints);

  const lineMaterial = new THREE.Line2NodeMaterial({
    linewidth: thickness, // Width in pixels
    transparent: true,
    color: "grey",
    blending: THREE.NormalBlending, //If this is not set the radial lines near (0,0,1) looks whitish grey
    alphaTest: 0.1,
    depthTest: true,
    depthWrite: true
    // polygonOffset: true, // attempt to limit z fighting when polar angle is 0 or pi
    // polygonOffsetFactor: -1.0, // Nudge the line toward the camera
    // polygonOffsetUnits: -4.0 // Higher value = more aggressive nudge
  });

  // Clipping Logic -- line2NodeMaterial is really just a center line that is
  // thickened with quadrilaterals. It is the union of a series of instances,
  // each of which is a quadrilateral (= two triangles with a common edge
  // (diagonal)), with a center line down the middle. The vertices of the quad
  // are determined by moving perpendicular to the center line half the
  // thickness of the line material (in pixels). uv coordinates are the
  // coordinates of a location in the quad. I know that uv().y goes from -1 to
  // 1. I'm not sure about the uv().x range. Each vertex of the quad has the
  // (same) instanceStart and instanceEnd data associated to it so doesn't
  // matter which vertex you get this information from. In this case all the z
  // coordinates of the instanceStart and instanceEnd along circular line are
  // the same so it doesn't matter which you choose

  const instanceStart = attribute("instanceStart", "vec3");
  const varyingInstanceStartLocal = varying(instanceStart);
  const worldInstanceStartZ = modelWorldMatrix.mul(
    vec4(varyingInstanceStartLocal, 1.0)
  ).z;
  const clippingLogic = Fn(() => {
    // discard any instances that start/end after/before zClip
    const shouldClip = upper
      ? worldInstanceStartZ.greaterThan(zUpperClip)
      : worldInstanceStartZ.lessThan(zLowerClip);
    shouldClip.discard();

    return float(1.0);
  });

  // Apply to your material
  lineMaterial.opacityNode = clippingLogic();

  // Attempt to fix z-fighting when the boundary cone is displayed and the dolly distance is large
  // lineMaterial.positionNode = Fn(() => {
  //   const posView = modelViewMatrix.mul(vec4(positionLocal, 1.0));
  //   const nudged = vec4(posView.xyz.add(vec3(0, 0, 0.001)), posView.w);
  //   return nudged.xyz;
  // })();

  // @ts-expect-error: Line2 constructor type definition is outdated for WebGPU materials
  const mesh = new Line2(geometry, lineMaterial);

  // mesh.name =
  //   (upper ? `U` : `L`) + `PolarGridCircle_r=${intrinsicRadius.toFixed(2)}`;
  mesh.raycast = () => {}; // this object is never intersected
  return mesh;
}

export function createPolarGridRadialLine({
  radianAngle,
  upper,
  thickness = 3 //pixels
}: {
  radianAngle: number;
  upper: boolean;
  thickness?: number;
}): Mesh {
  const points: number[] = [];

  let nextTValue = 0.01;
  let myContinue = true;
  for (let i = 0; myContinue; i++) {
    if (nextTValue > Math.acosh(SETTINGS.maxZClip + 1.0)) {
      nextTValue = Math.acosh(SETTINGS.maxZClip + 1.0);
      // add one to zMax because the dolly max distance is sometimes exceeded when all the way zoomed out to allow for smooth zooming and motion. This way the clipping planes limit the display and very little extra (which is cut off by the clipping plane) is stored in the scene.
      myContinue = false;
    }
    points.push(
      Math.sinh(nextTValue) * Math.cos(radianAngle),
      Math.sinh(nextTValue) * Math.sin(radianAngle),
      (upper ? 1 : -1) * Math.cosh(nextTValue)
    );
    nextTValue += 0.01 * Math.exp(1.3 * nextTValue); //controls the spacing of the points along the hyperbolic radial line. The points on the radial do not need to be uniformly spaced in t - more points near zero are better for accuracy, because eventually the hyperboloid radial lines are almost linear.
  }

  const geometry = new LineGeometry();
  geometry.setPositions(points);

  const lineMaterial = new THREE.Line2NodeMaterial({
    linewidth: thickness, // Width in pixels
    transparent: true,
    color: "grey",
    blending: THREE.NormalBlending, //If this is not set the radial lines near (0,0,1) looks whitish grey
    alphaTest: 0.1,
    depthTest: true,
    depthWrite: true
    // polygonOffset: true, // attempt to limit z fighting when polar angle is 0 or pi
    // polygonOffsetFactor: -1.0, // Nudge the line toward the camera
    // polygonOffsetUnits: -4.0 // Higher value = more aggressive nudge
  });

  // Clipping Logic
  // First get the instance data and use the varying to make the vertex data
  // available to the fragment shader (which includes the color and opacity nodes)
  const instanceStart = attribute("instanceStart", "vec3");
  const instanceEnd = attribute("instanceEnd", "vec3");
  const varyingInstanceStartLocal = varying(instanceStart);
  const varyingInstanceEndLocal = varying(instanceEnd);

  const clippingLogic = Fn(() => {
    //compute the intermediate location in local coords then transform to world
    // The uv().y is the direction corresponding to the z direction of
    // the rendering of the quad (i.e. two triangles with a common edge)
    const intermediatePositionLocal = mix(
      varyingInstanceStartLocal,
      varyingInstanceEndLocal,
      uv().y.add(1.0).div(2.0) // uv().y  goes from -1 to 1 and NOT 0 to 1 as expected!
    );
    const intermediatePositionWorldZ = modelWorldMatrix.mul(
      vec4(intermediatePositionLocal, 1.0)
    ).z;
    const clipPixel = upper
      ? intermediatePositionWorldZ.greaterThan(zUpperClip)
      : intermediatePositionWorldZ.lessThan(zLowerClip);
    clipPixel.discard();

    const returnSmooth = upper
      ? smoothstep(
          zUpperClip.mul(SETTINGS.fadePercentage),
          zUpperClip,
          intermediatePositionWorldZ
        )
      : smoothstep(
          zLowerClip.mul(SETTINGS.fadePercentage),
          zLowerClip,
          intermediatePositionWorldZ
        );

    return returnSmooth
      .oneMinus()
      .mul(float(SETTINGS.startOpacityFade).sub(float(SETTINGS.endOpacityFade)))
      .add(float(SETTINGS.endOpacityFade));
  });

  // Apply to your material
  lineMaterial.opacityNode = clippingLogic();

  // @ts-expect-error: Line2 constructor type definition is outdated for WebGPU materials
  const lineMesh = new Line2(geometry, lineMaterial);
  // lineMesh.computeLineDistances();
  lineMesh.raycast = () => {}; // this object is never intersected

  return lineMesh;
}

export function createBoundaryCone({ upper }: { upper: boolean }): THREE.Mesh {
  const coneMaterial = new THREE.MeshPhysicalNodeMaterial({
    side: DoubleSide,
    color: 0x7bafd4, //0x88ccff, // base color
    roughness: 0.0, // very smooth surface
    //transmission: 0.5, // glasslike transparency
    //thickness: 0.05, // thin glass layer (in world units)
    //ior: 1.45, // index of refraction of glass
    transparent: true, // must enable for opacity/transmission
    opacity: 0.0, // keep at 1, transparency handled via transmission
    metalness: 0.0
    // reflectivity: 0.15, // helps glass reflections
    // clearcoat: 1.0, // improves highlight realism
    // clearcoatRoughness: 0.05,
    // specularIntensity: 0.2,
    //soap bubble" thin-film interferences
    // iridescence: 1.0,
    // iridescenceIOR: 1.3,
    // iridescenceThicknessRange: [50, 150], // in nanometers
  });
  const baseColor = color(coneMaterial.color);

  const localPositionZ = varying(positionLocal.z); // make this available in the fragment shader

  const clippingLogic = Fn(() => {
    if (upper) {
      positionLocal.z.greaterThan(zUpperPAIClipMinus).discard();
    } else {
      positionLocal.z.lessThan(zLowerPAIClipPlus).discard();
    }

    return baseColor;
  });

  coneMaterial.colorNode = clippingLogic();

  // Smooth the opacity of the top edge of the hyperboloid
  coneMaterial.opacityNode = smoothstep(
    (upper ? zUpperPAIClipMinus : zLowerPAIClipPlus).mul(
      SETTINGS.fadePercentage
    ),
    upper ? zUpperPAIClipMinus : zLowerPAIClipPlus,
    localPositionZ
  )
    .oneMinus()
    .mul(float(SETTINGS.startOpacityFade).sub(float(SETTINGS.endOpacityFade)))
    .add(float(SETTINGS.endOpacityFade));

  const coneGeometry = new ParametricGeometry(
    (u, v, out) => {
      let r = u * SETTINGS.maxZClip * (upper ? 1 : -1); // 0 to +/-maxZClippingHeight
      if (r == 0) {
        r = 0.0001 * (upper ? 1 : -1); // avoid singularity at the tip
      }
      const theta = v * 2 * Math.PI;
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const z = r; // + (0.1 / SETTINGS.maxZClip) * r * (upper ? -1 : 1); // small offset to avoid z-fighting with hyperboloid
      out.set(x, y, z);
    },
    120,
    300
  );

  const coneMesh = new Mesh(coneGeometry, coneMaterial);
  coneMesh.raycast = () => {}; // this object is never intersected
  return coneMesh;
}

export function createHyperboloidSheet({
  upper
}: {
  upper: boolean;
}): THREE.Mesh {
  const hyperboloidMaterial = new THREE.MeshPhysicalNodeMaterial({
    color: 0x004080, //0x2d2d2d, //, // 0x2d2d2d, //0xc46210,
    side: DoubleSide,
    metalness: 0.1,
    roughness: 0.2,
    opacity: 0, //0.2,
    transparent: false,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
  });
  const baseColor = color(hyperboloidMaterial.color); //Chocolate

  //const zClip = uniform(zClipInitial);
  const localPositionZ = varying(positionLocal.z); // make this available in the fragment shader

  const clippingLogic = Fn(() => {
    if (upper) {
      positionLocal.z.greaterThan(upper ? zUpperClip : zLowerClip).discard();
    } else {
      positionLocal.z.lessThan(upper ? zUpperClip : zLowerClip).discard();
    }

    return baseColor;
  });

  hyperboloidMaterial.colorNode = clippingLogic();

  // Smooth the opacity of the top edge of the hyperboloid
  // hyperboloidMaterial.opacityNode = smoothstep(
  //   (upper ? zUpperClip : zLowerClip).mul(SETTINGS.fadePercentage),
  //   upper ? zUpperClip : zLowerClip,
  //   localPositionZ
  // )
  //   .oneMinus()
  //   // .mul(float(SETTINGS.startOpacityFade).sub(float(SETTINGS.endOpacityFade)))
  //   .mul(float(1.0).sub(float(SETTINGS.endOpacityFade)))
  //   .add(float(SETTINGS.endOpacityFade));

  hyperboloidMaterial.opacityNode = float(0.0);

  const hyperboloidGeometry = new ParametricGeometry(
    upper ? upperHyperboloid : lowerHyperboloid,
    120,
    300
  );

  const hyperboloidMesh = new Mesh(hyperboloidGeometry, hyperboloidMaterial);

  hyperboloidMesh.raycast = function (raycaster, intersects) {
    const partialIntersects = intersectWithHyperboloid(
      raycaster.ray.origin,
      raycaster.ray.direction,
      raycaster.near,
      raycaster.far,
      upper
    );
    partialIntersects.forEach(obj =>
      intersects.push({
        distance: obj.distance,
        point: obj.point,
        normal: obj.normal,
        object: this
      })
    );
  };

  return hyperboloidMesh;
}

// Parametric function for the upper sheet of the hyperboloid where 0 <= u <= 1 and 0 <= v <= 1, the point is returned in pt
function upperHyperboloid(u: number, v: number, pt: Vector3) {
  // This is a one-to-one mapping from R^2 to a sheet of the hyperboloid.
  // https://math.stackexchange.com/questions/697245/parametrization-of-the-hyperboloid-of-two-sheets
  // Maybe this is useful if we run into multi-value issues
  // The edges of this do not form a rectangle in 3D
  // const scale = 3;
  // const myU = 2 * scale * u - scale; // map to -scale <= u <= scale
  // const myV = 2 * scale * v - scale; // map to -scale <= v <= scale
  // const x = Math.sinh(myU) * Math.cosh(myV);
  // const y = Math.sinh(myV);
  // const z = Math.cosh(myU) * Math.cosh(myV);

  // This is the standard polar coordinate parameterization
  // https://en.wikipedia.org/wiki/Hyperboloid_of_two_sheets#Parametrization
  // // where u is the radial coordinate and v is the angular coordinate
  u = u * (Math.acosh(SETTINGS.maxZClip) + 1) + 0.001; // add one because the dolly max distance is sometimes exceeded when all the way zoomed out to allow for smooth zooming and motion. This way the clipping planes limit the display and very little extra (which is cut off by the clipping plane) is stored in the scene. Adding 0.001 to avoid clumping of points at the tip which causes rendering issues.
  const theta = v * 2 * Math.PI;
  const x = Math.sinh(u) * Math.cos(theta);
  const y = Math.sinh(u) * Math.sin(theta);
  const z = Math.cosh(u);
  pt.set(x, y, z);
}

// Parametric function for the lower sheet of the hyperboloid in polar coordinates 0 <= u <= 1 and 0 <= v <= 1
function lowerHyperboloid(u: number, v: number, pt: Vector3) {
  u = u * (Math.acosh(SETTINGS.maxZClip) + 1) + 0.001; // add one because the dolly max distance is sometimes exceeded when all the way zoomed out to allow for smooth zooming and motion. This way the clipping planes limit the display and very little extra (which is cut off by the clipping plane) is stored in the scene. Adding 0.001 to avoid clumping of points at the tip which causes rendering issues.
  const theta = v * 2 * Math.PI;
  const x = Math.sinh(u) * Math.cos(theta);
  const y = Math.sinh(u) * Math.sin(theta);
  const z = -Math.cosh(u);
  pt.set(x, y, z);
}

const xAxisRotationMatrix = Fn(
  ([angle]: [THREE.TSL.ShaderNodeObject<THREE.Node>]) => {
    const s = sin(angle);
    const c = cos(angle);
    return mat3(
      float(1.0),
      float(0.0),
      float(0.0),
      float(0.0),
      c,
      s.negate(),
      float(0.0),
      s,
      c
    );
  }
) as unknown as (
  angle: THREE.TSL.ShaderNodeObject<THREE.Node>
) => THREE.TSL.ShaderNodeObject<THREE.Node>;

const zAxisRotationMatrix = Fn(
  ([angle]: [THREE.TSL.ShaderNodeObject<THREE.Node>]) => {
    const s = sin(angle);
    const c = cos(angle);
    return mat3(
      c,
      s.negate(),
      float(0.0),
      s,
      c,
      float(0.0),
      float(0.0),
      float(0.0),
      float(1.0)
    );
  }
) as unknown as (
  angle: THREE.TSL.ShaderNodeObject<THREE.Node>
) => THREE.TSL.ShaderNodeObject<THREE.Node>;

const yAxisRotationMatrix = Fn(
  ([angle]: [THREE.TSL.ShaderNodeObject<THREE.Node>]) => {
    const s = sin(angle);
    const c = cos(angle);
    return mat3(
      c,
      float(0.0),
      s,
      float(0.0),
      float(1.0),
      float(0.0),
      s.negate(),
      float(0.0),
      c
    );
  }
) as unknown as (
  angle: THREE.TSL.ShaderNodeObject<THREE.Node>
) => THREE.TSL.ShaderNodeObject<THREE.Node>;
