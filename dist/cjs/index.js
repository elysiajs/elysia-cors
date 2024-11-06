"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  cors: () => cors,
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);
var import_elysia = require("elysia");
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
var processOrigin = async (origin, request, from) => {
  if (Array.isArray(origin))
    return origin.some((o) => processOrigin(o, request, from));
  switch (typeof origin) {
    case "string":
      if (origin.indexOf("://") === -1) return from.includes(origin);
      return origin === from;
    case "function": {
      const originResponse = origin(request);
      if (Array.isArray(originResponse))
        return originResponse.some((o) => processOrigin(o, request, from));
      else if (originResponse instanceof Promise) return Boolean(await originResponse);
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
  const app = new import_elysia.Elysia({
    name: "@elysiajs/cors",
    seed: config,
    aot
  });
  const anyOrigin = origins?.some((o) => o === "*");
  const handleOrigin = async (set, request) => {
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
        const value = await processOrigin(origins[i], request, from);
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
  async function handleOption({ set, request, headers }) {
    await handleOrigin(set, request);
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
  return app.onRequest(async function processCors({ set, request }) {
    await handleOrigin(set, request);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cors
});
