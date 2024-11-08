// src/index.ts
import { Elysia } from "elysia";
var isBun = typeof new Headers()?.toJSON === "function";
var processHeaders = (headers) => {
  if (isBun) return Object.keys(headers.toJSON()).join(", ");
  let keys = "";
  headers.forEach((_, key) => {
    keys += key + ", ";
  });
  if (keys) keys = keys.slice(0, -1);
  return keys;
};
var processOrigin = (origin, set, request, from) => {
  if (Array.isArray(origin))
    return origin.some((o) => processOrigin(o, set, request, from));
  switch (typeof origin) {
    case "string":
      if (origin.indexOf("://") === -1) return from.includes(origin);
      return origin === from;
    case "function": {
      const originResponse = origin(request, set);
      if (Array.isArray(originResponse))
        return originResponse.some((o) => processOrigin(o, set, request, from));
      else if (typeof originResponse === "string")
        return processOrigin(originResponse, set, request, from);
      return Boolean(originResponse);
    }
    case "object":
      if (origin instanceof RegExp) return origin.test(from);
  }
  return false;
};
var cors = (config) => {
  let {
    aot = true,
    origin = true,
    methods = true,
    allowedHeaders = true,
    exposeHeaders = true,
    credentials = true,
    maxAge = 5,
    preflight = true
  } = config ?? {};
  if (Array.isArray(allowedHeaders))
    allowedHeaders = allowedHeaders.join(", ");
  if (Array.isArray(exposeHeaders)) exposeHeaders = exposeHeaders.join(", ");
  const origins = typeof origin === "boolean" ? void 0 : Array.isArray(origin) ? origin : [origin];
  const app = new Elysia({
    name: "@elysiajs/cors",
    seed: config,
    aot
  });
  const anyOrigin = origins?.some((o) => o === "*");
  const handleOrigin = (set, request) => {
    if (origin === true) {
      set.headers.vary = "*";
      set.headers["access-control-allow-origin"] = request.headers.get("Origin") || "*";
      return;
    }
    if (anyOrigin) {
      set.headers.vary = "*";
      set.headers["access-control-allow-origin"] = "*";
      return;
    }
    if (!origins?.length) return;
    const headers = [];
    if (origins.length) {
      const from = request.headers.get("Origin") ?? "";
      for (let i = 0; i < origins.length; i++) {
        const value = processOrigin(origins[i], set, request, from);
        if (value === true) {
          set.headers.vary = origin ? "Origin" : "*";
          set.headers["access-control-allow-origin"] = from || "*";
          return;
        }
        if (value) headers.push(value);
      }
    }
    set.headers.vary = "Origin";
    if (headers.length)
      set.headers["access-control-allow-origin"] = headers.join(", ");
  };
  const handleMethod = (set, method) => {
    if (!method) return;
    if (methods === true)
      return set.headers["access-control-allow-methods"] = method ?? "*";
    if (methods === false || !methods?.length) return;
    if (methods === "*")
      return set.headers["access-control-allow-methods"] = "*";
    if (!Array.isArray(methods))
      return set.headers["access-control-allow-methods"] = methods;
    set.headers["access-control-allow-methods"] = methods.join(", ");
  };
  const defaultHeaders = {};
  if (typeof exposeHeaders === "string")
    defaultHeaders["access-control-expose-headers"] = exposeHeaders;
  if (typeof allowedHeaders === "string")
    defaultHeaders["access-control-allow-headers"] = allowedHeaders;
  if (credentials === true)
    defaultHeaders["access-control-allow-credentials"] = "true";
  app.headers(defaultHeaders);
  function handleOption({ set, request, headers }) {
    handleOrigin(set, request);
    handleMethod(set, request.headers.get("access-control-request-method"));
    if (allowedHeaders === true || exposeHeaders === true) {
      if (allowedHeaders === true)
        set.headers["access-control-allow-headers"] = headers["access-control-request-headers"];
      if (exposeHeaders === true)
        set.headers["access-control-expose-headers"] = Object.keys(headers).join(",");
    }
    if (maxAge) set.headers["access-control-max-age"] = maxAge.toString();
    return new Response(null, {
      status: 204
    });
  }
  if (preflight) app.options("/", handleOption).options("/*", handleOption);
  return app.onRequest(function processCors({ set, request }) {
    handleOrigin(set, request);
    handleMethod(set, request.method);
    if (allowedHeaders === true || exposeHeaders === true) {
      const headers = processHeaders(request.headers);
      if (allowedHeaders === true)
        set.headers["access-control-allow-headers"] = headers;
      if (exposeHeaders === true)
        set.headers["access-control-expose-headers"] = headers;
    }
  });
};
var src_default = cors;
export {
  cors,
  src_default as default
};
