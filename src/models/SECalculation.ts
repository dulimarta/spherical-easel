import { SEExpression } from "./SEExpression";
// import { ExpressionParser } from "@/expression/ExpressionParser";

export class SECalculation extends SEExpression {
  // static parser = new ExpressionParser();
  protected exprText = "";
  constructor(text: string) {
    super();
    this.exprText = text;
    this.name += `-Calc(${text}`;
  }
  get value(): number {
    return 0;
  }
}
