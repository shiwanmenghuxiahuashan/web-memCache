module.exports = {
  extends: ['@element-plus/eslint-config'],
  globals: {
    describe: 'readonly',
    expect: 'readonly',
    it: 'readonly',
    test: true
  },
  ignores: ['webpack.config.js', '.eslintrc.js', 'tests', '/dist']
}
