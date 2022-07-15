import KingWorld from 'kingworld'

import cors from '../src'

import { describe, expect, it } from 'bun:test'

const req = (path: string, headers?: Record<string, string>) =>
    new Request(path, {
        headers
    })

describe('Methods', () => {
    it('Accept single methods', async () => {
        const app = new KingWorld()
            .use(cors, {
                methods: 'GET'
            })
            .get('/', () => 'HI')

        const res = await app.handle(req('/'))
        expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET')
    })

    it('Accept array', async () => {
        const app = new KingWorld()
            .use(cors, {
                methods: ['GET', 'POST']
            })
            .get('/', () => 'HI')

        const res = await app.handle(req('/'))
        expect(res.headers.get('Access-Control-Allow-Methods')).toBe(
            'GET, POST'
        )
    })
})
