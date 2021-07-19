import { SENodule } from "./SENodule";
import { SEPoint } from "./SEPoint";
import Ellipse from "@/plottables/Ellipse";
import { Vector3, Matrix4 } from "three";
import { Visitable } from "@/visitors/Visitable";
import { Visitor } from "@/visitors/Visitor";
import { EllipseState, OneDimensional, ParametricState } from "@/types";
import SETTINGS from "@/global-settings";
import { UpdateMode, UpdateStateType, CircleState } from "@/types";
import { Labelable } from "@/types";
import { SELabel } from "@/models/SELabel";
import { Vector } from "two.js";
import { SEStore } from "@/store";
import i18n from "@/i18n";
import Parametric from "@/plottables/Parametric";
import { SEParametricEndPoint } from "./SEParametricEndPoint";
import {
  DEFAULT_PARAMETRIC_BACK_STYLE,
  DEFAULT_PARAMETRIC_FRONT_STYLE
} from "@/types/Styles";

const styleSet = new Set([
  ...Object.getOwnPropertyNames(DEFAULT_PARAMETRIC_FRONT_STYLE),
  ...Object.getOwnPropertyNames(DEFAULT_PARAMETRIC_BACK_STYLE)
]);
export class SEParametric extends SENodule
  implements Visitable, OneDimensional, Labelable {
  /**
   * The plottable (TwoJS) segment associated with this model segment
   */
  public ref: Parametric;
  /**
   * Pointer to the label of this SEParametric
   */
  public label?: SELabel;

  /** Use in the rotation matrix during a move event */
  private tmpVector = new Vector3();
  private tmpVector1 = new Vector3();
  private tmpVector2 = new Vector3();
  private tmpMatrix = new Matrix4();

  /**
   * Compute the maximum number of perpendiculars to this SEParametric
   */
  private _maxNumberOfPerpendiculars = 1;

  /**
   * The SE endpoints of this curve, if any
   */
  private _endPoints: SEParametricEndPoint[] = [];
  /**
   * Create a model SEParametric using:
   * @param parametric The plottable TwoJS Object associated to this object
   */
  constructor(parametric: Parametric) {
    super();
    this.ref = parametric;
    this.ref.updateDisplay();

    // Sample for max number of perpendiculars from any point on the sphere
    // https://stackoverflow.com/questions/9600801/evenly-distributing-n-points-on-a-sphere
    const sample: Vector3[] = [];
    for (let i = 0; i < SETTINGS.parametric.evenSphereSampleSize; i++) {
      const y = 1 - (i / (SETTINGS.parametric.evenSphereSampleSize - 1)) * 2; // y goes from 1 to -1
      const radius = Math.sqrt(1 - y * y); // radius at y
      const theta = ((Math.sqrt(5) + 1) / 2) * i; // golden angle increment
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      sample.push(new Vector3(x, y, z));
    }

    let numberOfPerp: number;
    sample.forEach(vec => {
      numberOfPerp = this.getNormalsToLineThru(vec, this.tmpVector).length;
      if (numberOfPerp > this._maxNumberOfPerpendiculars) {
        this._maxNumberOfPerpendiculars = numberOfPerp;
      }
    });
    console.log("Number of Perps", this._maxNumberOfPerpendiculars);
    // sample for number of tangents from any point on the sphere

    SEParametric.PARAMETRIC_COUNT++;
    this.name = `Pa${SEParametric.PARAMETRIC_COUNT}`;
  }

  customStyles(): Set<string> {
    return styleSet;
  }

  get maxNumberOfPerpendiculars(): number {
    return this._maxNumberOfPerpendiculars;
  }
  public get noduleDescription(): string {
    return String(
      i18n.t(`objectTree.parametricDescription`, {
        xExpression: this.ref.coordinateExpressions.x,
        yExpression: this.ref.coordinateExpressions.y,
        zExpression: this.ref.coordinateExpressions.z,
        tMinNumber: this.ref.tNumbers.min,
        tMaxNumber: this.ref.tNumbers.max
      })
    );
  }

  public get noduleItemText(): string {
    return (
      this.label?.ref.shortUserName ?? "No Label Short Name In SEParametric"
    );
  }

  get endPoints(): SEParametricEndPoint[] {
    return this._endPoints;
  }
  set endPoints(points: SEParametricEndPoint[]) {
    this._endPoints.slice(0);
    this._endPoints.push(...points);
  }

  public isHitAt(
    unitIdealVector: Vector3,
    currentMagnificationFactor: number
  ): boolean {
    return (
      this.tmpVector
        .subVectors(unitIdealVector, this.closestVector(unitIdealVector))
        .length() <
      SETTINGS.parametric.hitIdealDistance / currentMagnificationFactor
    );
  }

  public update(state: UpdateStateType): void {
    // If any one parent is not up to date, don't do anything
    if (!this.canUpdateNow()) {
      return;
    }
    this.setOutOfDate(false);

    // The measurement expressions parents must exist
    this._exists = this.ref.seParentExpressions.every(exp => {
      return exp.exists;
    });

    // find the tracing tMin and tMax
    const [tMin, tMax] = this.ref.tMinMaxExpressionValues() ?? [
      this.ref.tNumbers.min,
      this.ref.tNumbers.max
    ];
    // if the tMin/tMax values are out of order then parametric curve doesn't exist
    if (tMax <= tMin) {
      this._exists = false;
    }

    if (this._exists) {
      // display the updated parametric
      this.ref.updateDisplay();
    }

    if (this.showing && this._exists) {
      this.ref.setVisible(true);
    } else {
      this.ref.setVisible(false);
    }
    // These parametric are completely determined by their expression parents and an update on the parents
    // will cause this parametric to be put into the correct location. Therefore there is no need to
    // store it in the stateArray for undo move. Only store for delete

    if (state.mode == UpdateMode.RecordStateForDelete) {
      const parametricState: ParametricState = {
        kind: "parametric",
        object: this
      };
      state.stateArray.push(parametricState);
    }

    this.updateKids(state);
  }

  /**
   * Return the vector on the SECircle that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestVector(idealUnitSphereVector: Vector3): Vector3 {
    //first transform the idealUnitSphereVector from the target unit sphere to the unit sphere with the parametric (P(t)) in standard position
    const transformedToStandard = new Vector3();
    transformedToStandard.copy(idealUnitSphereVector);
    transformedToStandard.applyMatrix4(SEStore.inverseTotalRotationMatrix);

    // find the tracing tMin and tMax
    const [tMin, tMax] = this.ref.tMinMaxExpressionValues() ?? [
      this.ref.tNumbers.min,
      this.ref.tNumbers.max
    ];
    // It must be the case that tMax> tMin because in update we check to make sure -- if it is not true then this parametric doesn't exist

    const closestStandardVector = new Vector3();
    closestStandardVector.copy(
      SENodule.closestVectorParametrically(
        this.ref.P.bind(this.ref), // bind the this.ref so that this in the this.ref.P method is this.ref
        this.ref.PPrime.bind(this.ref), // bind the this.ref so that this in the this.ref.PPrime method is this.ref
        transformedToStandard,
        tMin,
        tMax
        //this.ref.Epp.bind(this.ref) // bind the this.ref so that this in the this.ref.E method is this.ref
      )
    );
    // Finally transform the closest vector on the ellipse in standard position to the target unit sphere
    return closestStandardVector.applyMatrix4(
      this.tmpMatrix.getInverse(SEStore.inverseTotalRotationMatrix)
    );
  }
  /**
   * Return the vector near the SEParameteric (within SETTINGS.parametric.maxLabelDistance) that is closest to the idealUnitSphereVector
   * @param idealUnitSphereVector A vector on the unit sphere
   */
  public closestLabelLocationVector(idealUnitSphereVector: Vector3): Vector3 {
    // First find the closest point on the parametric to the idealUnitSphereVector
    const closest = new Vector3();
    closest.copy(this.closestVector(idealUnitSphereVector));
    // The current magnification level

    const mag = SEStore.zoomMagnificationFactor;

    // If the idealUnitSphereVector is within the tolerance of the closest point, do nothing, otherwise return the vector in the plane of the ideanUnitSphereVector and the closest point that is at the tolerance distance away.
    if (
      closest.angleTo(idealUnitSphereVector) <
      SETTINGS.parametric.maxLabelDistance / mag
    ) {
      return idealUnitSphereVector;
    } else {
      // tmpVector1 is the normal to the plane of the closest point vector and the idealUnitVector
      // This can't be zero because tmpVector can be the closest on the segment to idealUnitSphereVector and parallel with ideanUnitSphereVector
      this.tmpVector1.crossVectors(idealUnitSphereVector, closest).normalize();
      // compute the toVector (so that tmpVector2= toVector, tmpVector= fromVector, tmpVector1 form an orthonormal frame)
      this.tmpVector2.crossVectors(closest, this.tmpVector1).normalize;
      // return cos(SETTINGS.segment.maxLabelDistance)*fromVector/tmpVec + sin(SETTINGS.segment.maxLabelDistance)*toVector/tmpVec2
      this.tmpVector2.multiplyScalar(
        Math.sin(SETTINGS.parametric.maxLabelDistance / mag)
      );
      return this.tmpVector2
        .addScaledVector(
          closest,
          Math.cos(SETTINGS.parametric.maxLabelDistance / mag)
        )
        .normalize();
    }
  }
  accept(v: Visitor): void {
    v.actionOnParametric(this);
  }

  /**
   * Return the normal vector(s) to the plane containing a line that is perpendicular to this parametric through the
   * sePoint, in the case that the usual way of defining this line is not well defined  (something is parallel),
   * use the oldNormal to help compute a new normal (which is returned)
   * @param sePoint A point on the line normal to this parametric
   */
  public getNormalsToLineThru(
    sePointVector: Vector3,
    oldNormal: Vector3 // ignored for Ellipse and Circle and Parametric, but not other one-dimensional objects
  ): Vector3[] {
    const transformedToStandard = new Vector3();
    transformedToStandard.copy(sePointVector);
    transformedToStandard.applyMatrix4(SEStore.inverseTotalRotationMatrix);

    // find the tracing tMin and tMax
    const [tMin, tMax] = this.ref.tMinMaxExpressionValues() ?? [
      this.ref.tNumbers.min,
      this.ref.tNumbers.max
    ];
    // It must be the case that tMax> tMin because in update we check to make sure -- if it is not true then this parametric doesn't exist

    const normalList = SENodule.getNormalsToLineThruParametrically(
      this.ref.P.bind(this.ref), // bind the this.ref so that this in the this.ref.P method is this.ref
      this.ref.PPrime.bind(this.ref), // bind the this.ref so that this in the this.ref.PPrime method is this.ref
      transformedToStandard,
      tMin,
      tMax
      //this.ref.Epp.bind(this.ref) // bind the this.ref so that this in the this.ref.E method is this.ref
    );
    // // return the normal vector that is closest to oldNormal DO NOT DO THIS FOR NOW
    // const minAngle = Math.min(
    //   ...(normalList.map(vec => vec.angleTo(oldNormal)) as number[])
    // );
    // const ind = normalList.findIndex((vec: Vector3) => {
    //   return vec.angleTo(oldNormal) === minAngle;
    // });

    // normalList.forEach(vec =>
    //   console.log(Math.abs(vec.dot(transformedToStandard)) < 0.00001)
    // );

    normalList.forEach(vec => {
      if (Math.abs(vec.length() - 1) > 0.00000001) {
        console.log("BLAHHHHHHH normal len", vec.length());
      }
    });

    // check for normals that arise from curve being C0 and not C1 -- must pass through the given vector
    // normalList = normalList
    //   .filter(vec => Math.abs(vec.dot(transformedToStandard)) < 0.00001)
    //   .filter(vec => vec.normalize());

    // remove duplicates from the list
    const uniqueNormals: Vector3[] = [];
    normalList.forEach(vec => {
      if (
        uniqueNormals.every(
          nor => !nor.cross(vec).isZero(SETTINGS.nearlyAntipodalIdeal)
        )
      ) {
        uniqueNormals.push(vec.normalize());
      }
    });
    // console.log("un per", uniqueNormals, normalList.length);

    if (uniqueNormals.length > this._maxNumberOfPerpendiculars) {
      console.debug(
        "The number of normal vectors is bigger than the number of normals counted in the constructor. (Ignore this if issued by constructor.)"
      );
    }
    return uniqueNormals.map(vec =>
      vec.applyMatrix4(
        this.tmpMatrix.getInverse(SEStore.inverseTotalRotationMatrix)
      )
    );
  }

  // I wish the SENodule methods would work but I couldn't figure out how
  // See the attempts in SENodule around line 218
  public isFreePoint(): boolean {
    return false;
  }
  public isOneDimensional(): boolean {
    return true;
  }
  public isPoint(): boolean {
    return false;
  }
  public isPointOnOneDimensional(): boolean {
    return false;
  }
  public isLabel(): boolean {
    return false;
  }
  public isSegmentOfLengthPi(): boolean {
    return false;
  }
  public isLabelable(): boolean {
    return true;
  }
  public isNonFreeLine(): boolean {
    return false;
  }
}
