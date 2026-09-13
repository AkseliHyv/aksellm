import { useCallback, useEffect, useState } from "react";
import { FiUser, FiSettings, FiLogOut, FiCheck } from "react-icons/fi";
import { cn } from "../../../lib/cn";
import Modal from "../../ui/Modal";
import ModalHeader from "../../ui/ModalHeader";
import Button from "../../ui/Button";
import AccountView from "./views/AccountView";
import GeneralView from "./views/GeneralView";
import { useModalStore } from "../../../stores/useModalStore";

type TabId = "general" | "account";

type Tab = {
    id: TabId;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
};

const tabs: Tab[] = [
    { id: "general", label: "General", icon: FiSettings },
    { id: "account", label: "Account", icon: FiUser },
];

function UserSettingsModal() {
    const { activeModal, closeModal, openModal } = useModalStore();
    const [activeTabId, setActiveTabId] = useState<TabId>("general");
    const [canSave, setCanSave] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleDirtyChange = useCallback((dirty: boolean) => setCanSave(dirty), []);
    const handleSaved = useCallback(() => setSaved(true), []);

    useEffect(() => {
        setCanSave(false);
        setSaved(false);
    }, [activeTabId]);

    useEffect(() => {
        if (!saved) return;
        const timeout = setTimeout(() => setSaved(false), 2000);
        return () => clearTimeout(timeout);
    }, [saved]);

    const formId = `${activeTabId}-settings-form`;

    return (
        <Modal isOpen={activeModal === "userSettings"} onClose={closeModal} size="lg">
            <ModalHeader title="Settings" onClose={closeModal} />

            <div className="relative border-b border-line/50">
                <div className="flex px-6">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTabId === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTabId(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 cursor-pointer",
                                    isActive
                                        ? "text-ink border-accent"
                                        : "text-ink-subtle border-transparent hover:text-ink-muted"
                                )}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="relative p-6 min-h-100">
                {activeTabId === "general" && (
                    <GeneralView formId={formId} onDirtyChange={handleDirtyChange} onSaved={handleSaved} />
                )}
                {activeTabId === "account" && (
                    <AccountView formId={formId} onDirtyChange={handleDirtyChange} onSaved={handleSaved} />
                )}
            </div>

            <div className="relative p-6 pt-4 border-t border-line/50 flex items-center justify-between">
                <Button
                    type="button"
                    variant="danger"
                    onClick={() => openModal("logoutConfirm")}
                    aria-label="Logout"
                >
                    <FiLogOut size={16} />
                    Log Out
                </Button>

                <div className="flex items-center gap-3">
                    {saved && (
                        <span className="flex items-center gap-1.5 text-sm text-success animate-fade-in">
                            <FiCheck size={16} />
                            Saved
                        </span>
                    )}
                    <Button type="submit" form={formId} disabled={!canSave} aria-label="Save settings">
                        Save
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

export default UserSettingsModal;
