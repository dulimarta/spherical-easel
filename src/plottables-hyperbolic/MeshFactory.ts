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
  min,
  max,
  negate,
  mat4,
  sqrt,
  floor,
  mod,
  and
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
import {
  CustomPointMaterial,
  CustomLabelMaterial,
  CustomLineMaterial
} from "./MaterialFactory";
import {
  intersectWithHyperboloid,
  intersectWithIdealPointsStrip as intersectWithIdealPointsStrip
} from "@/utils/helpingHEFunctions";

const pulseRate = 0.3; // selected objects pulse and this set the rate oscSine(pulseRate*time)
const pulseSizePercent = 0.8; // selected objects grow between 1 and 1+pulseSizePercent times there size

// The z coordinate of all points on the hyperboloid(s) are between zUpperClip and zLowerClip and their negations
export const zUpperClip = uniform(1.0, "float");
export const zLowerClip = uniform(-1.0, "float");

// The z coordinate of all points of the upperIdealPointsStrip are between zUpperIdealPointsClipPlus and zUpperIdealPointsClipMinus,
export const zUpperIdealPointsClipPlus = uniform(2.0, "float");
export const zUpperIdealPointsClipMinus = uniform(1.5, "float");

// The z coordinate of all points of the lowerIdealPointsStrip are between zLowerIdealPointsClipPlus and zLowerIdealPointsClipMinus,
export const zLowerIdealPointsClipPlus = uniform(-1.5, "float");
export const zLowerIdealPointsClipMinus = uniform(-2.0, "float");

export const unitLength: THREE.TSL.ShaderNodeObject<THREE.UniformNode<number>> =
  uniform(1.0, "float");

