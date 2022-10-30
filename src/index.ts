import type KingWorld from 'kingworld'
import type { Handler } from 'kingworld'
import type Context from 'kingworld/src/context'

import { isAbsolute } from 'path'

type Origin = string | RegExp | ((context: Context) => boolean | void)

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

const cors = (
    app: KingWorld,
    {
        origin = true,
        methods = '*',
        allowedHeaders = '*',
        exposedHeaders = '*',
        credentials = false,
        maxAge = 5,
        preflight = true
    }: CORSConfig = {
        origin: true,
        methods: '*',
        allowedHeaders: '*',
        exposedHeaders: '*',
        credentials: false,
        maxAge: 5,
        preflight: true
    }
) => {
    const _origin =
        typeof origin === 'boolean'
            ? undefined
            : Array.isArray(origin)
            ? origin
            : [origin]

    const processOrigin = (
        origin: Origin,
        context: Context,
        request: string
    ) => {
        switch (typeof origin) {
            case 'string':
                return origin

            case 'function':
                return origin(context)

            case 'object':
                if (origin.test(request)) return true
        }
    }

    const handleOrigin = (context: Context) => {
        const { responseHeaders } = context

        if (!_origin)
            if (origin) {
                context.responseHeaders['Vary'] = '*'
                return (responseHeaders['Access-Control-Allow-Origin'] = '*')
            } else return

        if (!_origin[0]) return

        const headers: string[] = []

        for (const header of _origin) {
            const origin = context.request.headers.get('Origin')
            const value = processOrigin(header, context, origin ?? '')
            if (value === true) {
                context.responseHeaders['Vary'] = origin ? 'Origin' : '*'

                return (responseHeaders['Access-Control-Allow-Origin'] =
                    context.request.headers.get('Origin') ?? '*')
            }

            if (value) headers.push(value)
        }

        context.responseHeaders['Vary'] = 'Origin'
        responseHeaders['Access-Control-Allow-Origin'] = headers.join(', ')
    }

    const handleMethod = (context: Context) => {
        if (!methods || !methods[0]) return

        const { responseHeaders } = context

        if (methods === '*')
            return (responseHeaders['Access-Control-Allow-Methods'] = '*')

        if (!Array.isArray(methods))
            return (responseHeaders['Access-Control-Allow-Methods'] = methods)

        responseHeaders['Access-Control-Allow-Methods'] = methods.join(', ')
    }

    if (preflight)
        app.options('/*', (context) => {
            handleOrigin(context)
            handleMethod(context)

            if (exposedHeaders[0])
                context.responseHeaders['Access-Control-Allow-Headers'] =
                    typeof allowedHeaders === 'string'
                        ? allowedHeaders
                        : allowedHeaders.join(', ')

            if (maxAge)
                context.responseHeaders['Access-Control-Max-Age'] =
                    maxAge.toString()

            return new Response('', {
                status: 204
            })
        })

    app.transform((context) => {
        handleOrigin(context)
        handleMethod(context)

        const { responseHeaders } = context

        if (allowedHeaders[0])
            responseHeaders['Access-Control-Allow-Headers'] =
                typeof allowedHeaders === 'string'
                    ? allowedHeaders
                    : allowedHeaders.join(', ')

        if (exposedHeaders[0])
            responseHeaders['Access-Control-Exposed-Headers'] =
                typeof exposedHeaders === 'string'
                    ? exposedHeaders
                    : exposedHeaders.join(', ')

        if (credentials)
            responseHeaders['Access-Control-Allow-Credentials'] = 'true'
    })

    return app
}

export default cors
