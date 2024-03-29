import { Elysia } from 'elysia'
import { cors } from '../src'

import { describe, expect, it } from 'bun:test'
import { req } from './utils'

describe('Credentials', () => {
    it('Allow credential', async () => {
        const app = new Elysia()
            .use(
                cors({
                    credentials: true
                })
            )
            .get('/', () => 'HI')

        const res = await app.handle(req('/'))
        expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true')
    })

    it('Disallow credential', async () => {
        const app = new Elysia()
            .use(
                cors({
                    credentials: false
                })
            )
            .get('/', () => 'HI')

        const res = await app.handle(req('/'))
        expect(res.headers.get('Access-Control-Allow-Credentials')).toBe(null)
    })
})
