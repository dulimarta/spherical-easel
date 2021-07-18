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
      expect(out.rightChild?.node.kind).toEqual(TokenType.MULT);

      const coeff = out.leftChild;
      expect(coeff?.node.kind).toEqual(TokenType.NUMBER);
      expect(coeff?.node.numericValue).toEqual(3);

      const powerTerm = out.rightChild?.leftChild;
      expect(powerTerm?.node.kind).toEqual(TokenType.POW);
      expect(powerTerm?.leftChild?.node.kind).toEqual(TokenType.MEASUREMENT);
      expect(powerTerm?.leftChild?.node.text).toEqual("z");
      expect(powerTerm?.rightChild?.node.kind).toEqual(TokenType.NUMBER);
      expect(powerTerm?.rightChild?.node.numericValue).toEqual(2);

      const thirdTerm = out.rightChild?.rightChild;
      // console.debug("3rd term", thirdTerm);
      expect(thirdTerm?.node.kind).toEqual(TokenType.NUMBER);
      expect(thirdTerm?.node.numericValue).toEqual(1);
    });

    it("differentiates sum of terms", () => {
      const out = diff("2 + x");
      expect(out.node.kind).toEqual(TokenType.PLUS);
      expect(out.leftChild).toBeTruthy();
      const left = out.leftChild!;
      expect(left.node.kind).toEqual(TokenType.NUMBER);
      expect(left.node.numericValue).toEqual(0);
      expect(out.rightChild).toBeTruthy();
      const right = out.rightChild!;
      expect(right.node.kind).toEqual(TokenType.NUMBER);
      expect(right.node.numericValue).toEqual(1);
    });

    it("differentiates sum of terms", () => {
      const out = diff("2*t**4 + 7*t", "t");
      expect(out.node.kind).toEqual(TokenType.PLUS);
      expect(out.leftChild).toBeTruthy();
      const left = out.leftChild!;
      // First term 0 * t ** 4 + 2 * 4 * t**3 * 1
      expect(left.node.kind).toEqual(TokenType.PLUS);
      expect(left.leftChild?.node.kind).toEqual(TokenType.MULT);
      expect(left.leftChild?.leftChild?.node.kind).toEqual(TokenType.NUMBER);
      expect(left.leftChild?.leftChild?.node.numericValue).toEqual(0);
      expect(left.leftChild?.rightChild?.node.kind).toEqual(TokenType.POW);
      expect(left.leftChild?.rightChild?.leftChild?.node.kind).toEqual(
        TokenType.MEASUREMENT
      );
      expect(left.leftChild?.rightChild?.leftChild?.node.text).toEqual("t");
      expect(left.leftChild?.rightChild?.rightChild?.node.kind).toEqual(
        TokenType.NUMBER
      );
      expect(left.leftChild?.rightChild?.rightChild?.node.numericValue).toEqual(
        4
      );

      expect(out.rightChild).toBeTruthy();
      const second = out.rightChild!;
      // 0*t + 7*1
      expect(second.node.kind).toEqual(TokenType.PLUS);
      expect(second.leftChild?.node.kind).toEqual(TokenType.MULT);
      expect(second.leftChild?.leftChild?.node.kind).toEqual(TokenType.NUMBER); // 0
      expect(second.leftChild?.leftChild?.node.numericValue).toEqual(0); // 0
      expect(second.leftChild?.rightChild?.node.kind).toEqual(
        TokenType.MEASUREMENT
      );
      expect(second.leftChild?.rightChild?.node.text).toEqual("t");
      expect(second.rightChild?.node.kind).toEqual(TokenType.MULT);
      expect(second.rightChild?.leftChild?.node.kind).toEqual(TokenType.NUMBER);
      expect(second.rightChild?.leftChild?.node.numericValue).toEqual(7);
      expect(second.rightChild?.rightChild?.node.kind).toEqual(
        TokenType.NUMBER
      );
      expect(second.rightChild?.rightChild?.node.numericValue).toEqual(1);
    });

    it("differentiates of difference of terms", () => {
      const out = diff("a - x");
      expect(out.node.kind).toEqual(TokenType.MINUS);
      expect(out.leftChild).toBeTruthy();
      const left = out.leftChild!;
      expect(left.node.kind).toEqual(TokenType.NUMBER);
      expect(left.node.numericValue).toEqual(0);
      expect(out.rightChild).toBeTruthy();
      const right = out.rightChild!;
      expect(right.node.kind).toEqual(TokenType.NUMBER);
      expect(right.node.numericValue).toEqual(1);
    });

    it("differentiates product of terms", () => {
      const out = diff("a * x");
      expect(out.node.kind).toEqual(TokenType.PLUS);

      expect(out.leftChild).toBeTruthy();
      const left = out.leftChild!;
      expect(left.node.kind).toEqual(TokenType.MULT);
      expect(left.leftChild?.node.kind).toEqual(TokenType.NUMBER);
      expect(left.leftChild?.node.numericValue).toEqual(0);
      expect(left.rightChild?.node.kind).toEqual(TokenType.MEASUREMENT);

      expect(out.rightChild).toBeTruthy();
      const right = out.rightChild!;
      expect(right.node.kind).toEqual(TokenType.MULT);
      expect(right.leftChild?.node.kind).toEqual(TokenType.MEASUREMENT);
      expect(right.leftChild?.node.text).toEqual("a");
      expect(right.rightChild?.node.kind).toEqual(TokenType.NUMBER);
      expect(right.rightChild?.node.numericValue).toEqual(1);
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
