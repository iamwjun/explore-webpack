const ts = require("typescript");
const fs = require('fs');
const { urlToRequest } = require("loader-utils");
const { validate } = require("schema-utils");

const schema = {
  type: "object",
  properties: {
    name: {
      type: "string",
    },
    value: {
      type: "string",
    },
  },
};

/**
 * clear console.log
 * @param {*} context ts.TransformationContext
 * @returns ts.Transformer<any>
 */
function logTransformer(context) {
  return (sourceFile) => {
    function visit(node) {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "log"
      ) {
        const logFunc = ts.factory.createStringLiteralFromNode(
          ts.factory.createStringLiteral('myLog')
        );
        const newArgs = ts.factory.createNodeArray([
          ts.factory.createStringLiteral(
            `${sourceFile.fileName}:(${node.pos})`
          ),
          ...node.arguments,
        ]);
        return ts.factory.createCallExpression(logFunc, undefined, newArgs);
      }
      return ts.visitEachChild(node, visit, context);
    }
    return ts.visitNode(sourceFile, visit);
  };
}

/**
 * transpile factory
 * @param {*} context ts.TransformationContext
 * @returns ts.Transformer<any>
 */
const transpileFactory = (context) => {
  return (sourceFile) => {
    function visitNode(node) {
      if (ts.isClassDeclaration(node)) {
        const constructor = node.members.find(ts.isConstructorDeclaration);
        if (constructor) {
          const assignment = constructor.body?.statements.find(
            ts.isExpressionStatement
          );
          if (assignment) {
            const variable = assignment.expression.getChildAt(0);
            if (ts.isPropertyAccessExpression(variable)) {
              const object = variable.expression;
              const propertyName = variable.name;
              if (
                ts.isExpressionStatement(object) &&
                ts.isIdentifier(propertyName) &&
                propertyName.text === "variable"
              ) {
                const newAssignment = ts.factory.createAssignment(
                  ts.factory.createPropertyAccessExpression(
                    ts.factory.createThis(),
                    ts.factory.createIdentifier("variable")
                  ),
                  ts.factory.createStringLiteral("ZGVtbw")
                );
                return ts.factory.createExpressionStatement(newAssignment);
              }
            }
          }
        }
      }
      return ts.visitEachChild(node, visitNode, context);
    }
    return ts.visitNode(sourceFile, visitNode);
  };
};

/**
 * transform class constructor
 * @param {*} context ts.TransformationContext
 * @returns ts.Transformer<any>
 */
const transformClassConstructor = (context) => {
  return (node) => {
    if (ts.isClassDeclaration(node)) {
      for (const member of node.members) {
        if (ts.isConstructorDeclaration(member)) {
          const thisExpression = ts.factory.createThis();
          const assignment = ts.factory.createAssignment(
            ts.factory.createPropertyAccessExpression(
              thisExpression,
              "variable"
            ),
            ts.factory.createStringLiteral("ZGVtbw")
          );
          member.body?.statements.slice(0, 1);
          member.body?.statements.unshift(
            ts.factory.createExpressionStatement(assignment)
          );
        }
      }
    }
    return ts.visitEachChild(node, transformClassConstructor(context), context);
  };
};

/**
 * transform class constructor
 * @param {*} source code string
 * @param {*} map source map
 * @returns void
 */
module.exports = function (source, map) {
  const options = this.getOptions();

  validate(schema, options, {
    name: "widgets Loader",
    baseDataPath: "options",
  });

  if (urlToRequest(this.resourcePath).indexOf("CompileCanvas") > -1) {
    const { outputText, sourceMapText } = ts.transpileModule(source, {
      compilerOptions: {
        sourceMap: true,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2015,
      },
      transformers: {
        before: [transformClassConstructor],
      },
    });
    this.callback(null, outputText, sourceMapText);
    return;
  }

  this.callback(null, source, map);
};
