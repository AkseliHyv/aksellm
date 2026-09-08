import { useEffect, useLayoutEffect, useRef } from "react";
import { useLLMStore } from "../stores/useLLMStore";
import Message from "./ui/Message";
import TextField from "./ui/TextField";
import { llmService } from "../services";
import { useToastStore } from "../stores/useToastStore";

const STICK_THRESHOLD_PX = 100;

function ChatPanel() {
    const { selectedLLM, setMessages, messages } = useLLMStore();
    const { showError } = useToastStore();
    const scrollRef = useRef<HTMLDivElement>(null);
    const isPinnedToBottom = useRef(true);

    useEffect(() => {
        setMessages([]);
        isPinnedToBottom.current = true;

        if (!selectedLLM) return;

        let isCurrent = true;

        llmService.getMessages(selectedLLM.id).then((chatMessages) => {
            if (isCurrent) {
                setMessages(chatMessages);
            }
        }).catch((e) => {
            showError(e instanceof Error ? e.message : "Failed to fetch chat messages.");
        });

        return () => {
            isCurrent = false;
        };
    }, [selectedLLM]);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el) return;

        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        isPinnedToBottom.current = distanceFromBottom <= STICK_THRESHOLD_PX;
    };

    useLayoutEffect(() => {
        const el = scrollRef.current;
        if (!el || !isPinnedToBottom.current) return;

        el.scrollTop = el.scrollHeight;
    }, [messages]);

    if (!selectedLLM) return null;

    return (
        <div className="relative w-auto flex-1">
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="overflow-y-scroll h-dvh px-20 pt-10 pb-30"
            >
                {messages?.map((msg) => (
                    <Message
                        key={msg.id}
                        role={msg.role}
                        content={msg.content}
                        createdAt={msg.createdAt}
                    />
                ))}
            </div>
            <TextField />
        </div>
    );
}

export default ChatPanel;