import { ObjectState } from "@/types";
import { Visitor } from "@/visitors/Visitor";
import { Vector3 } from "three";
import { SENodule } from "./SENodule";
import { SEParametric } from "./internal";

export class SEParametricGroup extends SENodule {
  private curves: Array<SEParametric> = [];
  constructor() {
    super();
  }

  public add(p: SEParametric) {
    this.curves.push(p);
  }

  get members(): Array<SEParametric> {
    return this.curves;
  }

  public update(
    objectState?: Map<number, ObjectState> | undefined,
    orderedSENoduleList?: number[] | undefined
  ): void {
    throw new Error("Method not implemented.");
  }
  public shallowUpdate(): void {
    throw new Error("Method not implemented.");
  }
  public isHitAt(
    unitIdealVector: Vector3,
    currentMagnificationFactor: number
  ): boolean {
    throw new Error("Method not implemented.");
  }
  public customStyles(): Set<string> {
    throw new Error("Method not implemented.");
  }
  public accept(v: Visitor): boolean {
    throw new Error("Method not implemented.");
  }
  public get noduleItemText(): string {
    throw new Error("Method not implemented.");
  }
  public get noduleDescription(): string {
    throw new Error("Method not implemented.");
  }
}
