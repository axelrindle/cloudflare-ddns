import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'
import { createMiddleware } from 'hono/factory'
import z from 'zod'
import { HonoBindings, kvKeyIpv6 } from './constants'
import { sendMessage } from './telegram'
import { ContentfulStatusCode } from 'hono/utils/http-status'

const app = new Hono<HonoBindings>()

const authorize = createMiddleware<HonoBindings>(async (c, next) => {
    const handler = bearerAuth({ token: c.env.ACCESS_TOKEN })
    return handler(c, next)
})

app.get('/',
    authorize,
    async (c) => {
        const ipv6 = await c.env.ddns.get(kvKeyIpv6)
        if (ipv6 === null) {
            return c.notFound()
        }

        return c.text(ipv6)
    },
)

app.post('/',
    authorize,
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

        // we can only batch a single zone, so we loop through the requested zone updates
        // and hope for the best
        for (const { zoneId, token, records } of zones) {
            const patches = records.map(id => ({ id, content: ipv6 }))

            const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/batch`
            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ patches }),
            })

            if (res.status !== 200) {
                const code = res.status as ContentfulStatusCode
                return c.json({
                    ok: false,
                    status: res.status,
                    result: await res.json(),
                }, code)
            }
        }

        await c.env.ddns.put(kvKeyIpv6, ipv6)

        const tgMsg = `New public IPv6 address: ${ipv6}`
        await sendMessage(
            c.env.TELEGRAM_BOT_TOKEN,
            c.env.TELEGRAM_CHAT_ID,
            tgMsg,
        )

        return c.json({ ok: true })
    },
)

export default app
