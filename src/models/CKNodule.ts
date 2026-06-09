import Label from "@/plottables-spherical/Label";
import { Nodule } from "@/plottables/Nodule";
import { Vector3 } from "three";

// Both the Module(Subscriber|Publisher) implement the Observer pattern,
// The former is for the data model, and the latter is for the view.
// The view will subscribe to the model, and update itself when the model changes.
export interface ModelSubscriber {
  modelUpdated(): void;
}
export interface ModelPublisher {
  subscribe(subscriber: ModelSubscriber): void;
  // unsubscribe(subscriber: ModelSubscriber): void;
  notifyModelUpdated(): void;
}
export abstract class CKNodule implements ModelPublisher {
  static NODE_COUNT = 0;
  protected _parent: Array<WeakRef<CKNodule>> = [];
  protected _kids: Array<CKNodule> = [];
  protected _subscribers: Array<ModelSubscriber> = [];
  protected _highlighted = false;
  public id: number;
  public name = "";
  public ref?: Nodule;
  public labelRef?: Nodule;

  constructor() {
    this.id = CKNodule.NODE_COUNT++;
  }

  private addParent(n: CKNodule) {
    this._parent.push(new WeakRef(n));
  }

  private removeParent(n: CKNodule) {
    const idx = this._parent.findIndex(node => node.deref()?.id === n.id);
    if (idx >= 0) this._parent.splice(idx, 1);
  }

  private addKid(n: CKNodule) {
    this._kids.push(n);
  }

  private removeKid(n: CKNodule) {
    const idx = this._kids.findIndex(node => node.id === n.id);
    if (idx >= 0) this._parent.splice(idx, 1);
  }

  public registerChild(n: CKNodule) {
    this.addKid(n);
    n.addParent(this);
  }

  public unregisterChild(n: CKNodule) {
    this.removeKid(n);
    n.removeParent(this);
  }

  public removeThisNode() {
    this._parent.forEach(item => {
      item.deref()?.unregisterChild(this);
    });
    while (this._kids.length > 0) {
      this._kids[0].removeThisNode();
    }
  }

  public setHighlight(highlight: boolean) {
    this._highlighted = highlight;
    this.notifyModelUpdated();
  }

  public isHighlighted(): boolean {
    return this._highlighted;
  }

  subscribe(subscriber: ModelSubscriber): void {
    this._subscribers.push(subscriber);
  }

  notifyModelUpdated(): void {
    this._subscribers.forEach(subscriber => subscriber.modelUpdated());
  }
  public abstract isHitAt(unitIdealVector: Vector3): boolean;
}
