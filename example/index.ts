import { Elysia } from 'elysia'
import cors from '../src/index'

const app = new Elysia()
    .use(cors({
        maxAge: 5
    }))
    .get('/', () => ({
        hello: 'world'
    }))
    .post('/', () => 'Hi')
    .listen(8080)
