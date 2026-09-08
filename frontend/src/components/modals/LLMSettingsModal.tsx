import { useState, useEffect } from "react";
import { FiCpu, FiType, FiX } from "react-icons/fi";
import Modal from "../ui/Modal";
import AdvancedLLMConfigFields, { labelCls } from "./LLMConfigFields";
import { useModalStore } from "../../stores/useModalStore";
import { LLMProvider, ProviderModels } from "../../domain";
import type { LLMConfig } from "../../domain";
import { llmService } from "../../services";
import { useLLMStore } from "../../stores/useLLMStore";

function LLMSettingsModal() {
    const { activeModal, closeModal, llmSettingsTarget } = useModalStore();
    const availableModels = ProviderModels[LLMProvider.Ollama];
    const [name, setName] = useState(llmSettingsTarget?.name ?? "");
    const [config, setConfig] = useState(llmSettingsTarget?.config);
    const [error, setError] = useState<string | null>(null);
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const { updateLLM, removeLLM } = useLLMStore();

    useEffect(() => {
        setName(llmSettingsTarget?.name ?? "");
        setConfig(llmSettingsTarget?.config);
        setAdvancedOpen(false);
        setConfirmingDelete(false);
    }, [llmSettingsTarget]);

    useEffect(() => {
        if (!confirmingDelete) return;

        const timeout = setTimeout(() => {
            setConfirmingDelete(false);
        }, 3000);

        return () => clearTimeout(timeout);
    }, [confirmingDelete]);

    const isUnchanged = name.trim() === llmSettingsTarget?.name && configEquals(config, llmSettingsTarget?.config);

    const patch = (partial: Partial<NonNullable<typeof config>>) =>
        setConfig((prev) => prev ? { ...prev, ...partial } : prev);

    function configEquals(a: LLMConfig | undefined, b: LLMConfig | undefined): boolean {
        if (a === b) return true;
        if (!a || !b) return false;

        const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof LLMConfig>;

        for (const key of keys) {
            const av = a[key];
            const bv = b[key];

            if (Array.isArray(av) && Array.isArray(bv)) {
                if (av.length !== bv.length || av.some((v, i) => v !== bv[i])) return false;
            } else if (av !== bv) {
                return false;
            }
        }

        return true;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || isUnchanged) return;

        setError(null);
        llmService.update(llmSettingsTarget!.id, { name: name.trim(), config })
            .then((llm) => {
                updateLLM(llm);
                closeModal();
            })
            .catch((e) => {
                setError(e instanceof Error ? e.message : "Failed to update LLM");
            });
    };

    const deleteLLM = () => {
        setError(null);
        llmService.delete(llmSettingsTarget!.id)
            .then(() => {
                removeLLM(llmSettingsTarget!.id);
                closeModal();
            })
            .catch((e) => {
                setError(e instanceof Error ? e.message : "Failed to delete LLM");
                setConfirmingDelete(false);
            });
    };

    return (
        <Modal isOpen={activeModal === "llmSettings"} onClose={closeModal} size="md">
            <div className="relative p-6 pb-4 border-b border-line/50 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-ink">
                        {llmSettingsTarget?.name ?? "LLM Settings"}
                    </h2>
                    <div className="h-0.5 w-20 bg-linear-to-r from-line-strong to-transparent mt-2 rounded-full" />
                </div>
                <button
                    onClick={closeModal}
                    className="p-2 rounded-lg hover:bg-hover/50 transition-all duration-200 text-ink-subtle hover:text-ink cursor-pointer"
                    aria-label="Close LLM settings"
                >
                    <FiX size={20} />
                </button>
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
                            value={config?.model ?? ""}
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

                {config && (
                    <AdvancedLLMConfigFields
                        config={config}
                        onChange={patch}
                        isOpen={advancedOpen}
                        onToggle={() => setAdvancedOpen((o) => !o)}
                    />
                )}

                <div className="relative flex justify-end gap-3 pt-4">
                    {confirmingDelete ? (
                        <button
                            type="button"
                            onClick={deleteLLM}
                            aria-label="Confirm delete"
                            className="absolute left-0 px-5 py-2.5 cursor-pointer bg-linear-to-r from-danger-solid to-danger-deep text-ink rounded-lg hover:from-danger-solid hover:to-danger-solid transition-all duration-200 font-medium shadow-lg shadow-danger-deep/30"
                        >
                            Confirm
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setConfirmingDelete(true)}
                            aria-label="Delete LLM"
                            className="absolute left-0 px-5 py-2.5 cursor-pointer bg-linear-to-r from-danger-solid to-danger-deep text-ink rounded-lg hover:from-danger-solid hover:to-danger-solid transition-all duration-200 font-medium shadow-lg shadow-danger-deep/30"
                        >
                            Delete
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={closeModal}
                        aria-label="Close LLM update modal"
                        className="px-5 py-2.5 cursor-pointer bg-raised/50 text-ink-muted rounded-lg hover:bg-hover/50 transition-all duration-200 font-medium border border-line/50 hover:border-line-strong"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={!name.trim() || isUnchanged}
                        aria-label="Update LLM model"
                        className="px-5 py-2.5 cursor-pointer bg-linear-to-r from-line to-line-strong text-ink rounded-lg hover:from-line-strong hover:to-line-active transition-all duration-200 font-medium shadow-lg shadow-surface/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-line disabled:hover:to-line-strong"
                    >
                        Update
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default LLMSettingsModal;
