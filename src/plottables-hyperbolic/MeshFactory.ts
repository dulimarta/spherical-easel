import SETTINGS, { SURFACE_TYPES } from "@/global-settings-hyperbolic";
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
  min,
  max,
  mat4,
  sqrt,
  floor,
  mod,
  and,
  Discard,
  or,
  cross,
  dot,
  exp,
  vec2
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
  ConeGeometry,
  Vector2,
  LatheGeometry
} from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry";
import { LineGeometry } from "three/examples/jsm/Addons.js";
import {
  CustomPointMaterial,
  CustomLabelMaterial,
  CustomLineMaterial
} from "./MaterialFactory";
import { intersectWithSurface } from "@/utils/helpingHEFunctions";

const pulseRate = 0.3; // selected objects pulse and this set the rate oscSine(pulseRate*time)
const pulseSizePercent = 0.8; // selected objects grow between 1 and 1+pulseSizePercent times there size

// The z coordinate of all points on the hyperboloid(s) are between zUpperClip and zLowerClip and their negations
export const zUpperClip = uniform(1.0, "float");
export const zLowerClip = uniform(-1.0, "float");

// The z coordinate of all points of the upperIdealStrip are between zUpperIdealClipPlus and zUpperIdealClipMinus,
export const zUpperIdealStripClipPlus = uniform(2.0, "float");
export const zUpperIdealStripClipMinus = uniform(1.5, "float");

// The z coordinate of all points of the lowerIdealStrip are between zLowerIdealClipPlus and zLowerIdealClipMinus,
export const zLowerIdealStripClipPlus = uniform(-1.5, "float");
export const zLowerIdealStripClipMinus = uniform(-2.0, "float");

export const zUpperUltraClip = uniform(-1.5, "float");
export const zLowerUltraClip = uniform(-2.0, "float");

export const unitLength: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>> =
  uniform(1.0, "float");

export const arcLengthScale: THREE.TSL.ShaderNodeObject<
  THREE.UniformNode<number>
> = uniform(1.0, "float"); // controls the scale of line (and circles?) along the centerline, so the number of points used to display lines (and circles?) can update as the dolly distance (and FOV) changes

