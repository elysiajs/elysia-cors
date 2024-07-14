import { Elysia, t } from 'elysia'
import { cors } from '../src/index'

new Elysia()
	.use(cors())
	.post('/', ({ body }) => body)
	.listen(3000)

new Elysia().get('/', () => 'hi').listen(3001)

// app.handle(
//     new Request('http://localhost/awd', {
//         headers: {
//             origin: 'https://saltyaom.com'
//         }
//     })
// )
//     .then((x) => x.headers.toJSON())
//     .then(console.log)

// export type App = typeof app
