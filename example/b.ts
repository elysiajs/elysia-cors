import { Elysia } from 'elysia'

export const plugin = <const T extends boolean>(enableMacro: T) => {
    const app = new Elysia()

    if (enableMacro)
        return new Elysia().macro(() => {
            return {
                a(b: string) {}
            }
        })

    return new Elysia()
}

new Elysia()
    .use(plugin(false))
    .get(
        '/',
        () => {},
        { a: 'a' } // should have type if enableMacro attaches macro, or if default value is used
    )
    .listen(3000)
