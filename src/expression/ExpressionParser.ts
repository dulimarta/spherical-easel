import i18n from "@/i18n";
import { TranslateResult } from "vue-i18n";

export enum TokenType {
  /* 0 */ PLUS,
  /* 1 */ MINUS,
  /* 2 */ MULT,
  /* 3 */ DIV,
  /* 4 */ POW,
  /* 5 */ NUMBER,
  /* 6 */ MEASUREMENT,
  /* 7 */ LEFT_PAREN,
  RIGHT_PAREN,
  MATH_BUILTIN,
  COMMA,
  UNKNOWN,
  EOF
  // UNARY_MINUS,
}

type Lexicon = {
  kind: TokenType;
  text?: string;
  numericValue?: number;
};

export type SyntaxTree = {
  node: Lexicon;

  // left and right for binary operators
  leftChild?: SyntaxTree;
  rightChild?: SyntaxTree;

  // args for multi argument functions
  args?: SyntaxTree[];
};

class Lexer {
  readonly BUILT_IN_MATCH_FNs = [
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

  private iterator: IterableIterator<string>;
  private nextChar: IteratorResult<string>;
  private prev?: Lexicon;
  private curr?: Lexicon;
  constructor(input: string) {
    // JS strings are an iterable object
    // The iterator provides two important properties:
    // .done which is set to true when we reach the end of iteration
    //    (.dose is opposite of hasNext() of Java iterators)
    // .next() which returns the next character in the string

    this.iterator = input[Symbol.iterator]();
    this.nextChar = this.iterator.next();
  }

  lastToken(): string {
    return this.prev?.text ?? "Start of input";
  }
  skipWhiteSpaces(): void {
    // \s is Regex for whitespace
    while (!this.nextChar.done && this.nextChar.value.match(/\s/)) {
      this.nextChar = this.iterator.next();
    }
  }

  /**
   * The tokenize() function is a co-routine, it automatically pauses
   * on yield and resumes when the caller invokes its next()
   */
  *tokenize(): IterableIterator<Lexicon> {
    while (!this.nextChar.done) {
      this.prev = this.curr;
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
        if (!isNaN(value)) {
          // Is this a valid numerical value?
          this.curr = {
            kind: TokenType.NUMBER,
            text: tok,
            numericValue: Number(tok)
          };
          yield this.curr;
        } else
          yield {
            kind: TokenType.UNKNOWN,
            text: tok
          };
      } else if (this.nextChar.value.match(/[a-zA-Z]/)) {
        // Measurement Identifier or math builtin functions
        let tok = "";
        do {
          tok += this.nextChar.value;
          this.nextChar = this.iterator.next();
        } while (
          !this.nextChar.done &&
          this.nextChar.value.match(/[a-zA-Z0-9]/)
        );

        // Check for special constants (pi, e)
        if (tok.toUpperCase() === "PI") {
          this.curr = {
            kind: TokenType.NUMBER,
            text: tok,
            numericValue: Math.PI
          };
          yield this.curr;
        } else if (tok.toUpperCase() === "E") {
          this.curr = {
            kind: TokenType.NUMBER,
            text: tok,
            numericValue: Math.E
          };
          yield this.curr;
        } else if (
          this.BUILT_IN_MATCH_FNs.findIndex(fn => fn === tok.toLowerCase()) >= 0
        ) {
          // One of the builtin Math functions
          this.curr = { kind: TokenType.MATH_BUILTIN, text: tok };
          yield this.curr;
        } else {
          this.curr = { kind: TokenType.MEASUREMENT, text: tok };
          yield this.curr;
        }
      } else if (this.nextChar.value === "+") {
        // Binary plus (we don't support unary plus)
        this.nextChar = this.iterator.next();
        this.curr = { kind: TokenType.PLUS, text: "+" };
        yield this.curr;
      } else if (this.nextChar.value === "-") {
        // Either a binary minus or a unary minus
        this.nextChar = this.iterator.next();

        // If we hit the end of input stream the token was
        // intended as a binary minus
        // if (this.nextChar.done) this.curr = { kind: TokenType.MINUS }; yield this.curr;;
        // Is the next character the beginning of a number or identifier?
        // else if (this.nextChar.value.match(/[0-9a-zA-Z.]/))
        // this.curr = { kind: TokenType.UNARY_MINUS }; yield this.curr;;
        this.curr = { kind: TokenType.MINUS, text: "-" };
        yield this.curr; // binary minus
      } else if (this.nextChar.value === "*") {
        // Multiplication or exponentiation
        this.nextChar = this.iterator.next();
        // if we hit the end of input stream the token was
        // intended as a binary multiplication
        if (this.nextChar.done) {
          this.curr = { kind: TokenType.MULT, text: "*" };
        } else if (this.nextChar.value === "*") {
          this.nextChar = this.iterator.next();
          this.curr = { kind: TokenType.POW, text: "**" };
        } else this.curr = { kind: TokenType.MULT, text: "*" };
        yield this.curr;
      } else if (this.nextChar.value === "/") {
        // Division
        this.nextChar = this.iterator.next();
        this.curr = { kind: TokenType.DIV, text: "/" };
        yield this.curr;
      } else if (this.nextChar.value === "^") {
        // Alternate operator of exponentiation
        this.nextChar = this.iterator.next();
        this.curr = { kind: TokenType.POW, text: "^" };
        yield this.curr;
      } else if (this.nextChar.value === "(") {
        this.nextChar = this.iterator.next();
        this.curr = { kind: TokenType.LEFT_PAREN, text: "(" };
        yield this.curr;
      } else if (this.nextChar.value === ")") {
        this.nextChar = this.iterator.next();
        this.curr = { kind: TokenType.RIGHT_PAREN, text: ")" };
        yield this.curr;
      } else if (this.nextChar.value === ",") {
        this.nextChar = this.iterator.next();
        this.curr = { kind: TokenType.COMMA, text: "," };
        yield this.curr;
      } else {
        const unknownChar = this.nextChar.value;
        console.debug("Unknown char", unknownChar);
        this.nextChar = this.iterator.next();
        this.curr = { kind: TokenType.UNKNOWN, text: unknownChar };
        yield this.curr;
      }
    }

    // We reach the end of iterator stream!
    this.curr = { kind: TokenType.EOF, text: "$" };
    yield this.curr;
  }
}

