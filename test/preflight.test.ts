import { Elysia } from 'elysia'
import { cors } from '../src'

import { describe, expect, it } from 'bun:test'

const req = (path: string, headers?: Record<string, string>) =>
    new Request(`http://localhost${path}`, {
        method: 'OPTIONS',
        headers
    })

describe('Preflight', () => {
    it('Enable preflight', async () => {
        const app = new Elysia()
            .use(
                cors({
                    preflight: true
                })
            )
            .get('/', () => 'HI')

        const res = await app.handle(req('/'))
        expect(res.status).toBe(204)
    })

    it('Enable preflight on sub path', async () => {
        const app = new Elysia()
            .use(
                cors({
                    preflight: true
                })
            )
            .get('/nested/deep', () => 'HI')

        const res = await app.handle(req('/'))
        expect(res.status).toBe(204)
    })

    it('Disable preflight', async () => {
        const app = new Elysia()
            .use(
                cors({
                    preflight: false
                })
            )
            .get('/', () => 'HI')

        const res = await app.handle(req('/'))
        expect(res.status).toBe(404)
    })
})
