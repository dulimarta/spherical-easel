//
enum TokenType {
  PLUS,
  MINUS,
  UNARY_MINUS,
  MULT,
  DIV,
  POW,
  NUMBER,
  IDENTIFIER,
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

  skipWhiteSpaces(): void {
    while (!this.nextChar.done && this.nextChar.value.match(/ /)) {
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
        } while (!this.nextChar.done && this.nextChar.value.match(/[a-zA-Z]/));

        // Check for special constants (pi, e)
        if (tok.toUpperCase() === "PI")
          yield { kind: TokenType.NUMBER, numericValue: Math.PI };
        else if (tok.toUpperCase() === "E")
          yield { kind: TokenType.NUMBER, numericValue: Math.E };
        else if (
          builtinMathFunctions.findIndex(fn => fn === tok.toLowerCase())
        ) {
          // One of the builtin Math functions
          yield { kind: TokenType.MATH_BUILTIN, name: tok };
        } else {
          // TODO: lookup for measurement object?
          yield { kind: TokenType.IDENTIFIER, name: tok };
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
// type Result<T, E> =
//   | {
//       error: E;
//     }
//   | { value: T };
//   const Ok(value:T):Result<T,E> => new

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
      } else if (token.value.kind === TokenType.IDENTIFIER) {
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
        } else if (token.value.kind === TokenType.IDENTIFIER) {
          // TODO: lookup measurement
          throw new SyntaxError("Incomplete implementation");
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

  static evaluate(t: SyntaxTree): number {
    const valueOf = ExpressionParser.evaluate;
    let denom;
    switch (t.node.kind) {
      case TokenType.NUMBER:
        return t.node.numericValue!;
      case TokenType.PLUS:
        return valueOf(t.leftChild!) + valueOf(t.rightChild!);
      case TokenType.MINUS:
        return valueOf(t.leftChild!) - valueOf(t.rightChild!);
      case TokenType.MULT:
        return valueOf(t.leftChild!) * valueOf(t.rightChild!);
      case TokenType.DIV:
        denom = valueOf(t.rightChild!);
        if (Math.abs(denom) > 1e-4)
          return valueOf(t.leftChild!) / valueOf(t.rightChild!);
        else throw new RangeError("Attempt to divide by zero");
      case TokenType.POW:
        return Math.pow(valueOf(t.leftChild!), valueOf(t.rightChild!));
      case TokenType.MATH_BUILTIN:
        switch (t.node.name) {
          // Multi-arg functions
          // Apply "evaluate()" to each element
          case "max":
            return Math.max(...t.args!.map(valueOf));
          case "min":
            return Math.min(...t.args!.map(valueOf));

          // Binary functions
          case "atan2":
            return Math.atan2(valueOf(t.args![0]), valueOf(t.args![1]));

          // Unary functions
          case "abs":
            return Math.abs(valueOf(t.args![0]));
          case "acos":
            return Math.acosh(valueOf(t.args![0]));
          case "asin":
            return Math.asin(valueOf(t.args![0]));
          case "atan":
            return Math.atan(valueOf(t.args![0]));

          case "ceil":
            return Math.ceil(valueOf(t.args![0]));
          case "cos":
            return Math.cos(valueOf(t.args![0]));
          case "exp":
            return Math.exp(valueOf(t.args![0]));
          case "floor":
            return Math.floor(valueOf(t.args![0]));
          case "ln":
            return Math.log(valueOf(t.args![0]));
          case "sgn":
            return Math.sign(valueOf(t.args![0]));
          case "sin":
            return Math.sin(valueOf(t.args![0]));
          case "sqrt":
            return Math.sqrt(valueOf(t.args![0]));
          case "tan":
            return Math.tan(valueOf(t.args![0]));
          default:
            throw new SyntaxError(`Unknown math builtin ${t.node.name}`);
        }

      default:
        return 0;
    }
  }
  evaluate(input: string): number {
    return ExpressionParser.evaluate(ExpressionParser.parse(input));
  }
}
