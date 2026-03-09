import { configActDefault } from '@actcoding/eslint-config'
import { defineConfig } from 'eslint/config'
import json from '@eslint/json'

export default defineConfig([
    ...configActDefault,
    {
        name: 'app/json',
        plugins: {
            json,
        },
        language: 'json/json5',
        files: ['**/*.json'],
        extends: ['json/recommended'],
    },
])
