import { Elysia, t } from 'elysia'
import { cors } from '../src/index'

const app = new Elysia()
    .use(
        cors({
            origin: 'http://localhost:3001',
            credentials: true
        })
    )
    .put('/', () => 'ok')
    .listen(3000)

new Elysia()
	.get('/', () => 'hi')
	.listen(3001)

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
