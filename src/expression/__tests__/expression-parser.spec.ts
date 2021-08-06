import { ExpressionParser } from "@/expression/ExpressionParser";

describe("SEExpression", () => {
  const parser = new ExpressionParser();

  describe("Numeric constant", () => {
    it("evaluates integer constant with no sign", () => {
      expect(parser.evaluate("5")).toBeCloseTo(5, 2);
    });

    it("evaluates floating point constant", () => {
      expect(parser.evaluate("5.3")).toBeCloseTo(5.3, 2);
    });

    it("evaluates floating point constant with no leading digits", () => {
      expect(parser.evaluate(".345")).toBeCloseTo(0.345, 3);
    });

    it("evaluates integer constant with leading -", () => {
      expect(parser.evaluate("-25")).toBeCloseTo(-25, 0);
    });
    it("evaluates floating point constant with no leading digits leading -", () => {
      expect(parser.evaluate("-.456")).toBeCloseTo(-0.456, 3);
    });
  });

  describe("Whitespaces", () => {
    it("ignores blanks before a token", () => {
      expect(parser.evaluate("  456")).toBeCloseTo(456, 0);
    });
    it("ignore newline ", () => {
      expect(parser.evaluate("  4 + \n56\n")).toBeCloseTo(60, 0);
    });
    it("ignore tab ", () => {
      expect(parser.evaluate("  4 + \t56\t")).toBeCloseTo(60, 0);
    });
    it("parses expressions without blanks", () => {
      expect(parser.evaluate("2+456")).toBeCloseTo(458, 0);
    });
  });

  describe("Special Math constants", () => {
    it("parses PI", () => {
      expect(parser.evaluate("pi")).toBeCloseTo(3.14159, 5);
    });
    it("parses Euler number", () => {
      expect(parser.evaluate("e")).toBeCloseTo(2.71828, 5);
    });
  });

  describe("Unary minus", () => {
    it("parses unary minus as the only operand", () => {
      expect(parser.evaluate("-pi")).toBeCloseTo(-Math.PI, 5);
      expect(parser.evaluate("-234")).toBeCloseTo(-234, 0);
      expect(parser.evaluate("-cos(0)")).toBeCloseTo(-1, 0);
    });

    it("parses unary minus attached to the first operand", () => {
      expect(parser.evaluate("-3 + 10")).toBeCloseTo(7, 0);
      expect(parser.evaluate("-pi + pi")).toBeCloseTo(0, 0);
    });
    it("parses unary minus attached the subsequent operands", () => {
      expect(parser.evaluate("10 + -3")).toBeCloseTo(7, 0);
      expect(parser.evaluate("2 * -30")).toBeCloseTo(-60, 0);
      expect(parser.evaluate("2 ^ -3")).toBeCloseTo(1 / 8, 5);
      expect(parser.evaluate("2 * -(3+7)")).toBeCloseTo(-20, 2);
    });
  });
  describe("Binary operators", () => {
    it("adds two values", () => {
      expect(parser.evaluate("2.34 + 0.66")).toBeCloseTo(3, 2);
    });
    it("subtract two values", () => {
      expect(parser.evaluate("2.34 - 0.66")).toBeCloseTo(1.68, 2);
    });
    it("multiplies two values", () => {
      expect(parser.evaluate("2.34 * 5.00")).toBeCloseTo(11.7, 1);
    });
    it("divides two values", () => {
      expect(parser.evaluate("1000 / 25.0")).toBeCloseTo(40.0, 1);
    });
    it("divides two values with unary minus", () => {
      expect(parser.evaluate("1000 / -25.0")).toBeCloseTo(-40.0, 1);
    });
    it("divides two values with unary minuses", () => {
      expect(parser.evaluate("-1000 / -25.00")).toBeCloseTo(40.0, 1);
    });
    it("divides two values with repeating decimals", () => {
      expect(parser.evaluate("1000 / 3.00")).toBeCloseTo(333.33, 2);
    });

    it("computes exponent with positive base", () => {
      expect(parser.evaluate("2 ^ 3")).toBeCloseTo(8.0, 1);
    });
    it("computes exponent with negative base", () => {
      expect(parser.evaluate("-2 ^ 3")).toBeCloseTo(-8.0, 1);
    });
    it("computes exponent with negative power", () => {
      expect(parser.evaluate("5 ^ -2")).toBeCloseTo(0.04, 2);
    });
    it("computes exponent with fractional power", () => {
      expect(parser.evaluate("64 ^ 0.5")).toBeCloseTo(8, 1);
    });

    it("computes exponent before multiplication", () => {
      expect(parser.evaluate("2 * 3 ^ 2")).toBeCloseTo(18, 1);
    });
    it("overrides exponent/ multiplication", () => {
      expect(parser.evaluate("(2 * 3) ^ 2")).toBeCloseTo(36, 1);
    });

    it("subtracts left associative", () => {
      expect(parser.evaluate("10 - 5 - 2")).toBeCloseTo(3, 1);
    });
    it("overrides left associative", () => {
      expect(parser.evaluate("10 - (5 - 2)")).toBeCloseTo(7, 1);
    });
  });

  describe("Order of operations", () => {
    it("multiplies before adds", () => {
      expect(parser.evaluate("10 + 5 * 8")).toBeCloseTo(50, 1);
    });
    it("multiplies before subtracts", () => {
      expect(parser.evaluate("10 - 5 * 8")).toBeCloseTo(-30, 1);
    });
    it("divides before adds", () => {
      expect(parser.evaluate("10 + 8 / 2")).toBeCloseTo(14, 1);
    });
    it("overrides multiplication/addition with parentheses", () => {
      expect(parser.evaluate("(10 + 5) * 8")).toBeCloseTo(120, 1);
    });

    it("overrides multiplication/subtraction with parentheses", () => {
      expect(parser.evaluate("(10 - 5) * 8")).toBeCloseTo(40, 1);
    });

    it("does not change order of multiplication", () => {
      expect(parser.evaluate("10 + (5 * 8)")).toBeCloseTo(50, 1);
    });
    it("does not change order of division", () => {
      expect(parser.evaluate("10 + (5 / 2)")).toBeCloseTo(12.5, 2);
    });
  });

  describe("Math builtin functions", () => {
    it("computes cos()", () => {
      expect(parser.evaluate("cos(0)")).toBeCloseTo(1.0, 1);
      expect(parser.evaluate("cos(pi/2)")).toBeCloseTo(0, 1);
      expect(parser.evaluate("cos(pi)")).toBeCloseTo(-1, 1);
      expect(parser.evaluate("cos(2*pi)")).toBeCloseTo(1, 1);
    });

    it("computes sin()", () => {
      expect(parser.evaluate("sin(0)")).toBeCloseTo(0, 1);
      expect(parser.evaluate("sin(pi/2)")).toBeCloseTo(1, 1);
      expect(parser.evaluate("sin(pi)")).toBeCloseTo(0, 1);
      expect(parser.evaluate("sin(2*pi)")).toBeCloseTo(0, 1);
    });

    it("computes tan()", () => {
      expect(parser.evaluate("tan(0)")).toBeCloseTo(0, 1);
      expect(parser.evaluate("tan(pi/4)")).toBeCloseTo(1, 1);
      expect(parser.evaluate("tan(pi)")).toBeCloseTo(0, 1);
      expect(parser.evaluate("tan(-pi/4)")).toBeCloseTo(-1, 1);
    });

    it("computes atan()", () => {
      ExpressionParser.parse("atan(0)");
      expect(parser.evaluate("atan(0)")).toBeCloseTo(0, 1);
      ExpressionParser.parse("atan(1)");
      expect(parser.evaluate("atan(1)")).toBeCloseTo(Math.PI / 4, 3);
      ExpressionParser.parse("tan(atan(-2.34))");
      expect(parser.evaluate("tan(atan(-2.34))")).toBeCloseTo(-2.34, 2);
    });

    it("computes multi expressions the evaluate to identity", () => {
      expect(parser.evaluate("sin(pi/3)^2 + cos(pi/3)^2")).toBeCloseTo(1.0, 3);
      expect(parser.evaluate("sin(pi/3) / cos(pi/3) / tan(pi/3)")).toBeCloseTo(
        1.0,
        3
      );
    });

    it("computes multi arg min()", () => {
      expect(parser.evaluate("min(0, -3, 5, 8, 99)")).toBeCloseTo(-3, 1);
      expect(parser.evaluate("min(0, -3, 5 * -2, 8, 99)")).toBeCloseTo(-10, 1);
    });

    it("computes multi arg max()", () => {
      expect(parser.evaluate("max(0, 100*cos(2*pi) - 0.5, 9)")).toBeCloseTo(
        99.5,
        1
      );
    });

    it("computes atan2()", () => {
      expect(parser.evaluate("atan2(1,1)")).toBeCloseTo(Math.PI / 4, 3);
    });
    it("computes abs()", () => {
      expect(parser.evaluate("abs(3+7)")).toBeCloseTo(10, 3);
      expect(parser.evaluate("abs(-3-7)")).toBeCloseTo(10, 3);
      expect(parser.evaluate("abs(-(3+7))")).toBeCloseTo(10, 3);
    });
    it("computes acos()", () => {
      expect(parser.evaluate("acos(0.5)")).toBeCloseTo(Math.PI / 3, 1);
      expect(parser.evaluate("acos(-0.5)")).toBeCloseTo((2 * Math.PI) / 3, 3);
      expect(parser.evaluate("acos(cos(pi/3))")).toBeCloseTo(Math.PI / 3, 2);
      expect(parser.evaluate("cos(acos(0.5))")).toBeCloseTo(0.5, 2);
    });
    it("computes asin()", () => {
      expect(parser.evaluate("asin(0.5)")).toBeCloseTo(Math.PI / 6, 1);
      expect(parser.evaluate("asin(-0.5)")).toBeCloseTo(-Math.PI / 6, 3);
      expect(parser.evaluate("asin(sin(pi/3))")).toBeCloseTo(Math.PI / 3, 2);
      expect(parser.evaluate("sin(asin(0.5))")).toBeCloseTo(0.5, 2);
    });
    it("computes ceil()", () => {
      expect(parser.evaluate("ceil(0.56)")).toBeCloseTo(1.0, 1);
      expect(parser.evaluate("ceil(-2*0.33)")).toBeCloseTo(0, 1);
    });
    it("computes exp()", () => {
      expect(parser.evaluate("exp(3+7)")).toBeCloseTo(22026.4657948, 3);
      expect(parser.evaluate("ln(exp(3))")).toBeCloseTo(3, 2);
      expect(parser.evaluate("exp(ln(3))")).toBeCloseTo(3, 2);
      expect(parser.evaluate("exp(-3)")).toBeCloseTo(0.04978706837, 3);
    });
    it("computes floor()", () => {
      expect(parser.evaluate("floor(0.56)")).toBeCloseTo(0.0, 1);
      expect(parser.evaluate("floor(-2*0.33)")).toBeCloseTo(-1.0, 1);
    });
    it("computes ln()", () => {
      expect(parser.evaluate("ln(3+7)")).toBeCloseTo(2.30258509, 3);
      expect(parser.evaluate("ln(exp(3))")).toBeCloseTo(3, 2);
      expect(parser.evaluate("exp(ln(3))")).toBeCloseTo(3, 2);
      expect(parser.evaluate("ln(-3-7)")).toBeFalsy();
      expect(parser.evaluate("ln(0)")).toBeFalsy();
    });
    it("computes sgn()", () => {
      expect(parser.evaluate("sgn(0.56)")).toBeCloseTo(1.0, 1);
      expect(parser.evaluate("sgn(0)")).toBeCloseTo(0, 1);
      expect(parser.evaluate("sgn(-2*0.33)")).toBeCloseTo(-1, 1);
    });
    it("computes sqrt()", () => {
      expect(parser.evaluate("sqrt(3+7)")).toBeCloseTo(3.1622776602, 3);
      expect(parser.evaluate("sqrt(3^2)")).toBeCloseTo(3, 2);
      expect(parser.evaluate("sqrt(3)^2")).toBeCloseTo(3, 2);
      expect(parser.evaluate("sqrt(-3-7)")).toBeFalsy();
    });
  });

  describe("Syntax errors", () => {
    let parser: ExpressionParser;
    beforeEach(() => {
      parser = new ExpressionParser();
    });

    it("detects unknown character", () => {
      try {
        parser.evaluate("20 # 60");
      } catch (e) {
        expect(e.message).toContain("#");
      }
    });
    it("detects invalid numbers", () => {
      expect(() => {
        parser.evaluate("20..60");
      }).toThrowError();
    });
    it("detects missing operators", () => {
      expect(() => {
        parser.evaluate("20 5");
      }).toThrowError();
    });
    it("detects missing operand after multiplication", () => {
      expect(() => {
        parser.evaluate("20 *");
      }).toThrowError();
    });

    it("detects missing operand after binary minus", () => {
      try {
        parser.evaluate("20 -");
      } catch (e) {
        expect(e.message).toContain("end of input");
      }
    });

    it("detects missing operand after exponentiation", () => {
      try {
        parser.evaluate("20 **");
      } catch (e) {
        expect(e.message).toContain("Unexpected input");
      }
    });
    it("detects missing parenthesis", () => {
      try {
        parser.evaluate("20 * (4 ^ 3");
      } catch (e) {
        expect(e.message).toContain("end of input");
      }
    });
    it("detects missing left parenthesis after builtin func", () => {
      try {
        parser.evaluate("20 * cos pi");
      } catch (e) {
        expect(e.message).toContain("(");
      }
    });
    it("detects missing right parenthesis after builtin func args", () => {
      try {
        parser.evaluate("20 * cos(pi/4");
      } catch (e) {
        expect(e.message).toContain("end of input");
      }
    });
    // it("detects natural log of negative numbers", () => {
    //   try {
    //     parser.evaluate("ln(-pi/4)");
    //   } catch (e) {
    //     expect(e.message).toContain("end of input");
    //   }
    // });
  });

  describe("With variables", () => {
    const varMap = new Map<string, number>();
    varMap.set("M1", 30);
    varMap.set("M2", -23.5);
    varMap.set("M3", Math.PI / 4);

    it("looks for a single var name", () => {
      expect(parser.evaluateWithVars("M1", varMap)).toBeCloseTo(30, 1);
    });
    it("looks for multiple var names", () => {
      expect(parser.evaluateWithVars("2*M1 - M2", varMap)).toBeCloseTo(83.5, 1);
    });
    it("uses var in expression", () => {
      expect(parser.evaluateWithVars("sin(2*M3)", varMap)).toBeCloseTo(1, 1);
    });
    it("looks for undefined var name", () => {
      expect(() => {
        parser.evaluateWithVars("M22", varMap);
      }).toThrowError();
    });
  });
});
