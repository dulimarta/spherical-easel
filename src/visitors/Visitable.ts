import { Visitor } from "./Visitor";

export interface Visitable {
  accept(v: Visitor): void;
}
