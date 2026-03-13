import { bearerAuth } from 'hono/bearer-auth'
import { createMiddleware } from 'hono/factory'
import { HonoBindings } from '../constants'

export const authorize = createMiddleware<HonoBindings>(async (c, next) => {
    const handler = bearerAuth({ token: c.env.ACCESS_TOKEN })
    return handler(c, next)
})
