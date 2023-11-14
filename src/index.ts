import { Elysia, type Context } from 'elysia'

type Origin = string | RegExp | ((request: Request) => boolean | void)

export type HTTPMethod =
    | 'ACL'
    | 'BIND'
    | 'CHECKOUT'
    | 'CONNECT'
    | 'COPY'
    | 'DELETE'
    | 'GET'
    | 'HEAD'
    | 'LINK'
    | 'LOCK'
    | 'M-SEARCH'
    | 'MERGE'
    | 'MKACTIVITY'
    | 'MKCALENDAR'
    | 'MKCOL'
    | 'MOVE'
    | 'NOTIFY'
    | 'OPTIONS'
    | 'PATCH'
    | 'POST'
    | 'PROPFIND'
    | 'PROPPATCH'
    | 'PURGE'
    | 'PUT'
    | 'REBIND'
    | 'REPORT'
    | 'SEARCH'
    | 'SOURCE'
    | 'SUBSCRIBE'
    | 'TRACE'
    | 'UNBIND'
    | 'UNLINK'
    | 'UNLOCK'
    | 'UNSUBSCRIBE'

interface CORSConfig {
    /**
     * @default `true`
     *
     * Assign the **Access-Control-Allow-Origin** header.
     *
     * Value can be one of the following:
     * - `string` - String of origin which will be directly assign to `Access-Control-Allow-Origin`
     *
     * - `boolean` - If set to true, `Access-Control-Allow-Origin` will be set to `*` (accept all origin)
     *
     * - `RegExp` - Pattern to use to test with request's url, will accept origin if matched.
     *
     * - `Function` - Custom logic to validate origin acceptance or not. will accept origin if `true` is returned.
     *   - Function will accepts `Context` just like `Handler`
     *
     *   ```typescript
     *   // ? Example usage
     *   app.use(cors, {
     *      origin: ({ request, headers }) => true
     *   })
     *
     *   // Type Definition
     *   type CORSOriginFn = (context: Context) => boolean | void
     *   ```
     *
     * - `Array<string | RegExp | Function>` - Will try to find truthy value of all options above. Will accept request if one is `true`.
     */
    origin?: Origin | boolean | Origin[]
    /**
     * @default `*`
     *
     * Assign **Access-Control-Allow-Methods** header.
     *
     * Value can be one of the following:
     * Accept:
     * - `undefined | null | ''` - Ignore all methods.
     *
     * - `*` - Accept all methods.
     *
     * - `HTTPMethod` - Will be directly set to **Access-Control-Allow-Methods**.
     * - Expects either a single method or a comma-delimited string (eg: 'GET, PUT, POST')
     *
     * - `HTTPMethod[]` - Allow multiple HTTP methods.
     * - eg: ['GET', 'PUT', 'POST']
     */
    methods?: undefined | null | '' | '*' | HTTPMethod | HTTPMethod[]
    /**
     * @default `*`
     *
     * Assign **Access-Control-Allow-Headers** header.
     *
     * Allow incoming request with the specified headers.
     *
     * Value can be one of the following:
     * - `string`
     *     - Expects either a single method or a comma-delimited string (eg: 'Content-Type, Authorization').
     *
     * - `string[]` - Allow multiple HTTP methods.
     *     - eg: ['Content-Type', 'Authorization']
     */
    allowedHeaders?: string | string[]
    /**
     * @default `*`
     *
     * Assign **Access-Control-Exposed-Headers** header.
     *
     * Return the specified headers to request in CORS mode.
     *
     * Value can be one of the following:
     * - `string`
     *     - Expects either a single method or a comma-delimited string (eg: 'Content-Type, 'X-Powered-By').
     *
     * - `string[]` - Allow multiple HTTP methods.
     *     - eg: ['Content-Type', 'X-Powered-By']
     */
    exposedHeaders?: string | string[]
    /**
     * @default `false`
     *
     * Assign **Access-Control-Allow-Credentials** header.
     *
     * Allow incoming requests to send `credentials` header.
     *
     * - `boolean` - Available if set to `true`.
     */
    credentials?: boolean
    /**
     * @default `5`
     *
     * Assign **Access-Control-Max-Age** header.
     *
     * Allow incoming requests to send `credentials` header.
     *
     * - `number` - Duration in seconds to indicates how long the results of a preflight request can be cached.
     */
    maxAge?: number
    /**
     * @default `true`
     *
     * Add `[OPTIONS] /*` handler to handle preflight request which response with `HTTP 204` and CORS hints.
     *
     * - `boolean` - Available if set to `true`.
     */
    preflight?: boolean
}

