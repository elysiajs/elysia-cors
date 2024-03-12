/* eslint-disable no-case-declarations */
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
     * Disable AOT (Ahead of Time) compilation for plugin instance
     *
     * @default true
     */
    aot?: boolean
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
    methods?: boolean | undefined | null | '' | '*' | HTTPMethod | HTTPMethod[]
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
     * @default `true`
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

const processOrigin = (
    origin: Origin,
    request: Request,
    from: string
): boolean => {
    if (Array.isArray(origin))
        return origin.some((o) => processOrigin(o, request, from))

    switch (typeof origin) {
        case 'string':
            const protocolStart = from.indexOf('://')
            if (protocolStart !== -1) from = from.slice(protocolStart + 3)

            const trailingSlash = from.indexOf('/', 0)
            if (trailingSlash !== -1) from = from.slice(trailingSlash)

            return origin === from

        case 'function':
            return origin(request) === true

        case 'object':
            if (origin instanceof RegExp) return origin.test(from)
    }

    return false
}

export const cors = (
    config?: CORSConfig
) => {
    let {
        aot = true,
        origin = '*',
        methods = '*',
        allowedHeaders = '*',
        exposedHeaders = '*',
        credentials = true,
        maxAge = 5,
        preflight = true
    } = config ?? {}

    if (Array.isArray(allowedHeaders))
        allowedHeaders = allowedHeaders.join(', ')

    if (Array.isArray(exposedHeaders))
        exposedHeaders = exposedHeaders.join(', ')

    const origins =
        typeof origin === 'boolean'
            ? undefined
            : Array.isArray(origin)
            ? origin
            : [origin]

    const app = new Elysia({
        name: '@elysiajs/cors',
        seed: config,
        aot
    })

    const anyOrigin = origins?.some((o) => o === '*')

    const handleOrigin = (set: Context['set'], request: Request) => {
        // origin === `true` means any origin
        if (origin === true) {
            set.headers['Vary'] = '*'
            set.headers['Access-Control-Allow-Origin'] =
                request.headers.get('Origin') || '*'

            return
        }

        if (anyOrigin) {
            set.headers['Vary'] = '*'
            set.headers['Access-Control-Allow-Origin'] = '*'

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
                    set.headers['Access-Control-Allow-Origin'] = from || '*'

                    return
                }

                // value can be string (truthy value) but not `true`
                if (value) headers.push(value)
            }
        }

        set.headers['Vary'] = 'Origin'
        set.headers['Access-Control-Allow-Origin'] = headers.join(', ')
    }

    const handleMethod = (set: Context['set'], method: string) => {
        if (methods === true)
            return (set.headers['Access-Control-Allow-Methods'] = method ?? '*')

        if (methods === false || !methods?.length) return

        if (methods === '*')
            return (set.headers['Access-Control-Allow-Methods'] = '*')

        if (!Array.isArray(methods))
            return (set.headers['Access-Control-Allow-Methods'] = methods)

        set.headers['Access-Control-Allow-Methods'] = methods.join(', ')
    }

    if (preflight)
        app.options('/', ({ set, request }) => {
            handleOrigin(set as any, request)
            handleMethod(set, request.method)

            if (allowedHeaders.length)
                set.headers['Access-Control-Allow-Headers'] =
                    allowedHeaders as string

            if (exposedHeaders.length)
                set.headers['Access-Control-Expose-Headers'] =
                    exposedHeaders as string

            if (maxAge)
                set.headers['Access-Control-Max-Age'] = maxAge.toString()

            return new Response(null, {
                status: 204
            })
        }).options('/*', ({ set, request }) => {
            handleOrigin(set as any, request)
            handleMethod(set, request.method)

            if (allowedHeaders.length)
                set.headers['Access-Control-Allow-Headers'] =
                    allowedHeaders as string

            if (exposedHeaders.length)
                set.headers['Access-Control-Expose-Headers'] =
                    exposedHeaders as string

            if (maxAge)
                set.headers['Access-Control-Max-Age'] = maxAge.toString()

            return new Response(null, {
                status: 204
            })
        })

    const defaultHeaders: Record<string, string> = {
        'Access-Control-Allow-Headers': allowedHeaders,
        'Access-Control-Exposed-Headers': exposedHeaders
    }

    if (credentials === true)
        defaultHeaders['Access-Control-Allow-Credentials'] = 'true'

    return app.headers(defaultHeaders).onRequest(({ set, request }) => {
        handleOrigin(set, request)
        handleMethod(set, request.method)

        if (allowedHeaders.length)
            set.headers['Access-Control-Allow-Headers'] =
                allowedHeaders as string

        if (exposedHeaders.length)
            set.headers['Access-Control-Expose-Headers'] =
                exposedHeaders as string
    })
}

export default cors
