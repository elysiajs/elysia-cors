import { Elysia } from 'elysia'
import { cors } from '../src'

import { describe, expect, it } from 'bun:test'
import { preflight, req } from './utils'

describe('Preflight', () => {
	it('Enable preflight', async () => {
		const app = new Elysia()
			.use(
				cors({
					preflight: true
				})
			)
			.get('/', () => 'HI')

		const res = await app.handle(preflight('/'))
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

		const res = await app.handle(preflight('/'))
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

		const res = await app.handle(preflight('/'))
		expect(res.status).toBe(404)
	})

	it('Preflight works with .all() handler on specific path', async () => {
		const app = new Elysia().use(cors()).all('/', () => 'HI')

		const res = await app.handle(preflight('/'))
		expect(res.status).toBe(204)
		expect(res.headers.get('Access-Control-Allow-Origin')).toBeTruthy()
	})

	it('Non-OPTIONS requests to .all() handler still work', async () => {
		const app = new Elysia().use(cors()).all('/', () => 'HI')

		const res = await app.handle(req('/'))
		expect(res.status).toBe(200)
		expect(await res.text()).toBe('HI')
		expect(res.headers.get('Access-Control-Allow-Origin')).toBeTruthy()
	})
})
