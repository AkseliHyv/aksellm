import { cn } from "../../lib/cn";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { llmService } from "../../services";
import { useLLMStore } from "../../stores/useLLMStore";
import { FiSend } from "react-icons/fi";
import { useToastStore } from "../../stores/useToastStore";
import { useModalStore } from "../../stores/useModalStore";
import type { Message } from "../../domain";

function TextField() {
    const [input, setInput] = useState("");
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const { selectedLLM, addMessage, confirmMessage, cancelMessage } = useLLMStore();
    const { showError } = useToastStore();
    const { activeModal } = useModalStore();

    const canSend = input.trim().length > 0 && !isSendingMessage;

    useEffect(() => {
        setInput("");
    }, [selectedLLM]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useLayoutEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }, [input]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;

        if (activeModal) return;

        e.preventDefault();
        if (canSend) sendMessage();
    };

    const sendMessage = () => {
        const storedInput = input;
        const tempId = -Date.now();

        const optimistic: Message = {
            id: tempId,
            role: "user",
            content: storedInput,
            createdAt: new Date().toISOString(),
        };

        setInput("");
        setIsSendingMessage(true);
        addMessage(optimistic);

        llmService.sendMessage(selectedLLM!.id, storedInput)
            .then((messages) => {
                if (messages.userMessage == null || messages.assistantMessage == null) {
                    throw new Error("Unexpected response shape");
                }

                confirmMessage(tempId, messages.userMessage);
                addMessage(messages.assistantMessage);
            })
            .catch((e) => {
                showError(e instanceof Error ? e.message : "Failed to send message.");
                cancelMessage(tempId);
                setInput(storedInput);
            })
            .finally(() => {
                setIsSendingMessage(false);
            });
    };

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4">
            <div
                className={cn(
                    "flex items-end gap-2",
                    "bg-surface/80 backdrop-blur-md",
                    "border border-line focus-within:border-accent/60 focus-within:shadow-lg focus-within:shadow-accent/10",
                    "rounded-2xl px-4 py-3 shadow-lg transition-all duration-200"
                )}
            >
                <textarea
                    ref={textareaRef}
                    rows={1}
                    className="flex-1 resize-none bg-transparent outline-none text-ink placeholder:text-ink-faint py-0.5 max-h-40 overflow-y-auto"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                />

                <button
                    className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-full transition-all cursor-pointer",
                        canSend ? "bg-accent text-app-deep hover:brightness-110" : "text-ink-faint"
                    )}
                    disabled={!canSend}
                    onClick={sendMessage}
                    aria-label="Send message"
                >
                    {isSendingMessage
                        ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-ink-muted border-t-transparent" />
                        : <FiSend size={14} />}
                </button>
            </div>
        </div>
    );
}

export default TextField;
