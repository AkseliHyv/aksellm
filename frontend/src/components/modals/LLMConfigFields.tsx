import { FiChevronDown } from "react-icons/fi";
import type { LLMConfig } from "../../domain";

export const inputCls = "w-full bg-surface/50 text-ink px-3 py-2 rounded-lg border border-line focus:outline-none focus:border-line-active focus:ring-2 focus:ring-line-active/20 transition-all placeholder:text-ink-faint text-sm";
export const labelCls = "block text-ink-muted text-sm font-medium";

type AdvancedLLMConfigFieldsProps = {
    config: LLMConfig;
    onChange: (partial: Partial<LLMConfig>) => void;
    isOpen: boolean;
    onToggle: () => void;
};

function AdvancedLLMConfigFields({ config, onChange, isOpen, onToggle }: AdvancedLLMConfigFieldsProps) {
    return (
        <div className="rounded-lg border border-line/60 overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between px-4 py-3 bg-raised/40 hover:bg-raised/70 transition-colors text-sm font-medium text-ink-muted hover:text-ink cursor-pointer"
                aria-expanded={isOpen}
            >
                <span>Advanced settings</span>
                <FiChevronDown
                    size={16}
                    className={`text-ink-subtle transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {isOpen && (
                <div className="p-4 space-y-4 border-t border-line/60 bg-surface/20">

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label htmlFor="temperature" className={labelCls}>Temperature</label>
                            <input
                                id="temperature"
                                type="number" min={0} max={2} step={0.05}
                                value={config.temperature}
                                placeholder="0.7"
                                onChange={(e) => onChange({ temperature: e.target.value === "" ? 0.7 : Number(e.target.value) })}
                                className={inputCls}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="maxTokens" className={labelCls}>Max Tokens</label>
                            <input
                                id="maxTokens"
                                type="number" min={1} step={1}
                                value={config.maxTokens}
                                placeholder="200"
                                onChange={(e) => onChange({ maxTokens: e.target.value === "" ? 200 : Number(e.target.value) })}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label htmlFor="topP" className={labelCls}>Top P</label>
                            <input
                                id="topP"
                                type="number" min={0} max={1} step={0.01}
                                value={config.topP ?? ""}
                                placeholder="default"
                                onChange={(e) => onChange({ topP: e.target.value === "" ? undefined : Number(e.target.value) })}
                                className={inputCls}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="topK" className={labelCls}>Top K</label>
                            <input
                                id="topK"
                                type="number" min={0} step={1}
                                value={config.topK ?? ""}
                                placeholder="default"
                                onChange={(e) => onChange({ topK: e.target.value === "" ? undefined : Number(e.target.value) })}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="repeatPenalty" className={labelCls}>Repeat Penalty</label>
                        <input
                            id="repeatPenalty"
                            type="number" min={0} step={0.01}
                            value={config.repeatPenalty ?? ""}
                            placeholder="default"
                            onChange={(e) => onChange({ repeatPenalty: e.target.value === "" ? undefined : Number(e.target.value) })}
                            className={inputCls}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="seed" className={labelCls}>Seed</label>
                        <input
                            id="seed"
                            type="number" step={1}
                            value={config.seed ?? ""}
                            placeholder="Random"
                            onChange={(e) => onChange({ seed: e.target.value === "" ? undefined : Number(e.target.value) })}
                            className={inputCls}
                        />
                    </div>

                    <div className="flex items-center justify-between py-1">
                        <label htmlFor="stream" className={labelCls}>Stream</label>
                        <button
                            id="stream"
                            type="button"
                            role="switch"
                            aria-checked={config.stream}
                            onClick={() => onChange({ stream: !config.stream })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${config.stream ? "bg-ink-faint" : "bg-hover"}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-ink shadow transition-transform duration-200 ${config.stream ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="stopSequences" className={labelCls}>
                            Stop Sequences
                            <span className="ml-1.5 text-ink-faint font-normal">(comma-separated)</span>
                        </label>
                        <input
                            id="stopSequences"
                            type="text"
                            value={config.stopSequences?.join(", ") ?? ""}
                            placeholder='e.g.  \n, ###, <end>'
                            onChange={(e) => {
                                const seqs = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                                onChange({ stopSequences: seqs.length ? seqs : undefined });
                            }}
                            className={inputCls}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="systemPrompt" className={labelCls}>System Prompt</label>
                        <textarea
                            id="systemPrompt"
                            rows={4}
                            value={config.systemPrompt ?? ""}
                            placeholder="Optional system prompt…"
                            onChange={(e) => onChange({ systemPrompt: e.target.value || undefined })}
                            className={`${inputCls} resize-none`}
                        />
                    </div>

                </div>
            )}
        </div>
    );
}

export default AdvancedLLMConfigFields;
