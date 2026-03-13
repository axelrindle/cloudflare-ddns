import { mkdir } from 'node:fs/promises'
import app, { scalarConfiguration } from '.'
import { writeFile } from 'node:fs/promises'
import { HtmlRenderingConfiguration } from '@scalar/types/api-reference'

const server = Bun.serve({
    fetch(req) {
        return app.fetch(req, {
            NODE_ENV: 'development',
        })
    },
    port: 1337,
})

const openapi = await server.fetch('/api.json')

const config = {
    ...scalarConfiguration,
    url: `/${process.env.PAGES_BASE_PATH}/api.json`,
    servers: [
        {
            url: '{baseUrl}',
            variables: {
                baseUrl: {},
            },
        },
    ],
} satisfies Partial<HtmlRenderingConfiguration>

const html = `
<!doctype html>
<html>
  <head>
    <title>Scalar API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="app"></div>
    <!-- Load the Script -->
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>

    <!-- Initialize the Scalar API Reference -->
    <script type="text/javascript">
      Scalar.createApiReference('#app', ${JSON.stringify(config)})
    </script>
  </body>
</html>
`

await mkdir('.pages', { recursive: true })
await writeFile('.pages/index.html', html)
await writeFile('.pages/api.json', await openapi.text())

await server.stop()
