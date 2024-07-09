import { Elysia } from 'elysia'
import { cors } from '../src'

import { describe, expect, it } from 'bun:test'
import { req } from './utils'

describe('Methods', () => {
	it('Accept single methods', async () => {
		const app = new Elysia()
			.use(
				cors({
					methods: 'GET'
				})
			)
			.get('/', () => 'HI')

		const res = await app.handle(req('/'))
		expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET')
	})

	it('Accept array', async () => {
		const app = new Elysia()
			.use(
				cors({
					methods: ['GET', 'POST']
				})
			)
			.get('/', () => 'HI')

		const res = await app.handle(req('/'))
		expect(res.headers.get('Access-Control-Allow-Methods')).toBe(
			'GET, POST'
		)
	})

	it('Accept *', async () => {
		const app = new Elysia()
			.use(
				cors({
					methods: '*'
				})
			)
			.get('/', () => 'HI')

		const res = await app.handle(req('/'))
		expect(res.headers.get('Access-Control-Allow-Methods')).toBe('*')
	})

	it('Mirror request method if set to true', async () => {
		const app = new Elysia()
			.use(
				cors({
					methods: true
				})
			)
			.get('/', () => 'HI')
			.post('/', () => 'HI')

		const get = await app.handle(req('/'))
		expect(get.headers.get('Access-Control-Allow-Methods')).toBe('GET')

		const post = await app.handle(
			new Request('http://localhost/', {
				method: 'POST',
				credentials: 'include'
			})
		)
		expect(post.headers.get('Access-Control-Allow-Methods')).toBe('POST')
	})

	it('Handle mirror method on preflight options', async () => {
		const app = new Elysia()
			.use(
				cors({
					methods: true
				})
			)
			.get('/', () => 'HI')
			.put('/', () => 'HI')

		const get = await app.handle(
			new Request('http://localhost/', {
				method: 'OPTIONS',
				credentials: 'include',
				headers: {
					origin: 'http://localhost/',
					'access-control-request-method': 'PUT'
				}
			})
		)
		expect(get.headers.get('Access-Control-Allow-Methods')).toBe('PUT')
	})
})
