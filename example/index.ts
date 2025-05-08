import { Elysia, t } from 'elysia'
import { cors } from '../src/index'

const app = new Elysia()
	.use(
		cors({
			origin: 'example.com'
		})
	)
	.post('/', ({ body }) => body)

app.handle(
	new Request('http://localhost/awd', {
		headers: {
			origin: 'http://notexample.com'
		}
	})
)
	.then((x) => x.headers.toJSON())
	.then(console.log)
