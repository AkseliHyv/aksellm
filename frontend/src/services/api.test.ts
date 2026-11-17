import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request, { streamRequest } from "./api";

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(status: number, body?: unknown): Response {
    return new Response(body === undefined ? null : JSON.stringify(body), { status });
}

function unauthorized(): Response {
    return jsonResponse(401, { message: "Unauthorized. Please authenticate and try again." });
}

function streamResponse(chunks: string[]): Response {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
        start(controller) {
            for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
            controller.close();
        },
    });

    return new Response(body, { status: 200 });
}

function calledPaths(): string[] {
    return fetchMock.mock.calls.map(([path]) => String(path));
}

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("request", () => {
    it("returns the parsed body", async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { id: 1 }));

        await expect(request("/api/llm/1")).resolves.toEqual({ id: 1 });
    });

    it("returns undefined for 204", async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(204));

        await expect(request("/api/llm/1", { method: "DELETE" })).resolves.toBeUndefined();
    });

    it("throws the backend's error message", async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(409, { message: "Already generating" }));

        await expect(request("/api/llm/1/chat")).rejects.toThrow("Already generating");
    });

    it("throws a generic message when the error body is not JSON", async () => {
        fetchMock.mockResolvedValueOnce(new Response("Bad Gateway", { status: 502 }));

        await expect(request("/api/llm")).rejects.toThrow("Request failed with status 502");
    });

    it("sends cookies and a JSON content type", async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(200, {}));

        await request("/api/llm");

        expect(fetchMock).toHaveBeenCalledWith("/api/llm", expect.objectContaining({
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        }));
    });
});

describe("session refresh", () => {
    it("refreshes and retries the request once on 401", async () => {
        fetchMock
            .mockResolvedValueOnce(unauthorized())
            .mockResolvedValueOnce(jsonResponse(204))
            .mockResolvedValueOnce(jsonResponse(200, { id: 1 }));

        await expect(request("/api/llm/1")).resolves.toEqual({ id: 1 });

        expect(calledPaths()).toEqual(["/api/llm/1", "/api/auth/refresh", "/api/llm/1"]);
        expect(fetchMock.mock.calls[1][1]).toEqual({ method: "POST", credentials: "include" });
    });

    it("resends the same method and body on retry", async () => {
        fetchMock
            .mockResolvedValueOnce(unauthorized())
            .mockResolvedValueOnce(jsonResponse(204))
            .mockResolvedValueOnce(jsonResponse(201, {}));

        const options = { method: "POST", body: JSON.stringify("hello") };
        await request("/api/llm/1/chat", options);

        expect(fetchMock.mock.calls[2][1]).toEqual(expect.objectContaining(options));
    });

    it("throws the original error when the refresh fails", async () => {
        fetchMock
            .mockResolvedValueOnce(unauthorized())
            .mockResolvedValueOnce(jsonResponse(400, { message: "Invalid Refresh Token" }));

        await expect(request("/api/llm")).rejects.toThrow("Unauthorized. Please authenticate and try again.");

        expect(calledPaths()).toEqual(["/api/llm", "/api/auth/refresh"]);
    });

    it("throws the original error when the refresh request errors", async () => {
        fetchMock
            .mockResolvedValueOnce(unauthorized())
            .mockRejectedValueOnce(new TypeError("Failed to fetch"));

        await expect(request("/api/llm")).rejects.toThrow("Unauthorized. Please authenticate and try again.");
    });

    it("does not refresh again when the retry also gets 401", async () => {
        fetchMock
            .mockResolvedValueOnce(unauthorized())
            .mockResolvedValueOnce(jsonResponse(204))
            .mockResolvedValueOnce(unauthorized());

        await expect(request("/api/llm")).rejects.toThrow("Unauthorized. Please authenticate and try again.");

        expect(calledPaths()).toEqual(["/api/llm", "/api/auth/refresh", "/api/llm"]);
    });

    it.each(["/api/auth/login", "/api/auth/register", "/api/auth/refresh"])("does not refresh for %s", async (path) => {
        fetchMock.mockResolvedValueOnce(unauthorized());

        await expect(request(path, { method: "POST" })).rejects.toThrow("Unauthorized. Please authenticate and try again.");

        expect(calledPaths()).toEqual([path]);
    });

    it("shares one refresh between concurrent 401s", async () => {
        let finishRefresh!: (res: Response) => void;
        const refresh = new Promise<Response>((resolve) => { finishRefresh = resolve; });
        const retried = new Set<string>();

        fetchMock.mockImplementation((input) => {
            const path = String(input);

            if (path === "/api/auth/refresh") return refresh;
            if (retried.has(path)) return Promise.resolve(jsonResponse(200, { path }));

            retried.add(path);
            return Promise.resolve(unauthorized());
        });

        const first = request("/api/llm");
        const second = request("/api/auth/me");

        // Let both requests receive their 401 before the refresh finishes
        await new Promise((resolve) => setTimeout(resolve, 0));
        finishRefresh(jsonResponse(204));

        await expect(first).resolves.toEqual({ path: "/api/llm" });
        await expect(second).resolves.toEqual({ path: "/api/auth/me" });
        expect(calledPaths().filter((path) => path === "/api/auth/refresh")).toHaveLength(1);
    });

    it("starts a new refresh after the previous one has finished", async () => {
        fetchMock
            .mockResolvedValueOnce(unauthorized())
            .mockResolvedValueOnce(jsonResponse(204))
            .mockResolvedValueOnce(jsonResponse(200, {}))
            .mockResolvedValueOnce(unauthorized())
            .mockResolvedValueOnce(jsonResponse(204))
            .mockResolvedValueOnce(jsonResponse(200, {}));

        await request("/api/llm");
        await request("/api/llm");

        expect(calledPaths().filter((path) => path === "/api/auth/refresh")).toHaveLength(2);
    });
});

