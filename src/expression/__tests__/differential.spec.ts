import {
  ExpressionParser,
  SyntaxTree,
  TokenType
} from "@/expression/ExpressionParser";

describe("Derivatives", () => {
  describe("Generate First Derivative tree", () => {
    function diff(expr: string, varname = "x"): SyntaxTree {
      const out = ExpressionParser.parse(expr);
      return ExpressionParser.differentiate(out, varname);
    }

    it("differentiates numeric constant", () => {
      const out = diff("5");

      expect(out.node.kind).toEqual(TokenType.NUMBER);
      expect(out.node.numericValue).toEqual(0);
    });

    it("differentiates non-numeric constant", () => {
      const out = diff("a", "x");

      expect(out.node.kind).toEqual(TokenType.NUMBER);
      expect(out.node.numericValue).toEqual(0);
    });

    it("differentiates linear terms", () => {
      const out = diff("x");
      expect(out.node.kind).toEqual(TokenType.NUMBER);
      expect(out.node.numericValue).toEqual(1);
    });

    it("differentiates polynomial terms", () => {
      const out = diff("z ** 3 ", "z");
      expect(out.node.kind).toEqual(TokenType.MULT);

      const coeff = out.leftChild;
      expect(coeff?.node.kind).toEqual(TokenType.NUMBER);
      expect(coeff?.node.numericValue).toEqual(3);

      const powerTerm = out.rightChild;
      expect(powerTerm?.node.kind).toEqual(TokenType.POW);
      expect(powerTerm?.leftChild?.node.kind).toEqual(TokenType.MEASUREMENT);
      expect(powerTerm?.leftChild?.node.text).toEqual("z");
      expect(powerTerm?.rightChild?.node.kind).toEqual(TokenType.NUMBER);
      expect(powerTerm?.rightChild?.node.numericValue).toEqual(2);
    });

    it("differentiates sum of terms", () => {
      const out = diff("2 + x");
      expect(out.node.kind).toEqual(TokenType.NUMBER);
      expect(out.node.numericValue).toEqual(1);
      // expect(out.leftChild).toBeTruthy();
      // const left = out.leftChild!;
      // expect(left.node.kind).toEqual(TokenType.NUMBER);
      // expect(left.node.numericValue).toEqual(0);
      // expect(out.rightChild).toBeTruthy();
      // const right = out.rightChild!;
      // expect(right.node.kind).toEqual(TokenType.NUMBER);
      // expect(right.node.numericValue).toEqual(1);
    });

    it("differentiates sum of terms", () => {
      const out = diff("2*t**4 + 7*t", "t");
      expect(out.node.kind).toEqual(TokenType.PLUS);
      expect(out.leftChild).toBeTruthy();
      // First term 8 * t**3
      const firstTerm = out.leftChild!;
      expect(firstTerm.node.kind).toEqual(TokenType.MULT);
      expect(firstTerm.leftChild).toBeTruthy();
      expect(firstTerm.rightChild).toBeTruthy();
      const coeff = firstTerm.leftChild!;
      // console.debug("First term coefficient", coeff);
      expect(coeff.node.kind).toEqual(TokenType.NUMBER);
      expect(coeff.node.numericValue).toEqual(2);

      const prodTerm = firstTerm.rightChild!;
      expect(prodTerm.node.kind).toEqual(TokenType.MULT);
      expect(prodTerm.leftChild?.node.kind).toEqual(TokenType.NUMBER);
      expect(prodTerm.leftChild?.node.numericValue).toEqual(4);

      const powTerm = prodTerm.rightChild!;

      expect(powTerm.node.kind).toEqual(TokenType.POW);
      expect(powTerm.leftChild?.node.kind).toEqual(TokenType.MEASUREMENT);
      expect(powTerm.leftChild?.node.text).toEqual("t");
      expect(powTerm.rightChild?.node.kind).toEqual(TokenType.NUMBER);
      expect(powTerm.rightChild?.node.numericValue).toEqual(3);

      expect(out.rightChild).toBeTruthy();
      const secondTerm = out.rightChild!;
      expect(secondTerm.node.kind).toEqual(TokenType.NUMBER);
      expect(secondTerm.node.numericValue).toEqual(7);
    });

    it("differentiates of difference of terms", () => {
      const out = diff("a - x");
      expect(out.node.kind).toEqual(TokenType.NUMBER);
      expect(out.node.numericValue).toEqual(-1);
    });

    it("differentiates product of terms", () => {
      const out = diff("a * x");
      expect(out.node.kind).toEqual(TokenType.MEASUREMENT);
      expect(out.node.text).toEqual("a");
    });
  });

  describe("Evaluate differential expression", () => {
    function evalDiff(
      expr: string,
      option: { var: string; value: number }
    ): number {
      const out = ExpressionParser.parse(expr);
      const varMap: Map<string, number> = new Map();
      varMap.set(option.var, option.value);
      const diff = ExpressionParser.differentiate(out, option.var);

      return ExpressionParser.evaluate(diff, varMap);
    }

    it("evaluates diff of constant", () => {
      const result = evalDiff("5", { var: "x", value: -3 });
      expect(result).toEqual(0);
    });

    it("evaluates diff of linear terms", () => {
      const result = evalDiff("x", { var: "x", value: -3 });
      expect(result).toEqual(1);
    });

    it("evaluates diff of sum of linear terms", () => {
      const result = evalDiff("3*x + 100", { var: "x", value: -3 });
      expect(result).toEqual(3);
    });
    it("evaluates diff of difference of polynomial terms", () => {
      const result = evalDiff("5 * x**3 - 2*x", { var: "x", value: 3 });
      expect(result).toEqual(135 - 2);
    });
  });
});
