const { urlToRequest } = require('loader-utils');
const { validate } = require('schema-utils');

const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string'
    },
    value: {
      type: 'string'
    }
  }
};

module.exports = function(source) {
  // 获取Loader的options
  const options = this.getOptions();

  // 验证options是否符合schema
  validate(schema, options, {
    name: 'My Custom Loader',
    baseDataPath: 'options'
  });

  console.log(urlToRequest(this.resourcePath))

  // 在文件中添加一个变量
  const variable = `${options.name} = "${options.value}";\n\n`;

  // 返回处理后的结果
  return variable + source;
};

// module.exports = function(source) {
//   console.log(source)
//   const options = this.getOptions();

//   validate(schema, options, {
//     name: 'Example Loader',
//     baseDataPath: 'options',
//   });

//   console.log(urlToRequest(this.resourcePath))
  
//   console.log('The request path', urlToRequest(this.resourcePath));

//   // Apply some transformations to the source...

//   return `export default ${JSON.stringify(source)}`;
// }