describe("streamRequest", () => {
    it("parses events split across chunks", async () => {
        fetchMock.mockResolvedValueOnce(streamResponse([
            "{\"type\":\"chunk\",\"con",
            "tent\":\"Hel\"}\n{\"type\":\"chunk\",",
            "\"content\":\"lo\"}\n",
        ]));
        const events: unknown[] = [];

        await streamRequest("/api/llm/1/chat/stream", { method: "POST" }, (event) => events.push(event));

        expect(events).toEqual([
            { type: "chunk", content: "Hel" },
            { type: "chunk", content: "lo" },
        ]);
    });

    it("parses a last event without a trailing newline and skips blank lines", async () => {
        fetchMock.mockResolvedValueOnce(streamResponse([
            "{\"type\":\"chunk\",\"content\":\"a\"}\n\n",
            "{\"type\":\"done\"}",
        ]));
        const events: unknown[] = [];

        await streamRequest("/api/llm/1/chat/stream", { method: "POST" }, (event) => events.push(event));

        expect(events).toEqual([{ type: "chunk", content: "a" }, { type: "done" }]);
    });

    it("refreshes and retries on 401 before the stream starts", async () => {
        fetchMock
            .mockResolvedValueOnce(unauthorized())
            .mockResolvedValueOnce(jsonResponse(204))
            .mockResolvedValueOnce(streamResponse(["{\"type\":\"done\"}\n"]));
        const events: unknown[] = [];

        await streamRequest("/api/llm/1/chat/stream", { method: "POST" }, (event) => events.push(event));

        expect(events).toEqual([{ type: "done" }]);
        expect(calledPaths()).toEqual(["/api/llm/1/chat/stream", "/api/auth/refresh", "/api/llm/1/chat/stream"]);
    });

    it("throws the backend's error message before reading the stream", async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(409, { message: "Already generating" }));
        const onEvent = vi.fn();

        await expect(streamRequest("/api/llm/1/chat/stream", { method: "POST" }, onEvent)).rejects.toThrow("Already generating");
        expect(onEvent).not.toHaveBeenCalled();
    });
});
