import { Hono } from 'hono'
import { describeRoute, resolver } from 'hono-openapi'
import z from 'zod'
import { HonoBindings, kvKeyIpv6 } from '../constants'
import { authorize } from '../middleware/authorize.middleware'

const description = `
Retrieves the currently active IPv6 address.

For this to work the update endpoint must have been called at least once.
`

const app = new Hono<HonoBindings>()
    .get('/',
        describeRoute({
            summary: 'Get current IPv6 address',
            description,
            responses: {
                200: {
                    description: 'IPv6 address',
                    content: {
                        'text/plain': {
                            schema: resolver(z.ipv6()),
                        },
                    },
                },
                404: {
                    description: 'The update endpoint has never been called yet.',
                },
            },
        }),
        authorize,
        async (c) => {
            const ipv6 = await c.env.ddns.get(kvKeyIpv6)
            if (ipv6 === null) {
                return c.notFound()
            }

            return c.text(ipv6)
        },
    )

export {
    app as appAddress,
}
