import { useState } from "react";
import { FiLogOut } from "react-icons/fi";
import Modal from "../ui/Modal";
import { useModalStore } from "../../stores/useModalStore";
import { useUserStore } from "../../stores/useUserStore";
import { useLLMStore } from "../../stores/useLLMStore";
import { authService } from "../../services";

function LogoutConfirmModal() {
    const { activeModal, closeModal, openModal } = useModalStore();
    const { clearProfile } = useUserStore();
    const { setLLMs, selectLLM } = useLLMStore();
    const [error, setError] = useState<string | null>(null);

    const handleLogout = () => {
        authService.logout()
            .then(() => {
                clearProfile();
                setLLMs([]);
                selectLLM(null);
                openModal("auth");
            })
            .catch((e) => {
                setError(e instanceof Error ? e.message : "Logout failed");
            });
    };

    return (
        <Modal isOpen={activeModal === "logoutConfirm"} onClose={closeModal} size="sm">
            <div className="relative p-6">
                <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-danger-solid/10 border border-danger-solid/20 flex items-center justify-center">
                        <FiLogOut className="text-danger" size={24} />
                    </div>
                </div>

                <h2 className="text-xl font-bold text-center text-ink mb-2">Log Out</h2>

                <p className="text-center text-ink-subtle text-sm mb-6">
                    Are you sure you want to log out? You'll need to sign in again to access your account.
                </p>

                {error && (
                    <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-4 py-2 mb-4 text-center">
                        {error}
                    </p>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={closeModal}
                        aria-label="Cancel logout"
                        className="flex-1 px-5 py-2.5 cursor-pointer bg-raised/50 text-ink-muted rounded-lg hover:bg-hover/50 transition-all duration-200 font-medium border border-line/50 hover:border-line-strong"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleLogout}
                        aria-label="Logout"
                        className="flex-1 px-5 py-2.5 cursor-pointer bg-linear-to-r from-danger-solid to-danger-deep text-ink rounded-lg hover:from-danger-solid hover:to-danger-solid transition-all duration-200 font-medium shadow-lg shadow-danger-deep/30"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export default LogoutConfirmModal;