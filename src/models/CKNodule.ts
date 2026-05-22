import Nodule from "@/plottables-spherical/Nodule";

export abstract class CKNodule {
  static NODE_COUNT = 0;
  protected _parent: Array<WeakRef<CKNodule>> = [];
  protected _kids: Array<CKNodule> = [];
  public id: number;
  public name = "";
  public ref?: Nodule;
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
}
