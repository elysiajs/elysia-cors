import { Elysia } from 'elysia'
import cors from '../src/index'

const app = new Elysia()
    .use(
        cors({
            origin: /\*.saltyaom.com$/
        })
    )
    .get('/', () => 'Hi')
    .listen(8080)
