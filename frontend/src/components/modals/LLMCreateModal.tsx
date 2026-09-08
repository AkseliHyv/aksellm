import { useEffect, useState } from "react";
import { FiType, FiCpu } from "react-icons/fi";
import Modal from "../ui/Modal";
import AdvancedLLMConfigFields, { labelCls } from "./LLMConfigFields";
import { useModalStore } from "../../stores/useModalStore";
import { useLLMStore } from "../../stores/useLLMStore";
import { llmService } from "../../services";
import { LLMProvider, ProviderModels } from "../../domain";
import type { LLMConfig } from "../../domain";

const DEFAULT_CONFIG: LLMConfig = {
    provider: LLMProvider.Ollama,
    model: "",
    temperature: 0.7,
    maxTokens: 200,
    stream: true,
};

function LLMCreateModal() {
    const { activeModal, closeModal } = useModalStore();
    const { addLLM } = useLLMStore();
    const availableModels = ProviderModels[LLMProvider.Ollama];
    const [name, setName] = useState("");
    const [config, setConfig] = useState<LLMConfig>({ ...DEFAULT_CONFIG, model: availableModels[0] ?? "" });
    const [error, setError] = useState<string | null>(null);
    const [advancedOpen, setAdvancedOpen] = useState(false);

    useEffect(() => {
        if (activeModal !== "llmCreate") return;

        setName("");
        setConfig({ ...DEFAULT_CONFIG, model: availableModels[0] ?? "" });
        setAdvancedOpen(false);
        setError(null);
    }, [activeModal]);

    const patch = (partial: Partial<LLMConfig>) =>
        setConfig((prev) => ({ ...prev, ...partial }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !config.model) return;

        setError(null);
        llmService.create({ name: name.trim(), config })
            .then((llm) => {
                addLLM(llm);
                setName("");
                setConfig({ ...DEFAULT_CONFIG, model: availableModels[0] ?? "" });
                setAdvancedOpen(false);
                closeModal();
            })
            .catch((e) => {
                setError(e instanceof Error ? e.message : "Failed to create LLM");
            });
    };

    return (
        <Modal isOpen={activeModal === "llmCreate"} onClose={closeModal} size="md">
            <div className="relative p-6 pb-4 border-b border-line/50">
                <h2 className="text-xl font-bold text-ink">Create a new LLM model</h2>
                <div className="h-0.5 w-20 bg-linear-to-r from-line-strong to-transparent mt-2 rounded-full" />
            </div>

            <form onSubmit={handleSubmit} className="relative p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-5rem)]">
                {error && (
                    <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-4 py-2">
                        {error}
                    </p>
                )}

                <div className="space-y-2">
                    <label htmlFor="name" className={labelCls}>Name</label>
                    <div className="relative">
                        <FiType className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-surface/50 text-ink pl-10 pr-4 py-2.5 rounded-lg border border-line focus:outline-none focus:border-line-active focus:ring-2 focus:ring-line-active/20 transition-all placeholder:text-ink-faint"
                            placeholder="Enter model name"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="model" className={labelCls}>Model</label>
                    <div className="relative">
                        <FiCpu className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint z-10" size={18} />
                        <select
                            id="model"
                            value={config.model}
                            onChange={(e) => patch({ model: e.target.value })}
                            className="w-full bg-surface/50 text-ink pl-10 pr-10 py-2.5 rounded-lg border border-line focus:outline-none focus:border-line-active focus:ring-2 focus:ring-line-active/20 transition-all appearance-none cursor-pointer"
                        >
                            {availableModels.map((model) => (
                                <option key={model} value={model} className="bg-raised">{model}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-subtle">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <AdvancedLLMConfigFields
                    config={config}
                    onChange={patch}
                    isOpen={advancedOpen}
                    onToggle={() => setAdvancedOpen((o) => !o)}
                />

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={closeModal}
                        aria-label="Close LLM creation modal"
                        className="px-5 py-2.5 cursor-pointer bg-raised/50 text-ink-muted rounded-lg hover:bg-hover/50 transition-all duration-200 font-medium border border-line/50 hover:border-line-strong"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!name.trim() || !config.model}
                        aria-label="Create LLM model"
                        className="px-5 py-2.5 cursor-pointer bg-linear-to-r from-line to-line-strong text-ink rounded-lg hover:from-line-strong hover:to-line-active transition-all duration-200 font-medium shadow-lg shadow-surface/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-line disabled:hover:to-line-strong"
                    >
                        Create
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default LLMCreateModal;
