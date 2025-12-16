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

type MaybeArray<T> = T | T[]

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
	methods?:
		| boolean
		| undefined
		| null
		| ''
		| '*'
		| MaybeArray<HTTPMethod | (string & {})>
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
	allowedHeaders?: true | string | string[]
	/**
	 * @default `*`
	 *
	 * Assign **Access-Control-Expose-Headers** header.
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
	exposeHeaders?: true | string | string[]
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

// @ts-ignore
const isBun = typeof new Headers()?.toJSON === 'function'

/**
 * This function is use when headers config is true.
 * Attempts to process headers based on request headers.
 */
const processHeaders = (headers: Headers) => {
	if (isBun) return Object.keys(headers.toJSON()).join(', ')

	let keys = ''

	let i = 0
	headers.forEach((_, key) => {
		if (i) keys = keys + ', ' + key
		else keys = key

		i++
	})

	return keys
}

export const cors = (config?: CORSConfig) => {
	let {
		aot = true,
		origin = true,
		methods = true,
		allowedHeaders = true,
		exposeHeaders = true,
		credentials = true,
		maxAge = 5,
		preflight = true
	} = config ?? {}

	if (Array.isArray(allowedHeaders))
		allowedHeaders = allowedHeaders.join(', ')

	if (Array.isArray(exposeHeaders)) exposeHeaders = exposeHeaders.join(', ')

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

	const originMap = <Record<string, true>>{}
	if (origins)
		for (const origin of origins)
			if (typeof origin === 'string') originMap[origin] = true

	const processOrigin = (
		origin: Origin,
		request: Request,
		from: string
	): boolean => {
		if (Array.isArray(origin))
			return origin.some((o) => processOrigin(o, request, from))

		switch (typeof origin) {
			case 'string':
				if (from in originMap) return true

				const fromProtocol = from.indexOf('://')
				if (fromProtocol !== -1) from = from.slice(fromProtocol + 3)

				return origin === from

			case 'function':
				return origin(request) === true

			case 'object':
				if (origin instanceof RegExp) return origin.test(from)
		}

		return false
	}

	const handleOrigin = (set: Context['set'], request: Request) => {
		// origin === `true` means any origin
		if (origin === true) {
			set.headers.vary = '*'
			set.headers['access-control-allow-origin'] =
				request.headers.get('Origin') || '*'

			return
		}

		if (anyOrigin) {
			set.headers.vary = '*'
			set.headers['access-control-allow-origin'] = '*'

			return
		}

		if (!origins?.length) return

		const headers: string[] = []

		if (origins.length) {
			const from = request.headers.get('Origin') ?? ''
			for (let i = 0; i < origins.length; i++) {
				const value = processOrigin(origins[i]!, request, from)
				if (value === true) {
					set.headers.vary = origin ? 'Origin' : '*'
					set.headers['access-control-allow-origin'] = from || '*'

					return
				}
			}
		}

		set.headers.vary = 'Origin'
		if (headers.length)
			set.headers['access-control-allow-origin'] = headers.join(', ')
	}

	const handleMethod = (set: Context['set'], method?: string | null) => {
		if (!method) return

		if (methods === true)
			return (set.headers['access-control-allow-methods'] = method ?? '*')

		if (methods === false || !methods?.length) return

		if (methods === '*')
			return (set.headers['access-control-allow-methods'] = '*')

		if (!Array.isArray(methods))
			return (set.headers['access-control-allow-methods'] = methods)

		set.headers['access-control-allow-methods'] = methods.join(', ')
	}

	const defaultHeaders: Record<string, string> = {}

	if (typeof exposeHeaders === 'string')
		defaultHeaders['access-control-expose-headers'] = exposeHeaders

	if (typeof allowedHeaders === 'string')
		// @ts-ignore
		defaultHeaders['access-control-allow-headers'] = allowedHeaders

	if (credentials === true)
		defaultHeaders['access-control-allow-credentials'] = 'true'

	app.headers(defaultHeaders)

	function handleOption({ set, request, headers }: Context) {
		handleOrigin(set as any, request)
		handleMethod(set, request.headers.get('access-control-request-method'))

		if (allowedHeaders === true || exposeHeaders === true) {
			if (allowedHeaders === true)
				set.headers['access-control-allow-headers'] =
					headers['access-control-request-headers']

			if (exposeHeaders === true)
				set.headers['access-control-expose-headers'] =
					Object.keys(headers).join(',')
		}

		if (maxAge) set.headers['access-control-max-age'] = maxAge.toString()

		return new Response(null, {
			status: 204
		})
	}

	if (preflight) app.options('/', handleOption).options('/*', handleOption)

	return app.onRequest(function processCors({ set, request }) {
		handleOrigin(set, request)

		// Handle OPTIONS preflight in onRequest to ensure it runs
		// before any .all() handlers can intercept it
		if (preflight && request.method === 'OPTIONS') {
			return handleOption({
				set,
				request,
				headers: request.headers.toJSON() as Record<string, string>
			} as Context)
		}

		// Non-preflight requests
		handleMethod(set, request.method)

		if (allowedHeaders === true || exposeHeaders === true) {
			// @ts-ignore
			const headers = processHeaders(request.headers)

			if (allowedHeaders === true)
				set.headers['access-control-allow-headers'] = headers

			if (exposeHeaders === true)
				set.headers['access-control-expose-headers'] = headers
		}
	})
}

export default cors
