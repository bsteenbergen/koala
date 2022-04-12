// SEMANTIC ANALYZER
import { Variable, Function, error, BinaryExpression, Token } from "./core.js"

import * as stdlib from "./stdlib.js"

class Context {
  constructor({
    parent = null,
    functions = new Map(),
    variables = new Map(),
    inLoop = false,
    function: f = null,
  }) {
    Object.assign(this, { parent, functions, variables, inLoop, function: f })
  }
  sees(name) {
    // Search "outward" through enclosing scopes
    return this.variables.has(name) || this.parent?.sees(name)
  }
  add(name, entity) {
    // No shadowing!
    if (this.sees(name)) error(`Identifier ${name} already declared`)
    this.variables.set(name, entity)
  }
  lookup(name) {
    const entity = this.variables.get(name)
    if (entity) {
      return entity
    } else if (this.parent) {
      return this.parent.lookup(name)
    }
    error(`Identifier ${name} not declared`)
  }
  newChildContext(props) {
    return new Context({
      ...this,
      parent: this,
      variables: new Map(),
      ...props,
    })
  }
  analyze(node) {
    return this[node.constructor.name](node)
  }
  Program(p) {
    this.analyze(p.statements)
  }
  PrintStatement(d) {
    // If printing variable, check if it has been declared.
    if (
      d.argument.category === "Id" &&
      !this.variables.has(d.argument.lexeme)
    ) {
      error(`Print statement argument "${d.argument.lexeme}" is uninitialized.`)
    }
  }

  BinaryExpression(d) {
    console.log("BinaryExpression from analyzer")
  }

  VariableDeclaration(d) {
    let type = d.type.typeName.lexeme
    let name = d.name.lexeme
    let initilizer = d.initializer.lexeme
    let v = new Variable(type, name, initilizer)
    // Make sure variable has not already been declared.
    if (this.variables.has(name)) {
      // If it has, throw!
      error(`Variable ${name} already declared`)
    }
    // Make sure variable is being initialized to the correct type.
    if (d.initializer.constructor === Token) {
      // If initialized to id, make sure id has been declared.
      if (d.initializer.category === "Id") {
        if (!this.variables.has(d.initializer.lexeme)) {
          error(`Initializer ${d.initializer.lexeme} has not been initalized.`)
        }
      }
      if (["Int", "Float", "Bool"].includes(d.initializer.category)) {
        if (d.initializer.category.toLowerCase() !== type.toLowerCase()) {
          error(`Initializer type does not match variable type`)
        }
      }
    }
    // If we initialize our variable to the result of a binary expression ...
    if (d.initializer.constructor === BinaryExpression) {
      // Ensure that the variable type is a bool (b/c the result of a binary
      // expression cannot be anything else.)
      if (type !== "bool") {
        error(
          `Variable ${name} is being initalized to result of binary expression but is not type bool`
        )
      }
    }
    this.variables.set(name, v)
  }
  VariableAssignment(d) {
    // Ensure LHS has already been initialized.
    let name = d.name.lexeme
    if (!this.variables.has(name)) {
      // If it has, throw!
      error(`Must initialize variables before asignment`)
    }
    // TODO: TYPE CHECKING HERE
  }
  FunctionDeclaration(d) {
    let funcName = d.funcName.lexeme // This still has the #. Should we keep it?
    let suite = d.suite
    let func = new Function(funcName, suite)
    // Make sure function has not already been declared.
    if (this.functions.has(funcName)) {
      // If it has, throw!
      error(`Function ${funcName} already declared`)
    }
    // If it has not, add the function being created to the Context's functions.
    this.functions.set(funcName, func)
    // Create new child context
    const childContext = this.newChildContext({
      functions: this.functions,
      variables: this.variables,
      inLoop: false,
      function: func,
    })
    childContext.analyze(suite.statements)
  }

  FunctionCall(d) {
    // Is the call a branch or a branch link?
    let link = d.link.lexeme === "bl" ? true : false
    let funcName = d.funcName.lexeme
    // Make sure the function has been declared.
    if (!this.functions.has(funcName)) {
      // If it has, throw!
      error(`Function ${funcName} has not yet been declared`)
    }
    // Check if there is a condition being attatched to the function call.
    if (d.condition.length !== 0) {
      d.condition.forEach((c) => {
        // If we have a binary operator.
        if (c.left !== undefined && c.right !== undefined) {
          let be = new BinaryExpression(c.left, c.op, c.right)
        }
      })
    }
  }

  IfStatement(d) {
    // The condition must evaluate to a boolean.
    // If the condition is a token, make sure it is an id or a boolean.
    if (!["Id", "Bool", undefined].includes(d.condition.category)) {
      error(`If statement condition must evaluate to a boolean`)
    }
    // If the token is an id ...
    if (d.condition.category == "Id") {
      // ... make sure the variable has been declared ...
      if (!this.variables.has(d.condition.description)) {
        error(`Must initialize variables before use in conditional expression`)
      }
      // ... and make sure the var is of type bool ...
      const condition_type = this.variables.get(d.condition.description).type
      if (condition_type !== "bool") {
        error(`If statement condition must evaluate to a boolean`)
      }
    }
    // TODO: check for binary expressions
  }

  CompareInstruction(d) {
    if (d.args.length !== 3) {
      error(`cmp instruction must have exactly three arguments.`)
    }
    // If either arg_1 and arg_2 are variables, they must be initialized already.
    d.args.slice(0, -1).forEach((arg) => {
      if (arg.category === "Id" && !this.variables.has(arg.description)) {
        error(`Variable ${arg.description} is undeclared`)
      }
    })
  }

  Array(a) {
    a.forEach((e) => this.analyze(e))
  }
}

// -----------------------
// Validation Functions
// -----------------------

// FOR FUNCTION CALLS

export default function analyze(node) {
  const initialContext = new Context({})
  for (const [name, type] of Object.entries(stdlib.contents)) {
    initialContext.add(name, type)
  }
  initialContext.analyze(node)
  return node
}
