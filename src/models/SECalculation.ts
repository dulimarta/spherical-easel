import { SEExpression } from "./SEExpression";

export class SECalculation extends SEExpression {
  protected exprText: string = "";

  get value(): number {
    return 0;
  }
}
