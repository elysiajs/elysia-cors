import { Elysia } from "elysia";
import { cors } from "../src";

import { describe, expect, it } from "bun:test";
import { req } from "./utils";

describe("CORS", () => {
    it("Accept all CORS by default", async () => {
        const app = new Elysia().use(cors()).get("/", () => "HI");

        const res = await app.handle(
            req("/", {
                origin: "https://saltyaom.com",
            }),
        );
        expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://saltyaom.com");
        expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET");
        expect(res.headers.get("Access-Control-Allow-Headers")).toBe("origin");
        expect(res.headers.get("Access-Control-Expose-Headers")).toBe(
            "origin",
        );
        expect(res.headers.get("Access-Control-Allow-Credentials")).toBe(
            "true",
        );
    });
});
