/** @type {import('prettier').Config} */
module.exports = {
  endOfLine: 'lf',
  semi: true,
  useTabs: false,
  singleQuote: true,
  arrowParens: 'always',
  tabWidth: 2,
  trailingComma: 'es5',
  importOrder: [
    '^(react/(.*)$)|^(react$)',
    '^(next/(.*)$)|^(next$)',
    '<THIRD_PARTY_MODULES>',
    '',
    '^@/lib/(.*)$',
    '^@/hooks/(.*)$',
    '^@/components/ui/(.*)$',
    '^@/components/(.*)$',
    '',
    '^@/registry/(.*)$',
    '^@/app/(.*)$',
    '',
    '^[./]',
    '',
    '^types$',
    '^@/types/(.*)$',
    '^@/config/(.*)$',
    '',
    '^@/constants/(.*)$',
    '',
    '^@/styles/(.*)$',
    '^(?!.*[.]css$)[./].*$',
    '.css$',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderBuiltinModulesToTop: true,
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderMergeDuplicateImports: true,
  importOrderCombineTypeAndValueImports: true,
  importOrderTypeScriptVersion: '5.0.0',
  plugins: [
    'prettier-plugin-packagejson',
    '@ianvs/prettier-plugin-sort-imports',
    'prettier-plugin-tailwindcss',
  ],
};