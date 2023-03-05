const path = require('path');
const WidgetsPlugin = require('./config/webpack/plugins/widgets');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'my-first-webpack.bundle.js',
  },
  plugins: [
    new WidgetsPlugin()
  ]
};