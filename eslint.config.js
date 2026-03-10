import { configActDefault } from '@actcoding/eslint-config'
import { defineConfig } from 'eslint/config'
import json from '@eslint/json'

export default defineConfig([
    ...configActDefault.filter(c => c.name !== 'act/defaults/import'),
    {
        name: 'app/ignores',
        ignores: [
            'src/gen/**',
        ],
    },
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
