import { Elysia } from 'elysia'
import { cors } from '../src'

import { describe, expect, it } from 'bun:test'
import { preflight, req } from './utils'

describe('Max Age', () => {
    it('Set maxage', async () => {
        const app = new Elysia().use(
            cors({
                maxAge: 5
            })
        )

        const res = await app.handle(preflight('/'))
        expect(res.headers.get('Access-Control-Max-Age')).toBe('5')
    })

    it('Skip maxage if falsey', async () => {
        const app = new Elysia().use(
            cors({
                maxAge: 0
            })
        )

        const res = await app.handle(preflight('/'))
        expect(res.headers.get('Access-Control-Max-Age')).toBe(null)
    })
})
