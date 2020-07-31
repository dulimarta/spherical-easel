//
enum TokenType {
  PLUS,
  MINUS,
  UNARY_MINUS,
  MULT,
  DIV,
  POW,
  NUMBER,
  MEASUREMENT,
  LEFT_PAREN,
  RIGHT_PAREN,
  MATH_BUILTIN,
  COMMA,
  UNKNOWN,
  EOF
}

type Lexicon = {
  kind: TokenType;
  name?: string;
  numericValue?: number;
};

type SyntaxTree = {
  node: Lexicon;

  // left and right for binary operators
  leftChild?: SyntaxTree;
  rightChild?: SyntaxTree;

  // args for multi argument functions
  args?: SyntaxTree[];
};

class Lexer {
  private input: string;
  private iterator: IterableIterator<string>;
  private nextChar: IteratorResult<string>;
  constructor(input: string) {
    this.input = input;
    this.iterator = input[Symbol.iterator]();
    this.nextChar = this.iterator.next();
  }

  /* next() of an iterator returns an object {done: boolean; value: string} */
  skipWhiteSpaces(): void {
    while (!this.nextChar.done && this.nextChar.value === " ") {
      this.nextChar = this.iterator.next();
    }
  }

  /**
   * The tokenize() function is a co-routine, it automatically pauses
   * on yield and resumes when the caller invokes its next()
   */
  *tokenize(): IterableIterator<Lexicon> {
    const builtinMathFunctions = [
      "abs",
      "acos",
      "asin",
      "atan",
      "atan2",
      "ceil",
      "cos",
      "exp",
      "floor",
      "ln",
      "max",
      "min",
      "sgn",
      "sin",
      "sqrt",
      "tan"
    ];

    while (!this.nextChar.done) {
      this.skipWhiteSpaces();
      if (this.nextChar.done) break;
      if (this.nextChar.value.match(/[0-9.]/)) {
        // Numeric value
        let tok = "";
        do {
          tok += this.nextChar.value;
          this.nextChar = this.iterator.next();
        } while (!this.nextChar.done && this.nextChar.value.match(/[0-9.]/));
        const value = Number(tok);
        if (!isNaN(value))
          // Is this a valid numerical value?
          yield { kind: TokenType.NUMBER, numericValue: Number(tok) };
        else
          yield {
            kind: TokenType.UNKNOWN,
            name: `Invalid numeric value ${tok}`
          };
      } else if (this.nextChar.value.match(/[a-zA-Z]/)) {
        // Identifier
        let tok = "";
        do {
          tok += this.nextChar.value;
          this.nextChar = this.iterator.next();
        } while (
          !this.nextChar.done &&
          this.nextChar.value.match(/[a-zA-Z0-9]/)
        );

        // Check for special constants (pi, e)
        if (tok.toUpperCase() === "PI")
          yield { kind: TokenType.NUMBER, numericValue: Math.PI };
        else if (tok.toUpperCase() === "E")
          yield { kind: TokenType.NUMBER, numericValue: Math.E };
        else if (
          builtinMathFunctions.findIndex(fn => fn === tok.toLowerCase()) >= 0
        ) {
          // One of the builtin Math functions
          yield { kind: TokenType.MATH_BUILTIN, name: tok };
        } else {
          yield { kind: TokenType.MEASUREMENT, name: tok };
        }
      } else if (this.nextChar.value === "+") {
        // Binary plus
        this.nextChar = this.iterator.next();
        yield { kind: TokenType.PLUS };
      } else if (this.nextChar.value === "-") {
        // Either a binary minus or a unary minus
        this.nextChar = this.iterator.next();

        // Is the next character the beginning of a number or identifier?
        if (this.nextChar.done) yield { kind: TokenType.MINUS };
        else if (this.nextChar.value.match(/[0-9a-zA-Z.]/))
          yield { kind: TokenType.UNARY_MINUS };
        else yield { kind: TokenType.MINUS };
      } else if (this.nextChar.value === "*") {
        // Multiplication or exponentiation
        this.nextChar = this.iterator.next();
        if (this.nextChar.done) yield { kind: TokenType.MULT };
        else if (this.nextChar.value === "*") {
          this.nextChar = this.iterator.next();
          yield { kind: TokenType.POW };
        } else yield { kind: TokenType.MULT };
      } else if (this.nextChar.value === "/") {
        // Division
        this.nextChar = this.iterator.next();
        yield { kind: TokenType.DIV };
      } else if (this.nextChar.value === "^") {
        // Alternate operator of exponentiation
        this.nextChar = this.iterator.next();
        yield { kind: TokenType.POW };
      } else if (this.nextChar.value === "(") {
        this.nextChar = this.iterator.next();
        yield { kind: TokenType.LEFT_PAREN };
      } else if (this.nextChar.value === ")") {
        this.nextChar = this.iterator.next();
        yield { kind: TokenType.RIGHT_PAREN };
      } else if (this.nextChar.value === ",") {
        this.nextChar = this.iterator.next();
        yield { kind: TokenType.COMMA };
      } else {
        const unknownChar = this.nextChar.value;
        console.debug("Unknown char", unknownChar);
        this.nextChar = this.iterator.next();
        yield { kind: TokenType.UNKNOWN, name: unknownChar };
      }
    }

    // We reach the end of iterator stream!
    yield { kind: TokenType.EOF };
  }
}

