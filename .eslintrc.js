module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es6: true
  },
  extends: ["eslint:recommended"],
  plugins: [],
  rules: {
    indent: ["error", 2, { SwitchCase: 1 }],
    semi: ["error", "always"],
    quotes: ["error", "double"],
    "no-console": "off"
  },
  parserOptions: {
    parser: "babel-eslint"
  }
};