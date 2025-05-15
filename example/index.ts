import { Elysia, t } from 'elysia'
import { cors } from '../src/index'

const app = new Elysia()
	.use(
		cors({
			origin: 'http://example.com'
		})
	)
	.post('/', ({ body }) => body)

app.handle(
	new Request('http://localhost/awd', {
		headers: {
			origin: 'https://example.com',
			a: 'b',
			c: 'd'
		}
	})
)
	.then((x) => x.headers.toJSON())
	.then(console.log)
