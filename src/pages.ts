import { mkdir } from 'node:fs/promises'
import app from '.'
import { writeFile } from 'node:fs/promises'

const server = Bun.serve({
    fetch(req) {
        return app.fetch(req, {
            NODE_ENV: 'development',
        })
    },
    port: 1337,
})

const html = await server.fetch('/api.html')
const openapi = await server.fetch('/api.json')

await mkdir('.pages', { recursive: true })
await writeFile('.pages/index.html', await html.text())
await writeFile('.pages/api.json', await openapi.text())

await server.stop()
