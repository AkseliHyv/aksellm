import type { LLMProvider } from "./enums/LLMProvider";

export type LLMConfig = {
    provider: LLMProvider;
    model: string;
    temperature: number;
    maxTokens: number;
    stream: boolean;
    systemPrompt?: string;
    topP?: number;
    topK?: number;
    repeatPenalty?: number;
    seed?: number;
    stopSequences?: string[];
};