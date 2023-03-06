const acorn = require("acorn");
const walk = require("acorn-walk");
const { RawSource } = require("webpack-sources");

class AssetsPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('AssetsPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'AssetsPlugin',
          stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONS, // see below for more stages
        },
        (assets) => {
          Object.entries(assets).forEach(([pathname]) => {
            if(pathname.indexOf("static/js/main") > -1 && pathname.endsWith(".js")) {
              let source = compilation.assets[pathname].source();
              // modify source
              const nextsource = source + '\n//console.log("Hello, Webpack!")\n';
              // update asset
              compilation.updateAsset(pathname, new RawSource(nextsource));
            }
          });
        }
      );
    });
  }
}

module.exports = AssetsPlugin;
