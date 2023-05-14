export const req = (path: string, headers?: Record<string, string>) =>
    new Request(`http://localhost${path}`, {
        headers
    })

export const preflight = (path: string, headers?: Record<string, string>) =>
    new Request(`http://localhost${path}`, {
        method: 'options',
        headers
    })
