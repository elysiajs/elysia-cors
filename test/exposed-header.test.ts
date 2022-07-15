import KingWorld from 'kingworld'

import cors from '../src'

import { describe, expect, it } from 'bun:test'

const req = (path: string, headers?: Record<string, string>) =>
    new Request(path, {
        headers
    })

describe('Exposed Headers', () => {
    it('Expose single header', async () => {
        const app = new KingWorld()
            .use(cors, {
                exposedHeaders: 'Content-Type'
            })
            .get('/', () => 'HI')

        const res = await app.handle(req('/'))
        expect(res.headers.get('Access-Control-Exposed-Headers')).toBe('Content-Type')
    })

    it('Expose array', async () => {
        const app = new KingWorld()
            .use(cors, {
                exposedHeaders: ['Content-Type', 'X-Imaginary-Value']
            })
            .get('/', () => 'HI')

        const res = await app.handle(req('/'))
        expect(res.headers.get('Access-Control-Exposed-Headers')).toBe(
            'Content-Type, X-Imaginary-Value'
        )
    })
})