export class ExpressionParser {
  readonly EMPTY_MAP = new Map();

  /**
   * Parse the arithmetic expression using a recursive descent parser.
   * Refer to the railroad diagrams and the expr.ebnf
   *
   * @param input a string of arithmetic expression
   */
  static parse(input: string): SyntaxTree {
    const lexer = new Lexer(input); // Lexical analyzer
    const tokenizer = lexer.tokenize();
    let token = tokenizer.next();

    function throwError(msg: string, info: Lexicon): never {
      if (info.kind === TokenType.EOF)
        throw new SyntaxError(String(i18n.t(`objectTree.parserError`)));
      else throw new SyntaxError(msg);
    }
    function atom(): SyntaxTree {
      // factor() is 3-level deep from EXPR (highest precedence)
      if (token.value.kind === TokenType.LEFT_PAREN) {
        // Parenthesized expressions
        token = tokenizer.next();
        const eTree = expr();
        if (token.value.kind === TokenType.RIGHT_PAREN) {
          token = tokenizer.next();
          return eTree;
        } else
          return throwError(
            `expected ')' at '${token.value.text}'`,
            token.value
          );
      }
      if (token.value.kind === TokenType.MINUS) {
        // Unary minus
        token = tokenizer.next();
        const atomTree = atom();

        // Convert Unary operator (-EXPR) to binary operator (0 - EXPR)
        return {
          node: { kind: TokenType.MINUS, text: "-" },
          leftChild: {
            node: { kind: TokenType.NUMBER, text: "0", numericValue: 0 }
          },
          rightChild: atomTree
        };
      } else if (token.value.kind === TokenType.MEASUREMENT) {
        // TODO: look up the actual value of measurement
        const out = token.value;
        token = tokenizer.next();
        return { node: out };
      } else if (token.value.kind === TokenType.NUMBER) {
        const out = token.value;
        token = tokenizer.next();
        return { node: out };
      } else if (token.value.kind === TokenType.MATH_BUILTIN) {
        const out = token.value;
        token = tokenizer.next();
        if (token.value.kind !== TokenType.LEFT_PAREN)
          return throwError(
            `expected '(' at function name '${lexer.lastToken()}'`,
            token.value
          );
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
        } else
          return throwError(
            `Expected ')', but received ${token.value.text}`,
            token.value
          );
      } else
        return throwError(
          `Unexpected input at '${token.value.text}'`,
          token.value
        );
    }