export class ExpressionParser {
  /**
   * Parse the arithmetic expression using a recursive descent parser
   * @param input a string of arithmetic expression
   */
  static parse(input: string): SyntaxTree {
    const lexer = new Lexer(input); // Lexical analyzer
    const tokenizer = lexer.tokenize();
    let token = tokenizer.next();

    function factor(): SyntaxTree {
      if (token.value.kind === TokenType.LEFT_PAREN) {
        // Parenthesized expressions
        token = tokenizer.next();
        const eTree = expr();
        if (token.value.kind === TokenType.RIGHT_PAREN) {
          token = tokenizer.next();
          return eTree;
        } else throw new SyntaxError("expected ')'");
      } else if (token.value.kind === TokenType.MEASUREMENT) {
        // TODO: look up the actual value of measurement
        console.debug("Var/Measurement", token.value.text);
        const out = token.value;
        token = tokenizer.next();
        return { node: out };
      } else if (token.value.kind === TokenType.NUMBER) {
        const out = token.value;
        token = tokenizer.next();
        return { node: out };
      } else if (token.value.kind === TokenType.UNARY_MINUS) {
        token = tokenizer.next();
        if (token.value.kind === TokenType.NUMBER) {
          const out = token.value;
          out.numericValue *= -1;
          token = tokenizer.next();
          return { node: out };
        } else if (token.value.kind === TokenType.MEASUREMENT) {
          // Convert unary minus -Mx to binary minus (0 - Mx)
          const varName = token.value.name;
          token = tokenizer.next();
          return {
            node: { kind: TokenType.MINUS },
            leftChild: { node: { kind: TokenType.NUMBER, numericValue: 0 } },
            rightChild: {
              node: { kind: TokenType.MEASUREMENT, name: varName }
            }
          };
        } else throw new SyntaxError("expected NUMBER after a '-'");
      } else if (token.value.kind === TokenType.MATH_BUILTIN) {
        const out = token.value;
        token = tokenizer.next();
        if (token.value.kind !== TokenType.LEFT_PAREN)
          throw new SyntaxError("expected '(' after a builtin function");
        token = tokenizer.next();
        const exprTree = expr();
        const args = [exprTree];

        // Parse comma separate expressions
        while (token.value.kind === TokenType.COMMA) {
          token = tokenizer.next();
          args.push(expr());
        }
        if (token.value.kind === TokenType.RIGHT_PAREN) {
          token = tokenizer.next();
          return { node: out, args };
        } else throw new SyntaxError("expected ')' after function arguments");
      } else throw new SyntaxError("expected IDENT, NUMBER, '+', '-', or '('");
    }

    function power(): SyntaxTree {
      let factorTree = factor();
      while (token.value.kind == TokenType.POW) {
        const oper = token.value;
        token = tokenizer.next();
        const f = factor();
        const parent = { node: oper, leftChild: factorTree, rightChild: f };
        factorTree = parent; // The new node becomes a new parent
      }
      return factorTree;
    }

    function term(): SyntaxTree {
      let powTree = power();
      while (
        token.value.kind == TokenType.MULT ||
        token.value.kind === TokenType.DIV
      ) {
        const oper = token.value;
        token = tokenizer.next();
        const p = power();
        const parent = { node: oper, leftChild: powTree, rightChild: p };
        powTree = parent; // The new node becomes a new parent
      }
      return powTree;
    }

    function expr(): SyntaxTree {
      let termTree = term();
      while (
        token.value.kind == TokenType.PLUS ||
        token.value.kind === TokenType.MINUS
      ) {
        const oper = token.value;
        token = tokenizer.next();
        const t = term();
        const parent = { node: oper, leftChild: termTree, rightChild: t };
        termTree = parent; // The new node becomes a new parent
      }
      return termTree;
    }

    const out = expr();
    if (token.value.kind === TokenType.EOF) return out;
    else throw new SyntaxError("Unexpected token");
  }

