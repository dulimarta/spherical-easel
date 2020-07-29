import { SEExpression, evaluate } from "@/expression/SEExpression";

describe("SEExpression", () => {
  describe("Numeric constant", () => {
    it("evaluates integer constant with no sign", () => {
      const synTree = SEExpression.parse("5");
      expect(evaluate(synTree)).toBeCloseTo(5, 2);
    });

    it("evaluates floating point constant", () => {
      const synTree = SEExpression.parse("5.3");
      expect(evaluate(synTree)).toBeCloseTo(5.3, 2);
    });

    it("evaluates floating point constant with no leading digits", () => {
      const synTree = SEExpression.parse(".345");
      expect(evaluate(synTree)).toBeCloseTo(0.345, 3);
    });

    it("evaluates integer constant with leading +", () => {
      const synTree = SEExpression.parse("+5");
      const val = evaluate(synTree);
      expect(val).toBeCloseTo(5, 0);
    });
    it("evaluates integer constant with leading -", () => {
      const synTree = SEExpression.parse("-25");
      const val = evaluate(synTree);
      expect(val).toBeCloseTo(-25, 0);
    });
    it("evaluates floating point constant with no leading digits leading +", () => {
      const synTree = SEExpression.parse("+.345");
      expect(evaluate(synTree)).toBeCloseTo(0.345, 3);
    });
    it("evaluates floating point constant with no leading digits leading -", () => {
      const synTree = SEExpression.parse("-.456");
      expect(evaluate(synTree)).toBeCloseTo(-0.456, 3);
    });
  });

  describe("Special Math constants", () => {
    it("parses PI", () => {
      const synTree = SEExpression.parse("pi");
      expect(evaluate(synTree)).toBeCloseTo(3.14159, 5);
    });
    it("parses Euler number", () => {
      const synTree = SEExpression.parse("e");
      expect(evaluate(synTree)).toBeCloseTo(2.71828, 5);
    });
  });

  describe("Binary operators", () => {
    it("adds two values", () => {
      const synTree = SEExpression.parse("2.34 + 0.66");
      expect(evaluate(synTree)).toBeCloseTo(3, 2);
    });
    it("subtract two values", () => {
      const synTree = SEExpression.parse("2.34 - 0.66");
      expect(evaluate(synTree)).toBeCloseTo(1.68, 2);
    });
    it("multiplies two values", () => {
      const synTree = SEExpression.parse("2.34 * 5.00");
      expect(evaluate(synTree)).toBeCloseTo(11.7, 1);
    });
    it("divides two values", () => {
      const synTree = SEExpression.parse("1000 / 25.00");
      expect(evaluate(synTree)).toBeCloseTo(40.0, 1);
    });
    it("divides two values with unary minus", () => {
      const synTree = SEExpression.parse("1000 / -25.00");
      expect(evaluate(synTree)).toBeCloseTo(-40.0, 1);
    });
    it("divides two values with unary minuses", () => {
      const synTree = SEExpression.parse("-1000 / -25.00");
      expect(evaluate(synTree)).toBeCloseTo(40.0, 1);
    });
    it("divides two values with repeating decimals", () => {
      const synTree = SEExpression.parse("1000 / 3.00");
      expect(evaluate(synTree)).toBeCloseTo(333.33, 2);
    });

    it("computes exponent with positive base", () => {
      const synTree = SEExpression.parse("2 ^ 3");
      expect(evaluate(synTree)).toBeCloseTo(8.0, 1);
    });
    it("computes exponent with negative base", () => {
      const synTree = SEExpression.parse("-2 ^ 3");
      expect(evaluate(synTree)).toBeCloseTo(-8.0, 1);
    });
    it("computes exponent with negative power", () => {
      const synTree = SEExpression.parse("5 ^ -2");
      expect(evaluate(synTree)).toBeCloseTo(0.04, 2);
    });
    it("computes exponent with fractional power", () => {
      const synTree = SEExpression.parse("64 ^ 0.5");
      expect(evaluate(synTree)).toBeCloseTo(8, 1);
    });

    it("computes exponent before multiplication", () => {
      const synTree = SEExpression.parse("2 * 3 ^ 2");
      expect(evaluate(synTree)).toBeCloseTo(18, 1);
    });
    it("overrides exponent/ multiplication", () => {
      const synTree = SEExpression.parse("(2 * 3) ^ 2");
      expect(evaluate(synTree)).toBeCloseTo(36, 1);
    });

    it("subtracts left associative", () => {
      const synTree = SEExpression.parse("10 - 5 - 2");
      expect(evaluate(synTree)).toBeCloseTo(3, 1);
    });
    it("overrides left associative", () => {
      const synTree = SEExpression.parse("10 - (5 - 2)");
      expect(evaluate(synTree)).toBeCloseTo(7, 1);
    });
  });

  describe("Order of operations", () => {
    it("multiplies before adds", () => {
      const synTree = SEExpression.parse("10 + 5 * 8");
      expect(evaluate(synTree)).toBeCloseTo(50, 1);
    });
    it("multiplies before subtracts", () => {
      const synTree = SEExpression.parse("10 - 5 * 8");
      expect(evaluate(synTree)).toBeCloseTo(-30, 1);
    });
    it("divides before adds", () => {
      const synTree = SEExpression.parse("10 + 8 / 2");
      expect(evaluate(synTree)).toBeCloseTo(14, 1);
    });
    it("overrides multiplication/addition with parentheses", () => {
      const synTree = SEExpression.parse("(10 + 5) * 8");
      expect(evaluate(synTree)).toBeCloseTo(120, 1);
    });

    it("overrides multiplication/subtraction with parentheses", () => {
      const synTree = SEExpression.parse("(10 - 5) * 8");
      expect(evaluate(synTree)).toBeCloseTo(40, 1);
    });

    it("does not change order of multiplication", () => {
      const synTree = SEExpression.parse("10 + (5 * 8)");
      expect(evaluate(synTree)).toBeCloseTo(50, 1);
    });
    it("does not change order of division", () => {
      const synTree = SEExpression.parse("10 + (5 / 2)");
      expect(evaluate(synTree)).toBeCloseTo(12.5, 2);
    });
  });
});