    // Parses: base ^ power1 ^ power2 ^ ...
    function factor(): SyntaxTree {
      // factor() is 2-level deep from EXPR (medium precedence)

      let atomTree = atom();
      while (token.value.kind == TokenType.POW) {
        const oper = token.value;
        token = tokenizer.next();
        const sibling = atom();

        // Combine the LHS subtree with the RHS subtree
        const parent = {
          node: oper,
          leftChild: atomTree,
          rightChild: sibling
        };
        atomTree = parent; // The new node becomes a new parent
      }
      return atomTree;
    }

    // Parses: P (*|/) P (*|/) P ...
    function term(): SyntaxTree {
      // term() is 1-level deep from EXPR (lowest precedence)
      let outTree = factor();
      while (
        token.value.kind == TokenType.MULT ||
        token.value.kind === TokenType.DIV
      ) {
        const oper = token.value;
        token = tokenizer.next();
        const sibling = factor();

        // Combine the LHS subtree with the RHS subtree
        const parent = { node: oper, leftChild: outTree, rightChild: sibling };
        outTree = parent; // The new node becomes a new parent
      }
      return outTree;
    }

    // Parses: term (*|/) term (*|/) term ...
    function expr(): SyntaxTree {
      let outTree = term();
      while (
        token.value.kind == TokenType.PLUS ||
        token.value.kind === TokenType.MINUS
      ) {
        const oper = token.value;
        token = tokenizer.next();
        const sibling = term();

        // Combine the LHS subtree with the RHS subtree
        const parent = { node: oper, leftChild: outTree, rightChild: sibling };
        outTree = parent; // The new node becomes a new parent
      }
      return outTree;
    }

    const out = expr();