export function createLine(
  name: string,
  mode: number,
  upper: boolean,
  temporary = false //used in handlers, flag so that temporary objects are never hit with ray casting
): Mesh {
  const cylinderMaterial = new CustomLineMaterial({
    color: 0xff8080,
    transparent: true
  });
  const glowingUniform = cylinderMaterial.userData.glowing;

  const transformationMatrixUniform =
    cylinderMaterial.userData.transformationMatrix;

  const radiusUniform = cylinderMaterial.userData.radius;
  radiusUniform.value = 0.04;

  const upperUniform = cylinderMaterial.userData.upper;
  upperUniform.value = upper ? 1 : 0;

  const modeUniform = cylinderMaterial.userData.mode;
  modeUniform.value = mode;

  const startYUniform = cylinderMaterial.userData.startY;
  const endYUniform = cylinderMaterial.userData.endY;

  const standardPositionY = varying(float(0), "standardPositionY");

  const positionFunction = Fn(() => {
    // A glowing line's size pulses
    const myRadius = select(
      glowingUniform.greaterThan(0.5),
      radiusUniform
        .mul(unitLength)
        .mul(oscSine(time.mul(pulseRate)).mul(pulseSizePercent).add(1)),
      radiusUniform.mul(unitLength)
    );

    // Capture positionLocal into a local var first
    const localPos = positionLocal.toVar();
    const x = localPos.x;
    const z = localPos.z;
    const unScaledT = localPos.y.mul(arcLengthScale);
    const t = exp(unScaledT).sub(exp(unScaledT.negate())).div(2); //This is sinh(unScaledT) so that the unScaledT (which is uniformly distributed on the length of the cylinder), is transformed so that there are more t values near zero and few for larger unScaledT in absolute value

    standardPositionY.assign(t); //store this value so it can be used in the fragment shader and can decide to discard or keep the fragment with this y value.

    const sqrtTerm = sqrt(t.mul(t).add(1));

    const centerLineStandardPosition = vec4(
      0,
      t,
      sqrtTerm.mul(select(upperUniform.greaterThan(0.5), float(1), float(-1))),
      1
    );

    const centerLineTangentVector = vec4(
      0,
      1,
      t
        .div(sqrtTerm)
        .mul(select(upperUniform.greaterThan(0.5), float(1), float(-1))),
      0
    );

    const centerLineFinalPosition = transformationMatrixUniform.mul(
      centerLineStandardPosition
    ).xyz;

    const unitTangentVector = transformationMatrixUniform
      .mul(centerLineTangentVector)
      .xyz.normalize();

    const surfaceNormal = vec3(
      centerLineFinalPosition.x.negate(),
      centerLineFinalPosition.y.negate(),
      centerLineFinalPosition.z
    ).normalize();

    const NDotT = dot(surfaceNormal, unitTangentVector);
    const unitNormalVector = surfaceNormal
      .sub(unitTangentVector.mul(NDotT))
      .normalize();

    const biNormal = cross(unitNormalVector, unitTangentVector).normalize(); // the other order turns the cylinder inside out and then, unless you make it a two sided cylinder, it can't be seen.

    return centerLineFinalPosition
      .add(unitNormalVector.mul(x).mul(myRadius))
      .add(biNormal.mul(z).mul(myRadius));
  });

  cylinderMaterial.positionNode = positionFunction();

  const colorFunction = Fn(() => {
    // Clip points to the visible part of the hyperboloid
    select(
      upperUniform.greaterThan(0.5),
      positionLocal.z.greaterThan(zUpperClip).discard(),
      positionLocal.z.lessThan(zLowerClip).discard()
    );
    // clip the line depending on the startY and endY and the mode
    // first decode the mode
    const mode = float(modeUniform);
    const bit0 = mod(floor(mode), 2.0);
    const bit1 = mod(floor(mode.div(2.0)), 2.0);
    const bit2 = mod(floor(mode.div(4.0)), 2.0);
    const drawAfterEnd = bit0.greaterThan(0.5);
    const drawBetweenStartAndEnd = bit1.greaterThan(0.5);
    const drawBeforeStart = bit2.greaterThan(0.5);

    // discard the portions of the line appropriately
    const largerY = max(startYUniform, endYUniform);
    const smallerY = min(startYUniform, endYUniform);
    // we always go from start to end when we are tracing the line
    // from one end to the other and that may or may not be in increasing y values (when transformed to standard position)
    // If startY < endY then we are tracing from smallest to largest
    // If startY > endY then we are tracing from largest to smallest and the ends drawn need to be flipped: drawAfterEnd = drawBeforeStart and drawBeforeStart = drawAfterEnd UNLESS the endpoint is ideal
    const isReversed = endYUniform.lessThan(startYUniform);

    const activeBefore = select(isReversed, drawAfterEnd, drawBeforeStart);
    const activeAfter = select(isReversed, drawBeforeStart, drawAfterEnd);

    const isBefore = standardPositionY.lessThan(smallerY);
    const isAfter = standardPositionY.greaterThan(largerY);
    const isBetween = standardPositionY
      .greaterThan(smallerY)
      .and(standardPositionY.lessThan(largerY));

    or(
      and(isBefore, activeBefore.not()),
      and(isBetween, drawBetweenStartAndEnd.not()),
      and(isAfter, activeAfter.not())
    ).discard();

    // Glowing line's color pulses
    const returnColor = select(
      glowingUniform.greaterThan(0.5),
      color(cylinderMaterial.color).mul(
        oscSine(time.mul(pulseRate)).mul(pulseSizePercent).add(1)
      ),
      color(cylinderMaterial.color).mul(1.0)
    );

    // return select(
    //   isBetween,
    //   color(cylinderMaterial.color).mul(10.0),
    //   color(cylinderMaterial.color).mul(0.0)
    // );
    return returnColor;
  });
  cylinderMaterial.colorNode = colorFunction();

  // Smooth the opacity of the edge of the line
  const zClip = select(upperUniform.greaterThan(0.5), zUpperClip, zLowerClip);
  cylinderMaterial.opacityNode = smoothstep(
    zClip.mul(SETTINGS.fadePercentage),
    zClip,
    positionLocal.z
  )
    .oneMinus()
    .mul(float(SETTINGS.startOpacityFade).sub(float(SETTINGS.endOpacityFade)))
    .add(float(SETTINGS.endOpacityFade));

  const maxZ = Math.acosh(SETTINGS.maxZClip + 1.001);
  const maxY = Math.sqrt(maxZ * maxZ - 1);

  const returnMesh = new Mesh(
    new CylinderGeometry(
      1,
      1,
      400 * Math.acosh(maxY * maxY + maxZ * maxZ), // h2Distance(new Vector3(0, -maxY, maxZ), new Vector3(0, maxY, maxZ)), Needs to be long enough to show a geodesic from Vector3(0, -maxY, maxZ) to Vector3(0, maxY, maxZ) when the fov of is at a minimum and the dolly distance is at a maximum.
      50, // Radial segments
      500, // Segments along the length of the cylinder
      true, // open ended
      0,
      2 * Math.PI
    ),
    cylinderMaterial
  );

  returnMesh.name = name;

  returnMesh.raycast = function (raycaster, intersects) {
    if (temporary) return; //temporary objects are never hit
    // const matrix = transformationMatrixUniform.value.elements;
    // const position = new Vector3(matrix[12], matrix[13], matrix[14]); // the position is stored in the last column of the transformation matrix
    // // console.log("intersect point", this.name, position.toFixed(2));
    const tempIntersections = intersectWithSurface(
      raycaster.ray.origin,
      raycaster.ray.direction,
      raycaster.near,
      raycaster.far,
      this.material.userData.upper.value > 0.5 ? true : false,
      SURFACE_TYPES.hyperboloid
    );
    const normalVector = this.material.userData.normalVector;
    const inverseTransformationMatrix =
      this.material.userData.inverseTransformationMatrix;

    tempIntersections.forEach(intersection => {
      // If the intersection point is near the plane that defines the line then we are
      // on the line connecting startPoint and endPoint
      // Math.abs(normalVector.dot(intersection.point)) is the distance to the plane of the line
      // console.log("raycast from ", returnMesh.name);
      if (
        Math.abs(normalVector.dot(intersection.point)) <
        radiusUniform.value * unitLength.value * 2.5
      ) {
        // now we have to determine if the point is near the part of the line that is displayed, this depends on the mode and the start/end point being ideal or not.

        const intersectionY = new THREE.Vector4(
          intersection.point.x,
          intersection.point.y,
          intersection.point.z,
          1
        ).applyMatrix4(inverseTransformationMatrix.value).y; // This might not be exact enough.  If so, then we need to snap to the nearest point on the hyperboloid and on the plane.

        // console.log(
        //   "raycast line",
        //   this.name,
        //   "Y ",
        //   intersectionY,
        //   new THREE.Vector4(
        //     intersection.point.x,
        //     intersection.point.y,
        //     intersection.point.z,
        //     1
        //   )
        //     .applyMatrix4(inverseTransformationMatrix.value)
        //     .toFixed(2),
        //   intersection.point.toFixed(2),
        //   inverseTransformationMatrix.value.elements
        // );
        // first decode the mode
        const drawBeforeStart = ((modeUniform.value >> 2) & 1) > 0.5;
        const drawBetweenStartAndEnd = ((modeUniform.value >> 1) & 1) > 0.5;
        const drawAfterEnd = (modeUniform.value & 1) > 0.5;

        // console.log(
        //   "mode bits",
        //   drawBeforeStart,
        //   drawBetweenStartAndEnd,
        //   drawAfterEnd
        // );

        // console.log("start Y", startYUniform.value);
        // console.log("end Y", endYUniform.value);
        // check the relationship between intersectionY and (start|end)Y appropriately
        const largerY = Math.max(startYUniform.value, endYUniform.value);
        const smallerY = Math.min(startYUniform.value, endYUniform.value);
        // we always go from start to end when we are tracing the line
        // from one end to the other and that may or may not be in increasing y values (when transformed to standard position)
        // If startY < endY then we are tracing from smallest to largest
        // If startY > endY then we are tracing from largest to smallest and the ends drawn need to be flipped: drawAfterEnd = drawBeforeStart and drawBeforeStart = drawAfterEnd

        const newDrawBeforeStart =
          endYUniform.value < startYUniform.value
            ? drawAfterEnd
            : drawBeforeStart;

        const newDrawAfterEnd =
          endYUniform.value < startYUniform.value
            ? drawBeforeStart
            : drawAfterEnd;

        // console.log(
        //   "mode bits",
        //   newDrawBeforeStart,
        //   drawBetweenStartAndEnd,
        //   newDrawAfterEnd
        // );
        const isAHit =
          (intersectionY > largerY && newDrawAfterEnd) ||
          (largerY > intersectionY &&
            intersectionY > smallerY &&
            drawBetweenStartAndEnd) ||
          (smallerY > intersectionY && newDrawBeforeStart);

        if (isAHit) {
          intersects.push({
            distance: intersection.distance,
            point: intersection.point.clone(),
            normal: intersection.normal,
            object: this
          });
        }
      }
    });
  };

  return returnMesh;
}

