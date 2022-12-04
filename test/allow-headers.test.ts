import { Elysia } from 'elysia'
import { cors } from '../src'

import { describe, expect, it } from 'bun:test'

const req = (path: string, headers?: Record<string, string>) =>
    new Request(path, {
        headers
    })

describe('Allowed Headers', () => {
    it('Accept single header', async () => {
        const app = new Elysia()
            .use(
                cors({
                    allowedHeaders: 'Content-Type'
                })
            )
            .get('/', () => 'HI')

        const res = await app.handle(req('/'))
        expect(res.headers.get('Access-Control-Allow-Headers')).toBe(
            'Content-Type'
        )
    })

    it('Accept array', async () => {
        const app = new Elysia()
            .use(
                cors({
                    allowedHeaders: ['Content-Type', 'X-Imaginary-Value']
                })
            )
            .get('/', () => 'HI')

        const res = await app.handle(req('/'))
        expect(res.headers.get('Access-Control-Allow-Headers')).toBe(
            'Content-Type, X-Imaginary-Value'
        )
    })
})
