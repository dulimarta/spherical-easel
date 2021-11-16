import { UnsignedShort4444Type, Vector3 } from "three";
import Nodule from "@/plottables/Nodule";
import {
  NormalVectorAndTValue,
  ObjectState,
  ParametricVectorAndTValue
} from "@/types";
import newton from "newton-raphson-method";
import SETTINGS from "@/global-settings";
import { colors } from "vuetify/lib";
import Parametric from "@/plottables/Parametric";

let NODE_COUNT = 0;

export abstract class SENodule {
  public static POINT_COUNT = 0;
  public static SEGMENT_COUNT = 0;
  public static LINE_COUNT = 0;
  public static CIRCLE_COUNT = 0;
  public static ANGLEMARKER_COUNT = 0;
  public static EXPR_COUNT = 0;
  public static ELLIPSE_COUNT = 0;
  public static PARAMETRIC_COUNT = 0;
  public static LABEL_COUNT = 0;
  public static POLYGON_COUNT = 0;

  static resetAllCounters(): void {
    NODE_COUNT = 0;
    SENodule.POINT_COUNT = 0;
    SENodule.LINE_COUNT = 0;
    SENodule.SEGMENT_COUNT = 0;
    SENodule.ANGLEMARKER_COUNT = 0;
    SENodule.CIRCLE_COUNT = 0;
    SENodule.EXPR_COUNT = 0;
    SENodule.ELLIPSE_COUNT = 0;
    SENodule.PARAMETRIC_COUNT = 0;
    SENodule.LABEL_COUNT = 0;
    SENodule.POLYGON_COUNT = 0;
  }

  /**
   * An array to store the parents of the node (i.e. the objects that this node depends on)
   */
  protected _parents: SENodule[] = [];

  /**
   * An array to store the kids of the node (i.e. the objects that depend on this node)
   */
  protected _kids: SENodule[] = [];

  /**
   * A pointer to the corresponding plottable object
   */
  public ref?: Nodule;

  /**
   * temporary vectors to help with finding tangents
   */
  private tmpVec1 = new Vector3();
  private tmpVec2 = new Vector3();

  /* A unique identification number and name for each node */
  public id: number;
  public name = "";

  constructor() {
    this.id = NODE_COUNT++;
  }

  /* If the object doesn't exist then exists= false (For example the intersection of two circles
        can exist only if the two circles are close enough to each other, but even when they are 
        far apart and the intersections don't exist, the user might drag the circles back to where
        the intersections exist). If an object doesn't exist then all of the objects that are 
        descendants of the object don't exist. */
  protected _exists = true;

  /* If the object is not visible then showing = true (The user can hide objects)*/
  protected _showing = true;

  /* If the object is selected, it is either being used by an event tool or is in the setSelectedSENodules in mutations. Its glow property is not turned off by the highlighter.ts routines*/
  protected _selected = false;

  /* This boolean is set to indicate that the object is out of date and needs to be updated. */
  protected _outOfDate = false;

