module.exports = {
  presets: ['module:metro-react-native-babel-preset', 'module:react-native-dotenv'],
  retainLines: true,
  plugins: [['import', { libraryName: 'antd-mobile-rn' }]],
  env: {
    production: {
      plugins: ['transform-remove-console'],
    },
  },
};
