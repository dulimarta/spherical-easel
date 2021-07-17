import {
  ExpressionParser,
  SyntaxTree,
  TokenType
} from "@/expression/ExpressionParser";

describe("Derivatives", () => {
  function diff(expr: string, varname = "x"): SyntaxTree {
    const out = ExpressionParser.parse(expr);
    return ExpressionParser.differentiate(out, varname);
  }

  it("differentiates of numeric constant", () => {
    const out = diff("5");

    expect(out.node.kind).toEqual(TokenType.NUMBER);
    expect(out.node.numericValue).toEqual(0);
  });

  it("differentiates of non-numeric constant", () => {
    const out = diff("a", "x");

    expect(out.node.kind).toEqual(TokenType.NUMBER);
    expect(out.node.numericValue).toEqual(0);
  });

  it("differentiates linear terms", () => {
    const out = diff("x");
    expect(out.node.kind).toEqual(TokenType.NUMBER);
    expect(out.node.numericValue).toEqual(1);
  });

  it.only("differentiates polynomial terms", () => {
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
