import { useEffect, useState } from "react";
import { FiType, FiCpu } from "react-icons/fi";
import Modal from "../ui/Modal";
import ModalHeader from "../ui/ModalHeader";
import Button from "../ui/Button";
import { FormInput, FormSelect } from "../ui/FormField";
import AdvancedLLMConfigFields from "./LLMConfigFields";
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
            <ModalHeader title="Create a new LLM model" />

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
                    value={config.model}
                    onChange={(e) => patch({ model: e.target.value })}
                />

                <AdvancedLLMConfigFields
                    config={config}
                    onChange={patch}
                    isOpen={advancedOpen}
                    onToggle={() => setAdvancedOpen((o) => !o)}
                />

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="secondary" onClick={closeModal} aria-label="Close LLM creation modal">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={!name.trim() || !config.model} aria-label="Create LLM model">
                        Create
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

export default LLMCreateModal;
