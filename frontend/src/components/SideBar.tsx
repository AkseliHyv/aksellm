import { useState } from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import { HiDotsVertical } from "react-icons/hi";
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
        <div className={twMerge(clsx(
            "h-dvh bg-linear-to-b from-app-deep via-app to-app-deep relative overflow-hidden transition-all duration-300 ease-in-out border-r border-raised/50",
            isOpen ? "w-62" : "w-14"
        ))}>
            <div className="absolute inset-0 bg-linear-to-br from-raised/5 to-transparent pointer-events-none" />

            <div className={twMerge(clsx(
                "absolute top-2 left-3 transition-opacity duration-200",
                isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            ))}>
                <h1 className="text-2xl font-bold bg-linear-to-r from-ink to-ink-subtle bg-clip-text text-transparent">
                    AkseLLM
                </h1>
                <div className="h-0.5 w-16 bg-linear-to-r from-line-strong to-transparent mt-1 rounded-full" />
            </div>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute right-2 top-2 cursor-pointer w-10 h-10 pb-1 rounded-lg hover:bg-raised/50 transition-all duration-200 flex items-center justify-center group backdrop-blur-sm"
                aria-label={isOpen ? "Close Sidebar" : "Open Sidebar"}
            >
                <span className="text-ink-subtle group-hover:text-ink transition-colors text-lg">
                    {isOpen ? "✖" : "☰"}
                </span>
            </button>

            <div className={twMerge(clsx(
                "w-58 mx-2 pt-20 transition-opacity duration-200",
                isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            ))}>
                <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-ink-muted text-sm tracking-wider">LLMS</span>
                    <div className="h-px flex-1 ml-3 bg-linear-to-r from-line to-transparent" />
                </div>

                <ul className="mt-3 space-y-1 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                    {llms.map((llm) => {
                        const isSelected = llm.id === selectedLLM?.id;
                        return (
                            <li
                                key={llm.id}
                                onClick={() => handleSelectLLM(llm)}
                                className={twMerge(clsx(
                                    "rounded-lg h-9 flex items-center pl-3 cursor-pointer transition-all duration-200 group relative overflow-hidden",
                                    isSelected ? "bg-raised shadow-lg shadow-surface/50" : "hover:bg-raised/50"
                                ))}
                            >
                                {isSelected && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-line-active to-line rounded-r" />
                                )}
                                <span className={twMerge(clsx(
                                    "text-sm transition-colors truncate",
                                    isSelected ? "text-ink font-medium" : "text-ink-subtle group-hover:text-ink-muted"
                                ))}>
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
                    className={twMerge(clsx(
                        "mt-4 w-full h-9 rounded-lg border-2 border-dashed border-line transition-all duration-200 flex items-center justify-center group",
                        loggedIn && llms.length < 15 ? "cursor-pointer hover:border-line-strong hover:bg-raised/30" : "opacity-50 cursor-not-allowed"
                    ))}
                    onClick={() => openModal("llmCreate")}
                    aria-label="Create new LLM"
                    title={llms.length < 15 ? "" : "Maximum number of llms reached"}
                    disabled={!loggedIn || llms.length >= 15}
                >
                    <span className={twMerge(clsx("text-ink-faint font-bold text-lg", loggedIn && "group-hover:text-ink-muted"))}>+</span>
                    <span className={twMerge(clsx("ml-2 text-sm text-ink-faint font-medium", loggedIn && "group-hover:text-ink-muted"))}>New LLM</span>
                </button>
            </div>

            {loggedIn && (
                <div
                    className={twMerge(clsx(
                        "absolute flex items-center bottom-2 left-1.5 cursor-pointer h-12 rounded-lg hover:bg-raised/50 transition-all duration-300 ease-in-out group backdrop-blur-sm border border-transparent hover:border-line/50",
                        isOpen ? "w-58.5" : "w-10"
                    ))}
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
                            <div className="text-xs text-ink-faint">{profile.plan} plan</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SideBar;