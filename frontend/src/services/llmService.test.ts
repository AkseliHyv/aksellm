import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { llmService } from "./llmService";

const fetchMock = vi.fn<typeof fetch>();

const userMessage = { role: "user", content: "Hi", sentAt: "2026-01-01T00:00:00Z" };
const assistantMessage = { role: "assistant", content: "Hello", sentAt: "2026-01-01T00:00:01Z" };

function streamResponse(events: object[]): Response {
    return new Response(events.map((event) => JSON.stringify(event) + "\n").join(""), { status: 200 });
}

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("sendMessageStream", () => {
    it("passes chunks to onChunk and returns the saved messages", async () => {
        fetchMock.mockResolvedValueOnce(streamResponse([
            { type: "chunk", content: "Hel" },
            { type: "chunk", content: "lo" },
            { type: "done", userMessage, assistantMessage },
        ]));
        const onChunk = vi.fn();

        const result = await llmService.sendMessageStream(1, "Hi", onChunk);

        expect(onChunk.mock.calls).toEqual([["Hel"], ["lo"]]);
        expect(result).toEqual({ userMessage, assistantMessage });
        expect(fetchMock).toHaveBeenCalledWith("/api/llm/1/chat/stream", expect.objectContaining({
            method: "POST",
            body: JSON.stringify("Hi"),
        }));
    });

    it("throws the content of an error event", async () => {
        fetchMock.mockResolvedValueOnce(streamResponse([
            { type: "chunk", content: "Hel" },
            { type: "error", content: "The LLM service is unreachable. Please try again shortly." },
        ]));

        await expect(llmService.sendMessageStream(1, "Hi", vi.fn()))
            .rejects.toThrow("The LLM service is unreachable. Please try again shortly.");
    });

    it("throws when the stream ends without a done event", async () => {
        fetchMock.mockResolvedValueOnce(streamResponse([{ type: "chunk", content: "Hel" }]));

        await expect(llmService.sendMessageStream(1, "Hi", vi.fn())).rejects.toThrow("The response ended unexpectedly");
    });
});
