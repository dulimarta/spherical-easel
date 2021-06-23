import { Vector3 } from "three";
import Nodule from "@/plottables/Nodule";
import { Styles } from "@/types/Styles";
import { UpdateStateType } from "@/types";
import newton from "newton-raphson-method";
import SETTINGS from "@/global-settings";
import Ellipse from "@/plottables/Ellipse";

//import AppStore from "@/store";

//import { magnificationLevel } from "@/components/SENoduleItem.vue";

let NODE_COUNT = 0;

export abstract class SENodule {
  protected static POINT_COUNT = 0;
  protected static SEGMENT_COUNT = 0;
  protected static LINE_COUNT = 0;
  protected static CIRCLE_COUNT = 0;
  protected static ANGLEMARKER_COUNT = 0;
  protected static EXPR_COUNT = 0;
  protected static ELLIPSE_COUNT = 0;

  static resetAllCounters(): void {
    NODE_COUNT = 0;
    SENodule.POINT_COUNT = 0;
    SENodule.LINE_COUNT = 0;
    SENodule.SEGMENT_COUNT = 0;
    SENodule.ANGLEMARKER_COUNT = 0;
    SENodule.CIRCLE_COUNT = 0;
    SENodule.EXPR_COUNT = 0;
    SENodule.ELLIPSE_COUNT = 0;
  }

  /**
   * The Global Vuex Store
   */
  //protected static store = AppStore;

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

  /* A unique identification number and name for each node */
  public id: number;
  public name: string;

  constructor() {
    this.id = NODE_COUNT++;
    this.name = `SENodule ${this.id}`;
  }

  /* If the object doesn't exist then exists= false (For example the intersection of two circles
        can exist only if the two circles are close enough to each other, but even when they are 
        far apart and the intersections don't exist, the user might drag the circles back to where
        the intersections exist). If an object doesn't exist then all of the objects that are 
        descendants of the object don't exist. */
  protected _exists = true;

  /* If the object is not visible then showing = true (The user can hide objects)*/
  protected _showing = true;

  /* If the object is selected, it is either being used by an event tool or is in the setSelectedSENodules sin mutations*/
  protected _selected = false;

  /* This boolean is set to indicate that the object is out of date and needs to be updated. */
  protected _outOfDate = false;

