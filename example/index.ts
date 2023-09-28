import { Elysia } from 'elysia'
import { cors } from '../src/index'

const app = new Elysia()
    .use(
        cors({
            origin: ['gehenna.sh', 'saltyaom.com']
        })
    )
    .get('/', () => 'A')
    .listen(3000)

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`)

app.fetch(
    new Request('http://localhost/awd', {
        headers: {
            origin: 'https://saltyaom.com'
        }
    })
)

export type App = typeof app
console.log('Server is running on port 3000.')