    // Be sure there is no leftover character after a valid expression
    if (token.value.kind === TokenType.EOF) return out;
    else throw new SyntaxError(`Unexpected token at '${token.value.text}'`);
  }
  static readonly NOT_DEFINED: SyntaxTree = {
    node: { kind: TokenType.UNKNOWN, text: "0", numericValue: 0 }
  };

  static differentiate(
    input: SyntaxTree | undefined,
    varName: string
  ): SyntaxTree {
    if (!input) return ExpressionParser.NOT_DEFINED;
    switch (input.node.kind) {
      case TokenType.NUMBER: // Diff of constant is ZERO
        return {
          node: { kind: TokenType.NUMBER, text: "0", numericValue: 0 }
        };
      case TokenType.MEASUREMENT:
        if (input.node.text === varName)
          return {
            node: { kind: TokenType.NUMBER, text: "1", numericValue: 1 }
          };
        else
          return {
            node: { kind: TokenType.NUMBER, text: "0", numericValue: 0 }
          };

      case TokenType.PLUS:
      case TokenType.MINUS: {
        const leftDiff = this.differentiate(input.leftChild, varName);
        const rightDiff = this.differentiate(input.rightChild, varName);
        return {
          node: { kind: input.node.kind, text: "" },
          leftChild: leftDiff,
          rightChild: rightDiff
        };
      }
      case TokenType.MULT: {
        // diff(f(x) g(x)) = diff(f(x)) g(x) + f(x) diff(g(x))
        const fDiff = this.differentiate(input.leftChild, varName);
        const gDiff = this.differentiate(input.rightChild, varName);
        const firstTerm: SyntaxTree = {
          node: {
            kind: TokenType.MULT
          },
          leftChild: fDiff,
          rightChild: input.rightChild
        };
        const secondTerm: SyntaxTree = {
          node: {
            kind: TokenType.MULT
          },
          leftChild: input.leftChild,
          rightChild: gDiff
        };
        return {
          node: { kind: TokenType.PLUS },
          leftChild: firstTerm,
          rightChild: secondTerm
        };
      }
      case TokenType.DIV: {
        // diff(f(x)/ g(x)) = [diff(f(x)) g(x) - f(x) diff(g(x))] / g(x)*g(x)
        const fDiff = this.differentiate(input.leftChild, varName);
        const gDiff = this.differentiate(input.rightChild, varName);
        const numerator: SyntaxTree = {
          node: {
            kind: TokenType.MINUS
          },
          leftChild: {
            node: { kind: TokenType.MULT },
            leftChild: fDiff,
            rightChild: input.rightChild
          },
          rightChild: {
            node: { kind: TokenType.MULT },
            leftChild: input.leftChild,
            rightChild: gDiff
          }
        };
        const denominator: SyntaxTree = {
          node: {
            kind: TokenType.MULT
          },
          leftChild: input.rightChild,
          rightChild: input.rightChild
        };
        return {
          node: { kind: TokenType.DIV },
          leftChild: numerator,
          rightChild: denominator
        };
      }
      case TokenType.POW: {
        // diff (f^N) = N * f^(N-1) * diff(f)
        // diff(f(x)^g(x)) = f(x)^g(x) * diff(g(x)) * ln(f(x)) + f(x)^(g(x)-1) * g(x) * diff(f(x))
        if (input.rightChild?.node.kind !== TokenType.NUMBER)
          throw new Error("Can't handle non-numeric exponents");
        const fDiff = this.differentiate(input.leftChild, varName);
        const expo = input.rightChild.node.numericValue ?? 1;
        const N: SyntaxTree = {
          node: {
            kind: TokenType.NUMBER,
            numericValue: input.rightChild.node.numericValue
          }
        };
        const fPower: SyntaxTree = {
          node: { kind: TokenType.POW },
          leftChild: input.leftChild,
          rightChild: {
            node: { kind: TokenType.NUMBER, numericValue: expo - 1 }
          }
        };
        // Return the product of the three terms above
        return {
          node: { kind: TokenType.MULT },
          leftChild: N,
          rightChild: {
            node: { kind: TokenType.MULT },
            leftChild: fPower,
            rightChild: fDiff
          }
        };
      }
      case TokenType.MATH_BUILTIN: {
        const args = input.args!;
        switch (input.node.text) {
          // Multi-arg functions
          // case "max":
          //   return; // TOO Ugly! https://math.stackexchange.com/questions/1237239/what-is-the-derivative-of-max-and-min-functions/1237244
          // case "min":
          //   return; // TOO Ugly!

          // // Binary functions
          // case "atan2":
          //   return; // No need for this. Not doing partial derivatives

          // Unary functions
          case "abs": {
            //We are going to ignore the fact that this derivative is undefined at various values
            // diff(abs(f(x)))= diff(f(x))*f(x)/abs(f(x))
            const fDiff = this.differentiate(args[0], varName);
            //return the triple
            return {
              node: { kind: TokenType.MULT },
              leftChild: fDiff,
              rightChild: {
                node: { kind: TokenType.DIV },
                leftChild: args[0],
                rightChild: input
              }
            };
          }
          case "acos": {
            // diff(acos(f(x))) = -1*diff(f(x))/sqrt(1-f(x)*f(x))
            const minusOne: SyntaxTree = {
              node: {
                kind: TokenType.NUMBER,
                text: "-1",
                numericValue: -1
              }
            };
            const fxsquared: SyntaxTree = {
              node: {
                kind: TokenType.MULT
              },
              leftChild: args[0],
              rightChild: args[0]
            };
            const oneMinusfxsquared: SyntaxTree = {
              node: { kind: TokenType.MINUS },
              leftChild: {
                node: {
                  kind: TokenType.NUMBER,
                  text: "1",
                  numericValue: 1
                }
              },
              rightChild: fxsquared
            };
            const sqrtTerm: SyntaxTree = {
              node: {
                kind: TokenType.MATH_BUILTIN,
                text: "sqrt"
              },
              args: [oneMinusfxsquared]
            };
            const fDiff = this.differentiate(args[0], varName);
            //return the triple
            return {
              node: { kind: TokenType.MULT },
              leftChild: minusOne,
              rightChild: {
                node: { kind: TokenType.DIV },
                leftChild: fDiff,
                rightChild: sqrtTerm
              }
            };
          }
          case "asin": {
            // diff(asin(f(x))) = diff(f(x))/sqrt(1-f(x)*f(x))
            const fxsquared: SyntaxTree = {
              node: {
                kind: TokenType.MULT
              },
              leftChild: args[0],
              rightChild: args[0]
            };
            const oneMinusfxsquared: SyntaxTree = {
              node: { kind: TokenType.MINUS },
              leftChild: {
                node: {
                  kind: TokenType.NUMBER,
                  text: "1",
                  numericValue: 1
                }
              },
              rightChild: fxsquared
            };
            const sqrtTerm: SyntaxTree = {
              node: {
                kind: TokenType.MATH_BUILTIN,
                text: "sqrt"
              },
              args: [oneMinusfxsquared]
            };
            const fDiff = this.differentiate(args[0], varName);
            //return the triple
            return {
              node: { kind: TokenType.DIV },
              leftChild: fDiff,
              rightChild: sqrtTerm
            };
          }
          case "atan": {
            // diff(atan(f(x))) = diff(f(x))/(1+f(x)*f(x))
            const fxsquared: SyntaxTree = {
              node: {
                kind: TokenType.MULT
              },
              leftChild: args[0],
              rightChild: args[0]
            };
            const onePlusfxsquared: SyntaxTree = {
              node: { kind: TokenType.PLUS },
              leftChild: {
                node: {
                  kind: TokenType.NUMBER,
                  text: "1",
                  numericValue: 1
                }
              },
              rightChild: fxsquared
            };

            const fDiff = this.differentiate(args[0], varName);
            //return the triple
            return {
              node: { kind: TokenType.DIV },
              leftChild: fDiff,
              rightChild: onePlusfxsquared
            };
          }
          case "ceil":
            //We are going to ignore the fact that the derivative at integer values is undefined
            return {
              node: {
                kind: TokenType.NUMBER,
                text: "0",
                numericValue: 0
              }
            };
          case "cos": {
            // diff(cos(f(x))) = -1*sin(f(x))*diff(f(x))
            const minusOne: SyntaxTree = {
              node: {
                kind: TokenType.NUMBER,
                text: "-1",
                numericValue: -1
              }
            };
            const sinfx: SyntaxTree = {
              node: {
                kind: TokenType.MATH_BUILTIN,
                text: "sin"
              },
              args: [args[0]]
            };
            const fDiff = this.differentiate(args[0], varName);
            //return the triple product
            return {
              node: { kind: TokenType.MULT },
              leftChild: minusOne,
              rightChild: {
                node: { kind: TokenType.MULT },
                leftChild: sinfx,
                rightChild: fDiff
              }
            };
          }
          case "exp": {
            // diff(e^(f(x))) = e^(f(x))*diff(f(x))
            const fDiff = this.differentiate(args[0], varName);
            //return the product
            return {
              node: { kind: TokenType.MULT },
              leftChild: input,
              rightChild: fDiff
            };
          }
          case "floor":
            //We are going to ignore the fact that the derivative at integer values is undefined
            return {
              node: {
                kind: TokenType.NUMBER,
                text: "0",
                numericValue: 0
              }
            };
          case "ln": {
            // diff(ln(f(x))) = diff(f(x))/f(x)
            const fDiff = this.differentiate(args[0], varName);
            //return the product
            return {
              node: { kind: TokenType.DIV },
              leftChild: fDiff,
              rightChild: args[0]
            };
          }
          case "sin": {
            // diff(sin(f(x))) = cos(f(x))*diff(f(x))
            const cosfx: SyntaxTree = {
              node: {
                kind: TokenType.MATH_BUILTIN,
                text: "cos"
              },
              args: [args[0]]
            };
            const fDiff = this.differentiate(args[0], varName);
            //return the product
            return {
              node: { kind: TokenType.MULT },
              leftChild: cosfx,
              rightChild: fDiff
            };
          }
          case "sqrt": {
            // diff(sqrt(f(x))) = diff(f(x))/(2*sqrt(f(x)))
            const two: SyntaxTree = {
              node: {
                kind: TokenType.NUMBER,
                text: "2",
                numericValue: 2
              }
            };
            const fDiff = this.differentiate(args[0], varName);
            //return the triple
            return {
              node: { kind: TokenType.DIV },
              leftChild: fDiff,
              rightChild: {
                node: { kind: TokenType.MULT },
                leftChild: two,
                rightChild: input
              }
            };
          }
          case "tan": {
            // diff(tan(f(x))) = sec(f(x))*sec(f(x))*diff(f(x)) = diff(f(x))/(cos(f(x))*cos(f(x)))
            const cosfx: SyntaxTree = {
              node: {
                kind: TokenType.MATH_BUILTIN,
                text: "cos"
              },
              args: [args[0]]
            };
            const fDiff = this.differentiate(args[0], varName);
            //return the triple
            return {
              node: { kind: TokenType.DIV },
              leftChild: fDiff,
              rightChild: {
                node: { kind: TokenType.MULT },
                leftChild: cosfx,
                rightChild: cosfx
              }
            };
          }
          default:
            throw new SyntaxError(`Unknown math builtin ${input.node.text}`);
        }
      }
      default:
        throw new Error(
          `Unhandled token type ${TokenType[input.node.kind]} ${
            input.node.text
          }`
        );
    }
  }
  /** Recursive evaluation of the syntax tree
   * The post order traversal of the syntax tree makes the leaves
   * the highest precedence expressions
   */
  static evaluate(tree: SyntaxTree, varMap: Map<string, number>): number {
    function valueOf(t: SyntaxTree | null): number {
      let numValue: number;
      const measureName = t?.node.text ?? "n/a";
      let args: SyntaxTree[];
      switch (t?.node.kind) {
        case TokenType.NUMBER:
          return t.node.numericValue ?? 0;
        case TokenType.MEASUREMENT:
          if (varMap.has(measureName)) return varMap.get(measureName) ?? 0;
          else throw new Error(`Undefined variable ${measureName}`);
        case TokenType.PLUS:
          return valueOf(t.leftChild ?? null) + valueOf(t.rightChild ?? null);
        case TokenType.MINUS:
          return valueOf(t.leftChild ?? null) - valueOf(t.rightChild ?? null);
        case TokenType.MULT:
          return valueOf(t.leftChild ?? null) * valueOf(t.rightChild ?? null);
        case TokenType.DIV:
          numValue = valueOf(t.rightChild ?? null);
          if (Math.abs(numValue) > 1e-4)
            return valueOf(t.leftChild ?? null) / valueOf(t.rightChild ?? null);
          else throw new RangeError("Attempt to divide by zero");
        case TokenType.POW:
          return Math.pow(
            valueOf(t.leftChild ?? null),
            valueOf(t.rightChild ?? null)
          );
        case TokenType.MATH_BUILTIN:
          args = t.args!;
          switch (t.node.text) {
            // Multi-arg functions
            // Apply "evaluate()" to each element
            case "max":
              return Math.max(...args.map(a => valueOf(a)));
            case "min":
              return Math.min(...args.map(a => valueOf(a)));

            // Binary functions
            case "atan2":
              return Math.atan2(valueOf(args[0]), valueOf(args[1]));

            // Unary functions
            case "abs":
              return Math.abs(valueOf(args[0]));
            case "acos":
              return Math.acos(valueOf(args[0]));
            case "asin":
              return Math.asin(valueOf(args[0]));
            case "atan":
              return Math.atan(valueOf(args[0]));

            case "ceil":
              return Math.ceil(valueOf(args[0]));
            case "cos":
              return Math.cos(valueOf(args[0]));
            case "exp":
              return Math.exp(valueOf(args[0]));
            case "floor":
              return Math.floor(valueOf(args[0]));
            case "ln":
              return Math.log(valueOf(args[0]));
            case "sgn":
              return Math.sign(valueOf(args[0]));
            case "sin":
              return Math.sin(valueOf(args[0]));
            case "sqrt":
              return Math.sqrt(valueOf(args[0]));
            case "tan":
              return Math.tan(valueOf(args[0]));
            default:
              throw new SyntaxError(`Unknown math builtin ${t.node.text}`);
          }

        default:
          return 0;
      }
    }

    return valueOf(tree);
  }

  evaluateWithVars = (input: string, varMap: Map<string, number>): number =>
    ExpressionParser.evaluate(ExpressionParser.parse(input), varMap);

  evaluate = (input: string): number =>
    ExpressionParser.evaluate(ExpressionParser.parse(input), this.EMPTY_MAP);
}
