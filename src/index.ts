import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import z from 'zod'

const app = new Hono()

app.post('/',
    zValidator('json', z.strictObject({
        ipv6: z.ipv6(),
        zones: z.array(z.strictObject({
            token: z.string().nonempty(),
            zoneId: z.string().nonempty(),
            records: z.array(z.string().nonempty()),
        })),
    })),
    async (c) => {
        const { ipv6, zones } = c.req.valid('json')

        for (const { zoneId, token, records } of zones) {
            for (const record of records) {
                const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${record}`
                const res = await fetch(url, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content: ipv6 }),
                })

                if (res.status !== 200) {
                    return c.json({
                        ok: false,
                        status: res.status,
                        result: await res.json(),
                        meta: {
                            zoneId,
                            record,
                        },
                    })
                }
            }
        }

        return c.json({ ok: true })
    },
)

export default app
