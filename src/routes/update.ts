import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { describeRoute, resolver } from 'hono-openapi'
import z from 'zod'
import { HonoBindings, kvKeyIpv6 } from '../constants'
import { authorize } from '../middleware/authorize.middleware'
import { sendMessage } from '../telegram'

const bodySchema = z.strictObject({
    ipv6: z.ipv6(),
    zones: z.array(z.strictObject({
        token: z.string().nonempty(),
        zoneId: z.string().nonempty(),
        records: z.array(z.string().nonempty()),
    })),
})

const description = `
Allows mass updating multiple DNS records across multiple zones on Cloudflare.
`

const app = new Hono<HonoBindings>()
    .post('/update',
        describeRoute({
            summary: 'Mass update DNS records',
            description,
            security: [
                {
                    Token: [],
                },
            ],
            responses: {
                200: {
                    description: 'Mass update succeeded',
                    content: {
                        'application/json': {
                            schema: resolver(z.strictObject({
                                success: z.literal(true),
                            })),
                        },
                    },
                },
                400: {
                    description: `
Cloudflare failed to update one or more records.

For more information view the [Cloudflare API documentation](https://developers.cloudflare.com/api/resources/dns/subresources/records/methods/batch/)
`,
                    content: {
                        'application/json': {
                            schema: resolver(z.strictObject({
                                success: z.literal(false),
                                status: z.number(),
                                meta: z.object().describe('The response from Cloudflare'),
                            })),
                        },
                    },
                },
                500: {
                    description: 'Something else went wrong',
                },
            },
        }),
        authorize,
        zValidator('json', bodySchema),
        async (c) => {
            const { ipv6, zones } = c.req.valid('json')

            // we can only batch a single zone, so we loop through the requested zone updates
            // and hope for the best
            for (const { zoneId, token, records } of zones) {
                const patches = records.map(id => ({ id, content: ipv6 }))

                const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/batch`
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ patches }),
                })

                if (res.status !== 200) {
                    return c.json({
                        success: false,
                        status: res.status,
                        meta: await res.json(),
                    }, 400)
                }
            }

            await c.env.ddns.put(kvKeyIpv6, ipv6)

            const tgMsg = `New public IPv6 address: ${ipv6}`
            await sendMessage(
                c.env.TELEGRAM_BOT_TOKEN,
                c.env.TELEGRAM_CHAT_ID,
                tgMsg,
            )

            return c.json({ success: true })
        },
    )

export {
    app as appUpdate,
}

