module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true
  },
  extends: 'eslint:recommended',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  rules: {
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'no-var': 'error',
    'block-scoped-var': 'error',
    curly: 'error',
    'default-case': 'error',
    'dot-notation': 'error',
    'no-empty-function': 'error',
    'no-else-return': 'error',
    'no-eval': 'error',
    'no-extra-bind': 'error',
    'no-extra-label': 'error',
    'no-implied-eval': 'error',
    'no-invalid-this': 'error',
    'no-multi-spaces': 'error',
    'no-new': 'error',
    'no-new-func': 'error',
    'no-new-wrappers': 'error',
    'no-return-assign': 'error',
    'no-return-await': 'error',
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-throw-literal': 'error',
    'no-useless-call': 'error',
    'no-useless-catch': 'error',
    'no-useless-concat': 'error',
    'no-with': 'error',
    'no-void': 'error',
    'prefer-promise-reject-errors': 'error',
    yoda: 'error',
    'prefer-const': 'error',
    //"prefer-arrow-callback": "error",
    'handle-callback-err': 'error',
    'no-async-promise-executor': 'error',
    'no-case-declarations': 'error',
    'no-shadow': 'error',
    'no-undef-init': 'error',
    'no-undefined': 'error',
    'no-use-before-define': 'error',
    'no-new-require': 'error',
    'no-process-env': 'error',
    // 'no-sync': 'error',
    strict: 'error',
    'arrow-spacing': 'error',
    'no-floating-decimal': 'error',
    'no-buffer-constructor': 'error',
    // "no-mixed-requires": ["error", { "grouping": true }],
    'max-classes-per-file': ['error', 1],
    'arrow-body-style': ['error', 'as-needed'],
    'no-confusing-arrow': ['error', { allowParens: true }],
    'no-duplicate-imports': 'error',
    'no-useless-computed-key': 'error',
    'no-useless-constructor': 'error',
    'no-useless-rename': 'error',
    // "prefer-destructuring": "error",
    // "prefer-template": "error",
    'capitalized-comments': ['error'],
    'consistent-this': ['error', 'oThis'],
    'eol-last': ['error', 'always'],
    'id-length': ['error', { min: 2 }],
    'key-spacing': ['error', { beforeColon: false, afterColon: true }],
    // 'lines-around-comment': ['error', { beforeBlockComment: false, beforeLineComment: false }],
    'lines-between-class-members': ['error', 'always'],
    'no-array-constructor': 'error',
    'max-depth': ['error', 4],
    'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
    'no-lonely-if': 'error',
    'no-multiple-empty-lines': 'error',
    'no-negated-condition': 'error',
    'no-new-object': 'error',
    'no-trailing-spaces': 'error',
    'no-unneeded-ternary': 'error',
    'operator-assignment': ['error', 'always'],
    'padding-line-between-statements': ['error', { blankLine: 'always', prev: '*', next: 'return' }],
    'spaced-comment': ['error', 'always', { exceptions: ['-', '+'] }]
  }
};
