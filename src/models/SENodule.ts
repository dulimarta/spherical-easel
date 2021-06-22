import { Vector3 } from "three";
import Nodule from "@/plottables/Nodule";
import { Styles } from "@/types/Styles";
import { UpdateStateType } from "@/types";
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

  static resetAllCounters(): void {
    NODE_COUNT = 0;
    SENodule.POINT_COUNT = 0;
    SENodule.LINE_COUNT = 0;
    SENodule.SEGMENT_COUNT = 0;
    SENodule.ANGLEMARKER_COUNT = 0;
    SENodule.CIRCLE_COUNT = 0;

    SENodule.EXPR_COUNT = 0;
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
  // TODO: SEExpression and it subclasses have no associated plottables
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
}