  static evaluate(t: SyntaxTree, varMap: Map<string, number>): number {
    const valueOf = ExpressionParser.evaluate;
    let numValue;
    switch (t.node.kind) {
      case TokenType.NUMBER:
        return t.node.numericValue!;
      case TokenType.MEASUREMENT:
        console.debug("Look up ", t.node.name);
        console.debug("Variable map", varMap);
        if (varMap.has(t.node.name!)) return varMap.get(t.node.name!)!;
        else throw new Error(`Undefined variable ${t.node.name}`);
      case TokenType.PLUS:
        return valueOf(t.leftChild!, varMap) + valueOf(t.rightChild!, varMap);
      case TokenType.MINUS:
        return valueOf(t.leftChild!, varMap) - valueOf(t.rightChild!, varMap);
      case TokenType.MULT:
        return valueOf(t.leftChild!, varMap) * valueOf(t.rightChild!, varMap);
      case TokenType.DIV:
        numValue = valueOf(t.rightChild!, varMap);
        if (Math.abs(numValue) > 1e-4)
          return valueOf(t.leftChild!, varMap) / valueOf(t.rightChild!, varMap);
        else throw new RangeError("Attempt to divide by zero");
      case TokenType.POW:
        return Math.pow(
          valueOf(t.leftChild!, varMap),
          valueOf(t.rightChild!, varMap)
        );
      case TokenType.MATH_BUILTIN:
        switch (t.node.name) {
          // Multi-arg functions
          // Apply "evaluate()" to each element
          case "max":
            return Math.max(...t.args!.map(a => valueOf(a, varMap)));
          case "min":
            return Math.min(...t.args!.map(a => valueOf(a, varMap)));

          // Binary functions
          case "atan2":
            return Math.atan2(
              valueOf(t.args![0], varMap),
              valueOf(t.args![1], varMap)
            );

          // Unary functions
          case "abs":
            return Math.abs(valueOf(t.args![0], varMap));
          case "acos":
            return Math.acosh(valueOf(t.args![0], varMap));
          case "asin":
            return Math.asin(valueOf(t.args![0], varMap));
          case "atan":
            return Math.atan(valueOf(t.args![0], varMap));

          case "ceil":
            return Math.ceil(valueOf(t.args![0], varMap));
          case "cos":
            return Math.cos(valueOf(t.args![0], varMap));
          case "exp":
            return Math.exp(valueOf(t.args![0], varMap));
          case "floor":
            return Math.floor(valueOf(t.args![0], varMap));
          case "ln":
            return Math.log(valueOf(t.args![0], varMap));
          case "sgn":
            return Math.sign(valueOf(t.args![0], varMap));
          case "sin":
            return Math.sin(valueOf(t.args![0], varMap));
          case "sqrt":
            return Math.sqrt(valueOf(t.args![0], varMap));
          case "tan":
            return Math.tan(valueOf(t.args![0], varMap));
          default:
            throw new SyntaxError(`Unknown math builtin ${t.node.name}`);
        }

      default:
        return 0;
    }
  }
  evaluateWithVars(input: string, varMap: Map<string, number>): number {
    return ExpressionParser.evaluate(ExpressionParser.parse(input), varMap);
  }
  readonly EMPTY_MAP = new Map();
  evaluate(input: string): number {
    return ExpressionParser.evaluate(
      ExpressionParser.parse(input),
      this.EMPTY_MAP
    );
  }
}
