import { create } from "zustand";
import type { LLMModel, Message } from "../domain";

type LLMStore = {
    llms: LLMModel[];
    messages: Message[];
    selectedLLM: LLMModel | null;

    setLLMs: (llms: LLMModel[]) => void;
    addLLM: (llm: LLMModel) => void;
    removeLLM: (id: number) => void;
    updateLLM: (llm: LLMModel) => void;
    selectLLM: (llm: LLMModel | null) => void;

    setMessages: (messages: Message[]) => void;
    addMessage: (messages: Message) => void;
    appendToMessage: (id: number, content: string) => void;
    confirmMessage: (tempId: number, confirmed: Message) => void;
    cancelMessage: (tempId: number) => void;
};

export const useLLMStore = create<LLMStore>((set) => ({
    llms: [],
    messages: [],
    selectedLLM: null,

    setLLMs: (llms) => set({ llms }),
    addLLM: (llm) => set((state) => ({ llms: [...state.llms, llm] })),
    removeLLM: (id) => set((state) => ({
        llms: state.llms.filter((l) => l.id !== id),
        selectedLLM: state.selectedLLM?.id === id ? null : state.selectedLLM,
    })),
    updateLLM: (llm) => set((state) => ({
        llms: state.llms.map((l) => l.id === llm.id ? llm : l),
        selectedLLM: state.selectedLLM?.id === llm.id ? llm : state.selectedLLM,
    })),
    selectLLM: (llm) => set({ selectedLLM: llm }),

    setMessages: (messages) => set({ messages }),
    addMessage: (messages) => set((state) => ({ messages: [...state.messages, messages] })),
    appendToMessage: (id, content) => set((state) => ({
        messages: state.messages.map((m) => m.id === id ? { ...m, content: m.content + content } : m),
    })),
    confirmMessage: (tempId, confirmed) => set((state) => ({
        messages: state.messages.map((m) => m.id === tempId ? confirmed : m),
    })),
    cancelMessage: (tempId) => set((state) => ({
        messages: state.messages.filter((m) => m.id !== tempId),
    })),
}));
