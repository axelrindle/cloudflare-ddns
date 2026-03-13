import { createMiddleware } from 'hono/factory'
import { HonoBindings } from '../constants'

export const onlyDevelopment = createMiddleware<HonoBindings>(async (c, next) => {
    if (c.env.NODE_ENV !== 'development') {
        return c.notFound()
    }

    return next()
})