export async function createLabel(
  textGeometry: THREE.BufferGeometry<THREE.NormalBufferAttributes>,
  name: string,
  myColor = 0xffffff //0x808080,
) {
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

  // override raycaster so that the transformed label can be hit
  returnMesh.raycast = function (raycaster, intersects) {
    const corners = this.material.userData.cornerImages as Vector3[];
    // console.log("raycast from", this.name, corners);
    if (corners && corners.length === 4) {
      const normal = new Vector3().crossVectors(
        corners[1].clone().sub(corners[0]),
        corners[2].clone().sub(corners[0])
      );
      // find the intersection of the ray P(t)= origin + t*direction with the plane defined by the corners (P(t)-corners[0]).normal = 0
      // t = (corners[0] - origin).normal / direction.normal
      const t =
        corners[0].clone().sub(raycaster.ray.origin).dot(normal) /
        raycaster.ray.direction.dot(normal);
      if (t >= raycaster.near && t <= raycaster.far) {
        const intersectionPoint = raycaster.ray.origin
          .clone()
          .add(raycaster.ray.direction.clone().multiplyScalar(t));
        const rightSide = corners[1].clone().sub(corners[0]);
        const upSide = corners[2].clone().sub(corners[0]);
        const localCoordsOfIntersection = intersectionPoint
          .clone()
          .sub(corners[0]);
        const rightCoord =
          localCoordsOfIntersection.dot(rightSide) / rightSide.dot(rightSide);
        const upCoord =
          localCoordsOfIntersection.dot(upSide) / upSide.dot(upSide);
        // s and t are the local coordinates of the intersection point in the basis defined by the right and up sides of the label, if they are between 0 and 1, then the ray hits the label.
        // check if the intersection point is within the corners
        if (
          rightCoord >= 0 &&
          rightCoord <= 1 &&
          upCoord >= 0 &&
          upCoord <= 1
        ) {
          // console.log("label hit", this.name);
          intersects.push({
            distance: t,
            point: intersectionPoint.clone(),
            normal: normal,
            object: this
          });
        }
      }
    }
  };
  return returnMesh;
}

