import { Scalar } from '@scalar/hono-api-reference'
import { HtmlRenderingConfiguration } from '@scalar/types/api-reference'
import { Hono } from 'hono'
import { openAPIRouteHandler } from 'hono-openapi'
import { description, version } from '../package.json'
import { HonoBindings } from './constants'
import { onlyDevelopment } from './middleware/development.middleware'
import { appAddress } from './routes/address'
import { appUpdate } from './routes/update'

const app = new Hono<HonoBindings>()
    .route('/', appAddress)
    .route('/', appUpdate)

app.get('/api.json',
    onlyDevelopment,
    openAPIRouteHandler(app, {
        documentation: {
            info: {
                title: 'Cloudflare DDNS',
                description,
                version,
            },
            components: {
                securitySchemes: {
                    'Token': {
                        type: 'http',
                        scheme: 'Bearer',
                    },
                },
            },
        },
        defaultOptions: {
            ALL: {
                security: [
                    {
                        Token: [],
                    },
                ],
            },
        },
    }),
)

const scalarConfiguration = {
    theme: 'mars',
    hideSearch: true,
    hideClientButton: true,
    persistAuth: true,
    mcp: {
        disabled: true,
    },
    agent: {
        disabled: true,
    },
} satisfies Partial<HtmlRenderingConfiguration>

app.get('/api.html',
    onlyDevelopment,
    Scalar({
        url: '/api.json',
    }),
)

export default app

export {
    scalarConfiguration,
}

