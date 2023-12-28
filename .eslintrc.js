module.exports = {
    env: {
        browser: true,
        node: true
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        sourceType: 'module'
    },
    plugins: [
        '@typescript-eslint'
    ],
    globals: {},
    rules: {
        'no-useless-escape': 0,
        'prefer-spread': 0,
        'prefer-const': 0,
        'comma-spacing': 'error',
        'space-infix-ops': 'error',
        'no-constant-condition': 0,
        'no-inner-declarations': 0,
        '@typescript-eslint/no-namespace': 0,
        'arrow-spacing': ['error', { before: true, after: true }],
        'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
        'space-before-function-paren': ['error', { 'anonymous': 'always', 'named': 'never', 'asyncArrow': 'always' }],
        '@typescript-eslint/ban-types': 0,
        '@typescript-eslint/ban-ts-comment': 0,
        '@typescript-eslint/no-explicit-any': 0,
        '@typescript-eslint/no-var-requires': 0,
        '@typescript-eslint/no-empty-function': 0,
        '@typescript-eslint/semi': ['error', 'always'],
        '@typescript-eslint/quotes': ['error', 'single'],
        '@typescript-eslint/explicit-module-boundary-types': 0,
        '@typescript-eslint/object-curly-spacing': ['error', 'always'],
        '@typescript-eslint/no-inferrable-types': ['error', { ignoreParameters: true, ignoreProperties: true }],
    }
};