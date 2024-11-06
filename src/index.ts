/* eslint-disable no-case-declarations */
import { Elysia, type Context } from 'elysia'

type Origin = string | RegExp | ((request: Request) => Promise<boolean> | string[] | boolean | void)

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

	headers.forEach((_, key) => {
		keys += key + ', '
	})

	if (keys) keys = keys.slice(0, -1)

	return keys
}

const processOrigin = async (
	origin: Origin,
	request: Request,
	from: string
): Promise<boolean> => {
	if (Array.isArray(origin))
		return origin.some((o) => processOrigin(o, request, from))

	switch (typeof origin) {
		case 'string':
			if (origin.indexOf('://') === -1) return from.includes(origin)

			return origin === from

		case 'function': {
			const originResponse = origin(request)
			if (Array.isArray(originResponse))
				return originResponse.some((o) => processOrigin(o, request, from))
			else if (originResponse instanceof Promise) return Boolean(await originResponse)
			return Boolean(originResponse)
		}

		case 'object':
			if (origin instanceof RegExp) return origin.test(from)
	}

	return false
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

	const handleOrigin = async (set: Context['set'], request: Request) => {
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
				const value = await processOrigin(origins[i]!, request, from)
				if (value === true) {
					set.headers.vary = origin ? 'Origin' : '*'
					set.headers['access-control-allow-origin'] = from || '*'

					return
				}

				// value can be string (truthy value) but not `true`
				if (value) headers.push(value)
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

	async function handleOption({ set, request, headers }: Context) {
		await handleOrigin(set as any, request)
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

	return app.onRequest(async function processCors({ set, request }) {
		await handleOrigin(set, request)
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
