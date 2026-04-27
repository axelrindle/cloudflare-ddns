#!/usr/bin/env bun

import { findWranglerConfig } from '@cloudflare/workers-utils'
import dotenv from 'dotenv'
import { exec } from 'node:child_process'
import { open } from 'node:fs/promises'
import { basename } from 'node:path'
import chalk from 'chalk'
import { log } from 'node:console'

dotenv.config({
    path: 'wrangler.env',
    quiet: true,
})

const { configPath } = findWranglerConfig()
if (configPath === undefined) {
    throw new Error('failed to find valid wrangler config file')
}

const sourceFile = basename(configPath)
const targetFile = `_gen_${sourceFile}`

const sourceHandle = await open(sourceFile, 'r')
const targetHandle = await open(targetFile, 'w+')

async function match(line: string): Promise<boolean> {
    const match = /\${([A-Za-z0-9_]+)}/g.exec(line)
    if (match === null) {
        return false
    }

    const [replace, key] = match
    const value = Bun.env[key]
    if (!value) {
        return false
    }

    await targetHandle.write(`${line.replace(replace, value)}\n`)

    return true
}

for await (const line of sourceHandle.readLines()) {
    const matched = await match(line)
    if (!matched) {
        await targetHandle.write(`${line}\n`)
    }
}

await sourceHandle.close()
await targetHandle.close()

const cmdline = `bunx wrangler --config ${targetFile} --cwd ${import.meta.dir} ${process.argv.slice(2).join(' ')}`

log(`${chalk.magenta.dim('$')} ${chalk.bold.dim(cmdline)}`)

const proc = exec(cmdline)

proc.stdout?.pipe(process.stdout)
proc.stderr?.pipe(process.stderr)
