import assert from "assert"
import ast from "../src/ast.js"

// Programs expected to be syntactically correct
const syntaxChecks = [
  ["simplest syntactically correct program", "break"],
  ["multiple statements", 'mumble("hey")\nbreak\nreturn'],
  ["variable declarations", "str s = 'silly'"],
  ["type declarations", "num n = 2"],
  ["function with one param", "task square(num) yields num^2"],
  ["function with two params", "task combineStrings(str str1, str str2) yields combinedString: combinedString = str1 + str2 end"],
  ["array type returned", "task returnList() yields List"],
  ["assignments", "abc=9*3 a=1"],
  ["short if", 'if (true): mumble("good!")'],
  ["while with empty block", "while true"],
  ["while with one statement block", "while true num x = 1"],
  ["for half-open range", "num i = 1 loop until i > 10: i += 1 end"]
  ["for closed range", "num i = 1 loop until i > 10: i += 1 end"],
  ["relational operators", 'mumble(1<2||1<=2||1==2||1!=2||1>=2||1>2)'],
  ["arithmetic", "task arithmetic() yields 2 * x + 3 / 5 - 7 "],
  ["boolean literals", "let x = false || true"],
  ["empty array literal", "List l = [] mumble(l)"],
  ["nonempty array literal", "List l = [5, 2] mumble(l)"],
  ["parentheses", "mumble(83 * (((((((((13 / 21))))))))) + 1 - 0)"],
  ["non-Latin letters in identifiers", "let コンパイラ = 100"],
  ["a simple string literal", 'mumble("😎💯")'],
  ["end of program inside comment", "mumble(0) // yay"],
  ["comments with no text", "mumble(1)//\mumble(0)//"],
]

// Programs with syntax errors that the parser will detect
const syntaxErrors = [
  ["non-letter in an identifier", "str ab😭c = 2", /Line 1, col 7:/],
  ["malformed number", "num x = 2.", /Line 1, col 10:/],
  ["a missing right operand", "mumble(5 -)", /Line 1, col 10:/],
  ["a non-operator", "mumble(7 * ((2 _ 3))", /Line 1, col 15:/],
  // I GOT TO HERE SO FAR (EVERYTHING ABOVE)
  ["an expression starting with a )", "return )", /Line 1, col 8:/],
  ["a statement starting with expression", "x * 5", /Line 1, col 3:/],
  ["an illegal statement on line 2", "print(5)\nx * 5", /Line 2, col 3:/],
  ["a statement starting with a )", "print(5)\n)", /Line 2, col 1:/],
  ["an expression starting with a *", "let x = * 71", /Line 1, col 9:/],
  ["negation before exponentiation", "print(-2**2)", /Line 1, col 10:/],
  ["mixing ands and ors", "print(1 && 2 || 3)", /Line 1, col 15:/],
  ["mixing ors and ands", "print(1 || 2 && 3)", /Line 1, col 15:/],
  ["associating relational operators", "print(1 < 2 < 3)", /Line 1, col 13:/],
  ["while without braces", "while true\nprint(1)", /Line 2, col 1/],
  ["if without braces", "if x < 3\nprint(1)", /Line 2, col 1/],
  ["while as identifier", "let for = 3", /Line 1, col 5/],
  ["if as identifier", "let if = 8", /Line 1, col 5/],
  ["unbalanced brackets", "function f(): int[", /Line 1, col 18/],
  ["empty array without type", "print([])", /Line 1, col 9/],
  ["bad array literal", "print([1,2,])", /Line 1, col 12/],
  ["empty subscript", "print(a[])", /Line 1, col 9/],
  ["true is not assignable", "true = 1", /Line 1, col 5/],
  ["false is not assignable", "false = 1", /Line 1, col 6/],
  ["no-paren function type", "function f(g:int->int) {}", /Line 1, col 17/],
  ["string lit with unknown escape", 'print("ab\\zcdef")', /col 11/],
  ["string lit with newline", 'print("ab\\zcdef")', /col 11/],
  ["string lit with quote", 'print("ab\\zcdef")', /col 11/],
  ["string lit with code point too long", 'print("\\u{1111111}")', /col 17/],
]

describe("The parser", () => {
  for (const [scenario, source] of syntaxChecks) {
    it(`recognizes ${scenario}`, () => {
      assert(ast(source))
    })
  }
  for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => ast(source), errorMessagePattern)
    })
  }
})