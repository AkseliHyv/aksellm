async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        ...options,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `Request failed with status ${res.status}`);
    }

    if (res.status === 204) return undefined as T;

    return res.json() as Promise<T>;
}

export default request;