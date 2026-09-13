import { useState } from "react";
import { cn } from "../lib/cn";
import { HiDotsVertical } from "react-icons/hi";
import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi";
import { useUserStore } from "../stores/useUserStore";
import { useModalStore } from "../stores/useModalStore";
import { useLLMStore } from "../stores/useLLMStore";
import Avatar from "./ui/Avatar";
import { llmService } from "../services";
import { useToastStore } from "../stores/useToastStore";
import type { LLMModel } from "../domain";

function SideBar() {
    const { profile } = useUserStore();
    const { openModal } = useModalStore();
    const { llms, selectedLLM, selectLLM, removeLLM, updateLLM } = useLLMStore();
    const { showError } = useToastStore();
    const [isOpen, setIsOpen] = useState(true);

    const loggedIn = profile !== null;

    const handleSelectLLM = (llm: LLMModel) => {
        selectLLM(llm);

        llmService.getById(llm.id)
            .then((fresh) => {
                if (!fresh) {
                    removeLLM(llm.id);
                    return;
                }

                const current = llms.find((l) => l.id === fresh.id);
                if (!current || JSON.stringify(current) !== JSON.stringify(fresh)) {
                    updateLLM(fresh);
                }
            })
            .catch((e) => {
                showError(e instanceof Error ? e.message : `Failed to refresh LLM ${llm.name}.`);
            });
    };

    return (
        <div className={cn(
            "h-dvh bg-linear-to-b from-app-deep via-app to-app-deep relative overflow-hidden transition-all duration-300 ease-in-out border-r border-raised/50",
            isOpen ? "w-62" : "w-14"
        )}>
            <div className="absolute inset-0 bg-linear-to-br from-accent/5 to-transparent pointer-events-none" />

            <div className="relative flex items-center h-14 px-2.5">
                <h1 className={cn(
                    "font-bold text-2xl tracking-tight text-ink overflow-hidden whitespace-nowrap transition-all duration-200 pl-1.5",
                    isOpen ? "max-w-40 opacity-100" : "max-w-0 opacity-0 pl-0"
                )}>
                    Akse<span className="text-accent">LLM</span>
                </h1>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="ml-auto cursor-pointer w-9 h-9 rounded-lg hover:bg-raised/50 transition-all duration-200 flex items-center justify-center group shrink-0"
                    aria-label={isOpen ? "Close Sidebar" : "Open Sidebar"}
                >
                    <span className="text-ink-subtle group-hover:text-accent transition-colors">
                        {isOpen ? <FiChevronLeft size={18} /> : <FiChevronRight size={18} />}
                    </span>
                </button>
            </div>

            <div className={cn(
                "w-58 mx-2 mt-4 transition-opacity duration-200",
                isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
                <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-ink-muted text-sm tracking-wider">LLMS</span>
                    <div className="h-px flex-1 ml-3 bg-linear-to-r from-line to-transparent" />
                </div>

                <ul className="mt-3 space-y-1 max-h-96 overflow-y-auto">
                    {llms.map((llm) => {
                        const isSelected = llm.id === selectedLLM?.id;
                        return (
                            <li
                                key={llm.id}
                                onClick={() => handleSelectLLM(llm)}
                                className={cn(
                                    "rounded-lg h-9 flex items-center pl-3 cursor-pointer transition-all duration-200 group relative overflow-hidden",
                                    isSelected ? "bg-raised shadow-lg shadow-surface/50" : "hover:bg-raised/50"
                                )}
                            >
                                {isSelected && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-accent to-accent-strong rounded-r" />
                                )}
                                <span className={cn(
                                    "text-sm transition-colors truncate",
                                    isSelected ? "text-ink font-medium" : "text-ink-subtle group-hover:text-ink-muted"
                                )}>
                                    {llm.name}
                                </span>
                                {isSelected && (
                                    <button
                                        className="rounded-lg p-1.5 absolute right-0 mr-1 cursor-pointer duration-200 hover:bg-hover"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openModal("llmSettings", { llmSettingsTarget: llm });
                                        }}
                                        aria-label={`Open settings for ${llm.name}`}
                                    >
                                        <HiDotsVertical />
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>

                <button
                    className={cn(
                        "mt-4 w-full h-9 rounded-lg border-2 border-dashed border-line transition-all duration-200 flex items-center justify-center gap-2 group",
                        loggedIn && llms.length < 15 ? "cursor-pointer hover:border-accent/60 hover:bg-accent/5" : "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => openModal("llmCreate")}
                    aria-label="Create new LLM"
                    title={llms.length < 15 ? "" : "Maximum number of llms reached"}
                    disabled={!loggedIn || llms.length >= 15}
                >
                    <FiPlus className={cn("text-ink-faint transition-colors", loggedIn && "group-hover:text-accent")} size={16} />
                    <span className={cn("text-sm text-ink-faint font-medium transition-colors", loggedIn && "group-hover:text-ink-muted")}>New LLM</span>
                </button>
            </div>

            {loggedIn && (
                <div
                    className={cn(
                        "absolute flex items-center bottom-2 left-1.5 cursor-pointer h-12 rounded-lg hover:bg-raised/50 transition-all duration-300 ease-in-out group backdrop-blur-sm border border-transparent hover:border-line/50",
                        isOpen ? "w-58.5" : "w-10"
                    )}
                    onClick={() => openModal("userSettings")}
                    aria-label="Account settings"
                    role="button"
                >
                    <div className="relative">
                        <div className="ml-1">
                            <Avatar username={profile.username} size="sm" />
                        </div>
                    </div>
                    {isOpen && (
                        <div className="absolute left-12 flex-1 min-w-0">
                            <div className="text-sm font-medium text-ink-muted group-hover:text-ink transition-colors block truncate">
                                {profile?.username}
                            </div>
                            <div className="text-xs text-ink-faint">{profile?.email}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SideBar;
