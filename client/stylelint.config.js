export default {
  cache: false, // always use fresh files for linting
  extends: [
    'stylelint-config-standard',
    'stylelint-config-clean-order',
    'stylelint-config-recommended-vue',
  ],
  ignoreFiles: [
    '**/node_modules/',
    'dist/**/*',
    'src/assets/styles/_apple.css',
    'src/components/ui/**/*',
  ],
  overrides: [
    {
      files: ['src/**/*.vue'],
      rules: {},
    },
  ],
  plugins: [
    '@stylistic/stylelint-plugin',
    'stylelint-plugin-defensive-css',
    'stylelint-use-nesting',
  ],
  rules: {
    /**
     * ------------------------------------------------------------------------------
     * Base Stylelint rule customization:
     * https://stylelint.io/user-guide/rules
     */
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'custom-variant',
          'reference',
          'theme',
          'variant',
        ],
      },
    ],
    'comment-empty-line-before': null,
    'declaration-block-no-duplicate-properties': [
      true,
      {
        ignore: ['consecutive-duplicates-with-different-values'],
      },
    ],
    'declaration-empty-line-before': null,
    'declaration-property-value-no-unknown': true,
    'font-family-name-quotes': 'always-unless-keyword',
    'function-url-quotes': [
      'always',
      {
        except: ['empty'],
      },
    ],
    'import-notation': null,
    'selector-attribute-quotes': 'always',
    'selector-class-pattern': null,
    'selector-id-pattern': null,
    'value-keyword-case': [
      'lower',
      {
        camelCaseSvgKeywords: true,
        ignoreKeywords: ['BlinkMacSystemFont'],
      },
    ],

    /**
     * ------------------------------------------------------------------------------
     * Stylistic rule customization:
     * https://github.com/stylelint-stylistic/stylelint-stylistic/blob/main/docs/user-guide/rules.md#rules
     */
    '@stylistic/declaration-bang-space-after': 'never',
    '@stylistic/declaration-bang-space-before': 'always',
    '@stylistic/declaration-block-semicolon-newline-after': 'always',
    '@stylistic/declaration-block-semicolon-newline-before': 'never-multi-line',
    '@stylistic/declaration-block-semicolon-space-before': 'never',
    '@stylistic/declaration-block-trailing-semicolon': 'always',
    '@stylistic/declaration-colon-space-after': 'always-single-line',
    '@stylistic/declaration-colon-space-before': 'never',
    '@stylistic/property-case': 'lower',
    '@stylistic/selector-list-comma-newline-after': 'always',
    '@stylistic/selector-max-empty-lines': 0,
    '@stylistic/string-quotes': 'single',
    '@stylistic/unit-case': 'lower',

    /**
     * ------------------------------------------------------------------------------
     * "Use Nesting" plugin:
     * https://www.npmjs.com/package/stylelint-use-nesting
     */
    'csstools/use-nesting': 'always',

    /**
     * ------------------------------------------------------------------------------
     * "Defensive CSS" plugin:
     * https://www.npmjs.com/package/stylelint-plugin-defensive-css
     */
    'plugin/use-defensive-css': [
      true,
      {
        'accidental-hover': true,
        'background-repeat': true,
        'flex-wrapping': true,
        'scroll-chaining': true,
        'vendor-prefix-grouping': true,
      },
    ],
  },
};