  /**
   * A method to update the current SENodule on the unit sphere when its parents have changed
   * The first method called is canUpdateNow, that checks to see if all the parents of this object are
   * not outOfDate. If any are the method returns with out updating, knowing that the updating method will
   * eventually try again because the last method called is updateKids()
   */
  public abstract update(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void;

  /**
   * Is the object hit a point at a particular sphere location?
   * @param sphereVector a location on the ideal unit sphere
   */
  public abstract isHitAt(
    unitIdealVector: Vector3,
    currentMagnificationFactor: number
  ): boolean;

  /**
   * Which style options are customizable for a particular subclass
   *
   * NOTE: Ideally we want to use an abstract static method.
   * But Typescript does not support it (yet?)
   */
  public abstract customStyles(): Set<string>;

  /* Marks all descendants (kids, grand kids, etc.) of the current SENodule out of date */
  public markKidsOutOfDate(): void {
    this._kids.forEach(item => {
      item.setOutOfDate(true);
      item.markKidsOutOfDate();
    });
  }

  /* This is called to check and see if any of the parents of the current SENodule are outOfDate
    if any of the parents are outOfDate then this function returns false. 
    <SENodule>.updateNow()
    is asking does <SENodule> need to be updated? If there is a parent outOfDate, then <SENodule> should 
    *not* be updated now. It should wait until *all* parents are not outOfDate.  */
  public canUpdateNow(): boolean {
    return !this._parents.some(item => item.isOutOfDate());
  }

  /* Kids of the current SENodule are updated  */
  public updateKids(
    objectState?: Map<number, ObjectState>,
    orderedSENoduleList?: number[]
  ): void {
    // In order to do a topological sort of the Data Structure (Directed Acyclic Graph), we first
    // query which of the kids of this object are updatable right now and then for those that are updatable
    // we update them. This means that every descendant object is visited only once.
    const updatableNowIndexList: number[] = [];
    this._kids.forEach((item, index) => {
      if (item.canUpdateNow()) {
        updatableNowIndexList.push(index);
      }
    });

    for (let i = 0; i < updatableNowIndexList.length; i++) {
      this._kids[updatableNowIndexList[i]].update(
        objectState,
        orderedSENoduleList
      );
    }
    return;
  }

  /**
   * Adds a given SENodule, n, to the parent array of the current SENodule
   * @param n the new SENodule to add
   */
  public addParent(n: SENodule): void {
    this._parents.push(n);
  }

  /** Removes a given SENodule, n, from the parent array of the current SENodule
   * @param n node to remove
   */
  public removeParent(n: SENodule): void {
    const idx = this._parents.findIndex((node: SENodule) => node.id === n.id);
    if (idx >= 0) {
      this._parents.splice(idx, 1);
    }
  }

  /* Adds a given SENodule, n, to the kids array of the current SENodule */
  public addKid(n: SENodule): void {
    this._kids.push(n);
  }

  /* Removes a given SENodule, n, from the kid arry of the current SENodule */
  public removeKid(n: SENodule): void {
    const idx = this._kids.findIndex((item: SENodule) => item.id === n.id);
    if (idx >= 0) this._kids.splice(idx, 1);
  }

  /* This registers a given SENodule as a child of the current SENodule by 
    1) putting the given SENodule,n ,as an element in the kids array
    2) declaring that the parent of the given SENodule is the current node  
    For example, if we are creating the intersection point P of two circles (C1 and C2) 
    that already exist. Then we would create a point P and call 
    C1.registerChild(P)  
    C2.registerChild(P)
    this would make the kids array of C1 (and C2) contain P and the parent array of P
    contain both C1 and C2.*/
  public registerChild(n: SENodule): void {
    //console.debug(`Register ${n.name} as child of ${this.name}`);
    this.addKid(n);
    n.addParent(this);
  }

  /* Unregister 1) removes the given SENodule,n, from the kids array and 2) removes the 
    current SENodule from the parents array of the given SENodule. If P was a registeredChild of circles
    C1 and C2, then to unregister it we would call
    C1.unregisterChild(P)
    C2.unregisterChild(P)
    this is never used on its own - it is called as part of a routine for removing an SENodule 
    from the object tree entirely, so all SENodules that are descendants (kids, grand kids, etc.)of 
    P must be recursively removed from object tree and this is accomplished with the remove 
    function. 
    */
  public unregisterChild(n: SENodule): void {
    this.removeKid(n);
    n.removeParent(this);
  }

  // public removeSelfSafely(): void {
  //   if (this._kids.length == 0) {
  //     // const pars = this._parents.map(p => p.name).join(", ");
  //     // console.debug(`Unregistering ${this.name} from ${pars}`);
  //     this._parents.forEach(item => {
  //       // Warning: we can't call unregisterChild() here
  //       // because that will eventually call this.removeParent()
  //       // which alters the parents array while we are still
  //       // iterating through its elements here
  //       item.removeKid(this);
  //     });
  //     this._parents.clear();
  //   } else {
  //     const dep = this._kids.map(z => z.name).join(", ");
  //     console.error(`Can't remove ${this.name} safely because of ${dep}`);
  //   }
  // }

  /* This removes the current node and all descendants (kids, grand kids, etc.) from the 
    object tree by using the unregister function and remove recursively */
  public removeThisNode(): void {
    //remove the current node from all of its parent SENodules
    this._parents.forEach(item => {
      item.unregisterChild(this);
    });
    while (this._kids.length > 0) {
      this._kids[0].removeThisNode();
    }
  }

  public setOutOfDate(b: boolean): void {
    this._outOfDate = b;
  }

  public isOutOfDate(): boolean {
    return this._outOfDate;
  }

  //Should return true only if this is an instance of SEPointOnOneDimensional over ride as appropriate
  public isPointOnOneDimensional(): boolean {
    return false;
  }
  // Only returns true if this is an SEPoint and this has no parents or is a point on an object
  public isFreePoint(): boolean {
    return false;
  }
  // Carefule with over ride, for example, the class SEPoint has isFreePoint return true, but its subclasses should return false
  public isNonFreePoint(): boolean {
    return false;
  }
  // Only returns true if this is an SEPoint (or a sub class)
  public isPoint(): boolean {
    return false;
  }
  // Only returns true if this is an SENonFreeLine
  public isNonFreeLine(): boolean {
    return false;
  }
  // Only returns true if this is an SELabel
  public isLabel(): boolean {
    return false;
  }
  // Only returns true if this is an SEOneDimensional
  public isOneDimensional(): boolean {
    return false;
  }
  // Only returns true if this is an Labelable
  public isLabelable(): boolean {
    return false;
  }
  // Only returns true if this is an SESegment of length pi (or very nearly pi)
  public isSegmentOfLengthPi(): boolean {
    return false;
  }
  //only returns true if this is an SELine where the points defining it are antipodal or nearly so
  public isLineWithAntipodalPoints(): boolean {
    return false;
  }

  public isFreeToMove(): boolean {
    if (
      this.isFreePoint() ||
      this.isPointOnOneDimensional() ||
      this.isLabel() ||
      this.isSegmentOfLengthPi() ||
      this.isLineWithAntipodalPoints()
    )
      return true;
    if (this.isNonFreeLine() || this.isNonFreePoint()) {
      // don't let this fall through because if a line or object has an empty parents array the .every method returns true even for non-free lines
      return false;
    }
    return this._parents.every(n => n.isFreePoint());
  }

  //Getters and Setters

  public abstract get noduleItemText(): string;

  public abstract get noduleDescription(): string;

  set exists(b: boolean) {
    this._exists = b;
  }

  get exists(): boolean {
    return this._exists;
  }

  get kids(): SENodule[] {
    return this._kids;
  }

  get parents(): SENodule[] {
    return this._parents;
  }

  set showing(b: boolean) {
    // Set the showing variable
    this._showing = b;

    // Set the display for the corresponding plottable object
    this.ref?.setVisible(b);
  }

  get showing(): boolean {
    return this._showing;
  }

  set glowing(b: boolean) {
    //glowing has no effect on hidden objects
    if (/*this._selected || */ !this._showing) return;
    if (b) {
      // Set the display for the corresponding plottable object
      if (!(this.ref instanceof Parametric)) this.ref?.glowingDisplay();
      else {
        let ptr: Parametric | null = this.ref;
        while (ptr !== null) {
          ptr.glowingDisplay();
          ptr = ptr.next;
        }
      }
    } else {
      if (!(this.ref instanceof Parametric)) this.ref?.normalDisplay();
      else {
        let ptr: Parametric | null = this.ref;
        while (ptr !== null) {
          ptr.normalDisplay();
          ptr = ptr.next;
        }
      }
      // TODO: not glowing implies not selected?
      // this.selected = false;
    }
  }

  /** Careful n.selected is not the same as being on the setSelectedSENodules list. A selected
   *  object's glow property is not turned off by the highlighter.ts routines */
  set selected(b: boolean) {
    // selecting has no effect on hidden objects
    if (!this._showing) return;
    this._selected = b;
    if (b) {
      // Set the display for the corresponding plottable object
      this.ref?.glowingDisplay();
      // TODO: do we need to set glowing?
      // this.glowing = true;
    } else {
      this.ref?.normalDisplay();
    }
  }

  get selected(): boolean {
    return this._selected;
  }

  /**
   * Find the closest vector to unitVec on the curve P(t) where tMin<= t <= tMax using subdivisions and Newton's method
   * @param P P(t) is the parameterization of a curve on the sphere (must be unit for all t)
   * @param PPrime P'(t) is the parameterization of the derivative of P(t) (NOT NECESSARILY UNIT)
   * @param unitVec a unit vector
   * @param tMin
   * @param tMax
   * @param PPPrime (Optional) P''(t) is the parameterization of the second derivative of P(t) (NOT NECESSARILY UNIT)
   */
  protected static closestVectorParametrically(
    P: (t: number) => Vector3,
    PPrime: (t: number) => Vector3,
    unitVec: Vector3,
    tMin: number,
    tMax: number,
    PPPrime?: (t: number) => Vector3
  ): ParametricVectorAndTValue {
    // First form the objective function, this is the function whose minimum we want to find.
    // The (angular) distance from P(t) to unitVec is d(t) = acos(P(t) /dot unitVec) because P(t) and unitVec are both unit
    const d: (t: number) => number = function(t: number): number {
      return Math.acos(Math.max(Math.min(P(t).dot(unitVec), 1), -1)); // if you drop the Math.min sometimes the dot product is bigger than one (just barely) but then d is undefined and that causes problems.
    };

    // The derivative of d(t) is zero at a minimum or max, so we want to find the zeros of d'(t)
    //  d'(t) = -1/ sqrt(1- (P(t) /dot unitVec)^2) * (P'(t) /dot unitVec)
    // This means that the zeros of d'(t) are the same as the zeros of (P'(t) /dot unitVec), so find them as they are (presumably) easier to find

    const dp: (t: number) => number = function(t: number): number {
      return PPrime(t).dot(unitVec);
    };

    // use (P''(t) /dot unitVec) as the second derivative if necessary
    let dpp: ((t: number) => number) | undefined;
    if (PPPrime !== undefined) {
      dpp = function(t: number): number {
        return PPPrime(t).dot(unitVec);
      };
    } else {
      dpp = undefined;
    }

    const zeros = this.findZerosParametrically(dp, tMin, tMax, [], dpp);
    if (zeros.length > 0) {
      // The zeros of dp are either minimums or maximums (or neither, but this is very unlikely so we assume it doesn't happen)
      let minTVal: number = zeros[0]; // The t value that minimizes d
      zeros.forEach(tVal => {
        if (d(tVal) < d(minTVal)) {
          minTVal = tVal;
        }
      });
      const returnPair: ParametricVectorAndTValue = {
        vector: P(minTVal),
        tVal: minTVal
      };

      return returnPair;
    } else {
      const d1 = d(tMin);
      const d2 = d(tMax);
      if (d1 < d2) {
        return {
          vector: P(tMin),
          tVal: d1
        };
      } else
        return {
          vector: P(tMin),
          tVal: d2
        };
    }
  }

  /**
   * A recursive method to implement the bisection method
   * @param f The continuous function whose zero we want to compute
   * t1 < t2 and f(t1)*f(t2)<0
   * @param t1
   * @param t2
   * @returns
   */
  protected static bisection(
    f: (t: number) => number,
    t1: number,
    t2: number
  ): number {
    if (Math.abs(f(t1)) < SETTINGS.tolerance / 1000) {
      return t1;
    }
    if (Math.abs(f(t2)) < SETTINGS.tolerance / 1000) {
      return t2;
    }
    const mid = (t1 + t2) / 2;
    if (Math.abs(t2 - t1) < SETTINGS.parameterization.bisectionMinSize) {
      return mid;
    } else {
      if (f(t1) * f(mid) < 0) {
        return SENodule.bisection(f, t1, mid);
      } else {
        return SENodule.bisection(f, mid, t2);
      }
    }
  }
  /**
   * Find all the unit normal vector lines that are perpendicular to the curve P(t) where tMin<= t <= tMax using subdivisions and Newton's method that
   * pass though unitVec
   * @param P P(t) is the parameterization of a curve on the sphere (must be unit for all t)
   * @param PPrime P'(t) is the parameterization of the derivative of P(t) (NOT NECESSARILY UNIT)
   * @param unitVec a unit vector
   * @param tMin
   * @param tMax
   * @param closed if true, implies P(tMin)=P(tMax)
   * @param periodic if true, implies P(t) = P(t + (tMax-tMin)) for all t
   */
  protected static getNormalsToPerpendicularLinesThruParametrically(
    // P: (t: number) => Vector3,
    PPrime: (t: number) => Vector3,
    unitVec: Vector3,
    tMin: number,
    tMax: number,
    avoidTheseTValues: number[],
    PPPrime?: (t: number) => Vector3
  ): NormalVectorAndTValue[] {
    // First form the objective function, this is the function that we want to find the zeros.
    // We want to find the t values where the P'(t) is perpendicular to unitVec (because P'(t) is a normal to the plane defining the perpendicular
    // line to P(t) passing through the point P(t), so we want this line to pass through unitVec i.e. unitVec and P'(t) are perp)
    // This means we want the dot product to be zero
    const d: (t: number) => number = function(t: number): number {
      return PPrime(t).dot(unitVec);
    };
    // use (P''(t) /dot unitVec) as the second derivative if necessary
    let dp: ((t: number) => number) | undefined;
    if (PPPrime !== undefined) {
      dp = function(t: number): number {
        return PPPrime(t).dot(unitVec);
      };
    } else {
      dp = undefined;
    }

    const zeros = this.findZerosParametrically(
      d,
      tMin,
      tMax,
      avoidTheseTValues,
      dp
    );

    // console.debug("Zeros for perpendicular lines", zeros);

    const returnVectors: Array<NormalVectorAndTValue> = zeros
      .map(tVal => {
        const tempNormal = new Vector3();
        tempNormal.copy(PPrime(tVal));
        tempNormal.normalize();
        // const tempLocation = new Vector3();
        // tempLocation.copy(P(tVal));
        // console.debug("At t=", tVal, "normal is", temp.toFixed(3));
        // don't return any zero vectors, the derivative being zero leads to a zero of d, but not a perpendicular
        // also check that that vec is perpendicular to the given unitVector
        // if (Math.abs(temp.dot(unitVec)) < SETTINGS.tolerance) {
        //   console.log("through point in SENodule");
        // } else {
        //   console.log("not through point in SENodule");
        // }
        return {
          normal: tempNormal,
          tVal
        };

        // }
      })
      .filter((pair: NormalVectorAndTValue) => !pair.normal.isZero());
    // remove duplicates from the list
    // const uniqueNormals: Vector3[] = [];
    // returnVectors.forEach(vec => {
    //   if (
    //     uniqueNormals.every(
    //       nor => !nor.cross(vec).isZero(SETTINGS.nearlyAntipodalIdeal)
    //     )
    //   ) {
    //     uniqueNormals.push(vec);
    //   }
    // });
    // console.log(
    //   "returnVectors list 0",
    //   returnVectors.length,
    //   returnVectors[1].x,
    //   returnVectors[1].y,
    //   returnVectors[1].z
    // );

    return returnVectors;
  }

  /**
   * Find all the unit normal vector lines that are tangent to the curve P(t) where tMin<= t <= tMax
   * using subdivisions and Newton's method that pass though unitVec
   * @param PPPrime P''(t) is the parameterization of second derivative of P(t) (NOT NECESSARILY UNIT)
   * @param PPrime P'(t) is the parameterization of the derivative of P(t) (NOT NECESSARILY UNIT)
   * @param unitVec a unit vector
   * @param tMin
   * @param tMax
   */
  protected static getNormalsToTangentLinesThruParametrically(
    P: (t: number) => Vector3,
    PPrime: (t: number) => Vector3,
    unitVec: Vector3,
    tMin: number,
    tMax: number,
    avoidTheseTValues: number[],
    PPPrime?: (t: number) => Vector3
  ): Vector3[] {
    // First form the objective function, this is the function that we want to find the zeros.
    // We want to find the t values where the P(t) x P'(t) is perpendicular to unitVec (because P(t) x P'(t) is a normal to the plane defining the tangent

    // This means we want the dot product to be zero
    const d: (t: number) => number = function(t: number): number {
      const tmpVec = new Vector3();
      tmpVec.crossVectors(P(t), unitVec);
      return tmpVec.dot(PPrime(t));
    };
    // use (P(t)xP''(t)).unitVect as the second derivative if necessary
    let dp: ((t: number) => number) | undefined;
    if (PPPrime !== undefined) {
      dp = function(t: number): number {
        const tmpVec = new Vector3();
        tmpVec.crossVectors(P(t), PPPrime(t));
        return tmpVec.dot(unitVec);
      };
    } else {
      dp = undefined;
    }

    const zeros = this.findZerosParametrically(
      d,
      tMin,
      tMax,
      avoidTheseTValues,
      dp
    );

    const returnVectors: Vector3[] = [];
    zeros.forEach(tVal => {
      const temp = new Vector3();

      temp.copy(P(tVal).cross(unitVec));
      returnVectors.push(temp.normalize());
    });
    return returnVectors;
  }

  public static findZerosParametrically(
    f: (t: number) => number,
    tMin: number,
    tMax: number,
    avoidTheseTValues: number[],
    fPrime?: (t: number) => number // not used if bisection method is used
  ): number[] {
    // now we need to find all the places that d changes sign so we know where to start Newton's method
    const signChanges = [];
    const zeros: number[] = [];

    let tVal: number;
    let lastTVal = tMin;
    if (Math.abs(f(tMin)) < SETTINGS.tolerance / 1000) {
      // make sure that tMin is not on the avoid list
      if (
        avoidTheseTValues.every(
          num => Math.abs(num - tMin) > SETTINGS.tolerance
        )
      ) {
        zeros.push(tMin);
      }
      // else {
      //   console.log("Excluded value", tMin);
      // }
      // console.log("Actual zero! tMin", tMin, f(tMin));
    }

    for (let i = 1; i < SETTINGS.parameterization.subdivisions + 1; i++) {
      tVal =
        tMin + (i / SETTINGS.parameterization.subdivisions) * (tMax - tMin);
      if (tVal < tMin || tVal > tMax)
        console.debug("Evaluating at t", tVal, "out of range", tMin, tMax);
      if (Math.abs(f(tVal)) < SETTINGS.tolerance / 1000) {
        // make sure that tVal is not on the avoid list
        if (
          avoidTheseTValues.every(
            num => Math.abs(num - tVal) > SETTINGS.tolerance
          )
        ) {
          zeros.push(tVal);
        }
        // else {
        //   console.log("Excluded value", tVal);
        // }
        // console.log("Actual zero!", tVal, f(tVal));
      } else if (f(tVal) * f(lastTVal) < 0) {
        // make sure that tMin is not on the avoid list
        if (!avoidTheseTValues.some(num => lastTVal <= num && num <= tVal)) {
          // console.log("sign Change", tVal, f(tVal));
          signChanges.push([lastTVal, tVal]);
        }
        // else {
        //   console.log("Excluded Interval", lastTVal, tVal);
        // }
      }

      lastTVal = tVal;
    }
    if (signChanges.length === 0 && zeros.length === 0) {
      return [];
    }

    signChanges.forEach(interval => {
      try {
        if (
          SETTINGS.parameterization.useNewtonsMethod &&
          fPrime !== undefined
        ) {
          //Newton's Method
          const zeroTVal: number | boolean = newton(
            f,
            fPrime,
            (interval[0] + interval[1]) / 2
            // { verbose: true }
          );

          if (
            zeroTVal !== false &&
            interval[0] - SETTINGS.tolerance <= zeroTVal &&
            zeroTVal <= interval[1] + SETTINGS.tolerance
          ) {
            zeros.push(zeroTVal as number);
          } else {
            console.log(
              "Newton's method failed to converge in interval",
              interval[0],
              interval[1],
              zeroTVal
            );
          }
        } else {
          // Bisection Method
          const zeroTVal = SENodule.bisection(f, interval[0], interval[1]);
          zeros.push(zeroTVal as number);
        }
      } catch (err) {
        console.debug("Newton's method error", err);
      }
    });
    return zeros;
  }
}
