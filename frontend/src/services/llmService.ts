import request from "./api";
import type { LLMModel, LLMConfig, Message } from "../domain";

type CreateLLMDto = {
    name: string;
    config: LLMConfig;
};

type UpdateLLMDto = {
    name?: string;
    config?: LLMConfig;
};

type LLMResponseDto = {
    llMs: LLMModel[];
    message?: string;
};

type GetMessagesDto = {
    chatMessages: Message[];
};

type MessageResponseDto = {
    userMessage: Message;
    assistantMessage: Message;
};

export const llmService = {
    getAll: () =>
        request<LLMResponseDto>("/api/llm").then((res) => res.llMs),

    getById: (id: number) =>
        request<LLMResponseDto>(`/api/llm/${id}`).then((res) => res.llMs[0]),

    create: (data: CreateLLMDto) =>
        request<LLMResponseDto>("/api/llm", {
            method: "POST",
            body: JSON.stringify(data),
        }).then((res) => res.llMs[0]),

    update: (id: number, data: UpdateLLMDto) =>
        request<LLMResponseDto>(`/api/llm/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }).then((res) => res.llMs[0]),

    delete: (id: number) =>
        request<void>(`/api/llm/${id}`, { method: "DELETE" }),

    getMessages: (id: number) =>
        request<GetMessagesDto>(`/api/llm/${id}/chat`).then((res) => res.chatMessages),

    sendMessage: (id: number, message: string) =>
        request<MessageResponseDto>(`/api/llm/${id}/chat`, {
            method: "POST",
            body: JSON.stringify(message),
        }),
};