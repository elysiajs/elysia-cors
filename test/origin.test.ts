import KingWorld from 'kingworld'

import cors from '../src'

import { describe, expect, it } from 'bun:test'

const req = (path: string, headers?: Record<string, string>) =>
    new Request(path, {
        headers
    })

describe('Origin', () => {
    it('Accept string', async () => {
        const app = new KingWorld()
            .use(cors, {
                origin: 'https://api.hifumin.app'
            })
            .get('/', () => 'HI')

        const res = await app.handle(req('/'))
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
            'https://api.hifumin.app'
        )
    })

    it('Accept boolean', async () => {
        const app = new KingWorld()
            .use(cors, {
                origin: 'https://example.com'
            })
            .get('/', () => 'HI')

        const res = await app.handle(req('/'))
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
            'https://example.com'
        )
    })

    it('Accept RegExp', async () => {
        const app = new KingWorld()
            .use(cors, {
                origin: /\.com/g
            })
            .get('/', () => 'HI')

        const notAllowed = await app.handle(
            req('/', {
                Origin: 'https://example.org'
            })
        )
        const allowed = await app.handle(
            req('/', {
                Origin: 'https://example.com'
            })
        )
        expect(notAllowed.headers.get('Access-Control-Allow-Origin')).toBe('')
        expect(allowed.headers.get('Access-Control-Allow-Origin')).toBe(
            'https://example.com'
        )
    })

    it('Accept Function', async () => {
        const app = new KingWorld()
            .use(cors, {
                origin: () => true
            })
            .get('/', () => 'HI')

        const res = await app.handle(
            req('/', {
                Origin: 'https://example.com'
            })
        )
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
            'https://example.com'
        )
    })

    it('Accept string[]', async () => {
        const app = new KingWorld()
            .use(cors, {
                origin: ['https://example.com', 'https://demo.app']
            })
            .get('/', () => 'HI')

        const res = await app.handle(
            req('/', {
                Origin: 'https://example.com'
            })
        )
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
            'https://example.com, https://demo.app'
        )
    })

    it('accepts Function[]', async () => {
        const app = new KingWorld()
            .use(cors, {
                origin: [
                    'https://demo.app',
                    () => false,
                    /.com/g
                ]
            })
            .get('/', () => 'HI')

        const res = await app.handle(
            req('/', {
                Origin: 'https://example.com'
            })
        )
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
            'https://example.com'
        )
    })
})