export function createPoint(
  name: string,
  temporary = false //used in handlers,flag so that temporary objects are never hit with ray casting
): Mesh {
  const sphereMaterial = new CustomPointMaterial({
    color: 0xff8080, // default color
    roughness: 0.3
  });

  const transformationMatrixUniform =
    sphereMaterial.userData.transformationMatrix;
  const radiusUniform = sphereMaterial.userData.radius;
  const glowingUniform = sphereMaterial.userData.glowing;
  radiusUniform.value = 0.15; // default radius
  const positionUniform = sphereMaterial.userData.position;

  const positionFunction = Fn(() => {
    // Glowing points size pulses
    const returnNode = select(
      glowingUniform.greaterThan(0.5),
      transformationMatrixUniform.mul(
        vec4(
          positionLocal
            .mul(unitLength)
            .mul(oscSine(time.mul(pulseRate)).mul(pulseSizePercent).add(1))
            .mul(radiusUniform),
          1
        )
      ),
      transformationMatrixUniform.mul(
        vec4(positionLocal.mul(unitLength).mul(radiusUniform), 1)
      )
    );

    return returnNode.xyz;
  });

  sphereMaterial.positionNode = positionFunction();

  const colorFunction = Fn(() => {
    // Clip points to the visible part of the hyperboloid
    select(
      positionUniform.z.greaterThan(0), //upper
      positionLocal.z.greaterThan(zUpperClip.add(radiusUniform)).discard(),
      positionLocal.z.lessThan(zLowerClip.sub(radiusUniform)).discard()
    );
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

  // returnMesh.raycast = function (raycaster, intersects) {
  //   console.debug("Raycasting a point", name, temporary);
  //   if (temporary) return; //temporary objects are never hit
  //   const matrix = transformationMatrixUniform.value.elements;
  //   const [x, y, z] = positionUniform.value.toArray();
  //   const position = new Vector3(x, y, z); // the position is stored in the last column of the transformation matrix
  //   // console.log("intersect point", this.name, position.toFixed(2));
  //   const tempIntersections = intersectWithSurface(
  //     raycaster.ray.origin,
  //     raycaster.ray.direction,
  //     raycaster.near,
  //     raycaster.far,
  //     position.z > 0,
  //     SURFACE_TYPES.hyperboloid
  //   );
  //   console.debug("Temp intersections for point", name, tempIntersections);
  //   tempIntersections.forEach(intersection => {
  //     // If the raycaster origin is the camera position, then if we are within the apparent radius (plus 150%) of the point, it is hit by the raycaster
  //     if (
  //       position.distanceTo(intersection.point) <
  //       radiusUniform.value * unitLength.value * 2.5
  //     ) {
  //       // console.log("point hit", this.name);
  //       intersects.push({
  //         distance: intersection.distance - radiusUniform.value,
  //         point: intersection.point.clone(),
  //         normal: intersection.normal,
  //         object: this
  //       });
  //     }
  //   });
  // };

  return returnMesh;
}

export function createIdealPoint(
  name: string,
  temporary = false //used in handlers,flag so that temporary objects are never hit with ray casting
): Mesh {
  const coneMaterial = new CustomPointMaterial({
    color: 0xff8080, // default color
    opacity: 1.0
  });

  const transformationMatrixUniform =
    coneMaterial.userData.transformationMatrix;
  const radiusUniform = coneMaterial.userData.radius;
  const heightUniform = coneMaterial.userData.height;
  const glowingUniform = coneMaterial.userData.glowing;
  const positionUniform = coneMaterial.userData.position;
  radiusUniform.value = 0.15; // default radius
  heightUniform.value = 0.33; // default height

  coneMaterial.positionNode = Fn(() => {
    const myRadius = select(
      glowingUniform.greaterThan(0.5), // selected nodes pulse in size
      radiusUniform
        .mul(unitLength)
        .mul(oscSine(time.mul(pulseRate)).mul(pulseSizePercent).add(1)),
      radiusUniform.mul(unitLength)
    );
    const myHeight = heightUniform.mul(unitLength);
    const scaleAndTranslateMatrix = mat4(
      vec4(myRadius, 0, 0, 0), // column 0
      vec4(0, myHeight, 0, 0), // column 1
      vec4(0, 0, myRadius, 0), // column 2
      vec4(
        float(0.0),
        myHeight.mul(0.5).add(zUpperIdealStripClipMinus.mul(Math.SQRT2)),
        float(0.0),
        1
      ) // column 3
    );
    //return scaleAndTranslateMatrix.mul(vec4(positionLocal, 1)).xyz;
    return transformationMatrixUniform
      .mul(scaleAndTranslateMatrix)
      .mul(vec4(positionLocal, 1)).xyz;
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

    const angle = Math.atan2(
      positionUniform.value.y,
      positionUniform.value.x
    ).modTwoPi();
    const myUpper = positionUniform.value.z > 0 ? true : false;

    const tempIntersections = intersectWithSurface(
      raycaster.ray.origin,
      raycaster.ray.direction,
      raycaster.near,
      raycaster.far,
      myUpper,
      SURFACE_TYPES.idealStrip
    );
    tempIntersections.forEach(intersection => {
      const hitAngle = Math.atan2(intersection.point.y, intersection.point.x);
      // If the angle is within the apparent radius of the base (plus 10%), it is hit by the raycaster
      // console.log("Ideal points hit angle", this.name, hitAngle); unitLength.value *

      if (
        Math.abs(hitAngle - angle) < 0.03 ||
        Math.abs(Math.abs(hitAngle - angle) - 2 * Math.PI) < // angle could be -3.1 and hitAngle could be 3.1
          0.03
      ) {
        // console.log("hit ideal point", this.name);
        intersects.push({
          distance: intersection.distance - radiusUniform.value,
          point: intersection.point.clone(),
          normal: intersection.normal,
          object: this
        });
      }
    });
  };
  return returnMesh;
}

export function createIdealPointTube(
  upper: boolean,
  angle: number = 0,
  radius: number = 0.05, // in multiples of the unit length
  myColor: number = 0xffbbbb, // 0xffbbbb, // 0xff9999, //"white",
  name: string = "tempIdealPointTube"
): Mesh {
  const cylinderMaterial = new CustomPointMaterial({
    color: myColor,
    opacity: 1.0,
    side: DoubleSide
  });
  const tubeAngleUniform = cylinderMaterial.userData.tubeAngle;
  const radiusUniform = cylinderMaterial.userData.radius;
  const positionUniform = cylinderMaterial.userData.position;
  tubeAngleUniform.value = angle;
  radiusUniform.value = radius;
  positionUniform.value = new THREE.Vector4(0, 0, upper ? 1 : -1, 0); // x,y,w are not used for the tube

  cylinderMaterial.positionNode = Fn(() => {
    const scaleAndTranslate = positionLocal.mul(
      vec3(
        radiusUniform.mul(unitLength),
        zUpperIdealStripClipMinus.mul(Math.SQRT2),
        radiusUniform.mul(unitLength)
      )
    );

    const minusPlusOne = select(
      positionUniform.z.greaterThan(0), //upper or lower
      float(-1.0),
      float(1.0)
    );
    // ca -sa 0        1   0     0
    // sa  ca 0    *   0  c+/-45   -s+/-45
    // 0   0  1        0  s+/-45    c+/-45

    const rotationMatrixAboutZAxis = zAxisRotationMatrix(
      float(Math.PI / 2).sub(tubeAngleUniform)
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
  const percentPad = 0.05; // percent of the total length of the tube that is not dashed at the ends.
  const numberOfIntervals = 8; // same as the number of dashes traveling up the shank.
  const rateOfOscillation = 0.6; // controls the speed of the dash movement along the shank.
  const percentOfEachIntervalThatIsDash = 0.5;
  const totalLengthOfShank = zUpperIdealStripClipMinus;
  const lengthOfPad = totalLengthOfShank.mul(percentPad);
  const lengthOfEachInterval = totalLengthOfShank
    .sub(lengthOfPad.mul(2))
    .div(numberOfIntervals);
  const lengthOfDash = lengthOfEachInterval.mul(
    percentOfEachIntervalThatIsDash
  );
  const totalLengthOfGaps = lengthOfEachInterval.sub(lengthOfDash); //This lengths is split into before and after the dash, with offset being the length before the dash that is determined by a sawtooth function.

  const clippingLogic = Fn(() => {
    const result = color(cylinderMaterial.color);
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

  cylinderMaterial.colorNode = clippingLogic();

  // path is the center line of the initial(untransformed) tube.
  const centerLine = new LineCurve3(new Vector3(0, 0, 0), new Vector3(0, 1, 0));
  const cylinder = new THREE.TubeGeometry(centerLine, 64, 1, 128, false);

  const returnMesh = new Mesh(cylinder, cylinderMaterial);
  returnMesh.name = name;
  returnMesh.raycast = () => {}; // this object is never intersected
  return returnMesh;
}

export function createUltraPoint(
  name: string,
  temporary = false //used in handlers,flag so that temporary objects are never hit with ray casting
): Mesh {
  const cylinderMaterial = new CustomPointMaterial({
    color: 0x000000, // 0xff8080,
    opacity: 1.0
  });

  const transformationMatrixUniform =
    cylinderMaterial.userData.transformationMatrix;
  const radiusUniform = cylinderMaterial.userData.radius;
  const heightUniform = cylinderMaterial.userData.height;
  const glowingUniform = cylinderMaterial.userData.glowing;
  const positionUniform = cylinderMaterial.userData.position;
  radiusUniform.value = 0.06; //default radius
  heightUniform.value = 0.05; //default thickness

  cylinderMaterial.positionNode = Fn(() => {
    const myRadius = select(
      glowingUniform.greaterThan(0.5), // selected nodes pulse in size
      radiusUniform
        .mul(unitLength)
        .mul(oscSine(time.mul(pulseRate)).mul(pulseSizePercent).add(1)),
      radiusUniform.mul(unitLength)
    );
    const myHeight = select(
      glowingUniform.greaterThan(0.5), // selected nodes pulse in size
      heightUniform
        .mul(unitLength)
        .mul(oscSine(time.mul(pulseRate)).mul(pulseSizePercent).add(1)),
      heightUniform.mul(unitLength)
    );

    const radialVec = vec2(positionLocal.x, positionLocal.y);
    const radialDir = radialVec.normalize();
    const radialDist = radialVec.length();

    // Scale the XY based on radial distance from axis, and Z based on height
    const scaledX = radialDir.x.mul(radialDist).mul(myRadius);
    const scaledY = radialDir.y.mul(radialDist).mul(myRadius);
    const scaledZ = positionLocal.z.mul(myHeight);

    // Apply the transformation matrix to the custom-scaled local position
    return transformationMatrixUniform.mul(vec4(scaledX, scaledY, scaledZ, 1.0))
      .xyz;
  })();

  const colorFunction = Fn(() => {
    // Clip points to the visible part of the hyperboloid
    If(positionUniform.z.greaterThan(0), () => {
      If(
        or(
          positionLocal.z.greaterThan(zUpperClip.add(radiusUniform)),
          positionLocal.z.lessThan(float(0).sub(radiusUniform))
        ),
        () => {
          Discard();
        }
      );
    }).Else(() => {
      If(
        or(
          positionLocal.z.greaterThan(float(0).add(radiusUniform)),
          positionLocal.z.lessThan(zLowerClip.sub(radiusUniform))
        ),
        () => {
          Discard();
        }
      );
    });
    // Glowing points color pulses
    const returnColor = select(
      glowingUniform.greaterThan(0.5),
      color(cylinderMaterial.color).mul(
        oscSine(time.mul(pulseRate)).mul(pulseSizePercent).add(1)
      ),
      color(cylinderMaterial.color).mul(1.0)
    );

    return returnColor;
  });
  cylinderMaterial.colorNode = colorFunction();

  const profile = [
    new Vector2(1, -0.5),
    new Vector2(2, -0.5),
    new Vector2(2, 0.5),
    new Vector2(1, 0.5),
    new Vector2(1, -0.5)
  ];
  const squareTorusGeo = new LatheGeometry(profile, 64);
  squareTorusGeo.rotateX(Math.PI / 2);
  squareTorusGeo.computeVertexNormals();

  // const returnMesh = new Mesh(new CylinderGeometry(), cylinderMaterial);
  const returnMesh = new Mesh(squareTorusGeo, cylinderMaterial);
  returnMesh.name = name;

  returnMesh.raycast = function (raycaster, intersects) {
    if (temporary) return; // temporary objects are never hit
    const [x, y, z] = positionUniform.value.toArray();
    const tempIntersections = intersectWithSurface(
      raycaster.ray.origin,
      raycaster.ray.direction,
      raycaster.near,
      raycaster.far,
      z > 0,
      SURFACE_TYPES.ultraStrip
    );
    tempIntersections.forEach(intersection => {
      if (
        intersection.point.distanceTo(new Vector3(x, y, z)) <
        radiusUniform.value * unitLength.value * 5
      ) {
        intersects.push({
          distance: intersection.distance - radiusUniform.value,
          point: intersection.point.clone(),
          normal: intersection.normal,
          object: this
        });
      }
    });
  };

  return returnMesh;
}

export function createIdealStrip(upper: boolean): Mesh {
  const idealStripMaterial = new THREE.MeshPhysicalNodeMaterial({
    color: 0x8c92ac,
    side: DoubleSide,
    transparent: false
    //depthWrite: false
  });

  const upperZValue = upper
    ? zUpperIdealStripClipPlus
    : zLowerIdealStripClipPlus;
  const lowerZValue = upper
    ? zUpperIdealStripClipMinus
    : zLowerIdealStripClipMinus;

  const transformedZ = positionLocal.z
    .mul(upperZValue.sub(lowerZValue))
    .add(lowerZValue);

  idealStripMaterial.positionNode = Fn(() => {
    return vec3(
      positionLocal.x.mul(transformedZ),
      positionLocal.y.mul(transformedZ),
      transformedZ
    );
  })();

  const path = new LineCurve3(new Vector3(0, 0, 0), new Vector3(0, 0, 1));
  const geometry = new THREE.TubeGeometry(path, 64, 1, 128, false);
  const idealPointMesh = new Mesh(geometry, idealStripMaterial);

  idealPointMesh.raycast = function (raycaster, intersects) {
    const partialIntersects = intersectWithSurface(
      raycaster.ray.origin,
      raycaster.ray.direction,
      raycaster.near,
      raycaster.far,
      upper,
      SURFACE_TYPES.idealStrip
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

  return idealPointMesh;
}

const waterGlassSettings = {
  side: THREE.DoubleSide,
  depthWrite: false,
  transparent: true,
  opacity: 1.0,
  roughness: 0.0,
  ior: 1.33,
  clearcoatRoughness: 0.0,
  metalness: 0.0,
  specularIntensity: 0.0,
  clearcoat: 0.5,
  transmission: 0.9,
  thickness: 0.01,
  color: 0xffffff,
  attenuationColor: 0x99ccff,
  attenuationDistance: 10.0
};

export function createUltraStrip(upper): THREE.Mesh {
  const ultraStripMaterial = new THREE.MeshPhysicalNodeMaterial(
    waterGlassSettings
  );
  ultraStripMaterial.transparent = true; // <-- ADD THIS (just to be safe)
  ultraStripMaterial.depthWrite = false; // <-- ADD THIS
  // const baseColor = color(ultraStripMaterial.color);
  const baseColor = color(0xffffff);
  const localPositionZ = varying(positionLocal.z); // make this available in the fragment shader

  const clippingLogic = Fn(() => {
    if (upper) {
      positionLocal.z.greaterThan(zUpperClip).discard();
      // positionLocal.z.lessThan(0).discard();
    } else {
      positionLocal.z.lessThan(zLowerClip).discard();
      // positionLocal.z.greaterThan(0).discard();
    }
    return baseColor;
  });

  ultraStripMaterial.colorNode = clippingLogic();

  const ultraStripGeometry = new ParametricGeometry(
    (u, v, pt) => {
      u = (upper ? 1 : -1) * u * (Math.acosh(SETTINGS.maxZClip) + 1);

      const correctedV = upper ? 1.0 - v : v; // Fix normals for the lower sheet
      const theta = correctedV * 2 * Math.PI;

      const x = Math.cosh(u) * Math.cos(theta);
      const y = Math.cosh(u) * Math.sin(theta);
      const z = Math.sinh(u);
      pt.set(x, y, z);
    },
    120,
    300
  );

  const ultraStripMesh = new Mesh(ultraStripGeometry, ultraStripMaterial);
  ultraStripMesh.renderOrder = 2;
  ultraStripMesh.raycast = function (raycaster, intersects) {
    const partialIntersects = intersectWithSurface(
      raycaster.ray.origin,
      raycaster.ray.direction,
      raycaster.near,
      raycaster.far,
      upper,
      SURFACE_TYPES.ultraStrip
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

  return ultraStripMesh;
}

const hazyGlassSettings = {
  side: THREE.DoubleSide,
  depthWrite: false,
  color: 0xffffff,
  transparent: true,
  opacity: 1.0,
  transmission: 0.85,
  attenuationColor: 0x3a7bb4,
  attenuationDistance: 0.5,
  emissive: new THREE.Color(0x2a6ba4),
  emissiveIntensity: 0.5,
  ior: 1.0,
  thickness: 1.0,
  specularIntensity: 0.0,
  clearcoat: 0.0,
  roughness: 1.0,
  metalness: 0.0
};
export function createBoundaryCone(upper: boolean): THREE.Mesh {
  const coneMaterial = new THREE.MeshPhysicalNodeMaterial(hazyGlassSettings);
  const baseColor = color(0xffffff);
  const localPositionZ = varying(positionLocal.z); // make this available in the fragment shader

  const clippingLogic = Fn(() => {
    if (upper) {
      positionLocal.z.greaterThan(zUpperIdealStripClipMinus).discard();
    } else {
      positionLocal.z.lessThan(zLowerIdealStripClipPlus).discard();
    }

    return baseColor;
  });

  coneMaterial.colorNode = clippingLogic();

  // Smooth the opacity of the top edge
  const upperSmooth = smoothstep(
    zUpperIdealStripClipMinus.mul(SETTINGS.fadePercentage),
    zUpperIdealStripClipMinus,
    localPositionZ
  ).oneMinus();

  const lowerSmooth = smoothstep(
    zLowerIdealStripClipPlus,
    zLowerIdealStripClipPlus.mul(SETTINGS.fadePercentage),
    localPositionZ
  );

  coneMaterial.opacityNode = (upper ? upperSmooth : lowerSmooth)
    .mul(float(SETTINGS.startOpacityFade).sub(float(SETTINGS.endOpacityFade)))
    .add(float(SETTINGS.endOpacityFade))
    .mul(float(0.5));

  const coneGeometry = new ParametricGeometry(
    (u, v, out) => {
      let r = u * SETTINGS.maxZClip; // Keep radius strictly positive
      if (r == 0) {
        r = 0.0001; // Avoid singularity at the tip
      }

      // Since we only negate Z below, the winding order flip perfectly fixes the normals
      const correctedV = upper ? v : 1.0 - v;
      const theta = correctedV * 2 * Math.PI;

      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const z = upper ? r : -r; // Negate Z for the lower sheet
      out.set(x, y, z);
    },
    120,
    300
  );

  const coneMesh = new Mesh(coneGeometry, coneMaterial);
  coneMesh.raycast = () => {}; // this object is never intersected
  coneMesh.renderOrder = 3;
  return coneMesh;
}
export function createHyperboloidSheet(upper: boolean): THREE.Mesh {
  const hyperboloidMaterial = new THREE.MeshPhysicalNodeMaterial({
    color: 0x004080, //0x2d2d2d, //, // 0x2d2d2d, //0xc46210,
    side: DoubleSide,
    metalness: 0.1,
    roughness: 0.2,
    transparent: true, //false, //true,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
  });
  // hyperboloidMaterial.transparent = true;
  //hyperboloidMaterial.depthWrite = false;
  //hyperboloidMaterial.depthTest = false;

  const baseColor = color(hyperboloidMaterial.color);

  const clippingLogic = Fn(() => {
    if (upper) {
      positionLocal.z.greaterThan(zUpperClip).discard();
    } else {
      positionLocal.z.lessThan(zLowerClip).discard();
    }
    return baseColor;
  });

  hyperboloidMaterial.colorNode = clippingLogic();

  // Smooth the opacity of the edge of the hyperboloid
  const upperSmooth = smoothstep(
    zUpperClip.mul(SETTINGS.fadePercentage),
    zUpperClip,
    positionLocal.z
  ).oneMinus();

  const lowerSmooth = smoothstep(
    zLowerClip,
    zLowerClip.mul(SETTINGS.fadePercentage),
    positionLocal.z
  );

  hyperboloidMaterial.opacityNode = (upper ? upperSmooth : lowerSmooth)
    .mul(float(SETTINGS.startOpacityFade).sub(float(SETTINGS.endOpacityFade)))
    .add(float(SETTINGS.endOpacityFade));

  const hyperboloidGeometry = new ParametricGeometry(
    (u, v, pt) => {
      u = u * (Math.acosh(SETTINGS.maxZClip) + 1) + 0.001; // add one because the dolly max distance is sometimes exceeded when all the way zoomed out to allow for smooth zooming and motion. This way the clipping planes limit the display and very little extra (which is cut off by the clipping plane) is stored in the scene. Adding 0.001 to avoid clumping of points at the tip which causes rendering issues.
      const correctedV = upper ? v : 1.0 - v;
      const theta = correctedV * 2 * Math.PI;
      const x = Math.sinh(u) * Math.cos(theta);
      const y = Math.sinh(u) * Math.sin(theta);
      const z = (upper ? 1 : -1) * Math.cosh(u);
      pt.set(x, y, z);
    },
    120,
    300
  );

  const hyperboloidMesh = new Mesh(hyperboloidGeometry, hyperboloidMaterial);
  hyperboloidMesh.renderOrder = 1;
  hyperboloidMesh.raycast = function (raycaster, intersects) {
    const partialIntersects = intersectWithSurface(
      raycaster.ray.origin,
      raycaster.ray.direction,
      raycaster.near,
      raycaster.far,
      upper,
      SURFACE_TYPES.hyperboloid
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
const GRID_Z_OFFSET = 0.01; // World-space push off hyperboloid surface to prevent z fighting with grid lines.

export function createPolarGridCircle(
  intrinsicRadius: number,
  upper: boolean,
  zPlus: boolean, // controls if the circle is just above the hyperboloid or just below
  thickness = 1
): Mesh {
  const circlePoints: number[] = [];
  const error = 0.004;
  const numPoints = Math.ceil(
    Math.PI / Math.acos(1 - error / Math.sinh(intrinsicRadius))
  );

  // Push the circle points slightly off the hyperboloid surface in ±z so they
  // are guaranteed to be in front of the surface in the depth buffer.
  const zOffset = zPlus ? GRID_Z_OFFSET : -GRID_Z_OFFSET;
  const z =
    (upper ? Math.cosh(intrinsicRadius) : -Math.cosh(intrinsicRadius)) +
    zOffset;

  for (let angle = 0; angle < 2 * Math.PI; angle += (2 * Math.PI) / numPoints) {
    circlePoints.push(
      Math.sinh(intrinsicRadius) * Math.cos(angle),
      Math.sinh(intrinsicRadius) * Math.sin(angle),
      z
    );
  }
  // Close the circle
  circlePoints.push(circlePoints[0], circlePoints[1], circlePoints[2]);

  const geometry = new LineGeometry();
  geometry.setPositions(circlePoints);

  const lineMaterial = new THREE.Line2NodeMaterial({
    linewidth: thickness,
    transparent: true,
    color: "grey",
    blending: THREE.NormalBlending,
    alphaTest: 0.1,
    depthTest: true,
    depthWrite: false // Do not write to depth buffer — only test against it.
    // The hyperboloid (renderOrder 1) already wrote its depth.
    // Grid lines (renderOrder 4) just need to pass that test.
  });

  const instanceStart = attribute("instanceStart", "vec3");
  const varyingInstanceStartLocal = varying(instanceStart);
  const worldInstanceStartZ = modelWorldMatrix.mul(
    vec4(varyingInstanceStartLocal, 1.0)
  ).z;

  const clippingLogic = Fn(() => {
    const shouldClip = upper
      ? worldInstanceStartZ.greaterThan(zUpperClip)
      : worldInstanceStartZ.lessThan(zLowerClip);
    shouldClip.discard();
    return float(1.0);
  });

  lineMaterial.opacityNode = clippingLogic();

  // @ts-expect-error: Line2 constructor type definition is outdated for WebGPU materials
  const mesh = new Line2(geometry, lineMaterial);
  // Render AFTER the hyperboloid (1), ultra strip (2), and cone (3).
  // The depth buffer at this point contains the hyperboloid surface depths.
  // With depthWrite: false, the grid cannot interfere with any subsequent passes.
  mesh.renderOrder = 4;
  mesh.raycast = () => {};
  return mesh;
}
const MAX_RADIAL_STEP = 0.04; // Cap on parameter step for radial lines
export function createPolarGridRadialLine(
  radianAngle: number,
  upper: boolean,
  zPlus: boolean, // controls if the circle is just above the hyperboloid or just below
  thickness = 1
): Mesh {
  const points: number[] = [];

  // Push off the surface in ±z, same as the circle lines.
  const zOffset = zPlus ? GRID_Z_OFFSET : -GRID_Z_OFFSET;

  let nextTValue = 0.01;
  let myContinue = true;
  for (let i = 0; myContinue; i++) {
    const tMax = Math.acosh(SETTINGS.maxZClip + 1.0);
    if (nextTValue > tMax) {
      nextTValue = tMax;
      myContinue = false;
    }
    points.push(
      Math.sinh(nextTValue) * Math.cos(radianAngle),
      Math.sinh(nextTValue) * Math.sin(radianAngle),
      (upper ? 1 : -1) * Math.cosh(nextTValue) + zOffset
    );

    // Cap the exponential step growth. Without this cap, segments near the
    // edge of the hyperboloid can be long enough that a single segment spans
    // a viewing angle where its screen-space projection degenerates. Shorter
    // segments mean shorter degenerate gaps. The cap doesn't fully solve the
    // billboard problem (a line pointing at the camera is always degenerate)
    // but it keeps the visible gaps small.
    nextTValue += Math.min(0.01 * Math.exp(1.3 * nextTValue), MAX_RADIAL_STEP);
  }

  const geometry = new LineGeometry();
  geometry.setPositions(points);

  const lineMaterial = new THREE.Line2NodeMaterial({
    linewidth: thickness,
    transparent: true,
    color: "grey",
    blending: THREE.NormalBlending,
    alphaTest: 0.1,
    depthTest: true,
    depthWrite: false // Same reasoning as circle lines above
  });

  const instanceStart = attribute("instanceStart", "vec3");
  const instanceEnd = attribute("instanceEnd", "vec3");
  const varyingInstanceStartLocal = varying(instanceStart);
  const varyingInstanceEndLocal = varying(instanceEnd);

  const clippingLogic = Fn(() => {
    const intermediatePositionLocal = mix(
      varyingInstanceStartLocal,
      varyingInstanceEndLocal,
      uv().y.add(1.0).div(2.0)
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

  lineMaterial.opacityNode = clippingLogic();

  // @ts-expect-error: Line2 constructor type definition is outdated for WebGPU materials
  const lineMesh = new Line2(geometry, lineMaterial);
  lineMesh.renderOrder = 4;
  lineMesh.raycast = () => {};
  return lineMesh;
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
