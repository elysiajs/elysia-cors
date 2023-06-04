import { Elysia } from 'elysia'
import { cors } from '../src/index'

const app = new Elysia()
    .use(cors())
    .get('/', () => ({ same: 'a' }))
    .listen(3000)

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`)

export type App = typeof app
console.log('Server is running on port 3000.')
