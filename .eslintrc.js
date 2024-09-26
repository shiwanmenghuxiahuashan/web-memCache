module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    '@element-plus/eslint-config'
  ],
  globals: {
    describe: 'readonly',
    expect: 'readonly',
    it: 'readonly',
    test: true
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off' // 禁用 no-explicit-any 规则
  }
}
