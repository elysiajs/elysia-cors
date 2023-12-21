import { Elysia } from 'elysia'
import { cors } from '../src/index'

const app = new Elysia()
    .use(
        cors({
            credentials: true
        })
    )
    .get('/', () => 'A')
    .listen(3000)

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`)

app.handle(
    new Request('http://localhost/awd', {
        headers: {
            origin: 'https://saltyaom.com'
        }
    })
).then(x => x.headers.toJSON()).then(console.log)

export type App = typeof app