export const cors = (
    config: CORSConfig = {
        origin: true,
        methods: '*',
        allowedHeaders: '*',
        exposedHeaders: '*',
        credentials: false,
        maxAge: 5,
        preflight: true
    }
) => {
    const {
        origin = true,
        methods = '*',
        allowedHeaders = '*',
        exposedHeaders = '*',
        credentials = false,
        maxAge = 5,
        preflight = true
    } = config

    const app = new Elysia({
        name: '@elysiajs/cors',
        seed: config
    })

    const origins =
        typeof origin === 'boolean'
            ? undefined
            : Array.isArray(origin)
            ? origin
            : [origin]

    const processOrigin = (origin: Origin, request: Request, from: string) => {
        switch (typeof origin) {
            case 'string':
                // eslint-disable-next-line no-case-declarations
                const protocolStart = from.indexOf('://')

                // Malform URL, invalid protocol
                if (protocolStart === -1) return false

                return origin === from.slice(protocolStart + 3)

            case 'function':
                return origin(request)

            case 'object':
                return origin.test(from)
        }
    }

    const handleOrigin = (set: Context['set'], request: Request) => {
        // origin === `true` means any origin
        if (origin === true) {
            set.headers['Vary'] = '*'
            set.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin') || '*'

            return
        }

        if (!origins?.length) return

        const headers: string[] = []

        if (origins.length) {
            const from = request.headers.get('Origin') ?? ''
            for (let i = 0; i < origins.length; i++) {
                const value = processOrigin(origins[i]!, request, from)
                if (value === true) {
                    set.headers['Vary'] = origin ? 'Origin' : '*'
                    set.headers['Access-Control-Allow-Origin'] =
                        request.headers.get('Origin') || '*'

                    return
                }

                // value can be string (truthy value) but not `true`
                if (value) headers.push(value)
            }
        }

        set.headers['Vary'] = 'Origin'
        set.headers['Access-Control-Allow-Origin'] = headers.join(', ')
    }

    const handleMethod = (set: Context['set']) => {
        if (!methods?.length) return

        if (methods === '*')
            return (set.headers['Access-Control-Allow-Methods'] = '*')

        if (!Array.isArray(methods))
            return (set.headers['Access-Control-Allow-Methods'] = methods)

        set.headers['Access-Control-Allow-Methods'] = methods.join(', ')
    }

    if (preflight)
        app.options('/', ({ set, request }) => {
            handleOrigin(set as any, request)
            handleMethod(set)

            if (exposedHeaders.length)
                set.headers['Access-Control-Allow-Headers'] =
                    typeof allowedHeaders === 'string'
                        ? allowedHeaders
                        : allowedHeaders.join(', ')

            if (maxAge)
                set.headers['Access-Control-Max-Age'] = maxAge.toString()

            return new Response('', {
                status: 204
            })
        }).options('/*', ({ set, request }) => {
            handleOrigin(set as any, request)
            handleMethod(set)

            if (exposedHeaders.length)
                set.headers['Access-Control-Allow-Headers'] =
                    typeof allowedHeaders === 'string'
                        ? allowedHeaders
                        : allowedHeaders.join(', ')

            if (maxAge)
                set.headers['Access-Control-Max-Age'] = maxAge.toString()

            return new Response('', {
                status: 204
            })
        })

    return app.onRequest(({ set, request }) => {
        handleOrigin(set, request)
        handleMethod(set)

        if (allowedHeaders.length)
            set.headers['Access-Control-Allow-Headers'] =
                typeof allowedHeaders === 'string'
                    ? allowedHeaders
                    : allowedHeaders.join(', ')

        if (exposedHeaders.length)
            set.headers['Access-Control-Exposed-Headers'] =
                typeof exposedHeaders === 'string'
                    ? exposedHeaders
                    : exposedHeaders.join(', ')

        if (credentials)
            set.headers['Access-Control-Allow-Credentials'] = 'true'
    })
}

export default cors