  /**
   * A method to update the current SENodule on the unit sphere when its parents have changed
   * The first method called is canUpdateNow, that checks to see if all the parents of this object are
   * not outOfDate. If any are the method returns with out updating, know that the updating method will
   * eventually try again because the last method called is updateKids()
   */
  public abstract update(state: UpdateStateType): void;

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
  public abstract customStyles(): Set<Styles>;

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
  public updateKids(state: UpdateStateType): void {
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
      this._kids[updatableNowIndexList[i]].update(state);
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

  //Hans -  why doesn't this testing for class work?
  //Should return true only if this is an instance of SEPointOnOneDimensional
  public abstract isPointOnOneDimensional(): boolean;
  // This doesn't work
  // public isPointOnOneDimensional(): this is SEPointOnOneDimensional {
  //   return true;
  // }

  // Only returns true if this is an SEPoint and this has no parents
  public abstract isFreePoint(): boolean;
  // This doesn't work
  // public isFreePoint(): this is SEPoint {
  //   return this._parents.length == 0;
  // }

  // Only returns true if this is an SEPoint
  public abstract isPoint(): boolean;
  // I wish something like this worked but it doesn't
  // public isPoint(): this is SEPoint {
  //   return true;
  // }

  // Only returns true if this is an SELabel
  public abstract isLabel(): boolean;
  // This doesn't work
  // public isLabel(): this is SELabel {
  //   return true;
  // }

  // Only returns true if this is an SEOneDimensional
  public abstract isOneDimensional(): boolean;
  // This doesn't work
  // public isOneDimensional(): this is SEOneDimensional {
  //   return true;
  // }
  // Only returns true if this is an Labelable
  public abstract isLabelable(): boolean;

  // Only returns true if this is an SESegment of length pi
  public abstract isSegmentOfLengthPi(): boolean;

  public isFreeToMove(): boolean {
    if (this.isFreePoint() || this.isPointOnOneDimensional() || this.isLabel())
      return true;
    if (this.isPoint()) {
      // don't let this fall through because if a point has an empty parents array the .every method returns true even for non-free points
      return false;
    }
    if (this.isSegmentOfLengthPi()) {
      return true;
    }
    return this._parents.every(n => n.isFreePoint());
  }

  //Getters and Setters
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
      this.ref?.glowingDisplay();
    } else {
      this.ref?.normalDisplay();
      // TODO: not glowing implies not selected?
      // this.selected = false;
    }
  }

  /** Careful n.selected is not the same as being on the setSelectedSENodules list */
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
   * @param PPPrime P''(t) is the parameterization of the second derivative of P(t) (NOT NECESSARILY UNIT)
   * @param unitVec a unit vector
   * @param tMin
   * @param tMax
   * @param closed if true, implies P(tMin)=P(tMax)
   * @param periodic if true, implies P(t) = P(t + (tMax-tMin)) for all t
   */
  protected static closestVectorParametrically(
    P: (t: number) => Vector3,
    PPrime: (t: number) => Vector3,
    PPPrime: (t: number) => Vector3,
    unitVec: Vector3,
    tMin: number,
    tMax: number
  ): Vector3 {
    // First form the objective function, this is the function whose minimum we want to find.
    // The (angular) distance from P(t) to unitVec is d(t) = acos(P(t) /dot unitVec) because P(t) and unitVec are both unit
    const d: (t: number) => number = function (t: number): number {
      return Math.acos(Math.min(P(t).dot(unitVec), 1)); // if you drop the Math.min sometimes the dot product is bigger than one (just barely) but then d is undefined and that causes problems.
    };

    // The derivative of d(t) is zero at a minimum or max, so we want to find the zeros of d'(t)
    //  d'(t) = -1/ sqrt(1- (P(t) /dot unitVec)^2) * (P'(t) /dot unitVec)
    // This means that the zeros of d'(t) are the same as the zeros of (P'(t) /dot unitVec), so find them as they are (presumably) easier to find

    const dp: (t: number) => number = function (t: number): number {
      return PPrime(t).dot(unitVec);
    };

    // const dp: (t: number) => number = function (t: number): number {
    //   return (
    //     (-1 * PPrime(t).dot(unitVec)) /
    //     Math.sqrt(1 - P(t).dot(unitVec) * P(t).dot(unitVec))
    //   );
    // };
    // use (P''(t) /dot unitVec) as the second derivative if necessary
    const dpp: (t: number) => number = function (t: number): number {
      return PPPrime(t).dot(unitVec);
    };

    // const dpp: (t: number) => number = function (t: number): number {
    //   return (
    //     (-P(t).dot(unitVec) * PPrime(t).dot(unitVec) * PPrime(t).dot(unitVec) +
    //       (-1 + P(t).dot(unitVec) * P(t).dot(unitVec)) *
    //         PPPrime(t).dot(unitVec)) /
    //     Math.sqrt(
    //       (1 - P(t).dot(unitVec) * P(t).dot(unitVec)) *
    //         (1 - P(t).dot(unitVec) * P(t).dot(unitVec)) *
    //         (1 - P(t).dot(unitVec) * P(t).dot(unitVec))
    //     )
    //   );
    // };

    // now we need to find all the places that dp changes sign so we know where to start Newton's method
    const signChanges = [];
    let tVal: number;
    let lastTVal = tMin;
    for (let i = 1; i < SETTINGS.parameterization.subdivisions + 1; i++) {
      tVal =
        tMin + (i / SETTINGS.parameterization.subdivisions) * (tMax - tMin);
      // console.log("dp(t)", tVal, dp(tVal));
      if (dp(tVal) * dp(lastTVal) < 0) {
        signChanges.push([lastTVal, tVal]);
      }
      lastTVal = tVal;
    }

    if (signChanges.length === 0) {
      console.log(
        "No minimum distance found - ERROR in closestVectorParametrically"
      );
      return new Vector3();
    }
    // if (signChanges.length != 2) {
    //   console.log("signChange length", signChanges.length);
    // }
    const zeros: number[] = [];
    signChanges.forEach(interval => {
      const zeroTVal = SENodule.bisection(dp, interval[0], interval[1]);
      zeros.push(zeroTVal);
      // const zeroTVal: number | boolean = newton(
      //   dp,
      //   dpp,
      //   (interval[0] + interval[1]) / 2,
      //   { verbose: true }
      // );
      // if (
      //   zeroTVal !== false //&&
      //   // interval[0] < zeroTVal &&
      //   // zeroTVal < interval[1]
      // ) {
      //   zeros.push(zeroTVal as number);
      // }
      // if (
      //   zeroTVal !== false &&
      //   (zeroTVal > interval[1] || zeroTVal < interval[0])
      // ) {
      //   console.log(
      //     "Newton method fail interval"
      //     // interval[0],
      //     // interval[1],
      //     // zeroTVal,
      //     // "dev values ",
      //     // dp(interval[0]),
      //     // dp(interval[1]),
      //     // dp(zeroTVal as number),
      //     // "values ",
      //     // d(interval[0]),
      //     // d((interval[0] + interval[1]) / 2),
      //     // d(interval[1])
      //   );
      // }
    });
    // console.log("ZL", zeros.length);
    // if (zeros.length !== 2) {
    // console.log(
    //   zeros,
    //   zeros.map(val => d(val))
    // );
    // }
    // The zeros of dp are either minimums or maximums (or neither, but this is very unlikely so we assume it doesn't happen)
    let minTVal: number = zeros[0]; // The t value that minimizes d
    zeros.forEach(tVal => {
      // if (isNaN(d(tVal))) {
      //   console.log(NaN, P(tVal).dot(unitVec));
      // }
      if (d(tVal) < d(minTVal)) {
        minTVal = tVal;
      }
    });

    return P(minTVal);
  }

  /**
   * A recursive method to implement the bisection method
   * @param f The continuous function whose zero we want to compute
   * t1< t2 and f(t1)*f(t2)<0
   * @param t1
   * @param t2
   * @returns
   */
  protected static bisection(
    f: (t: number) => number,
    t1: number,
    t2: number
  ): number {
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
  protected static getNormalsToLineThruParametrically(
    P: (t: number) => Vector3,
    PPrime: (t: number) => Vector3,
    unitVec: Vector3,
    tMin: number,
    tMax: number
  ): Vector3[] {
    // First form the objective function, this is the function that we want to find the zeros.
    // We want to find the t values where the P'(t) is perpendicular to unitVec (because P'(t) is a normal to the plane defining the perpendicular
    // line to P(t) passing through the point P(t), so we want this line to pass through unitVec i.e. unitVec and P'(t) are perp)
    // This means we want the dot product to be zero
    const d: (t: number) => number = function (t: number): number {
      return PPrime(t).dot(unitVec);
    };

    // now we need to find all the places that d changes sign so we know where to start Newton's method
    const signChanges = [];
    let tVal: number;
    let lastTVal = tMin;
    for (let i = 1; i < SETTINGS.parameterization.subdivisions + 1; i++) {
      tVal =
        tMin + (i / SETTINGS.parameterization.subdivisions) * (tMax - tMin);
      if (d(tVal) * d(lastTVal) < 0) {
        signChanges.push([lastTVal, tVal]);
      }
      lastTVal = tVal;
    }
    if (signChanges.length === 0) {
      console.log("No perpendiculars found - ERROR in getNormalsToLineThru");
      return [];
    }

    const zeros: number[] = [];
    signChanges.forEach(interval => {
      const zeroTVal = SENodule.bisection(d, interval[0], interval[1]);
      // const zeroTVal: number | boolean = newton(
      //   d,
      //   (interval[0] + interval[1]) / 2
      // );
      // if (zeroTVal !== false) {
      zeros.push(zeroTVal as number);
      // if (interval[0] > zeroTVal || zeroTVal > interval[1]) {
      //   console.log("Newton issue, converged outside of interval");
      // }
      // }
    });
    // if (
    //   Math.abs(PPrime(zeros[0]).x - PPrime(zeros[1]).x) +
    //     Math.abs(PPrime(zeros[0]).y - PPrime(zeros[1]).y) +
    //     Math.abs(PPrime(zeros[0]).z - PPrime(zeros[1]).z) <
    //   0.000001
    // ) {
    //   console.log("same perp");
    // }
    // console.log("zeros", zeros, PPrime(zeros[0]).x, PPrime(zeros[1]).x);
    const returnVectors: Vector3[] = [];
    zeros.forEach(tVal => {
      const temp = new Vector3();
      returnVectors.push(temp.copy(PPrime(tVal).normalize()));
    });
    return returnVectors;
    // // The zeros are the tVals that we are interested in so convert them to the corresponding normal vectors
    // const vectorsFromTValues = zeros.map(tVal => PPrime(tVal).normalize());

    // // Now make sure that none of the vectors in the return set are parallel (either the same or antipodal)
    // const returnVectors: Vector3[] = [vectorsFromTValues[0]];
    // const tmpVector = new Vector3();
    // for (let i = 1; i < vectorsFromTValues.length; i++) {
    //   for (let j = i; j < vectorsFromTValues.length; j++) {
    //     if (
    //       tmpVector
    //         .crossVectors(vectorsFromTValues[i - 1], vectorsFromTValues[j])
    //         .isZero(SETTINGS.nearlyAntipodalIdeal)
    //     ) {
    //       returnVectors.push(vectorsFromTValues[j]);
    //     }
    //   }
    // }
    // console.log("return len", returnVectors.length);
    // return returnVectors;
  }
}
