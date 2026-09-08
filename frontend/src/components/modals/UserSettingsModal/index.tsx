import { useState } from "react";
import { FiUser, FiSettings, FiLogOut, FiX } from "react-icons/fi";
import Modal from "../../ui/Modal";
import AccountView from "./views/AccountView";
import GeneralView from "./views/GeneralView";
import { useModalStore } from "../../../stores/useModalStore";

type TabId = "general" | "account";

type Tab = {
    id: TabId;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    content: React.ReactNode;
};

const tabs: Tab[] = [
    { id: "general", label: "General", icon: FiSettings, content: <GeneralView /> },
    { id: "account", label: "Account", icon: FiUser, content: <AccountView /> },
];

function UserSettingsModal() {
    const { activeModal, closeModal, openModal } = useModalStore();
    const [activeTabId, setActiveTabId] = useState<TabId>("general");
    const activeTab = tabs.find((t) => t.id === activeTabId)!;

    return (
        <Modal isOpen={activeModal === "userSettings"} onClose={closeModal} size="lg">
            <div className="relative p-6 pb-4 border-b border-line/50 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-ink">Settings</h2>
                    <div className="h-0.5 w-20 bg-linear-to-r from-line-strong to-transparent mt-2 rounded-full" />
                </div>
                <button
                    onClick={closeModal}
                    className="p-2 rounded-lg hover:bg-hover/50 transition-all duration-200 text-ink-subtle hover:text-ink cursor-pointer"
                    aria-label="Close settings"
                >
                    <FiX size={20} />
                </button>
            </div>

            <div className="relative border-b border-line/50">
                <div className="flex px-6">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTabId === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTabId(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 cursor-pointer ${
                                    isActive
                                        ? "text-ink border-line-active"
                                        : "text-ink-subtle border-transparent hover:text-ink-muted"
                                }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="relative p-6 min-h-100">{activeTab.content}</div>

            <div className="relative p-6 pt-4 border-t border-line/50">
                <button
                    onClick={() => openModal("logoutConfirm")}
                    className="flex items-center gap-2 px-5 py-2.5 cursor-pointer bg-linear-to-r from-danger-solid to-danger-deep text-ink rounded-lg hover:from-danger-solid hover:to-danger-solid transition-all duration-200 font-medium shadow-lg shadow-danger-deep/30"
                    aria-label="Logout"
                >
                    <FiLogOut size={16} />
                    Log Out
                </button>
            </div>
        </Modal>
    );
}

export default UserSettingsModal;