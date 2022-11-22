import KingWorld from 'kingworld'

import cors from '../src'

import { describe, expect, it } from 'bun:test'

const req = (path: string, headers?: Record<string, string>) =>
    new Request(path, {
        headers
    })

describe('Credentials', () => {
    it('Allow credential', async () => {
        const app = new KingWorld()
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
        const app = new KingWorld()
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
