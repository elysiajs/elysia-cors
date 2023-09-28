export const req = (path: string, headers?: HeadersInit) =>
    new Request(`http://localhost${path}`, {
        headers
    })

export const preflight = (path: string, headers?: HeadersInit) =>
    new Request(`http://localhost${path}`, {
        method: 'options',
        headers
    })
