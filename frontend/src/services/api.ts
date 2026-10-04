async function send(path: string, options?: RequestInit): Promise<Response> {
    const res = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        ...options,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `Request failed with status ${res.status}`);
    }

    return res;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await send(path, options);

    if (res.status === 204) return undefined as T;

    return res.json() as Promise<T>;
}

export async function streamRequest<T>(path: string, options: RequestInit, onEvent: (event: T) => void): Promise<void> {
    const res = await send(path, options);

    if (!res.body) throw new Error("Streaming is not supported by this browser");

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
            if (line.trim()) onEvent(JSON.parse(line) as T);
        }
    }

    if (buffer.trim()) onEvent(JSON.parse(buffer) as T);
}

export default request;
