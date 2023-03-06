import * as ts from "typescript";

const fs = require('fs');
const path = require('path');
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
function logTransformer(context: ts.TransformationContext): ts.Transformer<any> {
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
const transpileFactory = (context: ts.TransformationContext): ts.Transformer<any> => {
  return (sourceFile) => {
    function visitNode(node) {
      if (ts.isClassDeclaration(node)) {
        const constructor = node.members.find(ts.isConstructorDeclaration);
        console.log(constructor);
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
                  ts.factory.createStringLiteral("ZGVtbw==")
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
 * read all file paths
 * @param {*} dir folder path
 * @returns file paths
 */
const readFilesRecursively = (dir) => {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  const filePaths = files.map(file => {
    const filePath = path.join(dir, file.name);
    return file.isDirectory() ? readFilesRecursively(filePath) : filePath;
  });

  return filePaths.flat();
}

/**
 * get the full path of the application
 * @param {*} relative path
 * @returns the full path of the application
 */
const resolveApp = (relativePath) => {
  const appDirectory = fs.realpathSync(process.cwd());
  return path.resolve(appDirectory, relativePath);
}

/**
 * code convert to base64
 * @param {*} path file path
 * @returns base64 string
 */
const transformCodeToBase64 = (path) => {
  const tsxCode = fs.readFileSync(path, "utf-8");
  return Buffer.from(JSON.stringify(tsxCode)).toString("base64");
}

/**
 * convert all widgets in the directory
 * @returns base64 string
 */
const transformFiles = () => {
  const files = readFilesRecursively(resolveApp('src/widgets/components/'));
  const filesToMap = files.filter((file) => file.endsWith("index.tsx"));
  const base64Map = new Map();
  filesToMap.forEach((file) => {
    const match = file.match(/\/([A-Za-z]+)\/index.tsx$/);
    const filename = match ? match[1] : null;
    if (filename) {
      base64Map.set(filename, transformCodeToBase64(file));
    }
  });
  return Buffer.from(
    JSON.stringify(Object.fromEntries(base64Map))
  ).toString("base64");
};

/**
 * transform class constructor
 * @param {*} context ts.TransformationContext
 * @returns ts.Transformer<any>
 */
const transformClassConstructor = (context: ts.TransformationContext): ts.Transformer<any> => {
  return (node: ts.Node) => {
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
          // for (const statement of member.body?.statements || []) {
          //   if (ts.isExpressionStatement(statement) && ts.isBinaryExpression(statement.expression)) {
          //     const binaryExpr: ts.BinaryExpression = statement.expression as ts.BinaryExpression;
          //     // 对二元表达式进行相应的修改
          //     // ...
          //   }
          // }
          member.body?.statements.slice(0, 1);
          // @ts-ignore
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
    name: "My Custom Loader",
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