export function createLine(
  name: string,
  upper: boolean,
  temporary = false, //used in handlers,flag so that temporary objects are never hit with ray casting
  radius = 0.15,
  myColor = 0xff8080 //ffb3b3, //ff8080, //"white", //"0xBEBFC5",
): Mesh {
  const cylinderMaterial = new CustomLineMaterial({
    color: myColor
  });
  const transformationMatrixUniform =
    cylinderMaterial.userData.transformationMatrix;
  const radiusUniform = cylinderMaterial.userData.radius;
  const glowingUniform = cylinderMaterial.userData.glowing;
  radiusUniform.value = radius;
  const upperUniform = cylinderMaterial.userData.upper;
  const modeUniform = cylinderMaterial.userData.mode;
  const startYUniform = cylinderMaterial.userData.startY;
  const endYUniform = cylinderMaterial.userData.endY;
  const normalVector = cylinderMaterial.userData.normalVector;

  const positionFunction = Fn(() => {
    // A glowing line's size pulses
    const myRadius = select(
      glowingUniform.greaterThan(0.5),
      radiusUniform
        .mul(unitLength)
        .mul(oscSine(time.mul(pulseRate)).mul(pulseSizePercent).add(1)),
      radiusUniform.mul(unitLength)
    );
    // transform to standard position along the alpha = Pi/2 hyperbolic line through (0,0,1)
    const scaleAndMoveToStandardPositionMatrix = mat4(
      vec4(myRadius, float(0), float(0), float(0)), // column 0,
      vec4(float(0), float(1), float(0), float(0)), // column 1,
      vec4(float(0), float(0), myRadius, float(0)), // column 2
      vec4(
        float(0),
        float(0),
        sqrt(positionLocal.y.mul(positionLocal.y).add(1)).mul(
          select(upperUniform.greaterThan(0.5), float(1.0), float(-1.0))
        ),
        float(1.0)
      ) // column 3
    );

    return transformationMatrixUniform.mul(
      scaleAndMoveToStandardPositionMatrix.mul(vec4(positionLocal, 1.0))
    ).xyz;
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
    const bit0 = mod(floor(modeUniform), 2.0);
    const bit1 = mod(floor(modeUniform.div(2.0)), 2.0);
    const bit2 = mod(floor(modeUniform.div(4.0)), 2.0);
    const drawAfterEnd = bit0.greaterThan(0.5);
    const drawBetweenStartAndEnd = bit1.greaterThan(0.5);
    const drawBeforeStart = bit2.greaterThan(0.5);

    // discard the portions of the line appropriately
    const largerY = max(startYUniform, endYUniform);
    const smallerY = min(startYUniform, endYUniform);
    // we always go from start to end when we are tracing the line
    // from one end to the other and that may or may not be in increasing y values (when transformed to standard position)
    // If startY < endY then we are tracing from smallest to largest
    // If startY > endY then we are tracing from largest to smallest and the ends drawn need to be flipped: drawAfterEnd = drawBeforeStart and drawBeforeStart = drawAfterEnd

    const newDrawBeforeStart = select(
      endYUniform.lessThan(startYUniform),
      drawAfterEnd,
      drawBeforeStart
    );
    const newDrawAfterEnd = select(
      endYUniform.lessThan(startYUniform),
      drawBeforeStart,
      drawAfterEnd
    );

    and(
      positionLocal.y.lessThan(smallerY),
      newDrawBeforeStart.negate()
    ).discard();

    and(
      and(
        positionLocal.y.lessThan(largerY),
        positionLocal.y.greaterThan(smallerY)
      ),
      drawBetweenStartAndEnd.negate()
    ).discard();

    and(
      positionLocal.y.greaterThan(largerY),
      newDrawAfterEnd.negate()
    ).discard();

    // // Glowing points color pulses
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
  // The maximum y value on the hyperboloid is when z = ArcCosh(maxZClip)+1.001, so that means that y = Sinh(ArcCosh(maxZClip)+1.001) is the maximum.  Double this to get the length of the cylinder before transformation.
  const returnMesh = new Mesh(
    new CylinderGeometry(
      1,
      1,
      2 * Math.sinh(Math.acosh(SETTINGS.maxZClip) + 1.001),
      20, // Radial segments
      64, // Segments along the length of the cylinder
      true
    ),
    cylinderMaterial
  );

  returnMesh.name = name;

  returnMesh.raycast = function (raycaster, intersects) {
    if (temporary) return; //temporary objects are never hit
    // const matrix = transformationMatrixUniform.value.elements;
    // const position = new Vector3(matrix[12], matrix[13], matrix[14]); // the position is stored in the last column of the transformation matrix
    // // console.log("intersect point", this.name, position.toFixed(2));
    const tempIntersections = intersectWithHyperboloid(
      raycaster.ray.origin,
      raycaster.ray.direction,
      raycaster.near,
      raycaster.far,
      upper
    );

    tempIntersections.forEach(intersection => {
      // If the intersection point is near the plane that defines the line then we are
      // on the line connecting startPoint and endPoint
      // Math.abs(normalVector.dot(intersection.point)) is the distance to the plane of the line
      if (
        Math.abs(normalVector.dot(intersection.point)) <
        radiusUniform.value * unitLength.value * 2.5
      ) {
        // now we have to determine if the point is near the part of the line that is displayed, this depends on the mode.

        const inverseTransformationMatrix = transformationMatrixUniform.value
          .clone()
          .invert();

        const intersectionY = intersection.point.applyMatrix4(
          inverseTransformationMatrix
        ).y; // This might not be exact enough.  If so, then we need to snap to the nearest point on the hyperboloid and on the plane.

        // first decode the mode
        const drawAfterEnd = ((modeUniform.value >> 2) & 1) > 0.5;
        const drawBetweenStartAndEnd = ((modeUniform.value >> 1) & 1) > 0.5;
        const drawBeforeStart = (modeUniform.value & 1) > 0.5;

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

        const isAHit =
          (intersectionY > largerY && newDrawAfterEnd) ||
          (largerY > intersectionY &&
            intersectionY > smallerY &&
            drawBetweenStartAndEnd) ||
          (smallerY > intersectionY && newDrawBeforeStart);

        if (isAHit) {
          console.log("line hit", this.name);
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
  upper: boolean,
  temporary = false, //used in handlers,flag so that temporary objects are never hit with ray casting
  radius = 0.15,
  myColor = 0xff8080 //ffb3b3, //ff8080, //"white", //"0xBEBFC5",
): Mesh {
  const sphereMaterial = new CustomPointMaterial({
    color: myColor,
    roughness: 0.3
  });
  const transformationMatrixUniform =
    sphereMaterial.userData.transformationMatrix;
  const radiusUniform = sphereMaterial.userData.radius;
  const glowingUniform = sphereMaterial.userData.glowing;
  radiusUniform.value = radius;

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
    if (upper) {
      positionLocal.z.greaterThan(zUpperClip).discard();
    } else {
      positionLocal.z.lessThan(zLowerClip).discard();
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
    if (temporary) return; //temporary objects are never hit
    const matrix = transformationMatrixUniform.value.elements;
    const position = new Vector3(matrix[12], matrix[13], matrix[14]); // the position is stored in the last column of the transformation matrix
    // console.log("intersect point", this.name, position.toFixed(2));
    const tempIntersections = intersectWithHyperboloid(
      raycaster.ray.origin,
      raycaster.ray.direction,
      raycaster.near,
      raycaster.far,
      position.z > 0
    );

    tempIntersections.forEach(intersection => {
      // If the raycaster origin is the camera position, then if we are within the apparent radius (plus 150%) of the point, it is hit by the raycaster
      if (
        position.distanceTo(intersection.point) <
        radiusUniform.value * unitLength.value * 2.5
      ) {
        // console.log("point hit", this.name);
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

export function createIdealPoint(
  name: string,
  upper: boolean,
  temporary = false, //used in handlers,flag so that temporary objects are never hit with ray casting
  radius = 0.18, // in multiples of the unit length
  height = 0.33, // in multiples of the unit length
  myColor = 0xff8080 //"white", //"0xBEBFC5",
): Mesh {
  const coneMaterial = new CustomPointMaterial({
    color: myColor,
    opacity: 1.0
  });
  const transformationMatrixUniform =
    coneMaterial.userData.transformationMatrix;
  const radiusUniform = coneMaterial.userData.radius;
  const heightUniform = coneMaterial.userData.height;
  //const angleUniform = coneMaterial.userData.angle;
  const glowingUniform = coneMaterial.userData.glowing;
  const upperUniform = coneMaterial.userData.upper;
  radiusUniform.value = radius;
  heightUniform.value = height;
  //angleUniform.value = angle;
  upperUniform.value = upper ? 1 : 0;

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
        myHeight.mul(0.5).add(zUpperIdealPointsClipMinus.mul(Math.SQRT2)),
        float(0.0),
        1
      ) // column 3
    );

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
    const matrix = transformationMatrixUniform.value.elements;
    const angle = (Math.PI / 2 - Math.atan2(-matrix[1], matrix[0])).modTwoPi(); // the first column starts with cos(angle-pi/2), -sin(angle-pi/2), ...
    const myUpper = upperUniform.value > 0.5 ? true : false;
    // console.log("Ideal points raycast  check", this.name, myUpper, angle);
    const tempIntersections = intersectWithIdealPointsStrip(
      raycaster.ray.origin,
      raycaster.ray.direction,
      raycaster.near,
      raycaster.far,
      myUpper
    );
    tempIntersections.forEach(intersection => {
      const hitAngle = Math.atan2(intersection.point.y, intersection.point.x);
      // If the angle is within the apparent radius of the base (plus 10%), it is hit by the raycaster
      // console.log("Ideal points hit angle", this.name, hitAngle);
      if (
        Math.abs(hitAngle - angle).modTwoPi() <
        radiusUniform.value * unitLength.value * 1.5
      ) {
        // console.log("hit ideal point", this.name);
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

export function createIdealPointTube(
  upper: boolean,
  angle: number = 0,
  radius: number = 0.05, // in multiples of the unit length
  myColor: number = 0xffbbbb, // 0xffbbbb, // 0xff9999, //"white",
  name: string = "tempIdealPointTube"
): Mesh {
  const coneMaterial = new CustomPointMaterial({
    color: myColor,
    opacity: 1.0,
    side: DoubleSide
  });
  const tubeAngleUniform = coneMaterial.userData.tubeAngle;
  const radiusUniform = coneMaterial.userData.radius;
  const upperUniform = coneMaterial.userData.upper;
  tubeAngleUniform.value = angle;
  radiusUniform.value = radius;
  upperUniform.value = upper ? 1 : 0;

  coneMaterial.positionNode = Fn(() => {
    // return positionLocal;
    const scaleAndTranslate = positionLocal.mul(
      vec3(
        radiusUniform.mul(unitLength),
        zUpperIdealPointsClipMinus.mul(Math.SQRT2),
        radiusUniform.mul(unitLength)
      )
    );
    // .mul(vec3(0, float(Math.SQRT2), 0));
    // .mul(vec3(0, zUpperIdealPointsClipMinus.mul(Math.SQRT2), 0));
    // return scaleAndTranslate;
    const minusPlusOne = select(upperUniform.equal(1), float(-1.0), float(1.0));
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
  const percentPad = 0.1; // percent of the total length of the tube that is not dashed at the ends.
  const numberOfIntervals = 3; // same as the number of dashes traveling up the shank.
  const rateOfOscillation = 0.4; // controls the speed of the dash movement along the shank.
  const percentOfEachIntervalThatIsDash = 0.5;
  const totalLengthOfShank = zUpperIdealPointsClipMinus;
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

/**
 * Creates the cone on which the ideal points lie, the  portion of the cone representing the ideal points are between the given clipping planes.
 * @param param0
 * @returns
 */
export function createIdealPointsStrip(upper: boolean): Mesh {
  const idealPointMaterial = new THREE.MeshPhysicalNodeMaterial({
    color: 0x8c92ac,
    side: DoubleSide,
    transparent: true
  });

  const posFunc = Fn(() => {
    // Scale and translate the original tube segment {(x,y,z) | x^2 + y^2 = 1, 0<=z<=1 } to
    //  {(x,y,z) | x^2 + y^2 = z^2, lowerZValue <= z <= upperZValue}
    const upperZValue = upper
      ? zUpperIdealPointsClipPlus
      : zLowerIdealPointsClipPlus;
    const lowerZValue = upper
      ? zUpperIdealPointsClipMinus
      : zLowerIdealPointsClipMinus;
    const transformedZ = positionLocal.z
      .mul(upperZValue.sub(lowerZValue))
      .add(lowerZValue);

    return vec3(
      positionLocal.x.mul(transformedZ),
      positionLocal.y.mul(transformedZ),
      transformedZ
    );
  });

  idealPointMaterial.positionNode = posFunc();

  // Add opacity to the edges of the ideal point's strip
  const opacityAtEdges = 0.7;
  const percentOfEdgeReduceInOpacity = 0.005;

  if (upper) {
    idealPointMaterial.opacityNode = smoothstep(
      zUpperIdealPointsClipMinus,
      zUpperIdealPointsClipMinus.mul(1 + percentOfEdgeReduceInOpacity),
      positionLocal.z
    )
      .mul(1 - opacityAtEdges)
      .sub(
        smoothstep(
          zUpperIdealPointsClipPlus.mul(1 - percentOfEdgeReduceInOpacity),
          zUpperIdealPointsClipPlus,
          positionLocal.z
        ).mul(1 - opacityAtEdges)
      )
      .add(opacityAtEdges);
  } else {
    idealPointMaterial.opacityNode = smoothstep(
      zLowerIdealPointsClipPlus,
      zLowerIdealPointsClipPlus.mul(1 + percentOfEdgeReduceInOpacity),
      positionLocal.z
    )
      .mul(1 - opacityAtEdges)
      .sub(
        smoothstep(
          zLowerIdealPointsClipMinus.mul(1 - percentOfEdgeReduceInOpacity),
          zLowerIdealPointsClipMinus,
          positionLocal.z
        ).mul(1 - opacityAtEdges)
      )
      .add(opacityAtEdges);
  }

  // path is the center line of the initial(untransformed) tube.
  const path = new LineCurve3(new Vector3(0, 0, 0), new Vector3(0, 0, 1));
  const geometry = new THREE.TubeGeometry(path, 64, 1, 128, false);

  const idealPointMesh = new Mesh(geometry, idealPointMaterial);

  // --- Override the raycast for the mesh otherwise the ray caster detects only the untransformed mesh---
  idealPointMesh.raycast = function (raycaster, intersects) {
    const partialIntersects = intersectWithIdealPointsStrip(
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

  return idealPointMesh;
}

export function createPolarGridCircle(
  intrinsicRadius: number, // The intrinsic hyperbolic radius
  upper: boolean,
  thickness = 3 //pixels
): Mesh {
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

export function createPolarGridRadialLine(
  radianAngle: number,
  upper: boolean,
  thickness = 3 //pixels
): Mesh {
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

export function createBoundaryCone(upper: boolean): THREE.Mesh {
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
      positionLocal.z.greaterThan(zUpperIdealPointsClipMinus).discard();
    } else {
      positionLocal.z.lessThan(zLowerIdealPointsClipPlus).discard();
    }

    return baseColor;
  });

  coneMaterial.colorNode = clippingLogic();

  // Smooth the opacity of the top edge of the hyperboloid
  coneMaterial.opacityNode = smoothstep(
    (upper ? zUpperIdealPointsClipMinus : zLowerIdealPointsClipPlus).mul(
      SETTINGS.fadePercentage
    ),
    upper ? zUpperIdealPointsClipMinus : zLowerIdealPointsClipPlus,
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

export function createHyperboloidSheet(upper: boolean): THREE.Mesh {
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
