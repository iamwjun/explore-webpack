const acorn = require("acorn");
const walk = require("acorn-walk");
const NullFactory = require("webpack/lib/NullFactory");
const ConstDependency = require("webpack/lib/dependencies/ConstDependency");

class WidgetsPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap(
      "WidgetsPlugin",
      (compilation, { normalModuleFactory }) => {
        compilation.dependencyFactories.set(ConstDependency, new NullFactory());
        compilation.dependencyTemplates.set(
          ConstDependency,
          new ConstDependency.Template()
        );
      }
    );

    compiler.hooks.normalModuleFactory.tap("WidgetsPlugin", (factory) => {
      factory.hooks.parser
        .for("javascript/auto")
        .tap("WidgetsPlugin", (parser, options) => {
          parser.hooks.new
            .for("Compile")
            .tap({ name: "WidgetsPlugin", enforce: "pre" }, (expression) => {
              walk.simple(expression, {
                NewExpression(node) {
                  // 在NewExpression的arguments数组中添加一个新参数
                  node.arguments = [node.arguments[1]];
                  //  console.log("node", node);
                },
              });
              // console.log('code', generate(expression).code);
              // console.log("expression", expression);
              return expression;
            });
        });

      // factory.hooks.parser
      //   .for("javascript/auto")
      //   .tap("WidgetsPlugin", (parser, options) => {
      //     parser.hooks.program.tap("WidgetsPlugin", (ast, comments) => {
      //       if (
      //         parser.state &&
      //         parser.state.module &&
      //         parser.state.module.resource.indexOf("node_modules") === -1
      //       ) {
      //         if (parser.state.module.resource.endsWith("tsx")) {
      //           walk.simple(ast, {
      //             NewExpression(node) {
      //               if (node.arguments.length === 3) {
      //                 node.arguments.pop();
      //                 console.log("arguments", node);
      //               }
      //             },
      //           });
      //         }
      //       }
      //     });
      //   });
    });
  }
}

module.exports = WidgetsPlugin;
