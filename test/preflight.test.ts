import KingWorld from 'kingworld'

import cors from '../src'

import { describe, expect, it } from 'bun:test'

const req = (path: string, headers?: Record<string, string>) =>
    new Request(path, {
        method: 'OPTIONS',
        headers
    })

describe('Preflight', () => {
    it('Enable preflight', async () => {
        const app = new KingWorld()
            .use(cors, {
                preflight: true
            })
            .get('/', () => 'HI')

        const res = await app.handle(req('/'))
        expect(res.status).toBe(204)
    })

    it('Accept array', async () => {
        const app = new KingWorld()
            .use(cors, {
                preflight: false
            })
            .get('/', () => 'HI')

        const res = await app.handle(req('/'))
        expect(res.status).toBe(404)
    })
})
