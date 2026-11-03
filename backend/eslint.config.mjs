// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Librerías de framework o infraestructura que las capas internas NO pueden importar.
const FRAMEWORK = [
  '@nestjs/*',
  '@prisma/*',
  'prisma',
  'express',
  'class-validator',
  'class-transformer',
  'typeorm',
  'pg',
];
const msgDominio =
  'Regla de dependencia: el dominio es TypeScript puro y no conoce frameworks, el ORM ni capas externas.';
const msgAplicacion =
  'Regla de dependencia: la aplicación solo depende del dominio (no de NestJS, Prisma, infraestructura ni presentación).';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'coverage/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },

  // ---------- Clean Architecture: las dependencias apuntan hacia el dominio ----------
  {
    files: ['src/**/domain/**/*.ts'],
    ignores: ['src/**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: FRAMEWORK, message: msgDominio },
            {
              group: [
                '**/application/**',
                '**/infrastructure/**',
                '**/presentation/**',
              ],
              message: msgDominio,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/application/**/*.ts'],
    ignores: ['src/**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: FRAMEWORK, message: msgAplicacion },
            {
              group: ['**/infrastructure/**', '**/presentation/**'],
              message: msgAplicacion,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/presentation/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@prisma/*', 'prisma', '**/infrastructure/**'],
              message:
                'La presentación solo invoca casos de uso: no usa el ORM ni la infraestructura directamente.',
            },
          ],
        },
      ],
    },
  },
);
