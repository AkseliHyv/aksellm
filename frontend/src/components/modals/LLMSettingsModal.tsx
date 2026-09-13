import { useState, useEffect } from "react";
import { FiCpu, FiType } from "react-icons/fi";
import Modal from "../ui/Modal";
import ModalHeader from "../ui/ModalHeader";
import Button from "../ui/Button";
import { FormInput, FormSelect } from "../ui/FormField";
import AdvancedLLMConfigFields from "./LLMConfigFields";
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
            <ModalHeader title={llmSettingsTarget?.name ?? "LLM Settings"} onClose={closeModal} />

            <form onSubmit={handleSubmit} className="relative p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-5rem)]">
                {error && (
                    <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-4 py-2 animate-fade-in">
                        {error}
                    </p>
                )}

                <FormInput
                    id="name"
                    label="Name"
                    icon={FiType}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter model name"
                    autoFocus
                />

                <FormSelect
                    id="model"
                    label="Model"
                    icon={FiCpu}
                    options={availableModels}
                    value={config?.model ?? ""}
                    onChange={(e) => patch({ model: e.target.value })}
                />

                {config && (
                    <AdvancedLLMConfigFields
                        config={config}
                        onChange={patch}
                        isOpen={advancedOpen}
                        onToggle={() => setAdvancedOpen((o) => !o)}
                    />
                )}

                <div className="relative flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="danger"
                        onClick={confirmingDelete ? deleteLLM : () => setConfirmingDelete(true)}
                        aria-label={confirmingDelete ? "Confirm delete" : "Delete LLM"}
                        className="absolute left-0"
                    >
                        {confirmingDelete ? "Confirm" : "Delete"}
                    </Button>

                    <Button type="button" variant="secondary" onClick={closeModal} aria-label="Close LLM update modal">
                        Cancel
                    </Button>

                    <Button type="submit" disabled={!name.trim() || isUnchanged} aria-label="Update LLM model">
                        Update
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default LLMSettingsModal;
