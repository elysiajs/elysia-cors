import { Elysia, t } from 'elysia'
import { cors } from '../src/index'

const app = new Elysia({
    forceErrorEncapsulation: true,
    precompile: true
})
    .use(
        cors({
            origin: 'http://saltyaom.com',
            credentials: true
        })
    )
    .get('/', () => 'A')
    .onError(({ error, code }) => {
        if(code === "NOT_FOUND") return "A"

        console.log(error)
    })
    .post('/', ({ body, cookie: { session } }) => {
        session!.value = 'hi'

        return body
    }, {
        type: "multipart/form-data",
        body: t.Object({
            a: t.File({
                type: "image"
            })
        }),
        async parse({}, contentType) {
            console.log(contentType)
        }
    })
    .compile()
    .listen(3000)

// console.log(app.routes[1]?.composed.toString())

// console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`)

app.handle(
    new Request('http://localhost/awd', {
        headers: {
            origin: 'https://saltyaom.com'
        }
    })
)
    .then((x) => x.headers.toJSON())
    .then(console.log)

export type App = typeof app
