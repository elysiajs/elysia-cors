import { Elysia } from 'elysia'
import { cors } from '../src'

import { describe, expect, it } from 'bun:test'
import { req } from './utils'

describe('Exposed Headers', () => {
    it('Expose single header', async () => {
        const app = new Elysia()
            .use(
                cors({
                    exposedHeaders: 'Content-Type'
                })
            )
            .get('/', () => 'HI')

        const res = await app.handle(req('/'))
        expect(res.headers.get('Access-Control-Expose-Headers')).toBe(
            'Content-Type'
        )
    })

    it('Expose array', async () => {
        const app = new Elysia()
            .use(
                cors({
                    exposedHeaders: ['Content-Type', 'X-Imaginary-Value']
                })
            )
            .get('/', () => 'HI')

        const res = await app.handle(req('/'))
        expect(res.headers.get('Access-Control-Expose-Headers')).toBe(
            'Content-Type, X-Imaginary-Value'
        )
    })
})
